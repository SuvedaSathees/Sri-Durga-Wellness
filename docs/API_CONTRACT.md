# API contract — Sri Durga Wellness

> **Status of every endpoint below: PROPOSED — awaiting backend confirmation.**
> None of these endpoints is assumed to exist. The frontends run against an in-memory mock that
> follows this document exactly (`packages/core/src/mocks`). When the backend team confirms,
> renames or changes an endpoint, update this file and `packages/core/src/api/endpoints.ts`
> together; `npm test` checks that they match and that the mock implements every endpoint.

TypeScript definitions of every request and response body live in
[`packages/core/src/models`](../packages/core/src/models). The same Zod rules the apps use for
form validation are in [`packages/core/src/validation`](../packages/core/src/validation) and can
be reused by a Node backend or read as the reference for any other stack.

## Endpoint index

| Area                                       | Endpoints                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| [Auth](#auth)                              | register, login, refresh, logout, forgot / reset password                   |
| [Me](#me)                                  | profile, update profile, change password                                    |
| [Content](#content)                        | site info, text blocks, policies, FAQs, testimonials, journal               |
| [Catalogue](#catalogue)                    | services, practitioners                                                     |
| [Booking & enquiries](#booking--enquiries) | availability, book appointment, free consultation, contact message          |
| [Shop](#shop)                              | categories, products, cart quote, place order                               |
| [Payments](#payments)                      | get payment, submit UPI reference                                           |
| [Live classes](#live-classes)              | list, detail, register for a batch                                          |
| [Courses](#courses)                        | list, detail, lesson, enrol, mark lesson complete                           |
| [Account](#account)                        | appointments, orders, payments, class registrations, renew a month, courses |
| [Admin](#admin-clinic-owner)               | overview, check payments, orders, classes & batches, products, courses      |

---

## Conventions

### Base URL and versioning

All paths are relative to the configured base URL, which includes the version prefix, for example
`https://api.example.com/v1`. Apps read it from `VITE_API_BASE_URL` (web) and
`EXPO_PUBLIC_API_BASE_URL` (mobile). Breaking changes go to `/v2`; additive changes (new optional
fields, new endpoints) stay in `/v1`. Clients ignore unknown response fields.

### Format

- Request and response bodies are JSON (`Content-Type: application/json; charset=utf-8`).
- Field names are `camelCase`.
- **Money** is an integer number of **paise** (`35000` = ₹350.00). Never floats.
- **Instants** are ISO-8601 strings in UTC (`"2026-10-21T04:30:00.000Z"`).
- **Calendar dates** (`DateKey`) are `"YYYY-MM-DD"` in the clinic's time zone, `Asia/Kolkata`.
- **Phone numbers** are E.164 (`"+919876543210"`). The apps normalise input before sending.
- Nullable fields are always present with `null`, not omitted.
- `isSample: true` marks development sample records. The production backend returns `false`
  for clinic-approved content (the apps show a "sample content" banner otherwise).

### Request headers the apps send

| Header              | Value                     | Purpose                                                                                                                                                                                                                                       |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Authorization`     | `Bearer <accessToken>`    | On endpoints marked _required_ or _optional_ when signed in                                                                                                                                                                                   |
| `Accept-Language`   | `en` or `ta`              | Language for translated content (names, descriptions, FAQs…). Fall back to English per field when no approved Tamil exists                                                                                                                    |
| `X-Client-Platform` | `web`, `ios` or `android` | Decides how the refresh token is delivered (see Auth)                                                                                                                                                                                         |
| `Idempotency-Key`   | random 32-hex string      | On `POST /appointments`, `/orders`, `/class-batches/:id/registrations`, `/courses/:slug/enrolments`. Repeating a request with the same key and same user must return the original response instead of creating a duplicate (keep keys ≥ 24 h) |
| `Accept`            | `application/json`        |                                                                                                                                                                                                                                               |

### Authentication model

- **Access token:** short-lived (suggested 15 minutes), sent as a Bearer token. Kept in memory only.
- **Refresh token:** long-lived, rotated on every use (each refresh token works once).
  - **Web** (`X-Client-Platform: web`): set as a cookie, never in the body:
    `Set-Cookie: sdw_refresh=…; HttpOnly; Secure; SameSite=Lax; Path=/v1/auth`.
    The web app sends requests with credentials, so the API must allow the web origin explicitly
    with `Access-Control-Allow-Credentials: true` (no `*` origin).
  - **Mobile** (`ios` / `android`): returned in the JSON body as `refreshToken`; the app stores
    it in the iOS Keychain / Android Keystore and sends it back to `POST /auth/refresh`.
- Auth column below: **none** = never send a token; **optional** = send when signed in (the
  response may include the customer's own data); **required** = `401` without a valid token.
- When an access token expires the API returns `401 UNAUTHENTICATED`; the client refreshes once
  and retries. If refresh fails with 400/401/403 the client signs the customer out.

### Errors

Every non-2xx response has this body:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Some fields need attention",
    "fieldErrors": {
      "patientEmail": "Enter a valid email address",
      "address.pincode": "Enter a valid 6-digit PIN code"
    },
    "requestId": "req_01J…"
  }
}
```

- `code` is stable and machine-readable; `message` is a human-readable English fallback.
- `fieldErrors` (only for 400/422) uses the request body's field names, dot paths for nesting.
  The apps show each message next to the matching input. Using the same wording as the shared
  validation messages lets the apps translate them; any other text is shown as-is.
- `requestId` (also sent as the `X-Request-Id` header) helps support trace a problem.

| Status                      | When                                                                          | Typical codes                                                                                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `200 OK`                    | Success with a body                                                           |                                                                                                                                                                                                                                               |
| `201 Created`               | Something was created                                                         |                                                                                                                                                                                                                                               |
| `202 Accepted`              | Accepted for processing (forgot password)                                     |                                                                                                                                                                                                                                               |
| `204 No Content`            | Success without a body                                                        |                                                                                                                                                                                                                                               |
| `400 Bad Request`           | Malformed request or a token that can't be used                               | `VALIDATION_FAILED`, `RESET_TOKEN_INVALID`                                                                                                                                                                                                    |
| `401 Unauthorized`          | Missing / expired token, wrong credentials                                    | `UNAUTHENTICATED`, `INVALID_CREDENTIALS`                                                                                                                                                                                                      |
| `403 Forbidden`             | Signed in but not allowed                                                     | `FORBIDDEN`, `NOT_ENROLLED`                                                                                                                                                                                                                   |
| `404 Not Found`             | Unknown resource **or** someone else's resource (never reveal that it exists) | `NOT_FOUND`                                                                                                                                                                                                                                   |
| `409 Conflict`              | Business rule conflict                                                        | `EMAIL_TAKEN`, `SLOT_TAKEN`, `TOO_LATE_TO_CANCEL`, `OUT_OF_STOCK`, `DUPLICATE_UTR`, `PAYMENT_NOT_PAYABLE`, `BATCH_CLOSED`, `ALREADY_REGISTERED`, `ALREADY_ENROLLED`, `PAYMENT_ALREADY_CHECKED`, `INVALID_STATUS_CHANGE`, `BATCH_HAS_STUDENTS` |
| `422 Unprocessable Entity`  | Field validation failed                                                       | `VALIDATION_FAILED`                                                                                                                                                                                                                           |
| `429 Too Many Requests`     | Rate limit (send `Retry-After`)                                               | `RATE_LIMITED`                                                                                                                                                                                                                                |
| `500 Internal Server Error` | Unexpected failure                                                            | `SERVER_ERROR`                                                                                                                                                                                                                                |
| `503 Service Unavailable`   | Feature not configured / maintenance                                          | `PAYMENTS_NOT_CONFIGURED`, `SERVICE_UNAVAILABLE`                                                                                                                                                                                              |

The client retries `GET` requests on network errors and `502/503/504` (up to twice, with back-off);
it never retries `POST`/`PATCH`/`PUT` automatically.

### Pagination

List endpoints that can grow take `?page=1&pageSize=12` (`pageSize` max 48) and return:

```json
{ "items": [], "page": 1, "pageSize": 12, "total": 0 }
```

### Security rules the backend must enforce

1. **Ownership:** every `/me/…` and `/payments/…` lookup is scoped to the signed-in user; other
   users' records return `404`.
2. **Payments:** only clinic staff (in the backend's own admin tools) move a payment to `VERIFIED`
   or `REJECTED`. `POST /payments/:id/submission` only records the customer's UTR and sets
   `SUBMITTED`. No endpoint accepts screenshots as proof of payment.
3. **Meeting links:** `meeting.url` is returned only inside the signed-in customer's own
   `CONFIRMED` class registration — never in public class data, lists of other users, logs or URLs.
4. **Course content:** lesson `video`, `notes` and `resources` are returned only when the viewer
   has an active enrolment or the lesson is a free preview; otherwise `403 NOT_ENROLLED` with no
   lesson data.
5. **Testimonials:** only approved testimonials with recorded consent are returned.
6. **Prices and stock** are always computed server-side; the client's cart holds only ids and
   quantities.
7. **Rate limits:** login, register, forgot password, contact and consultation endpoints should be
   rate-limited per IP and per email.
8. **No account enumeration:** `POST /auth/forgot-password` always answers `202`.

---

## Auth

### `POST /auth/register`

Status: **Proposed** · Auth: none

Create a customer account and start a session.

Request:

```json
{
  "name": "Asha Rao",
  "email": "asha@example.com",
  "phone": "+919876543210",
  "password": "calm-waters-42",
  "locale": "en",
  "acceptTerms": true
}
```

Response `201` (`AuthSession`):

```json
{
  "accessToken": "eyJ…",
  "expiresIn": 900,
  "refreshToken": "rt_…",
  "user": {
    "id": "usr_1",
    "name": "Asha Rao",
    "email": "asha@example.com",
    "phone": "+919876543210",
    "locale": "en",
    "role": "CUSTOMER",
    "createdAt": "2026-10-18T07:00:00.000Z"
  }
}
```

`role` is always `CUSTOMER` for registration. The clinic owner's account (`role: "OWNER"`) is created
on the server only — see [Admin](#admin-clinic-owner).

`refreshToken` is present only for `X-Client-Platform: ios|android`; web gets the `sdw_refresh`
cookie instead.

Errors: `422 VALIDATION_FAILED` (fieldErrors), `409 EMAIL_TAKEN` (with `fieldErrors.email`), `429 RATE_LIMITED`.

### `POST /auth/login`

Status: **Proposed** · Auth: none

Request: `{ "email": "asha@example.com", "password": "…" }`

Response `200`: `AuthSession` (as above).

Errors: `401 INVALID_CREDENTIALS` (same answer for unknown email and wrong password), `429 RATE_LIMITED`.

### `POST /auth/refresh`

Status: **Proposed** · Auth: none (uses the refresh token)

Request — web: `{}` (the browser sends the `sdw_refresh` cookie); mobile: `{ "refreshToken": "rt_…" }`.

Response `200` (`AuthTokens`): `{ "accessToken": "eyJ…", "expiresIn": 900, "refreshToken": "rt_new…" }`
(`refreshToken` mobile only; web gets a new cookie). The used refresh token is invalidated.

Errors: `401 UNAUTHENTICATED` (missing, expired, revoked or reused token — revoke the whole token family on reuse).

### `POST /auth/logout`

Status: **Proposed** · Auth: optional

Request: `{}` or `{ "refreshToken": "rt_…" }` (mobile). Revokes the access token's session and the
refresh token; web also clears the cookie.

Response `204`.

### `POST /auth/forgot-password`

Status: **Proposed** · Auth: none

Request: `{ "email": "asha@example.com" }`

Response `202` `{ "accepted": true }` — always, whether or not the account exists. If it exists,
email a single-use link valid for 1 hour: `https://<web-site>/reset-password?token=<token>` (the
web app removes the token from the address bar as soon as it reads it; the mobile app handles
`sridurgawellness://reset-password?token=…`).

Errors: `422 VALIDATION_FAILED`, `429 RATE_LIMITED`.

### `POST /auth/reset-password`

Status: **Proposed** · Auth: none

Request: `{ "token": "rst_…", "password": "new-password-123" }`

Response `204`. Revoke all of the user's refresh tokens.

Errors: `400 RESET_TOKEN_INVALID` (unknown, used or expired), `422 VALIDATION_FAILED`.

---

## Me

### `GET /me`

Status: **Proposed** · Auth: required

Response `200` (`User`): `{ "id": "usr_1", "name": "Asha Rao", "email": "asha@example.com", "phone": "+919876543210", "locale": "ta", "createdAt": "…" }`

### `PATCH /me`

Status: **Proposed** · Auth: required

Request (any subset): `{ "name": "Asha R.", "phone": "+919876543210", "locale": "ta" }`.
`locale` is also used for the customer's emails. Email changes are out of scope for v1.

Response `200`: the updated `User`. Errors: `422 VALIDATION_FAILED`.

### `POST /me/password`

Status: **Proposed** · Auth: required

Request: `{ "currentPassword": "…", "newPassword": "…" }`

Response `204`. Errors: `422 VALIDATION_FAILED` with `fieldErrors.currentPassword = "Your current password is incorrect"`.

---

## Content

### `GET /site`

Status: **Proposed** · Auth: none

Clinic information and feature switches (`SiteInfo`). Cacheable for a few minutes.

```json
{
  "clinicName": "Sri Durga Wellness",
  "tagline": "Your journey to balance and well-being",
  "contact": { "phone": "+91…", "whatsapp": "91…", "email": "hello@…" },
  "social": { "instagram": null, "facebook": null, "youtube": null },
  "branches": [
    {
      "id": "br_main",
      "slug": "main-clinic",
      "name": "Main Clinic",
      "addressLine": "…",
      "city": "…",
      "state": "Tamil Nadu",
      "pincode": "600001",
      "phone": null,
      "openingHours": "Mon – Sat · 9:00 AM – 7:00 PM\nSunday · Closed",
      "mapUrl": "https://maps.google.com/…",
      "isPickupPoint": true,
      "isSample": false
    }
  ],
  "features": { "upiPayments": true, "homeDelivery": true, "clinicPickup": true, "onlineBooking": true },
  "shop": { "deliveryFee": 6000, "freeDeliveryFrom": 200000, "paymentWindowHours": 24, "deliversAllIndia": true },
  "consultation": { "durationMinutes": 10, "methods": ["PHONE", "VIDEO", "IN_PERSON"] },
  "payments": { "checksPerDay": 1 },
  "isSampleContent": false
}
```

- `shop.deliversAllIndia: true` — home delivery reaches every PIN code in India; checkout offers all
  states and union territories. The backend still validates the PIN code (`^[1-9][0-9]{5}$`).
- `consultation` — the free consultation's length and the ways it can happen; the form offers only these.
- `payments.checksPerDay` — how often staff check UPI payments; the apps tell customers how long
  confirmation can take (`1` = "once a day, up to a day").
- The clinic is **not GST-registered**: no GST lines, GSTIN or tax invoices anywhere. If that changes,
  add `gst: { gstin, ratesIncluded }` here and HSN codes to products before showing anything.

`contact.*` are `null` until the clinic approves them — the apps then show "Contact details will be
added soon." `features.upiPayments: false` disables checkout and paid registrations with an explanation.

### `GET /content/blocks`

Status: **Proposed** · Auth: none

Query: `prefix` (e.g. `home.`, `about.`, `contact.`, `consultation.`, `footer.`).

Response `200` (`ContentBlocks`): `{ "home.hero.title": "Find Your Balance. Embrace Your Well-being.", "home.intro.body": "Markdown…" }`.
Keys the apps use: `home.hero.title`, `home.hero.subtitle`, `home.intro.eyebrow`, `home.intro.title`,
`home.intro.body`, `home.intro.imageAlt`, `home.cta.title`, `home.cta.body`, `about.intro`,
`about.story`, `about.philosophy`, `about.approach`, `about.imageAlt`, `contact.intro`,
`consultation.intro`, `consultation.privacy`, `footer.about`. Missing keys may be omitted.

### `GET /content/policies/:slug`

Status: **Proposed** · Auth: none

`slug`: `privacy-policy` | `terms-of-use` | `refund-and-cancellation-policy` | `medical-disclaimer`.

Response `200` (`PolicyPage`):

```json
{
  "slug": "privacy-policy",
  "title": "Privacy Policy",
  "body": "Markdown…",
  "updatedAt": "2026-10-01T00:00:00.000Z",
  "bodyLocale": "en"
}
```

`bodyLocale` tells the app the body's language; policies stay `en` until a Tamil version is approved
(the app then shows an "available in English only" notice in Tamil mode). Errors: `404 NOT_FOUND`.

### `GET /faqs`

Status: **Proposed** · Auth: none

Response `200`: `[{ "id": "faq_1", "question": "How do I book an appointment?", "answer": "Markdown…" }]`

### `GET /testimonials`

Status: **Proposed** · Auth: none

Response `200`: `[{ "id": "tst_1", "authorName": "…", "authorDetail": "Chennai", "quote": "…" }]`.
**Only approved testimonials with recorded consent.** An empty array hides the section.

### `GET /posts`

Status: **Proposed** · Auth: none

Query: `page`, `pageSize` (default 9), `tag` (optional).

Response `200`: `Paginated<BlogPostSummary>` —
`{ "items": [{ "id": "post_1", "slug": "building-a-gentle-morning-routine", "title": "…", "excerpt": "…", "cover": { "url": "https://…", "alt": "" }, "tags": ["Daily living"], "publishedAt": "…" }], "page": 1, "pageSize": 9, "total": 3 }`.
Only published posts, newest first.

### `GET /posts/:slug`

Status: **Proposed** · Auth: none

Response `200` (`BlogPost`): summary fields plus `"content": "Markdown…"`. Errors: `404 NOT_FOUND`.

---

## Catalogue

### `GET /services`

Status: **Proposed** · Auth: none

Active services in display order (`Service[]`):

```json
[
  {
    "id": "svc_1",
    "slug": "wellness-consultation",
    "name": "Wellness Consultation",
    "summary": "…",
    "durationMinutes": 45,
    "price": 80000,
    "mode": "IN_PERSON",
    "icon": "care",
    "isBookable": true,
    "isSample": false
  }
]
```

`mode`: `IN_PERSON` | `ONLINE` | `BOTH`. `price: null` hides the fee — the clinic has chosen not to
show service prices, so the backend currently returns `null` for every service (and in `Appointment.service`). `isBookable: false` disables
online booking (the app shows "contact the clinic"). `icon` is one of `care`, `stethoscope`,
`nutrition`, `activity`, `breath`, `sparkle` (others fall back to a leaf).

### `GET /services/:slug`

Status: **Proposed** · Auth: none

Response `200` (`ServiceDetail`): `Service` plus `"description": "Markdown…"` and `"doctors": Doctor[]`
(verified practitioners who offer it). Errors: `404 NOT_FOUND`.

### `GET /doctors`

Status: **Proposed** · Auth: none

Query: `serviceId` (optional). Only **verified, active** practitioners (`Doctor[]`):

```json
[
  {
    "id": "doc_1",
    "slug": "dr-…",
    "name": "…",
    "specialisation": "…",
    "qualifications": "…",
    "experienceYears": 12,
    "languages": "Tamil, English",
    "shortBio": "…",
    "photo": { "url": "https://…", "alt": "Portrait of …" },
    "acceptsAppointments": true,
    "isSample": false
  }
]
```

Never return registration numbers or qualifications the clinic hasn't verified.

### `GET /doctors/:slug`

Status: **Proposed** · Auth: none

Response `200` (`DoctorDetail`): `Doctor` plus `"bio": "Markdown…"` and `"serviceIds": ["svc_1"]`. Errors: `404`.

---

## Booking & enquiries

### `GET /availability`

Status: **Proposed** · Auth: none

Query: `serviceId`, `doctorId`, `from` (`YYYY-MM-DD`), `days` (1–31).

Response `200` (`Availability`):

```json
{
  "timeZone": "Asia/Kolkata",
  "days": [
    {
      "date": "2026-10-19",
      "closedReason": null,
      "slots": [{ "startsAt": "2026-10-19T04:30:00.000Z", "endsAt": "2026-10-19T05:15:00.000Z", "branchId": "br_main" }]
    },
    { "date": "2026-10-20", "closedReason": "Clinic holiday", "slots": [] }
  ]
}
```

Slots already exclude booked times, the practitioner's leave, clinic holidays and a minimum lead
time. `branchId` is `null` for online services. Errors: `422 VALIDATION_FAILED`.

### `POST /appointments`

Status: **Proposed** · Auth: optional (guests can book) · Header: `Idempotency-Key`

Request (`CreateAppointmentRequest`):

```json
{
  "serviceId": "svc_1",
  "doctorId": "doc_1",
  "startsAt": "2026-10-19T04:30:00.000Z",
  "patientName": "Asha Rao",
  "patientPhone": "+919876543210",
  "patientEmail": "asha@example.com",
  "reason": "First visit",
  "consent": true
}
```

Response `201` (`Appointment`):

```json
{
  "id": "apt_1",
  "reference": "APT-7KQ2M9",
  "status": "CONFIRMED",
  "service": {
    "id": "svc_1",
    "slug": "wellness-consultation",
    "name": "Wellness Consultation",
    "durationMinutes": 45,
    "price": 80000
  },
  "doctor": { "id": "doc_1", "slug": "…", "name": "…" },
  "branch": { "id": "br_main", "name": "Main Clinic", "addressLine": "…", "city": "…" },
  "startsAt": "…",
  "endsAt": "…",
  "patientName": "Asha Rao",
  "patientPhone": "+919876543210",
  "patientEmail": "asha@example.com",
  "reason": "First visit",
  "canCancel": true,
  "cancelBefore": "2026-10-18T04:30:00.000Z",
  "cancelledAt": null
}
```

When signed in, link the appointment to the account. Send a confirmation email in the customer's
language. Errors: `409 SLOT_TAKEN` (the app returns to time selection), `422 VALIDATION_FAILED`, `429`.

### `POST /consultation-requests`

Status: **Proposed** · Auth: optional

Request: `{ "name": "…", "phone": "+91…", "email": "…", "preferredMethod": "PHONE", "reason": "…", "consent": true }`
(`preferredMethod`: one of `GET /site` → `consultation.methods`; today `PHONE` | `VIDEO` | `IN_PERSON`).

Response `201`: `{ "reference": "FC-3H8KQ2" }`. Errors: `422`, `429`.

### `POST /contact-messages`

Status: **Proposed** · Auth: optional

Request: `{ "name": "…", "email": "…", "phone": "+91…" (optional), "subject": "…", "message": "…" }`

Response `201`: `{ "reference": "MSG-9J2K4P" }`. Errors: `422`, `429`.

---

## Shop

### `GET /product-categories`

Status: **Proposed** · Auth: none

Response `200`: `[{ "id": "cat_1", "slug": "teas-infusions", "name": "Teas & Infusions" }]`

### `GET /products`

Status: **Proposed** · Auth: none

Query: `category` (slug), `sort` (`featured` | `price-asc` | `price-desc` | `newest` | `name`), `q`, `page`, `pageSize` (default 12).

Response `200`: `Paginated<ProductSummary>`:

```json
{
  "items": [
    {
      "id": "prd_1",
      "slug": "calm-evening-herbal-tea",
      "name": "Calm Evening Herbal Tea",
      "category": { "id": "cat_1", "slug": "teas-infusions", "name": "Teas & Infusions" },
      "size": "100 g",
      "price": 35000,
      "mrp": 40000,
      "image": { "url": "https://…", "alt": "Calm Evening Herbal Tea" },
      "stockStatus": "IN_STOCK",
      "maxQuantity": 20,
      "isSample": false
    }
  ],
  "page": 1,
  "pageSize": 12,
  "total": 6
}
```

`stockStatus`: `IN_STOCK` | `LOW_STOCK` | `OUT_OF_STOCK`. `maxQuantity` = what one customer can order now (0 when out of stock).

### `GET /products/:slug`

Status: **Proposed** · Auth: none

Response `200` (`Product`): summary plus `shortDescription`, `description` (Markdown), `benefits` (string[]),
`ingredients`, `usage` (nullable strings) and `images` (`ImageRef[]`). Errors: `404`.

### `POST /cart/quote`

Status: **Proposed** · Auth: none

Prices the device cart. Request: `{ "items": [{ "productId": "prd_1", "quantity": 2 }], "fulfilment": "DELIVERY" }`.

Response `200` (`CartQuote`):

```json
{
  "lines": [{ "product": { "…ProductSummary": "…" }, "quantity": 2, "unitPrice": 35000, "lineTotal": 70000 }],
  "problems": [{ "productId": "prd_6", "code": "OUT_OF_STOCK", "availableQuantity": 0 }],
  "subtotal": 70000,
  "deliveryFee": 6000,
  "total": 76000
}
```

`problems[].code`: `OUT_OF_STOCK` | `QUANTITY_REDUCED` | `UNAVAILABLE`. Lines are already reduced to what can be supplied.

### `POST /orders`

Status: **Proposed** · Auth: required · Header: `Idempotency-Key`

Request (`CreateOrderRequest`):

```json
{
  "items": [{ "productId": "prd_1", "quantity": 2 }],
  "fulfilment": "DELIVERY",
  "address": {
    "line1": "12 Lake Road",
    "line2": "Flat 3",
    "landmark": "Near the temple",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600001"
  },
  "contact": { "name": "Asha Rao", "email": "asha@example.com", "phone": "+919876543210" },
  "notes": "Please call before delivery"
}
```

For pickup send `"fulfilment": "PICKUP", "pickupBranchId": "br_main"` instead of `address`.

Response `201` (`CreateOrderResponse`): `{ "order": Order, "payment": Payment }`. The order starts
`PENDING_PAYMENT`, stock is reserved, and unpaid orders are released after `paymentDueAt`.

Errors: `409 OUT_OF_STOCK` (the app re-quotes the cart), `422 VALIDATION_FAILED` (fieldErrors such as
`address.pincode`, `pickupBranchId`), `503 PAYMENTS_NOT_CONFIGURED`.

`Order` (also returned by `GET /me/orders/:reference`):

```json
{
  "id": "ord_1",
  "reference": "ORD-THVESQ",
  "status": "PENDING_PAYMENT",
  "total": 76000,
  "itemCount": 2,
  "createdAt": "…",
  "fulfilment": "DELIVERY",
  "pickupBranch": null,
  "address": { "…": "…" },
  "contact": { "name": "Asha Rao", "email": "…", "phone": "…" },
  "items": [
    {
      "productId": "prd_1",
      "name": "Calm Evening Herbal Tea",
      "size": "100 g",
      "unitPrice": 35000,
      "quantity": 2,
      "lineTotal": 70000,
      "image": null
    }
  ],
  "subtotal": 70000,
  "deliveryFee": 6000,
  "notes": null,
  "trackingInfo": null,
  "paymentDueAt": "…",
  "payment": { "…Payment": "…" },
  "events": [{ "status": "PENDING_PAYMENT", "note": "Order placed", "at": "…" }]
}
```

Order `status`: `PENDING_PAYMENT` → `PAYMENT_SUBMITTED` → `CONFIRMED` → `PROCESSING` →
`READY_FOR_PICKUP` | `SHIPPED` → `COMPLETED`; or `CANCELLED` / `EXPIRED`.

---

## Payments

UPI flow: the customer pays the clinic's UPI ID in any UPI app, then enters the UPI transaction
reference (UTR). Clinic staff check their bank statement and verify or reject it in the backend.

### `GET /payments/:paymentId`

Status: **Proposed** · Auth: required (owner only)

Response `200` (`Payment`):

```json
{
  "id": "pay_1",
  "purpose": "ORDER",
  "reference": "ORD-THVESQ",
  "amount": 76000,
  "status": "AWAITING_PAYMENT",
  "upi": { "payeeVpa": "<clinic UPI ID from backend config>", "payeeName": "Sri Durga Wellness", "note": "ORD-THVESQ" },
  "dueAt": "…",
  "utrLast4": null,
  "submittedAt": null,
  "verifiedAt": null,
  "rejectionReason": null,
  "description": "Order ORD-THVESQ"
}
```

`status`: `AWAITING_PAYMENT` → `SUBMITTED` → `VERIFIED` | `REJECTED` (rejected can be resubmitted) | `CANCELLED`.
`upi` is present only while the payment can be made (`AWAITING_PAYMENT` or `REJECTED`) and
`features.upiPayments` is on. `purpose`: `ORDER` | `CLASS` | `CLASS_RENEWAL` (another month of a monthly class) | `COURSE`. The web app polls this every
30 s while `SUBMITTED`. Errors: `404`.

### `POST /payments/:paymentId/submission`

Status: **Proposed** · Auth: required (owner only)

Request: `{ "utr": "412356789012", "payerName": "Asha Rao" }` (UTR: 6–30 letters/digits, normalised uppercase without spaces).

Response `200`: the `Payment` with `status: "SUBMITTED"`, `utrLast4`, `submittedAt`, and the linked
order / registration / enrolment moves to `PAYMENT_SUBMITTED`. **This never marks anything paid.**

Errors: `409 DUPLICATE_UTR` (UTR already used on another non-rejected payment; `fieldErrors.utr`),
`409 PAYMENT_NOT_PAYABLE` (already submitted, verified or cancelled), `422 VALIDATION_FAILED`, `404`.

---

## Live classes

### `GET /classes`

Status: **Proposed** · Auth: none

Published classes (`LiveClassSummary[]`):

```json
[
  {
    "id": "cls_1",
    "slug": "morning-yoga-flow",
    "title": "Morning Yoga Flow",
    "summary": "…",
    "level": "BEGINNER",
    "language": "English & Hindi",
    "feeType": "MONTHLY",
    "fee": 120000,
    "instructorName": "…",
    "image": null,
    "isSample": false,
    "nextBatch": {
      "id": "bat_1",
      "name": "Morning batch",
      "startsAt": "…",
      "durationMinutes": 55,
      "sessionsCount": 12,
      "scheduleNote": "Mon, Wed & Fri · 6:30 – 7:25 AM",
      "price": 120000,
      "seatsLeft": null,
      "isOpen": true,
      "closedReason": null
    }
  }
]
```

`level`: `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `ALL_LEVELS`. `seatsLeft: null` = no limit
(the clinic currently sets no seat limits).

`feeType` — how the class is charged; `fee` is the amount per unit:

| `feeType`     | `fee` means | `batch.price` (first payment) | Later payments                          |
| ------------- | ----------- | ----------------------------- | --------------------------------------- |
| `PER_BATCH`   | whole batch | `fee`                         | none                                    |
| `MONTHLY`     | one month   | `fee` (the first month)       | one per month, via the renewal endpoint |
| `PER_SESSION` | one session | `fee × sessionsCount`         | none                                    |

`durationMinutes` is per session and stays **under 60** (free Google Meet group calls end at 60
minutes; longer sessions would need a paid Google Workspace plan). `sessionsCount` for a `MONTHLY`
class is sessions per month.
`closedReason`: `FULL` | `STARTED` | `CLOSED` | `CANCELLED` | `null`. **No meeting links.**

### `GET /classes/:slug`

Status: **Proposed** · Auth: optional

Response `200` (`LiveClass`): summary plus `description` (Markdown), `audience`, `feeIncludes` (string[]),
`materials` (string[]), `batches` (`ClassBatch[]`, upcoming and recently started) and
`myRegistrations` — the signed-in customer's active registrations for this class
(`[{ "batchId": "bat_1", "registrationId": "reg_1", "status": "PENDING_PAYMENT" }]`, empty for guests).
Errors: `404`.

### `POST /class-batches/:batchId/registrations`

Status: **Proposed** · Auth: required · Header: `Idempotency-Key`

Request: `{}`.

Response `201` (`RegisterForBatchResponse`): `{ "registration": ClassRegistration }`.
Free classes are `CONFIRMED` immediately (no payment). Paid classes are `PENDING_PAYMENT` with a seat
hold until `holdExpiresAt` and a `payment` to complete.

`ClassRegistration`:

```json
{
  "id": "reg_1",
  "reference": "CLS-4M7Q2X",
  "status": "CONFIRMED",
  "amount": 120000,
  "feeType": "MONTHLY",
  "class": { "id": "cls_1", "slug": "morning-yoga-flow", "title": "Morning Yoga Flow" },
  "batch": { "…ClassBatch": "…" },
  "holdExpiresAt": null,
  "payment": { "…Payment": "…" },
  "meeting": { "url": "https://meet.google.com/…", "opensAt": "…" },
  "monthly": {
    "paidUntil": "2026-11-21T01:00:00Z",
    "monthlyFee": 120000,
    "renewal": null,
    "canRenew": true
  }
}
```

`amount` is the first payment (`batch.price`). `monthly` is `null` unless `feeType` is `MONTHLY`:
`paidUntil` is set when the first payment is verified (one calendar month from the batch start, or
from the verification day if the batch has begun) and moves on by a month each time a renewal is
verified; `renewal` is the month being paid for (`{ periodStart, periodEnd, payment }`) or `null`.

`meeting` is non-null **only** for this customer's `CONFIRMED` registration — and, for monthly
classes, only while `paidUntil` is in the future. Registration `status`:
`PENDING_PAYMENT` | `PAYMENT_SUBMITTED` | `CONFIRMED` | `COMPLETED` | `CANCELLED` | `EXPIRED`.

Errors: `409 ALREADY_REGISTERED`, `409 BATCH_CLOSED` (full, started or closed), `503 PAYMENTS_NOT_CONFIGURED` (paid class), `404`.

---

## Courses

### `GET /courses`

Status: **Proposed** · Auth: none

Query: `category` (optional). Response `200` (`CourseSummary[]`):

```json
[
  {
    "id": "crs_1",
    "slug": "foundations-of-mindful-breathing",
    "title": "…",
    "summary": "…",
    "category": "Breathwork",
    "level": "BEGINNER",
    "language": "English",
    "price": 149900,
    "accessDays": 365,
    "lessonCount": 6,
    "cover": { "url": "https://…", "alt": "" },
    "isSample": false
  }
]
```

`accessDays: null` = lifetime access; `365` = 12 months (both are used — the clinic decides per course).

### `GET /courses/:slug`

Status: **Proposed** · Auth: optional

Response `200` (`Course`): summary plus `description`, `outcomes` (string[]), `instructor`
(`{ name, bio }` or null), `lessons` and `enrolment` (the viewer's enrolment or null):

```json
{
  "lessons": [
    {
      "id": "les_1",
      "position": 1,
      "title": "Welcome",
      "durationMinutes": 6,
      "isFreePreview": true,
      "isLocked": false,
      "isCompleted": false
    },
    {
      "id": "les_2",
      "position": 2,
      "title": "Finding a comfortable posture",
      "durationMinutes": 9,
      "isFreePreview": false,
      "isLocked": true,
      "isCompleted": false
    }
  ],
  "enrolment": {
    "id": "enr_1",
    "reference": "CRS-8K2M4P",
    "status": "PENDING_PAYMENT",
    "amount": 149900,
    "accessExpiresAt": null,
    "payment": { "…Payment": "…" }
  }
}
```

Enrolment `status`: `PENDING_PAYMENT` | `PAYMENT_SUBMITTED` | `ACTIVE` | `EXPIRED` | `CANCELLED`.
`isLocked` is computed for this viewer. Outlines never contain video data. Errors: `404`.

### `GET /courses/:slug/lessons/:lessonId`

Status: **Proposed** · Auth: optional (free previews work for guests)

Response `200` (`Lesson`):

```json
{
  "id": "les_2",
  "courseSlug": "foundations-of-mindful-breathing",
  "position": 2,
  "title": "…",
  "summary": null,
  "durationMinutes": 9,
  "notes": "Markdown…",
  "video": { "provider": "VIMEO", "embedUrl": "https://player.vimeo.com/video/…?h=…" },
  "resources": [{ "id": "res_1", "title": "Practice sheet (PDF)", "url": "https://… (short-lived signed URL)" }],
  "isCompleted": false,
  "previousLessonId": "les_1",
  "nextLessonId": "les_3"
}
```

`video` is `null` when no video has been added yet. Use unlisted / domain-restricted embeds and
short-lived signed resource URLs. `provider`: `YOUTUBE` | `VIMEO` | `BUNNY` | `EMBED_URL`.

Errors: `403 NOT_ENROLLED` (no active enrolment and not a free preview — **no lesson fields in the
body**), `404`.

### `POST /courses/:slug/enrolments`

Status: **Proposed** · Auth: required · Header: `Idempotency-Key`

Request: `{}`. Response `201` (`EnrolResponse`): `{ "enrolment": CourseEnrolment }`. Free courses
become `ACTIVE` immediately; paid courses start `PENDING_PAYMENT` with a `payment`. Access starts
(and `accessExpiresAt` is set) when staff verify the payment.

Errors: `409 ALREADY_ENROLLED`, `503 PAYMENTS_NOT_CONFIGURED`, `404`.

### `PUT /me/lessons/:lessonId/completion`

Status: **Proposed** · Auth: required

Request: `{ "completed": true }` (or `false` to undo). Response `204`.
Errors: `403 NOT_ENROLLED`, `404`.

---

## Account

All endpoints here are scoped to the signed-in customer; other customers' records return `404`.

### `GET /me/appointments`

Status: **Proposed** · Auth: required

Query: `scope` = `upcoming` (confirmed, not yet ended; soonest first) | `past` (everything else; newest first), `page`, `pageSize`.

Response `200`: `Paginated<Appointment>`.

### `GET /me/appointments/:appointmentId`

Status: **Proposed** · Auth: required

Response `200`: `Appointment`. Errors: `404`.

### `POST /me/appointments/:appointmentId/cancel`

Status: **Proposed** · Auth: required

Request: `{ "reason": "Travelling" }` (optional, max 500 characters).

Response `200`: the updated `Appointment` (`status: "CANCELLED"`, `canCancel: false`). The freed
slot becomes available again. Errors: `409 TOO_LATE_TO_CANCEL` (after `cancelBefore` — the clinic's
cut-off, suggested 24 h), `404`.

### `GET /me/orders`

Status: **Proposed** · Auth: required

Query: `page`, `pageSize`. Response `200`: `Paginated<OrderSummary>` —
`{ "items": [{ "id": "ord_1", "reference": "ORD-THVESQ", "status": "CONFIRMED", "total": 76000, "itemCount": 2, "createdAt": "…" }], … }`, newest first.

### `GET /me/orders/:reference`

Status: **Proposed** · Auth: required

Response `200`: `Order` (see `POST /orders`). Errors: `404`.

### `GET /me/payments`

Status: **Proposed** · Auth: required

Query: `open=true` returns only payments needing action (`AWAITING_PAYMENT`, `REJECTED`).
Response `200`: `Payment[]`, newest first.

### `GET /me/class-registrations`

Status: **Proposed** · Auth: required

Response `200`: `ClassRegistration[]`, newest first (meeting details only on confirmed ones).

### `GET /me/class-registrations/:registrationId`

Status: **Proposed** · Auth: required

Response `200`: `ClassRegistration`. Errors: `404`.

### `POST /me/class-registrations/:registrationId/renewals`

Status: **Proposed** · Auth: required (owner only) · Header: `Idempotency-Key`

Starts paying for one more month of a `MONTHLY` class. Direct UPI cannot charge automatically, so
each month is a new payment the customer makes and staff verify, like any other.

Request: `{}`.

Response `201` (`RenewRegistrationResponse`): `{ "registration": ClassRegistration, "payment": Payment }`
— `payment.purpose` is `CLASS_RENEWAL`, `payment.amount` the monthly fee. The new month runs from
the current `paidUntil` (or today, if it has already passed) for one calendar month. Verifying the
payment moves `paidUntil` to the end of that month; rejecting it lets the customer resubmit.

Errors: `409 NOT_MONTHLY`, `409 NOT_CONFIRMED` (first month not verified yet), `409 RENEWAL_IN_PROGRESS`,
`503 PAYMENTS_NOT_CONFIGURED`, `404`.

### `GET /me/courses`

Status: **Proposed** · Auth: required

Response `200` (`MyCourse[]`):

```json
[
  {
    "course": { "…CourseSummary": "…" },
    "enrolment": { "…CourseEnrolment": "…" },
    "completedLessons": 2,
    "nextLessonId": "les_3"
  }
]
```

---

## Admin (clinic owner)

The Admin area on the website (`/admin`) uses these endpoints. Every one is **Auth: required, owner
only**: the server must answer `403 FORBIDDEN` to any signed-in user whose `role` is not `OWNER`,
and must not rely on the app hiding the screens. Responses contain customers' contact details and
full UPI references, so they must not be cached by proxies (`Cache-Control: no-store`).

How owner accounts are created is the backend's choice (for example a seed script that reads the
owner's email and a strong password from server configuration, as the first version of the site
does with `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Registration never creates one, and no owner password
belongs in either app. The mock backend creates a practice owner login only when the web app passes
one in from its development settings file (`apps/web/.env.development`).

Admin bodies use `Bilingual` text — `{ "en": "Morning Yoga Flow", "ta": "காலை யோகா" }` — with
`ta: null` when there is no Tamil version yet (Tamil visitors then see the English). Public endpoints
keep returning one language, chosen by `Accept-Language`.

`PATCH` bodies may contain any subset of the fields; the server lays them over the current values
and validates the result as a whole (so rules such as "MRP ≥ price" still hold). The apps send the
whole form. Validation rules for every body are the `*InputSchema` / `lessonSchema` /
`orderStatusSchema` / `rejectPaymentSchema` / `verifyPaymentSchema` schemas in
`packages/core/src/validation`.

### `GET /admin/overview`

Status: **Proposed** · Auth: required (owner only)

Response `200` (`AdminOverview`):
`{ "paymentsToCheck": 2, "ordersToPrepare": 1, "upcomingBatches": 6, "lowStockProducts": 0 }` —
submitted UPI payments not yet checked; orders in `CONFIRMED` or `PROCESSING`; batches that haven't
started; published products with 5 or fewer in stock.

### `GET /admin/payments`

Status: **Proposed** · Auth: required (owner only)

Query: `status` (optional `PaymentStatus`). With `status=SUBMITTED` the list is oldest first (check
in the order customers paid); otherwise newest first.

Response `200` (`AdminPayment[]`):

```json
[
  {
    "id": "pay_1",
    "purpose": "ORDER",
    "reference": "ORD-THVESQ",
    "amount": 76000,
    "status": "SUBMITTED",
    "description": "Order ORD-THVESQ",
    "utr": "412356789012",
    "payerName": "Asha Rao",
    "customer": { "name": "Asha Rao", "email": "asha@example.com", "phone": "+919876543210" },
    "createdAt": "…",
    "submittedAt": "…",
    "verifiedAt": null,
    "rejectionReason": null
  }
]
```

Unlike the customer's own `Payment` (which shows only the last 4 characters), `utr` is the full
reference, so staff can find it in the bank statement.

### `POST /admin/payments/:paymentId/verification`

Status: **Proposed** · Auth: required (owner only)

A person has found the payment in the clinic's bank statement. Request:
`{ "foundInBankStatement": true }` (required — a reminder that a screenshot or the customer's word is
not proof). Moves the payment to `VERIFIED` and what it pays for to its confirmed state: the order to
`CONFIRMED`, the class seat to `CONFIRMED` (Meet link now included for that customer), the course
enrolment to `ACTIVE` (access period starts now), or the next month of a monthly class onto
`paidUntil`. The server should record who verified it and when.

Response `200`: the updated `AdminPayment`. Errors: `409 PAYMENT_ALREADY_CHECKED` (not `SUBMITTED`
any more — another staff member checked it), `422`, `404`.

### `POST /admin/payments/:paymentId/rejection`

Status: **Proposed** · Auth: required (owner only)

The payment could not be found. Request: `{ "reason": "We couldn't find this reference. Please check the 12-digit number." }`
(5–300 characters; shown to the customer). Moves the payment to `REJECTED`; the customer can submit a
corrected UPI reference. The order's payment window or the class seat hold is extended by 24 hours.

Response `200`: the updated `AdminPayment`. Errors: `409 PAYMENT_ALREADY_CHECKED`, `422`, `404`.

### `GET /admin/orders`

Status: **Proposed** · Auth: required (owner only)

Query: `status` (optional `OrderStatus`), `page`, `pageSize`. Response `200`:
`Paginated<AdminOrderSummary>` — `OrderSummary` plus `customerName`, `fulfilment` and
`paymentStatus`, newest first.

### `GET /admin/orders/:reference`

Status: **Proposed** · Auth: required (owner only)

Response `200` (`AdminOrder`): the `Order` (see `POST /orders`) plus `customer` (the account holder's
name, email, phone) and `nextStatuses` — the statuses staff may move it to now:

| Current status                      | `nextStatuses`                                                   |
| ----------------------------------- | ---------------------------------------------------------------- |
| `PENDING_PAYMENT`                   | `CANCELLED`                                                      |
| `PAYMENT_SUBMITTED`                 | none — check the payment first                                   |
| `CONFIRMED`                         | `PROCESSING`, `CANCELLED`                                        |
| `PROCESSING`                        | `SHIPPED` (delivery) or `READY_FOR_PICKUP` (pickup), `CANCELLED` |
| `SHIPPED`, `READY_FOR_PICKUP`       | `COMPLETED`                                                      |
| `COMPLETED`, `CANCELLED`, `EXPIRED` | none                                                             |

Errors: `404`.

### `POST /admin/orders/:reference/status-changes`

Status: **Proposed** · Auth: required (owner only)

Request (`UpdateOrderStatusRequest`):
`{ "status": "SHIPPED", "trackingInfo": "India Post EK123456789IN", "note": "Packed with care" }` —
`note` (optional, ≤ 300) and `trackingInfo` (optional, ≤ 160, kept for `SHIPPED`) are shown to the
customer; the order's `events` get a new entry (with a default note when none is given).
Cancelling returns the items to stock and cancels an unpaid payment. A **verified** payment stays
verified: the website never refunds — the clinic refunds from its bank account.

Response `200`: the updated `AdminOrder`. Errors: `409 INVALID_STATUS_CHANGE` (not in
`nextStatuses`), `422`, `404`.

### `GET /admin/classes`

Status: **Proposed** · Auth: required (owner only)

Response `200` (`AdminClassSummary[]`): every class, hidden ones included —
`{ "id", "slug", "title", "feeType", "fee", "isPublished", "isSample", "batchCount", "nextBatchStartsAt", "confirmedStudents" }`.

### `POST /admin/classes`

Status: **Proposed** · Auth: required (owner only)

Request (`ClassInput`):

```json
{
  "title": { "en": "Evening Pranayama", "ta": "மாலை பிராணாயாமம்" },
  "summary": { "en": "Gentle breathing practice after work.", "ta": null },
  "description": { "en": "", "ta": null },
  "level": "BEGINNER",
  "language": { "en": "Tamil and English", "ta": null },
  "feeType": "MONTHLY",
  "fee": 120000,
  "instructorName": null,
  "isPublished": true
}
```

The server creates the `slug` from the English title. Response `201`: `AdminClass` (the input plus
`id`, `slug`, `isSample` and `batches: AdminBatch[]`). Errors: `422`.

### `GET /admin/classes/:classId`

Status: **Proposed** · Auth: required (owner only)

Response `200` (`AdminClass`), with every batch as `AdminBatch`:
`{ "id", "name", "startsAt", "durationMinutes", "sessionsCount", "scheduleNote", "seatLimit", "registrationOpen", "meetingUrl", "price", "students": [{ "registrationId", "reference", "status", "name", "phone", "email", "createdAt" }] }`.
`meetingUrl` is the private Google Meet link — returned here and in a confirmed student's own
registration, never on public endpoints. Errors: `404`.

### `PATCH /admin/classes/:classId`

Status: **Proposed** · Auth: required (owner only)

Request: any `ClassInput` fields. Changing the fee affects new registrations only; existing ones
keep the amount they registered for. `isPublished: false` hides the class from `GET /classes` and
new registrations; customers who already registered keep seeing it. Response `200`: `AdminClass`.
Errors: `422`, `404`.

### `POST /admin/classes/:classId/batches`

Status: **Proposed** · Auth: required (owner only)

Request (`BatchInput`):

```json
{
  "name": "November batch",
  "startsAt": "2026-11-03T13:00:00.000Z",
  "durationMinutes": 45,
  "sessionsCount": 12,
  "scheduleNote": "Mon, Wed, Fri · 6:30–7:15 PM",
  "seatLimit": null,
  "registrationOpen": true,
  "meetingUrl": "https://meet.google.com/abc-defg-hij"
}
```

`startsAt` must be in the future; `durationMinutes` 15–60 (the free Google Meet limit);
`sessionsCount` 1–200 (sessions per month for `MONTHLY` classes); `seatLimit` null or 1–1000;
`meetingUrl` null or an `https://meet.google.com/…` link. Response `201`: the updated `AdminClass`.
Errors: `422` (`fieldErrors.startsAt`, …), `404`.

### `PATCH /admin/class-batches/:batchId`

Status: **Proposed** · Auth: required (owner only)

Request: any `BatchInput` fields (a past `startsAt` is allowed when correcting a batch). Closing
registration (`registrationOpen: false`) keeps existing students. Response `200`: the updated
`AdminClass`. Errors: `422`, `404`.

### `DELETE /admin/class-batches/:batchId`

Status: **Proposed** · Auth: required (owner only)

Only for batches with no students (registrations other than cancelled or expired). Response `204`.
Errors: `409 BATCH_HAS_STUDENTS` (close registration instead), `404`.

### `GET /admin/products`

Status: **Proposed** · Auth: required (owner only)

Response `200` (`AdminProductSummary[]`): every product, hidden ones included —
`{ "id", "slug", "name", "categoryName", "size", "price", "stock", "isPublished", "isSample" }`.

### `POST /admin/products`

Status: **Proposed** · Auth: required (owner only)

Request (`ProductInput`):

```json
{
  "name": { "en": "Tulsi Ginger Tea", "ta": null },
  "categoryId": "cat_herbal-teas",
  "size": "100 g",
  "price": 24000,
  "mrp": 28000,
  "stock": 12,
  "isFeatured": false,
  "isPublished": true,
  "shortDescription": { "en": "A warming blend for winter mornings.", "ta": null },
  "description": { "en": "", "ta": null }
}
```

`price` ≥ ₹1; `mrp` null or ≥ `price`; `stock` 0–100000 (the number available to sell now);
`categoryId` null or an id from `GET /product-categories`. Photos are added on the server (not part of
this body yet). Response `201`: `AdminProduct` (the input plus `id`, `slug`, `isSample`).
Errors: `422` (`fieldErrors.categoryId` "Choose a category", `fieldErrors.mrp`, …).

### `GET /admin/products/:productId`

Status: **Proposed** · Auth: required (owner only)

Response `200`: `AdminProduct`. Errors: `404`.

### `PATCH /admin/products/:productId`

Status: **Proposed** · Auth: required (owner only)

Request: any `ProductInput` fields. `isPublished: false` removes the product from the shop and from
cart quotes (`UNAVAILABLE`); existing orders are unaffected. Response `200`: `AdminProduct`.
Errors: `422`, `404`.

### `GET /admin/courses`

Status: **Proposed** · Auth: required (owner only)

Response `200` (`AdminCourseSummary[]`):
`{ "id", "slug", "title", "price", "accessDays", "lessonCount", "activeStudents", "isPublished", "isSample" }`.

### `POST /admin/courses`

Status: **Proposed** · Auth: required (owner only)

Request (`CourseInput`):
`{ "title": Bilingual, "summary": Bilingual, "description": Bilingual, "level": "ALL_LEVELS", "price": 49900, "accessDays": 365, "isPublished": true }`
— `accessDays` null for lifetime access, else 1–3650. Response `201`: `AdminCourse` (plus `id`,
`slug`, `isSample`, `lessons: []`). Errors: `422`.

### `GET /admin/courses/:courseId`

Status: **Proposed** · Auth: required (owner only)

Response `200` (`AdminCourse`) with `lessons: AdminLesson[]` —
`{ "id", "position", "title": Bilingual, "durationMinutes", "isFreePreview", "notes": Bilingual, "videoUrl" }`.
Errors: `404`.

### `PATCH /admin/courses/:courseId`

Status: **Proposed** · Auth: required (owner only)

Request: any `CourseInput` fields. A hidden course leaves `GET /courses` and can't be enrolled in;
enrolled students keep access. Response `200`: `AdminCourse`. Errors: `422`, `404`.

### `POST /admin/courses/:courseId/lessons`

Status: **Proposed** · Auth: required (owner only)

Request (`LessonInput`):
`{ "title": { "en": "Welcome", "ta": null }, "durationMinutes": 5, "isFreePreview": true, "notes": { "en": "Start here.", "ta": null }, "videoUrl": "https://youtu.be/…" }`
— `videoUrl` null or a YouTube / Vimeo link. The lesson endpoint returns it to viewers with access as
`video: { provider, embedUrl }` (YouTube via `youtube-nocookie.com`). New lessons go to the end.
Response `201`: the updated `AdminCourse`. Errors: `422` (`fieldErrors.videoUrl`), `404`.

### `PATCH /admin/lessons/:lessonId`

Status: **Proposed** · Auth: required (owner only)

Request: any `LessonInput` fields. Response `200`: the updated `AdminCourse`. Errors: `422`, `404`.

### `DELETE /admin/lessons/:lessonId`

Status: **Proposed** · Auth: required (owner only)

Removes the lesson; the remaining lessons are renumbered. Response `204`. Errors: `404`.

---

## Change log

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-18 | First proposal, derived from the Sri Durga Wellness website's features. All endpoints proposed.                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-10-19 | Admin area: `User.role` (`CUSTOMER` / `OWNER`), new owner-only `/admin/*` endpoints (overview, payment verification and rejection, orders and status changes, classes and batches with the private Meet link, products, courses and lessons), `Order.trackingInfo` filled from `SHIPPED`, lesson `video` from YouTube / Vimeo links, hidden (`isPublished: false`) classes / products / courses, new error codes `PAYMENT_ALREADY_CHECKED`, `INVALID_STATUS_CHANGE`, `BATCH_HAS_STUDENTS`. |
| 2026-10-18 | Clinic decisions: class `feeType` + `batch.price`, monthly renewals (new `POST /me/class-registrations/:id/renewals`, payment purpose `CLASS_RENEWAL`), `GET /site` → `shop.deliversAllIndia`, `consultation`, `payments.checksPerDay`; service prices hidden; no GST.                                                                                                                                                                                                                     |
