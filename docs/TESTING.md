# Testing

| Layer                                                    | Where                                       | Tool                                     | Run                 |
| -------------------------------------------------------- | ------------------------------------------- | ---------------------------------------- | ------------------- |
| Shared logic, validation, formatters, i18n               | `packages/core/tests`                       | Node test runner + tsx                   | `npm test`          |
| API client (headers, refresh, retries, errors)           | `packages/core/tests/client.test.ts`        | Node test runner, scripted Axios adapter | `npm test`          |
| Customer journeys through the real client + mock backend | `packages/core/tests/mock-journeys.test.ts` | Node test runner                         | `npm test`          |
| Admin area rules (owner only, payment checks, orders, …) | `packages/core/tests/admin.test.ts`         | Node test runner                         | `npm test`          |
| Controllers (booking flow, cart store, forms)            | `packages/controllers/tests`                | Node test runner                         | `npm test`          |
| Design tokens (contrast, generated CSS)                  | `packages/tokens/tests`                     | Node test runner                         | `npm test`          |
| Architecture rules                                       | `tests/architecture.test.ts`                | Node test runner                         | `npm test`          |
| API contract ↔ code ↔ mock                               | `tests/contract.test.ts`                    | Node test runner                         | `npm test`          |
| Tamil coverage                                           | `tests/i18n.test.ts`                        | Node test runner                         | `npm test`          |
| Web journeys in a real browser (phone, tablet, desktop)  | `apps/web/tests/e2e`                        | Playwright + Node test runner            | `npm run test:e2e`  |
| Types                                                    | every workspace                             | TypeScript                               | `npm run typecheck` |

## What the guard-rail tests check

- **Architecture:** screens and components never import Axios, the API layer or the mocks; never
  call `fetch`; never contain hard-coded URLs; never touch device storage; never call
  `useQuery`/`useMutation` directly; no `console.log`; the API base URL is read only in each app's
  config module.
- **Contract:** every endpoint in `endpoints.ts` is documented in `API_CONTRACT.md`, the doc lists
  nothing extra, and the mock backend implements all of them.
- **Tamil:** every `t("…")` string in both apps, every status label, error message and validation
  message has a Tamil entry, and Tamil entries keep their `{placeholders}`.
- **Tokens:** text colours meet WCAG AA contrast on the backgrounds they're used on; input borders
  meet 3:1.

## Browser tests

```bash
npm run build:test -w @sdw/web       # mock backend with the Demo tools (apps/web/.env.test)
npm run preview -w @sdw/web &        # http://localhost:4173
npm run test:e2e
```

`BASE_URL` points the tests elsewhere (e.g. a staging deployment). Each test opens a fresh browser
context, so it starts with an empty mock backend. Tests that need a signed-in customer or a
verified payment use the **Demo tools** panel, which exists only in mock mode. The Admin area tests
(`admin.test.mjs`) sign in with the practice owner login from `apps/web/.env.test`.

## Mobile

The mobile app shares all business logic, validation, API code and hooks with the web app, so
those are covered by the tests above, and it is type-checked against the React Native and React
Navigation type definitions. Screen-level mobile tests can be added with `jest-expo` and
`@testing-library/react-native` (`npx expo install jest-expo jest @testing-library/react-native`).
Before a release, run through the main journeys on one Android and one iOS device (booking, shop
checkout with UPI handoff, class registration, course lesson, language switch, sign-out).
