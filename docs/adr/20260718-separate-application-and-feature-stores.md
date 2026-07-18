# Separate Application and Feature Stores

Status: Accepted

## Context

The persisted configuration is consumed by `App` and multiple features. Keeping it under the settings feature makes application-wide consumers depend on a feature implementation.

## Decision

Place application-wide stores in `src/store` and their shared hooks in `src/hooks`. Keep feature-specific stores, such as the study store, within their owning feature even when they are singletons. See [PR #312](https://github.com/her0e1c1/tango/pull/312).
