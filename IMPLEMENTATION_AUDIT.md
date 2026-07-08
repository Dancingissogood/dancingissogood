# Dancing Is So Good Implementation Audit

Date: 2026-07-08

## Executive Summary

The landing website has been refactored from a static HTML/CSS site into a Next.js app inside the existing monorepo. The implementation now has routed pages, centralized content data, reusable components, optimized local assets, TypeScript checking, ESLint, production build verification, and deployment-ready workspace scripts.

The correct path was a proper refactor, not deleting and restarting. The useful existing assets and copy were preserved, but the runtime architecture was replaced with a framework-backed implementation that is maintainable for future backend, account, subscription, and payment work.

## Scope Completed

- Converted `landing` into a Next.js application.
- Preserved the monorepo layout:
  - `landing` for public website and SEO pages.
  - `backend` for future accounts, subscriptions, checkout, webhooks, and APIs.
  - `packages/*` for future shared config, database, validation, and types.
- Added a landing page at `/`.
- Added a partner studios page at `/studios`.
- Moved public images into `landing/public/assets`, which is the correct location for Next.js static assets.
- Added framework-level metadata and Open Graph image configuration.
- Added responsive CSS for desktop, tablet, and mobile breakpoints.
- Added a compact class menu card system.
- Added studio profile rendering with separate handling for cropped photos and logo-style images.
- Added workspace scripts for linting, type checking, building, and local development.
- Verified routes, assets, content, dependency audit, and production build from the terminal.

## Architecture Decision

This project is a monorepo with separate app boundaries:

- `landing`: public marketing website. This is where SEO pages, public copy, class descriptions, studio profiles, and lead capture UI belong.
- `backend`: future private/server-side system. This is where auth, accounts, subscriptions, checkout sessions, Stripe webhooks, admin APIs, and database writes should live.
- `packages`: shared code only when it is genuinely needed by more than one app. Current package folders remain placeholders because no shared runtime logic exists yet.

This split is acceptable and appropriate. It keeps the public website deployable independently while leaving room for a backend without forcing backend complexity into the landing app prematurely.

## Root Cause And Correction Log

### Static Site Was Not The Right Long-Term Base

The previous landing implementation was simple static HTML/CSS. That was workable for a first visual pass, but not the right long-term base for a project expecting accounts, subscriptions, SEO growth, reusable content, and deployment workflows.

Correction: the landing app is now a typed Next.js app with an App Router structure and reusable components.

### Next Static Asset Location

Next.js serves project-owned static files from `public`. The old `landing/assets` location was correct for a plain static site, but not for the Next.js app.

Correction: assets were moved to `landing/public/assets`, and all image references now point to `/assets/...`.

### Studio Logo Rendering

The Belleville logo was initially rendered with `next/image` using `fill`, while CSS also applied padding to the image element. That is not a clean layout contract because `fill` images are absolutely positioned and should be controlled by their container.

Correction: logo-style studio images now use explicit `width` and `height` with a `.studio-logo-image` class. Photo-style studio images still use `fill` and `object-fit: cover`.

### Dependency Security Versus Release Channel

Stable `next@16.2.10` currently depends on `postcss@8.4.31`, which triggers the moderate PostCSS advisory `GHSA-qx2v-qp2m-jg93`. A root `overrides` approach was tested with both broad and exact nested selectors, but npm kept `postcss@8.4.31` under `landing/node_modules/next`.

Correction: the app uses `next@16.3.0-preview.5` and `eslint-config-next@16.3.0-preview.5` because that graph installs `postcss@8.5.10` and returns `found 0 vulnerabilities`.

Follow-up: move back to the stable Next line as soon as the stable release depends on patched PostCSS or npm can produce a clean override for the stable package.

### Metadata Warning

The initial production build warned that `metadataBase` was missing for social image resolution.

Correction: `landing/app/layout.tsx` now sets `metadataBase` from `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL`, or `http://localhost:3000`.

## File-Level Audit

### Root

`package.json` - 17 lines

- Declares the monorepo as private.
- Defines workspaces for `landing`, `backend`, and `packages/*`.
- Exposes root scripts for `dev`, `build`, `lint`, `typecheck`, and `test`.
- Root `test` runs lint, typecheck, and build in sequence.
- No backend runtime dependency is introduced at the root.

`package-lock.json`

- Locks the full workspace dependency graph.
- Confirms `next@16.3.0-preview.5`.
- Confirms `postcss@8.5.10` under Next.
- Generated by `npm install`.

`.gitignore` - 14 lines

- Ignores dependencies, env files, OS noise, build output, coverage, TypeScript build info, and logs.
- Keeps `.env.example` trackable.
- Prevents `.next` and `node_modules` from entering git.

`README.md` - 21 lines

- Documents the monorepo structure.
- Keeps app responsibilities separated.
- Notes where public website, backend logic, and shared code belong.

