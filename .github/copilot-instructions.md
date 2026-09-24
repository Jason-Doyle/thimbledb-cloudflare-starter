# Contribution guidance

Use only documented public ThimbleDB package exports.

- Keep R2 bindings private and separate data from authentication state.
- Keep storage credentials, OIDC tokens, master keys, and scope keys out of
  browser code and committed files.
- Do not add a local development identity to the Cloudflare authority.
- Preserve typed collections, bounded queries, and explicit indexes.
- Keep configurable Cloudflare resources disabled in checked-in examples.
- Keep documentation user-facing and evidence-based.
