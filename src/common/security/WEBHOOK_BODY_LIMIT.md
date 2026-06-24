# Webhook body limit integration

Use `webhookJsonParser()` for `POST /webhooks/stellar` before generic JSON parsing and register `oversizedPayloadLogger(logger)` as the Express error handler so oversized webhook payloads return `413 Payload Too Large` and are logged.
