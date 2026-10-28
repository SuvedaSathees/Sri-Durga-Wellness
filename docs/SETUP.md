# Setup

## Requirements

- Node.js **22.12 or newer** (`.nvmrc` pins 22) and npm 10+
- For the mobile app: the [Expo Go](https://expo.dev/go) app on a phone, or Android Studio
  (emulator) / Xcode (iOS simulator, macOS only). Expo SDK 58, React Native 0.88.

## Install

```bash
npm install          # installs every workspace (packages/* and apps/*)
```

## Web app

```bash
cp apps/web/.env.example apps/web/.env.local   # defaults to the mock backend
npm run dev:web                                # http://localhost:5173
```

The mock site shows no "sample content" banner and no Demo tools button. To see them (the Demo
tools let you sign in as a sample customer and act as clinic staff verifying a payment), set
`VITE_PREVIEW_UI=on` in `apps/web/.env.local`. The browser tests turn them on through
`apps/web/.env.test` (`npm run build:test -w @sdw/web`).

### Admin area (clinic owner)

`npm run dev` includes a practice owner login, set in `apps/web/.env.development`:

| Login ID              | Password          | Where                                                        |
| --------------------- | ----------------- | ------------------------------------------------------------ |
| `owner@sridurga.demo` | `demo-owner-2026` | Person icon → Log in. The owner goes straight to **/admin**. |

It works in any browser or tab on your computer without registering. In the Admin area the owner
checks UPI payments (verify, or "not found" with a reason), moves orders through packing → shipped /
ready for pickup → completed (or cancels them), posts and edits live classes and their batches
(dates, fees, seats, the private Google Meet link), and adds or edits shop products and recorded
courses with their lessons (YouTube / Vimeo links).

The sample data is kept in your browser and shared by all its tabs, while each tab keeps its own
sign-in — so you can be a customer in one tab and the owner in another. Clear the site's data in the
browser to start over.

This login exists only on the built-in sample backend. Production builds don't read
`.env.development`, and on the live site owner and staff accounts are created and checked by the
backend server, with their own strong passwords — never with this one.

Production build:

```bash
npm run build:web                              # type-checks, then builds apps/web/dist
npm run preview -w @sdw/web                    # serves the build on http://localhost:4173
```

`apps/web/dist` is a static site. Serve it from any static host or CDN, and configure the host
to return `index.html` for unknown paths (single-page app routing). Suggested security headers:
`Content-Security-Policy` with `connect-src` limited to your API origin, `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

## Mobile app

```bash
cp apps/mobile/.env.example apps/mobile/.env   # defaults to the mock backend
npm run dev:mobile                             # starts Expo; press a (Android) or i (iOS), or scan the QR code with Expo Go
```

The first time, run `npx expo install --check` inside `apps/mobile` to align native module
versions with the installed Expo SDK.

Builds for the stores use [EAS](https://docs.expo.dev/build/introduction/):

```bash
cd apps/mobile
npx eas build --profile preview --platform android   # internal test build
npx eas build --profile production --platform all     # store builds (live API)
```

Set `EXPO_PUBLIC_API_BASE_URL` for each profile in `eas.json` or as EAS environment variables.
Bundle identifiers (`com.sridurgawellness.app`) and the deep-link scheme (`sridurgawellness://`)
are in `app.config.ts`; change them before the first store build.

## Useful commands (from the repository root)

| Command              | What it does                                                                |
| -------------------- | --------------------------------------------------------------------------- |
| `npm test`           | All unit, contract, architecture and Tamil-coverage tests                   |
| `npm run typecheck`  | Type-checks every package and app                                           |
| `npm run test:e2e`   | Browser tests for the web app (needs `npm run preview -w @sdw/web` running) |
| `npm run tokens:css` | Regenerates `apps/web/src/styles/tokens.css` after changing design tokens   |
| `npm run format`     | Prettier                                                                    |

## Project layout

See [ARCHITECTURE.md](./ARCHITECTURE.md). In short: `packages/core` (types, validation, logic,
API client, mock backend), `packages/controllers` (shared React hooks), `packages/tokens` (design
tokens), `apps/web` (Vite + React) and `apps/mobile` (Expo).

## Adding a feature

1. Add or confirm the endpoint in `docs/API_CONTRACT.md` and `packages/core/src/api/endpoints.ts`.
2. Add request/response types in `packages/core/src/models`, a function in the matching service,
   and a handler in the mock backend.
3. Add a hook in `packages/controllers` (query key in `query-keys.ts`).
4. Build the screens in `apps/web/src/features/<feature>` and `apps/mobile/src/features/<feature>`
   using the shared UI kits, register the route (web `app/routes.tsx`, mobile `navigation/`).
5. Add Tamil for every new `t("…")` string in `packages/core/src/i18n/ta/`.
6. `npm test && npm run typecheck`, then add a browser test in `apps/web/tests/e2e`.

## Before launch

- [ ] Backend connected and every endpoint in the contract marked **Confirmed**.
- [ ] Owner account created on the backend with a new strong password (the practice login in
      `apps/web/.env.development` works only on the sample backend).
- [ ] `VITE_API_MODE=live` / `EXPO_PUBLIC_API_MODE=live` in production.
- [ ] All sample content replaced by clinic-approved text, practitioners, prices, policies,
      contact details and photos (the sample banner disappears when `isSampleContent` is false).
- [ ] Tamil text reviewed by a Tamil speaker; policies translated only after approval.
- [ ] App icons, splash screen, bundle ids and deep-link domains set for the stores.
- [ ] Privacy policy URL and data-safety / privacy nutrition labels for the app stores.
