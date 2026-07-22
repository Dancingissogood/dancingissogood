# backend

Backend service for user accounts, subscriptions, and studio operations.

## Local development

From the repository root, start the local database and then run:

```bash
npm run backend:dev
```

The service listens on `http://localhost:3001`.

The ignored `.env` contains the local database URL and Stripe test credentials.
Copy `.env.example` for a new environment; never commit Stripe credentials.

## Stripe

The current $100 Three-Day Camp Pass is a one-time Checkout payment. Sync its
Stripe Product and Price, then link the local `PassProduct` record, with:

```bash
npm run stripe:sync-pass --workspace @dancingissogood/backend
```

The script is idempotent for a Stripe account: it finds the active Price using
the `three-day-camp-pass` lookup key and verifies its amount, currency, and
one-time billing model before writing the Price ID to Postgres.

Checkout endpoints:

- `POST /v1/checkout-sessions` accepts only `{ "passSlug": "three-day-camp-pass" }`.
- `GET /v1/checkout-sessions/:sessionId` returns only Checkout payment status.
- `POST /v1/webhooks/stripe` verifies Stripe signatures and processes each event once.

Before production, configure the backend with `LANDING_URL`, `CORS_ORIGINS`, a
restricted Stripe server-side key, and the webhook signing secret. Register a
Stripe webhook for `checkout.session.completed`,
`checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, and `checkout.session.expired` at
`/v1/webhooks/stripe`.

Health endpoints:

- `GET /health/live` checks that the process can serve traffic.
- `GET /health/ready` confirms that Postgres is reachable.

Expected responsibilities:

- Authentication/session support
- User and member account APIs
- Subscription and billing APIs
- Stripe checkout and webhook handlers
- Future class bookings and admin APIs

Shared database and validation code should live in `packages`.
