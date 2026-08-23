#!/usr/bin/env bash

# Stop on unhandled command failures, unset variables, and failed commands in a
# pipeline. Commands used deliberately as && or || conditions are handled by the
# script instead. Later IAM changes must not hide an unexpected partial failure.
set -euo pipefail

# These identifiers are intentionally fixed to Tango production resources.
# Keeping them out of command-line arguments prevents an operator from running
# this script against a different project or repository by mistake.
readonly PROJECT_ID="tango-ts"
readonly POOL_ID="github-actions"
readonly PROVIDER_ID="tango"
readonly SERVICE_ACCOUNT_ID="firebase-deployer"
readonly SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
readonly REPOSITORY_ID="118316857"
readonly BRANCH_REF="refs/heads/main"
readonly ENVIRONMENT="production"
readonly LOCATION="global"
readonly OIDC_ISSUER="https://token.actions.githubusercontent.com"

# GitHub places repository and branch data in its OIDC token. It also includes
# the environment claim when the job targets a GitHub Environment, which means
# jobs that do not target production cannot satisfy this provider condition.
# The mapping gives the claims Google-side names for all three checks.
# The numeric repository ID is immutable, so a renamed or recreated repository
# cannot inherit production access merely by using the old repository name.
readonly ATTRIBUTE_MAPPING="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref,attribute.environment=assertion.environment"
readonly ATTRIBUTE_CONDITION="attribute.repository_id == '${REPOSITORY_ID}' && attribute.ref == '${BRANCH_REF}' && attribute.environment == '${ENVIRONMENT}'"

# The deployer receives narrowly scoped Firebase deployment roles and supporting
# Service Usage roles required by the CLI. Owner, Editor, and service-account
# keys are excluded because they would grant broader or long-lived access.
DEPLOY_ROLES=(
  "roles/firebasehosting.admin"
  "roles/firebaserules.admin"
  "roles/serviceusage.serviceUsageConsumer"
  "roles/serviceusage.apiKeysViewer"
)

# Workload Identity Federation depends on these APIs for IAM resource changes,
# project metadata, service-account impersonation, and OIDC token exchange.
# Enabling an already enabled API is safe, which makes this step repeatable.
REQUIRED_APIS=(
  "iam.googleapis.com"
  "cloudresourcemanager.googleapis.com"
  "iamcredentials.googleapis.com"
  "sts.googleapis.com"
)

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

