# DTO length audit

Updated verified DTO string fields with maximum length decorators:

- `src/webhooks/dto/stellar-webhook.dto.ts`
- `src/escrow/dto/create-escrow.dto.ts`

Added focused unit tests for overlong values. Remaining DTOs should follow the same limits when discovered in later audits.
