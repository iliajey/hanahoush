# ADR-0009 — ERP authentication strategy

- **Status:** Accepted
- **Date:** 2026-08-11
- **Applies to:** outbound integration security

## Context

Hanahoush must authenticate to hanRP/Odoo. Options include static API keys, OAuth2 client
credentials, ERP service accounts, Odoo session cookies, signed webhooks (inbound only), and
mTLS. The correct choice depends on what the real hanRP instance exposes, which is not yet
known. Secrets must never be committed, and credential rotation must not require code changes.

## Decision

- The **provider adapter selects the mechanism via configuration** (`ERP_AUTH_TYPE`), never
  hard-codes it.
- **OAuth2 client-credentials is preferred when the ERP offers it** (token lifetime + refresh +
  revocability).
- **Scoped API key or a dedicated, least-privilege service account** is the fallback for
  Odoo JSON-RPC / gateways without OAuth2.
- Odoo session cookies are **not recommended** (fragile, session-coupled); mTLS is an optional
  production hardening, not a baseline.
- Credentials come from **environment variables or a secret manager** only; never committed.
- Rotation is **configuration-only** (change the secret, refresh the provider credential
  handle); rotation and auth failures are **audited** via existing mechanisms.
- **Auth failures are non-retryable** (no retrying 401/403); the provider enters an
  `auth_failed` state surfaced in status APIs, with non-sensitive logging.

## Consequences

- Credential changes never require code changes or redeploys.
- One auth path per environment, chosen by config, testable without real credentials
  (NullProvider + fake auth).
- Secret leakage risk is minimized by never logging or committing credentials.
- Discovery (Phase 9B) must confirm which mechanism the real hanRP instance supports before the
  Odoo adapter is enabled.

## References

- `docs/architecture/erp-security.md`
- `docs/architecture/hanrp-odoo-compatibility.md`
