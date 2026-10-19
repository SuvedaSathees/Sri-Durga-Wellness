# Architecture

Two apps (web and mobile) share one typed core. Screens are thin. Business rules live in shared
packages. Everything that touches the network goes through one API client.

```
┌──────────────────────────── apps ─────────────────────────────┐
│  apps/web  (React 19 + Vite + React Router)                   │
│  apps/mobile  (React Native + Expo + React Navigation)        │
│     View      screens/  components/          ← UI only        │
└───────────────┬───────────────────────────────────────────────┘
                │ uses hooks — never axios, never URLs
┌───────────────▼──────────── packages/controllers ─────────────┐
│  Controller   React Query hooks + flow reducers                │
│               (useServices, useBookingFlow, useCart, …)        │
└───────────────┬───────────────────────────────────────────────┘
                │ calls typed service functions
┌───────────────▼──────────── packages/core ────────────────────┐
│  Model        models/ (types)   validation/ (Zod)   logic/     │
│  API          api/client (Axios)  api/endpoints  api/services  │
│  Mocks        mocks/ (in-memory backend behind an Axios adapter)│
│  i18n         English + Tamil dictionary, formatters           │
└───────────────┬───────────────────────────────────────────────┘
                │ REST + JSON  (or the mock adapter)
          ┌─────▼─────┐
          │  Backend  │  developed separately — see API_CONTRACT.md
          └───────────┘
```

## Layers (MVC-style)

| Layer                                                                | Lives in                                                     | Allowed to import                           | Never does                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **Model** — types, validation, pure business rules                   | `packages/core/src/models`, `validation`, `logic`            | nothing app-specific                        | React, network, storage                         |
| **API** — HTTP client, endpoint list, services, mocks                | `packages/core/src/api`, `mocks`                             | models, axios                               | React, UI                                       |
| **Controller** — data fetching, caching, mutations, multi-step flows | `packages/controllers`                                       | core, React, React Query                    | DOM or native UI, raw HTTP                      |
| **View** — screens and components                                    | `apps/*/src/features`, `apps/*/src/components`               | controllers, core models/logic/i18n, tokens | axios, `@sdw/core/api`, `@sdw/core/mocks`, URLs |
| **Composition root** — creates the API client and providers          | `apps/*/src/app`, `apps/*/src/platform`, `apps/*/src/config` | everything                                  | feature UI                                      |

These rules are enforced by `tests/architecture.test.ts`, which fails the build if a screen or
component imports axios, the API layer or the mocks, or contains a hard-coded `http(s)://` API URL.

## Folder structure

```
sri-durga-wellness-apps/
├── package.json                 npm workspaces: packages/*, apps/*
├── tsconfig.base.json           strict TypeScript settings shared by every package
├── docs/                        requirements, architecture, API contract, setup, testing
├── tests/architecture.test.ts   layer rules (no API calls in UI, no hard-coded URLs)
│
├── packages/
│   ├── tokens/                  @sdw/tokens — design tokens (colour, type, spacing, radius, shadow, motion)
│   │   └── src/index.ts           one source for web CSS variables and the mobile theme
│   │
│   ├── core/                    @sdw/core — platform-agnostic TypeScript
│   │   └── src/
│   │       ├── models/            request/response and domain types (Service, Order, Payment, …)
│   │       ├── validation/        Zod schemas for every form (shared with the backend team)
│   │       ├── logic/             pure rules: money, dates, cart, slots, payment and course states, UPI links
│   │       ├── i18n/              English-key dictionary, Tamil translations, locale-aware formatters
│   │       ├── config/            environment schema (base URL, mock mode, timeouts)
│   │       ├── api/
│   │       │   ├── client.ts        the only Axios instance factory: auth header, refresh, retries, errors
│   │       │   ├── errors.ts        ApiError + normaliseError — one error shape for every failure
│   │       │   ├── endpoints.ts     every endpoint (method + path) — mirrors API_CONTRACT.md
│   │       │   ├── token-store.ts   TokenStore interface (web and mobile implement it)
│   │       │   └── services/        auth, catalog, booking, shop, payments, classes, courses, account, content
│   │       └── mocks/             in-memory backend implementing the contract, served through an Axios adapter
│   │
│   └── controllers/             @sdw/controllers — React hooks shared by web and mobile
│       └── src/
│           ├── ApiProvider.tsx    puts the services and QueryClient in context
│           ├── query-keys.ts      one place for cache keys
│           ├── session/           useSession, useSignIn, useSignOut, …
│           ├── booking/           booking-flow reducer (pure) + useBookingFlow
│           ├── shop/              cart store (pure) + useCart, useCheckout
│           └── …                  one folder per feature
│
└── apps/
    ├── web/                     React + TypeScript + Vite
    │   ├── .env.example           VITE_API_BASE_URL, VITE_API_MODE, …
    │   └── src/
    │       ├── app/               App, routes, providers, auth guard (composition root)
    │       ├── config/            reads import.meta.env through the core config schema
    │       ├── platform/          web TokenStore (memory only) and storage helpers
    │       ├── styles/            global CSS + generated token variables
    │       ├── components/
    │       │   ├── ui/            Button, TextField, Select, Card, Badge, Spinner, StateView, …
    │       │   └── layout/        header, footer, language toggle, mobile menu
    │       └── features/<name>/
    │           ├── screens/       one file per route — composes components, calls controller hooks
    │           └── components/    feature-only UI pieces
    │
    └── mobile/                  React Native + Expo
        ├── app.config.ts          reads EXPO_PUBLIC_* env into `extra`
        └── src/
            ├── app/               App, providers (composition root)
            ├── config/            reads Expo config through the core config schema
            ├── platform/          SecureStore TokenStore, cart persistence
            ├── navigation/        tabs, stacks, deep-link config, typed route params
            ├── theme/             native theme built from @sdw/tokens
            ├── components/ui/     Button, TextField, Card, Screen, StateView, …
            └── features/<name>/screens/
```