# Complete the initial command, account, and project preflight checks before the
# first cloud mutation. Project-scoped calls explicitly identify tango-ts, so
# the user's global gcloud project setting is neither trusted nor changed.
command -v gcloud >/dev/null 2>&1 || die "gcloud is required. Install the Google Cloud CLI and authenticate before retrying."
[[ $# -eq 0 ]] || die "This Tango-specific script does not accept arguments."

active_account=$(
  gcloud auth list \
    --filter="status:ACTIVE" \
    --format="value(account)" \
    --limit=1
)
[[ -n "$active_account" ]] || die "No active gcloud account was found. Run 'gcloud auth login' before retrying."

project_number=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
[[ "$project_number" =~ ^[0-9]+$ ]] || die "Could not resolve the numeric project number for ${PROJECT_ID}."

printf 'Configuring GitHub OIDC for project %s with account %s\n' "$PROJECT_ID" "$active_account"

# Read the existing project policy before changing IAM. If this service account
# already has Owner or Editor, the script stops instead of silently accepting
# excessive access. It also avoids deleting bindings that another process owns.
project_bindings=$(
  gcloud projects get-iam-policy "$PROJECT_ID" \
    --flatten="bindings[].members" \
    --format="value(bindings.role,bindings.members)"
)
while IFS=$'\t' read -r role member; do
  [[ "$member" == "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" ]] || continue
  [[ "$role" != "roles/owner" && "$role" != "roles/editor" ]] ||
    die "${SERVICE_ACCOUNT_EMAIL} already has ${role}; remove that broad role before retrying."
done <<<"$project_bindings"

# API activation is the first cloud mutation. It happens only after the account,
# project access, and broad-role safety checks above have all succeeded.
gcloud services enable "${REQUIRED_APIS[@]}" \
  --project="$PROJECT_ID" \
  --quiet

# gcloud has no single "create or update" command for service accounts. The
# list call first determines whether the account exists and whether an operator
# has disabled it. A disabled account is treated as an intentional safety state,
# so only an explicit manual decision may re-enable it.
service_account_info=$(
  gcloud iam service-accounts list \
    --project="$PROJECT_ID" \
    --filter="email=${SERVICE_ACCOUNT_EMAIL}" \
    --format="value(email,disabled)"
)
IFS=$'\t' read -r existing_service_account service_account_disabled <<<"$service_account_info"
[[ "$service_account_disabled" != "True" && "$service_account_disabled" != "true" ]] ||
  die "${SERVICE_ACCOUNT_EMAIL} is disabled; review and re-enable it explicitly before retrying."

# Exactly one of these two guarded commands runs: an existing account has its
# display name corrected, while a missing account is created. Re-running the
# script therefore converges on the same account instead of creating duplicates.
[[ "$existing_service_account" != "$SERVICE_ACCOUNT_EMAIL" ]] ||
  gcloud iam service-accounts update "$SERVICE_ACCOUNT_EMAIL" \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions Firebase Deployer" \
    --quiet
[[ "$existing_service_account" == "$SERVICE_ACCOUNT_EMAIL" ]] ||
  gcloud iam service-accounts create "$SERVICE_ACCOUNT_ID" \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions Firebase Deployer" \
    --quiet

readonly POOL_RESOURCE_NAME="projects/${project_number}/locations/${LOCATION}/workloadIdentityPools/${POOL_ID}"
readonly PROVIDER_RESOURCE_NAME="${POOL_RESOURCE_NAME}/providers/${PROVIDER_ID}"

# A Workload Identity Pool is the Google-side container for external identities.
# As with the service account, a disabled pool is never re-enabled automatically;
# disabling federation may be an emergency response that this script must respect.
pool_info=$(
  gcloud iam workload-identity-pools list \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    --filter="name=${POOL_RESOURCE_NAME}" \
    --format="value(name,disabled)"
)
IFS=$'\t' read -r existing_pool pool_disabled <<<"$pool_info"
[[ "$pool_disabled" != "True" && "$pool_disabled" != "true" ]] ||
  die "The ${POOL_ID} pool is disabled; review and re-enable it explicitly before retrying."

# Create the pool only when it is absent. The later update is still useful on
# every run because it repairs editable metadata without changing disabled state.
[[ "$existing_pool" == "$POOL_RESOURCE_NAME" ]] ||
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    --display-name="GitHub Actions" \
    --description="External identities used by GitHub Actions" \
    --quiet

# A provider describes which issuer is trusted and how its token is validated.
# Listing both its resource name and disabled flag lets the script distinguish
# a missing provider from one that an operator deliberately switched off.
provider_info=$(
  gcloud iam workload-identity-pools providers list \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    --workload-identity-pool="$POOL_ID" \
    --format="value(name,disabled)"
)

# The IAM principal used later is pool-scoped rather than provider-scoped. If a
# second provider shared this pool, it could potentially bypass this provider's
# repository, branch, or environment checks. This dedicated-pool guard therefore
# rejects every provider except the expected Tango provider.
existing_provider=""
while IFS=$'\t' read -r provider_name provider_disabled; do
  [[ -z "$provider_name" || "$provider_name" == "$PROVIDER_RESOURCE_NAME" ]] ||
    die "The ${POOL_ID} pool contains another provider (${provider_name}); use a dedicated pool before retrying."
  [[ "$provider_disabled" != "True" && "$provider_disabled" != "true" ]] ||
    die "The ${PROVIDER_ID} provider is disabled; review and re-enable it explicitly before retrying."
  [[ "$provider_name" != "$PROVIDER_RESOURCE_NAME" ]] || existing_provider="$provider_name"
done <<<"$provider_info"

# Update only descriptive pool fields. There is deliberately no --no-disabled
# flag here, so this command cannot undo a manual disable operation.
gcloud iam workload-identity-pools update "$POOL_ID" \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --display-name="GitHub Actions" \
  --description="External identities used by GitHub Actions" \
  --quiet

# Create the provider on the first run, then apply the update below on every run.
# The update makes editable trust settings converge if they drift, but it also
# deliberately leaves the provider's enabled/disabled state unchanged.
[[ "$existing_provider" == "$PROVIDER_RESOURCE_NAME" ]] ||
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    --workload-identity-pool="$POOL_ID" \
    --display-name="Tango production" \
    --description="GitHub OIDC for the Tango production deployment" \
    --issuer-uri="$OIDC_ISSUER" \
    --attribute-mapping="$ATTRIBUTE_MAPPING" \
    --attribute-condition="$ATTRIBUTE_CONDITION" \
    --quiet

gcloud iam workload-identity-pools providers update-oidc "$PROVIDER_ID" \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --workload-identity-pool="$POOL_ID" \
  --display-name="Tango production" \
  --description="GitHub OIDC for the Tango production deployment" \
  --issuer-uri="$OIDC_ISSUER" \
  --allowed-audiences="" \
  --attribute-mapping="$ATTRIBUTE_MAPPING" \
  --attribute-condition="$ATTRIBUTE_CONDITION" \
  --quiet

# Project roles determine what the service account can deploy after successful
# impersonation. add-iam-policy-binding is repeatable: an existing identical
# member/role binding is retained rather than duplicated.
for role in "${DEPLOY_ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="$role" \
    --condition=None \
    --quiet >/dev/null
done

# Workload Identity User permits an accepted external identity to impersonate
# this service account; it does not grant Owner or Editor access. The principal
# set adds the immutable repository ID as a second boundary, while the provider
# condition supplies the repository, branch, and environment checks.
readonly WORKLOAD_IDENTITY_PRINCIPAL="principalSet://iam.googleapis.com/${POOL_RESOURCE_NAME}/attribute.repository_id/${REPOSITORY_ID}"

add_workload_identity_binding() {
  gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
    --project="$PROJECT_ID" \
    --member="$WORKLOAD_IDENTITY_PRINCIPAL" \
    --role="roles/iam.workloadIdentityUser" \
    --condition=None \
    --quiet >/dev/null
}

# Google IAM can need about a minute to make a newly created service account
# visible to policy operations. Retry only this idempotent binding so a normal
# propagation delay does not make the first setup run fail permanently.
binding_added=false
for attempt in 1 2 3 4 5 6 7; do
  add_workload_identity_binding && binding_added=true && break
  [[ "$attempt" -lt 7 ]] || break
  printf 'Waiting for service account IAM propagation (attempt %s of 7)\n' "$attempt" >&2
  sleep 10
done
[[ "$binding_added" == true ]] || die "Could not grant Workload Identity User after seven attempts."

# Read the canonical provider resource name from Google instead of rebuilding
# the final output from assumptions. These are values to copy into the GitHub
# production environment; the script intentionally does not modify GitHub.
provider_name=$(
  gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    --workload-identity-pool="$POOL_ID" \
    --format="value(name)"
)

printf '\nConfiguration complete. Set these GitHub production environment variables:\n'
printf 'GCP_WORKLOAD_IDENTITY_PROVIDER=%s\n' "$provider_name"
printf 'GCP_DEPLOY_SERVICE_ACCOUNT=%s\n' "$SERVICE_ACCOUNT_EMAIL"
