# Acceptance criteria mapping

- JSON parser limit: `webhookJsonParser()` defaults to `1mb`.
- Webhook-specific limit: intended for `POST /webhooks/stellar`.
- 413 response: `oversizedPayloadLogger()` handles body parser limit errors.
- Logging: oversized attempts are logged through `JsonLoggerService`.
- Integration coverage: `webhook-body-limit.integration.spec.ts` verifies 413 behavior.
