# Acceptance criteria mapping

- Adds maximum length decorators to verified string DTO fields.
- Uses 255 for references and 128 for Stellar/hash identifiers.
- Overlong values produce class-validator errors that the global ValidationPipe returns as 400 responses.
- Unit tests cover representative DTO length failures.
