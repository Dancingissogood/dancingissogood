# backend

Backend service for user accounts, subscriptions, and studio operations.

## Local development

From the repository root, start the local database and then run:

```bash
npm run backend:dev
```

The service listens on `http://localhost:3001`.

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
