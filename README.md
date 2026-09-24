# ThimbleDB Cloudflare starter

This repository is an authenticated notes application built with ThimbleDB,
Cloudflare Workers, private R2 buckets, external OIDC, TypeScript, and Vite.

It includes:

- one Worker for authority routes and static assets
- separate private data and authentication buckets
- external OIDC session exchange
- encrypted user scopes
- typed notes
- declared title and modification-time indexes
- bounded fluent queries
- deletion and restore
- memory and encrypted IndexedDB caches

## Validate without deploying

```powershell
npm install
npm run check
```

The check builds the browser application and performs a Worker dry run. It
does not create Cloudflare resources or deploy anything.

## Configure Cloudflare

1. Copy `wrangler.example.jsonc` to `wrangler.jsonc`.
2. Create separate private R2 buckets for application and authentication
   data.
3. Uncomment the R2 bindings and replace the disabled examples with real
   bucket names.
4. Configure Microsoft Entra or another OIDC provider and its API audience.
5. Set the exact browser origin in `THIMBLE_ALLOWED_ORIGIN`.
6. Store a base64-encoded 32-byte master key:

   ```powershell
   npx wrangler secret put THIMBLE_MASTER_KEY
   ```

7. Validate, then deploy:

   ```powershell
   npm run check
   npm run deploy
   ```

No development identity is available in the Cloudflare authority. The host
application must obtain an API access token from the configured identity
provider. The starter exchanges that token for an HttpOnly ThimbleDB session
and does not persist the provider token.

The complete Cloudflare, authentication, security, migration, and operations
guides are available at
[thimbledb.com/docs](https://thimbledb.com/docs/).
ThimbleDB source and releases are available in the
[main repository](https://github.com/Jason-Doyle/thimble).

## Security boundary

Keep both R2 buckets private. Do not put bucket credentials, OIDC tokens, the
master key, or scope keys in browser code or committed files.

The checked-in Wrangler file is intentionally non-deployable until real
resources, identity settings, secrets, and an allowed origin are configured.

## Licence

Apache-2.0