### Landing App Configuration

`landing/package.json` - 25 lines

- Names the workspace `@dancingissogood/landing`.
- Provides Next lifecycle scripts: `dev`, `build`, `start`.
- Provides quality scripts: `lint`, `typecheck`.
- Uses React and React DOM.
- Uses TypeScript, ESLint, and Next ESLint config.
- Uses the audited Next preview dependency graph described above.

`landing/next.config.ts` - 7 lines

- Enables `reactStrictMode`.
- Keeps framework config minimal until a real need appears.

`landing/tsconfig.json` - 41 lines

- Uses strict TypeScript.
- Targets modern JavaScript.
- Enables DOM libraries for React.
- Uses Next's TypeScript plugin.
- Defines the `@/*` path alias.
- Includes generated Next types and source files.
- Excludes `node_modules`.

`landing/eslint.config.mjs` - 6 lines

- Uses Next core web vitals rules.
- Uses Next TypeScript lint rules.
- Keeps lint config framework-aligned instead of inventing custom rules early.

`landing/next-env.d.ts`

- Generated by Next.
- Required for Next and image type support.
- Should not be manually edited.

`landing/README.md` - 27 lines

- Documents how to preview the landing app.
- States the expected responsibilities of the landing app.
- States that dynamic actions should call `backend`.

### App Router Pages

`landing/app/layout.tsx` - 63 lines

- Imports Next metadata types and Google fonts.
- Defines Instrument Sans and Playfair Display as CSS variables.
- Computes `siteUrl` from `NEXT_PUBLIC_SITE_URL`, Vercel, or localhost.
- Sets default title, title template, description, and Open Graph image.
- Renders shared `SiteHeader` and `SiteFooter` around page content.
- Sets `lang="en"`.

`landing/app/page.tsx` - 176 lines

- Defines the home page route `/`.
- Uses a full-bleed image-backed hero, not a placeholder or marketing card.
- Includes primary CTAs for pass reservation and menu exploration.
- Renders quick facts from centralized content.
- Explains the camp model.
- Renders the 20-minute class menu.
- Renders the summer schedule pattern.
- Renders the daily format and unlimited class access window.
- Renders the $100 three-day pass section.
- Renders the instruction model.
- Renders the contact/request form section.

`landing/app/studios/page.tsx` - 39 lines

- Defines the partner studios route `/studios`.
- Sets page-specific metadata.
- Renders a focused hero for the studio network.
- Renders studio profiles from centralized content.
- Adds a short explanation of how partner studios fit into the camp model.

`landing/app/globals.css` - 844 lines

- Defines color tokens and global box sizing.
- Styles the fixed header and navigation.
- Styles the full-viewport hero with image overlay.
- Styles buttons, quick facts, sections, class menu cards, schedule blocks, pass section, instructor section, contact form, footer, studio hero, studio profiles, studio tags, and studio details.
- Provides responsive breakpoints at `1100px`, `820px`, and `560px`.
- Keeps cards at small radii.
- Uses stable dimensions for image containers and menu card layout.
- Avoids nested card structures.
- Includes a targeted `.studio-logo-image` rule for contained logo rendering.

### Components

`landing/components/SiteHeader.tsx` - 28 lines

- Renders the brand link.
- Renders nav links from centralized content.
- Renders the schedule request CTA.
- Uses `next/link` for internal navigation.

`landing/components/SiteFooter.tsx` - 8 lines

- Renders the brand name and concise positioning line.

`landing/components/QuickFacts.tsx` - 18 lines

- Accepts typed quick facts.
- Renders program highlights as a semantic section.

`landing/components/ClassMenu.tsx` - 31 lines

- Accepts typed class menu items.
- Renders compact cards for each 20-minute section.
- Uses `next/image` with `fill` and responsive `sizes`.
- Uses stable image containers for consistent card layout.

`landing/components/StudioDirectory.tsx` - 63 lines

- Accepts typed studio profiles.
- Alternates studio profile layout direction.
- Renders studio imagery, tags, details, and external website links.
- Uses explicit image dimensions for logo-style studio assets.
- Uses `fill` only for photo-style studio assets.
- Opens partner websites in a new tab with `rel="noopener"`.

`landing/components/ContactForm.tsx` - 26 lines

- Renders name, email, and interest fields.
- Uses a non-submitting button because no backend endpoint or form provider has been selected yet.
- This must be wired to the future backend or a chosen form provider before real lead capture is expected.

### Content

`landing/content/site.ts` - 180 lines

- Defines TypeScript types for navigation, quick facts, class menu items, and studio profiles.
- Stores navigation links.
- Stores quick facts.
- Stores 10 class menu entries:
  - Foam Rolling & Dancer's Stretches
  - Argentine Tango Proficiency
  - Waltz Rise & Fall
  - Cuban Motion
  - Latin Arms
  - Samba Beats
  - Latin & Smooth Rhythms
  - Hustle Fundamentals
  - Adult Barre
  - Juggling Introduction
