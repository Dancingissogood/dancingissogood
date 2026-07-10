# packages/db

Shared database package for schema, migrations, and database client generation.

## Local database

The root `docker-compose.yml` starts a local Postgres database with the same
database URL shown in `.env.example`.

```bash
npm run db:up
npm run db:migrate -- --name init_business_schema
```

The ignored local `.env` is initialized with the development database URL. The
committed `.env.example` documents the same value for a fresh checkout.

## Schema ownership

Clerk owns authentication identity. This package owns business records:

- synced user profiles keyed by Clerk user ID
- pass products and purchases
- class sessions and registrations
- Stripe event records for webhook idempotency
