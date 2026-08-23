#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_ID="tango-ts"
readonly POOL_ID="github-actions"
readonly PROVIDER_ID="tango"
readonly SERVICE_ACCOUNT_ID="firebase-deployer"
readonly SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
readonly REPOSITORY_ID="118316857"
readonly REPOSITORY="her0e1c1/tango"
readonly BRANCH_REF="refs/heads/main"
readonly ENVIRONMENT="production"
readonly LOCATION="global"
readonly OIDC_ISSUER="https://token.actions.githubusercontent.com"

readonly ATTRIBUTE_MAPPING="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref"
# The immutable repository ID prevents a renamed or recreated repository from inheriting production access.
readonly ATTRIBUTE_CONDITION="attribute.repository_id == '${REPOSITORY_ID}' && attribute.ref == '${BRANCH_REF}' && assertion.sub == 'repo:${REPOSITORY}:environment:${ENVIRONMENT}'"

DEPLOY_ROLES=(
  "roles/firebasehosting.admin"
  "roles/firebaserules.admin"
  "roles/serviceusage.serviceUsageConsumer"
  "roles/serviceusage.apiKeysViewer"
)

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

# Refuse broad pre-existing access without deleting IAM bindings that this script does not own.
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

gcloud services enable "${REQUIRED_APIS[@]}" \
  --project="$PROJECT_ID" \
  --quiet

service_account_info=$(
  gcloud iam service-accounts list \
    --project="$PROJECT_ID" \
    --filter="email=${SERVICE_ACCOUNT_EMAIL}" \
    --format="value(email,disabled)"
)
IFS=$'\t' read -r existing_service_account service_account_disabled <<<"$service_account_info"
[[ "$service_account_disabled" != "True" && "$service_account_disabled" != "true" ]] ||
  die "${SERVICE_ACCOUNT_EMAIL} is disabled; review and re-enable it explicitly before retrying."
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

existing_pool=$(
  gcloud iam workload-identity-pools list \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    --filter="name=${POOL_RESOURCE_NAME}" \
    --format="value(name)"
)
[[ "$existing_pool" == "$POOL_RESOURCE_NAME" ]] ||
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    --display-name="GitHub Actions" \
    --description="External identities used by GitHub Actions" \
    --quiet

provider_names=$(
  gcloud iam workload-identity-pools providers list \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    --workload-identity-pool="$POOL_ID" \
    --format="value(name)"
)

# Workload Identity principals are pool-scoped, so sharing this pool could bypass this provider's branch and environment checks.
while IFS= read -r provider_name; do
  [[ -z "$provider_name" || "$provider_name" == "$PROVIDER_RESOURCE_NAME" ]] ||
    die "The ${POOL_ID} pool contains another provider (${provider_name}); use a dedicated pool before retrying."
done <<<"$provider_names"

gcloud iam workload-identity-pools update "$POOL_ID" \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --display-name="GitHub Actions" \
  --description="External identities used by GitHub Actions" \
  --no-disabled \
  --quiet

[[ "$provider_names" == "$PROVIDER_RESOURCE_NAME" ]] ||
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
  --no-disabled \
  --quiet

for role in "${DEPLOY_ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="$role" \
    --condition=None \
    --quiet >/dev/null
done

# The provider condition supplies the branch and environment checks; this binding adds a second immutable repository-ID boundary.
readonly WORKLOAD_IDENTITY_PRINCIPAL="principalSet://iam.googleapis.com/${POOL_RESOURCE_NAME}/attribute.repository_id/${REPOSITORY_ID}"

add_workload_identity_binding() {
  gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
    --project="$PROJECT_ID" \
    --member="$WORKLOAD_IDENTITY_PRINCIPAL" \
    --role="roles/iam.workloadIdentityUser" \
    --condition=None \
    --quiet >/dev/null
}

# A newly created service account can take time to become available to IAM policy operations.
binding_added=false
for attempt in 1 2 3 4 5 6 7; do
  add_workload_identity_binding && binding_added=true && break
  [[ "$attempt" -lt 7 ]] || break
  printf 'Waiting for service account IAM propagation (attempt %s of 7)\n' "$attempt" >&2
  sleep 10
done
[[ "$binding_added" == true ]] || die "Could not grant Workload Identity User after seven attempts."

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