- Stores two studio profiles:
  - Belleville Lake Dance Company
  - Rhizome Roots Studio
- Keeps images and alt text tied to each content item.

### Public Assets

The public image set is stored under `landing/public/assets`:

- `dance-camp-hero.png`
- `classes/adult-barre.jpg`
- `classes/argentine-tango.jpg`
- `classes/cuban-motion.jpg`
- `classes/foam-rolling-stretches.jpg`
- `classes/hustle-fundamentals.jpg`
- `classes/juggling-introduction.jpg`
- `classes/latin-arms.jpg`
- `classes/latin-smooth-rhythms.jpg`
- `classes/samba-beats.jpg`
- `classes/waltz-rise-fall.jpg`
- `studios/belleville-lake-dance-company.webp`
- `studios/rhizome-roots-studio.jpg`

Verified image dimensions:

- Hero image: `1717x916`.
- Belleville logo: `577x785`.
- Rhizome Roots image: `1080x617`.

## Deleted Static Files

These files were intentionally removed because the Next.js app replaces them:

- `landing/index.html`
- `landing/studios.html`
- `landing/styles.css`
- `landing/dev-server.py`
- old `landing/assets/*` paths

The deleted asset paths were replaced by `landing/public/assets/*`.

## Runtime Verification

Production build:

```sh
npm run build
```

Result:

```txt
Compiled successfully
Route (app)
┌ ○ /
├ ○ /_not-found
└ ○ /studios
```

Production server route checks:

```sh
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/studios
```

Results:

```txt
200 text/html; charset=utf-8
200 text/html; charset=utf-8
```

Critical asset checks:

```sh
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/assets/dance-camp-hero.png
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/assets/studios/belleville-lake-dance-company.webp
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/assets/studios/rhizome-roots-studio.jpg
```

Results:

```txt
200 image/png
200 image/webp
200 image/jpeg
```

Rendered content checks confirmed the built home page contains:

- `A rotating class menu`
- `Choose your next 20-minute section`
- `Three days of movement`
- `Foam Rolling`
- `Argentine Tango`
- `Juggling Introduction`
- `Request the Schedule`

Rendered content checks confirmed the built studios page contains:

- `Belleville Lake Dance Company`
- `Rhizome Roots Studio`
- `500 E. Huron River Drive`
- `108 Pearl St`
- `Visit bellevillelakedance.com`
- `Visit rhizomeroots.com`

Next image optimizer markup was confirmed for:

- all class menu images.
- Belleville Lake Dance Company logo.
- Rhizome Roots Studio image.

## Quality Checks

These checks are expected to pass before deployment:

```sh
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

Final status:

- `npm run build`: pass.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm audit --audit-level=moderate`: pass, `found 0 vulnerabilities`.

## Deployment Settings For Vercel

Use these settings when importing the GitHub repository into Vercel:

- Framework Preset: `Next.js`
- Root Directory: `landing`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave default
- Development Command: leave default or `npm run dev`

Set this environment variable once the production domain is known:

```txt
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

This makes Open Graph URLs resolve to the final production domain instead of a Vercel preview URL.

## Current Production Readiness

Ready now:

- Static public marketing pages.
- Partner studios page.
- Local image assets.
- Next.js build pipeline.
- TypeScript configuration.
- ESLint configuration.
- Vercel-compatible workspace setup.

Not implemented yet:

- User accounts.
- Payment checkout.
- Subscription management.
- Stripe webhooks.
- Database schema.
- Admin dashboard.
- Auth.
- Real form submission.
- Automated date generation for actual calendar dates.

These belong in the next backend/payment phase, not inside the current landing-only implementation.

## Backend And Payments Direction

For future passes and accounts:

- Use Stripe Checkout for the $100 pass.
- Do not require accounts just to purchase a simple pass unless there is a clear membership reason.
- Store each purchase by email, Stripe customer ID, payment intent/session ID, pass type, purchase date, and redemption status.
- Add accounts later for recurring memberships, class history, subscriptions, saved payment methods, and customer portal access.
- Stripe webhooks should write authoritative payment state to the backend.
- The landing site should call backend endpoints rather than embedding payment or account logic directly in React components.

## Follow-Up Checklist

- Choose the backend framework and database before account/payment implementation.
- Decide whether lead capture uses the backend, a CRM, or a temporary form provider.
- Add exact calendar dates for July, August, and September once the target year is confirmed.
- Replace preview Next with the next stable release that resolves the PostCSS advisory.
- Add automated tests once backend behavior, checkout, or user flows exist.
- Add visual browser QA when terminal-only verification is no longer a constraint.
