# landing

Next.js public website for the dance studio.

## Preview

Run this from the repo root:

```sh
npm run dev
```

Then visit:

```txt
http://localhost:3000
```

For the local checkout proxy, set `BACKEND_URL` in the ignored
`.env.development.local`. The committed `.env.example` shows the required
value. In Vercel, set the same server-side `BACKEND_URL` value to the deployed
backend URL; it is never exposed to the browser.

Expected responsibilities:

- Home/landing page
- Class and instructor pages
- Pricing page
- Contact and lead forms
- SEO-focused content

This app should call `backend` for dynamic actions such as account creation, checkout, contact submissions, and subscriptions.
