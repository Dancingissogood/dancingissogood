# packages/db

Shared database package for schema, migrations, and database client generation.

## Local database

The root `docker-compose.yml` starts a local Postgres database with the same
database URL shown in `.env.example`.

```bash
npm run db:up
DATABASE_URL="postgresql://dancingissogood:dancingissogood_dev_password@localhost:5432/dancingissogood_dev?schema=public" npm run db:migrate -- --name init_business_schema
```

## Schema ownership

Clerk owns authentication identity. This package owns business records:

- synced user profiles keyed by Clerk user ID
- pass products and purchases
- class sessions and registrations
- Stripe event records for webhook idempotency
