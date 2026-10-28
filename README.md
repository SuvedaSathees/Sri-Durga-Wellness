# Sri Durga Wellness — web and mobile apps

The Sri Durga Wellness clinic, as a **React + TypeScript website** (Vite) and a **native Android /
iOS app** (React Native + Expo). Both share one typed core: models, validation, business rules, an
API client and a mock backend. Both talk to a separately developed backend over REST/JSON.

- English and **தமிழ்** everywhere, switchable at any time.
- Appointment booking, free consultation, contact, shop with UPI payment, live classes, recorded
  courses, account, journal and policies.
- Runs today on a built-in mock backend; switch to the real API with two environment variables.

## Start here

|                                                            |                                                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)               | What the apps do and the rules they follow                           |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               | Layers, folder structure, data flow, decisions                       |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md)               | Every endpoint, request, response and status code (all **proposed**) |
| [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md) | How to connect the real backend                                      |
| [docs/SETUP.md](docs/SETUP.md)                             | Install, run, build, deploy, launch checklist                        |
| [docs/TESTING.md](docs/TESTING.md)                         | What is tested and how to run it                                     |

## Quick start

```bash
npm install
npm run dev            # website on http://localhost:5173 (mock backend); same as npm run dev:web
npm run dev:mobile     # Expo — open on a phone with Expo Go, or an emulator
npm test               # unit, contract, architecture and Tamil-coverage tests
```

**Admin area:** with `npm run dev`, sign in at http://localhost:5173/login as `owner@sridurga.demo` /
`demo-owner-2026` to manage payments, orders, classes, products and courses at `/admin`. This
practice login lives in `apps/web/.env.development` and works only on the built-in sample backend —
see [docs/SETUP.md](docs/SETUP.md#admin-area-clinic-owner).

## Structure

```
packages/tokens        design tokens (colour, type, spacing) for both apps
packages/core          models · validation · logic · i18n · API client + services · mock backend
packages/controllers   React Query hooks and flow logic shared by web and mobile
apps/web               React + Vite + React Router
apps/mobile            Expo + React Navigation (native stacks + bottom tabs)
docs/                  requirements, architecture, API contract, setup, testing
tests/                 repository-wide rules (architecture, contract, Tamil coverage)
```

## Ground rules

- Screens never call the API directly — only through hooks in `@sdw/controllers` (enforced by a test).
- No hard-coded API URLs; the base URL comes from environment variables, validated at start-up.
- No secrets in the apps. The UPI ID and all payment settings come from the backend.
- Payments are never marked paid by the app; the clinic owner verifies each one in the Admin area
  (`/admin`) after finding it in the bank statement, and the server checks the owner role.
- Meeting links and paid lessons appear only when the API returns them for that customer.
- No invented testimonials, qualifications, contact details or medical claims. Sample data is
  labelled as such and must be replaced before launch.
