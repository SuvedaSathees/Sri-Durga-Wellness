# Connecting your backend

The apps currently run on the built-in mock backend. Connecting the real API is a configuration
change plus, if your API differs from the proposal, small edits in one layer. **No screen or
component needs to change.**

## 1. Agree the contract

Go through [API_CONTRACT.md](./API_CONTRACT.md) with the backend team. For each endpoint, either
confirm it, or note the real method, path and field names. Mark confirmed endpoints in the doc
(change **Proposed** to **Confirmed**) and add a line to its change log.

## 2. Point the apps at the API

Web — `apps/web/.env.local`:

```
VITE_APP_ENV=staging
VITE_API_MODE=live
VITE_API_BASE_URL=https://api.staging.example.com/v1
```

Mobile — `apps/mobile/.env` (or EAS build profile `env` in `eas.json`):

```
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_API_MODE=live
EXPO_PUBLIC_API_BASE_URL=https://api.staging.example.com/v1
```

The config is validated at start-up (`packages/core/src/config`): live mode requires an `https`
URL (plain `http` only for `localhost` / `10.0.2.2` during development) and production builds
refuse anything but `https`. A misconfiguration shows a clear message instead of a blank screen.

## 3. If the API differs from the proposal

| Difference                              | Change it here                                                                                                            | Nothing else changes because…                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| A path or method                        | `packages/core/src/api/endpoints.ts` (and the contract doc)                                                               | services refer to endpoints by name             |
| Field names or shapes                   | the matching file in `packages/core/src/api/services/` — map the backend's response to the model type before returning it | hooks and screens only see the models           |
| Error codes                             | `packages/core/src/api/errors.ts` (`MESSAGES`)                                                                            | screens show `errorMessage(error)`              |
| Pagination shape                        | the service function (convert to `Paginated<T>`)                                                                          |                                                 |
| Auth scheme (e.g. cookie-only sessions) | `packages/core/src/api/client.ts` and `token-store.ts`                                                                    | the client is the only place tokens are handled |

Example — the backend returns `{ data: [...], meta: { total } }` for services:

```ts
// packages/core/src/api/services/catalog.ts
services: async (signal?: AbortSignal) => {
  const body = await api.request<{ data: Service[] }>(endpoints.catalog.services, { signal });
  return body.data;
},
```

After changing anything, run `npm test`: the contract test fails if `endpoints.ts`, the doc and the
mock disagree, so they stay in sync (update the mock handler in `packages/core/src/mocks/backend.ts`
too, so development and tests keep working offline).

## 4. Backend checklist

- [ ] CORS: allow the web origin(s) explicitly, `Access-Control-Allow-Credentials: true`, and the
      headers `Authorization, Content-Type, Accept-Language, X-Client-Platform, Idempotency-Key`.
- [ ] Refresh token for web as an `HttpOnly; Secure; SameSite=Lax` cookie scoped to `/v1/auth`;
      in the body for `X-Client-Platform: ios|android`. Rotate on every refresh; revoke on reuse.
- [ ] Short-lived access tokens (≈15 min); `401 UNAUTHENTICATED` when expired.
- [ ] Every `/me/*` and `/payments/*` query filtered by the signed-in user; others → `404`.
- [ ] Payments move to `VERIFIED` / `REJECTED` only through staff tools. UTRs unique across
      non-rejected payments.
- [ ] `meeting.url` only in the customer's own confirmed registration.
- [ ] Lesson video/notes only for active enrolments or free previews; `403 NOT_ENROLLED` otherwise.
- [ ] Only approved, consented testimonials; only verified practitioners.
- [ ] `Idempotency-Key` honoured on the four create endpoints.
- [ ] `Accept-Language: ta` returns approved Tamil text where it exists, English otherwise.
- [ ] Rate limits on auth and enquiry endpoints; `Retry-After` on `429`.
- [ ] Error bodies follow `{ error: { code, message, fieldErrors?, requestId? } }`.
- [ ] The UPI ID, payee name and any payment settings live in backend configuration — never in the apps.
- [ ] Password-reset emails link to `https://<web-site>/reset-password?token=…`.
- [ ] Image URLs are absolute `https` URLs.

## 5. Try it end to end

1. Start your backend locally (say on port 4000).
2. Web: `VITE_API_MODE=live VITE_API_BASE_URL=http://localhost:4000/v1 npm run dev:web`.
3. Android emulator: `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000/v1`; iOS simulator: `http://localhost:4000/v1`.
   For a real phone use your computer's LAN address over https (or a tunnel).
4. Run the browser tests against it: `BASE_URL=http://localhost:5173 npm run test:e2e`. The tests
   that use the **Demo tools** (sample sign-in, simulated staff verification) only run in mock mode;
   for live testing, verify payments in your backend's staff tools.

## 6. Turning off the mock for production

Set `VITE_API_MODE=live` / `EXPO_PUBLIC_API_MODE=live` in production builds (the `production`
profile in `eas.json` already does). In live mode the web app never loads the mock code (it is
imported on demand), the demo tools never render, and the sample-content banner disappears once
`GET /site` returns `isSampleContent: false`.
