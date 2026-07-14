# dancingissogood

Monorepo for the dance studio website.

## Structure

```txt
dancingissogood/
  landing/          # Public marketing website
  backend/          # API, auth, subscriptions, webhooks, business logic
  packages/
    db/             # Database schema, migrations, and database client
    shared/         # Shared types, validation schemas, constants
    config/         # Shared TypeScript, lint, and environment config
  infrastructure/   # AWS Terraform, deployment scripts, and operations guide
```

## Notes

- Keep public SEO and marketing pages in `landing`.
- Keep accounts, subscriptions, Stripe webhooks, bookings, and admin APIs in `backend`.
- Put code used by both apps in `packages`, not duplicated across app folders.
