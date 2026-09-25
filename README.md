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
- opt-in bounded cold point-read bundles
- explicit covering index projections
- deletion and restore
- memory and encrypted IndexedDB caches

## Validate without deploying

```powershell
npm install
npm run check
```

The check builds the browser application and performs a Worker dry run. It
does not create Cloudflare resources or deploy anything.

The build also copies the version-matched Studio assets to `dist/studio`.

## Configure Cloudflare

1. Copy `wrangler.example.jsonc` to `wrangler.jsonc`.
2. Create separate private R2 buckets for application and authentication
   data.
3. Uncomment the R2 bindings and replace the disabled examples with real
   bucket names.
4. Generate and merge the recommended Entra entries:

   ```powershell
   npx thimbledb generate-entra-roles `
     --out ".\entra-authorization.json"
   ```

5. Configure Microsoft Entra or another OIDC provider and its API audience.
6. Set the exact browser origin in `THIMBLE_ALLOWED_ORIGIN`.
7. Store a base64-encoded 32-byte master key:

   ```powershell
   npx wrangler secret put THIMBLE_MASTER_KEY
   ```

8. Validate, then deploy:

   ```powershell
   npm run check
   npm run deploy
   ```

Open `/studio/` on the deployed authority to use the package-owned management
frontend. Studio starts read-only and applies the same OIDC and scope grants as
the notes application.

This starter embeds the authority and assets in one Worker deployment. The
authority can instead run in a separately routed Worker while `/api/*` and
`/studio/*` remain on the same public browser origin. See the
[authority deployment guide](https://thimbledb.com/docs/authority-deployment/).

No development identity is available in the Cloudflare authority. The host
application must obtain an API access token from the configured identity
provider. The starter exchanges that token for an HttpOnly ThimbleDB session
and does not persist the provider token.

The complete Cloudflare, authentication, security, migration, and operations
guides are available at
[thimbledb.com/docs](https://thimbledb.com/docs/).
ThimbleDB source and releases are available in the
[main repository](https://github.com/Jason-Doyle/thimble).

For automation, use an OIDC service principal with an explicit application
role. Do not replace that short-lived identity flow with a static global
database key.

## Security boundary

Keep both R2 buckets private. Do not put bucket credentials, OIDC tokens, the
master key, or scope keys in browser code or committed files.

The checked-in Wrangler file is intentionally non-deployable until real
resources, identity settings, secrets, and an allowed origin are configured.

## Licence

Apache-2.0
