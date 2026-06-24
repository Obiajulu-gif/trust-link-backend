# CORS integration

Use `buildCorsOptions(configService.getAllowedOrigins(), configService.get('NODE_ENV'))` in `main.ts`.

This preserves development convenience while ensuring an empty `ALLOWED_ORIGINS` blocks all browser cross-origin requests in production.
