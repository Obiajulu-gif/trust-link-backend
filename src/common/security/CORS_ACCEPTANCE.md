# Acceptance criteria mapping

- Production with no configured origins returns `origin: false`.
- Development with no configured origins returns `origin: true`.
- Configured origins are allowed by callback.
- Unconfigured origins are rejected by callback.