## How a request flows

1. A screen calls a controller hook: `const services = useServices()`.
2. The hook calls a typed service function: `catalog.listServices()`.
3. The service uses `endpoints.ts` and the shared Axios client: `GET {baseURL}/services`.
4. The client adds `Authorization`, `Accept-Language` and `X-Client-Platform` headers, refreshes an
   expired access token once (single-flight), and turns any failure into an `ApiError`
   `{ status, code, message, fieldErrors }`.
5. In **mock mode** the same client uses the mock adapter instead of the network, so interceptors,
   error handling and types are exercised exactly as they will be against the real backend.
6. The hook returns `{ data, isLoading, error, refetch }`. The screen renders loading, error, empty
   or data states with the shared `StateView` component.

## Switching from mocks to the real backend

```
# apps/web/.env.local
VITE_API_MODE=live
VITE_API_BASE_URL=https://api.example.com/v1

# apps/mobile/.env
EXPO_PUBLIC_API_MODE=live
EXPO_PUBLIC_API_BASE_URL=https://api.example.com/v1
```

No UI code changes. If the backend's paths or field names differ from the proposal, change
`endpoints.ts` or the mapping inside the relevant service file — screens stay untouched.
See [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md).

## Authentication

|               | Web                                                                                                                                           | Mobile                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Access token  | Kept in memory only (lost on reload, then refreshed)                                                                                          | Memory + `expo-secure-store` (Keychain / Keystore) |
| Refresh token | httpOnly, Secure, SameSite cookie set by the backend; the app never sees it                                                                   | Returned in the body; stored only in SecureStore   |
| Refresh       | `POST /auth/refresh` with `withCredentials`                                                                                                   | `POST /auth/refresh` with `{ refreshToken }`       |
| On 401        | One silent refresh, then the original request is retried once; if refresh fails the session is cleared and the user is asked to sign in again | Same                                               |
| Sign out      | `POST /auth/logout`, clear memory and React Query cache                                                                                       | Same, plus delete SecureStore keys                 |

No token or personal data is written to `localStorage` or `AsyncStorage`. The only things kept in
that ordinary storage are the cart (product IDs and quantities) and the language choice.

## State

- **Server state** (anything from the API) — TanStack Query. Keys live in `query-keys.ts`; mutations
  invalidate exactly the keys they affect.
- **Flow state** (booking steps, checkout form) — pure reducers in `@sdw/controllers`, unit-tested
  without React.
- **Device state** (cart, language) — small stores with a pluggable persistence adapter
  (`localStorage` on web, AsyncStorage on mobile). Only product ids, quantities and the language
  are stored — never tokens or personal details.

## Design tokens

`@sdw/tokens` is the single source for colours, type scale, spacing, radii, shadows and motion.
The web app turns them into CSS custom properties (`src/styles/tokens.css`, generated); the mobile
app turns them into a typed theme object (`apps/mobile/src/theme`). Mobile headings use the
platform serif (Georgia on iOS, Noto Serif on Android) and the system font for body text, which
keeps the app native and renders Tamil without bundling fonts. Colour pairs used for text are contrast-checked in tests.

## Internationalisation

English text is the key (`t("Book now")`). Tamil lives in `packages/core/src/i18n/ta/*`. A unit
test scans both apps for every `t("…")` string and fails if any is missing a Tamil entry. Dates,
times and prices are formatted by shared helpers so web and mobile show the same output.

## Key decisions

| Decision                                             | Why                                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| npm workspaces monorepo                              | Share types, validation and logic without publishing packages; one install                      |
| Vite + React Router for web                          | Plain React + TypeScript as requested; fastest dev loop; any backend can serve the static build |
| Expo + React Navigation (native stack + bottom tabs) | Native transitions and gestures; feature-based screens instead of file-based routes             |
| TanStack Query in a shared package                   | Same caching and loading/error semantics on both platforms                                      |
| Axios with a mock adapter                            | Mocks go through the real client, so switching to the backend changes nothing else              |
| Zod schemas shared                                   | One set of validation rules for both apps; can be handed to the backend team                    |
| Cart priced by the server                            | Prices and stock can't be tampered with on the device                                           |
| Node's built-in test runner + tsx                    | Fast, no extra framework; the same command runs locally and in CI                               |
| Playwright for web journeys                          | Real browser at phone, tablet and desktop sizes                                                 |
