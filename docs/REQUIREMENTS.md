# Product requirements — Sri Durga Wellness apps

This document records what the web and mobile frontends must do, drawn from the existing
Sri Durga Wellness website (Next.js, full-stack). The new frontends keep the same features
and rules, but talk to a **separately developed backend** over a REST/JSON API.

## 1. Who uses it

| User                    | Where                       | Main jobs                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visitor (not signed in) | Web, mobile                 | Learn about the clinic, its practitioners and services; browse the shop, classes and courses; book an appointment; ask for a free consultation; send a message                                                                                                                |
| Customer (signed in)    | Web, mobile                 | Everything a visitor can do, plus: buy products, register for live classes, enrol in recorded courses, pay by UPI and track verification, watch unlocked lessons, manage appointments, orders, profile and language                                                           |
| Clinic owner            | Web — Admin area (`/admin`) | Check UPI payments against the bank statement (verify / not found with a reason), move orders through packing and shipping, post live classes and batches with the private Meet link, edit products and courses. Every `/admin` call is checked on the server (`role: OWNER`) |

## 2. Features in scope

| Area                                | Web | Mobile | Notes                                                                                                                                                                              |
| ----------------------------------- | --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                                | ✓   | ✓      | Calm hero, services, upcoming classes, featured products, courses, FAQs, approved testimonials only                                                                                |
| About & practitioners               | ✓   | ✓      | Only verified practitioner profiles, as returned by the API                                                                                                                        |
| Services                            | ✓   | ✓      | List and detail; "Book" only when the service is bookable                                                                                                                          |
| Appointment booking                 | ✓   | ✓      | Service → practitioner → date and time → details → review → confirmation. Guests can book; signed-in customers get details prefilled                                               |
| Free consultation request           | ✓   | ✓      | Short form with consent checkbox                                                                                                                                                   |
| Contact                             | ✓   | ✓      | Branches, phone, WhatsApp, email, message form                                                                                                                                     |
| Shop                                | ✓   | ✓      | Categories, sort, pagination, product detail, stock state                                                                                                                          |
| Cart                                | ✓   | ✓      | Kept on the device; prices and stock are always re-checked by the server (`/cart/quote`)                                                                                           |
| Checkout                            | ✓   | ✓      | Pickup at a branch or home delivery; contact and address validation                                                                                                                |
| UPI payment                         | ✓   | ✓      | Show amount, UPI ID and QR (web) / open UPI app (mobile); customer submits the UPI transaction reference (UTR); status shows **"waiting for clinic to verify"** until staff verify |
| Live classes                        | ✓   | ✓      | Batches, seats left, registration (free → confirmed; paid → payment)                                                                                                               |
| Recorded courses                    | ✓   | ✓      | Outline with free previews; enrol; lesson player only when the API says the customer has access                                                                                    |
| Account                             | ✓   | ✓      | Overview, appointments (view, cancel), orders, payments, classes (Meet link only when the API provides it), courses, profile, password, language                                   |
| Sign in / register / reset password | ✓   | ✓      |                                                                                                                                                                                    |
| Journal (blog)                      | ✓   | ✓      | List and article                                                                                                                                                                   |
| Policies                            | ✓   | ✓      | Privacy, terms, refund & cancellation, medical disclaimer — text from the API                                                                                                      |
| English / தமிழ்                     | ✓   | ✓      | Toggle everywhere; choice remembered; sent to the API as `Accept-Language`                                                                                                         |

## 3. Business and safety rules the frontend must respect

These come from the clinic's original brief and are not optional.

1. **Payments are never marked paid by the app.** The app only shows the status the API returns.
   Submitting a UTR moves a payment to `SUBMITTED` ("waiting for verification"), never to `VERIFIED`.
2. **No screenshot-based payment confirmation.** The UI never says "paid" because a customer uploaded or typed something.
3. **Paid course content unlocks only when the API returns it.** The app has no client-side unlock logic; locked lessons have no video data at all.
4. **Google Meet links are private.** The app shows a Meet link only when the API includes one for that customer's confirmed registration. Links are never put in URLs, logs or analytics.
5. **Nothing is invented.** No made-up testimonials, medical claims, qualifications, registration numbers, prices or policies. Mock data is clearly marked as sample data and must be replaced by the backend before launch.
6. **No secrets in frontend code.** No API keys, admin passwords or payment credentials in either app. The UPI payee ID comes from the API at run time.
7. **No sensitive data in URLs.** Tokens, emails, phone numbers and Meet links never go into routes or query strings. Password-reset tokens arrive by email link and are removed from the address bar as soon as they are read.
8. **Every button works or is clearly disabled.** If the API says something isn't available (e.g. UPI not configured, class full, booking closed), the action is disabled with a reason.
9. **Patient and customer information is protected.** Tokens are stored securely (memory + httpOnly cookie on web, SecureStore on mobile); nothing personal is written to `localStorage`; sign-out clears cached data.

## 4. Non-functional requirements

- **Responsive web:** phone (≥ 320 px), tablet and desktop; no horizontal scrolling.
- **Native feel on mobile:** bottom tabs, native stack transitions, pull to refresh, safe areas, keyboard-aware forms, haptics-free but platform-standard controls, deep links.
- **Accessibility:** WCAG 2.2 AA colour contrast, labelled form fields, errors announced, keyboard navigation and visible focus on web, screen-reader labels and roles on mobile, respects reduced motion and large text.
- **States:** every data view has loading, error (with retry) and empty states.
- **Backend-agnostic UI:** screens never call HTTP directly; switching from mock data to the real backend is a configuration change.
- **Typed end to end:** request and response models are TypeScript types shared by both apps; forms are validated by shared Zod schemas, the same rules the backend should apply.
- **Testable:** business logic is pure and unit-tested; web journeys are tested end to end in a real browser.

## 5. Assumptions (to confirm with the backend team)

- Amounts are integers in **paise** (₹1 = 100).
- Dates are ISO-8601 strings in UTC; the clinic's time zone is **Asia/Kolkata**.
- The backend issues a short-lived **access token** (Bearer) and a **refresh token**: an httpOnly cookie for the web app, a token in the response body for the mobile app.
- Content translations are chosen by the backend from the `Accept-Language` header (`en` or `ta`).

Every endpoint the apps need is listed in [API_CONTRACT.md](./API_CONTRACT.md) with the status
**Proposed — awaiting backend confirmation**. None of them is assumed to exist yet.

## 6. Clinic decisions (answered 18 Oct 2026)

From the clinic's answers to the launch questionnaire. Where a setting comes from the backend, the
mock backend returns the same value so the apps behave as they will in production.

| #   | Question                  | Clinic's answer                                                    | What the apps do                                                                                                                                                                                              |
| --- | ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Website language          | English + Tamil                                                    | EN / தமிழ் switch in the top bar on every page (web) and on Home / Account (mobile)                                                                                                                           |
| 2   | How live classes are paid | All three: one fee per batch, monthly fee that renews, per session | Each class has a `feeType`. Fees show their unit ("₹1,200 / month", "₹250 / session"). Monthly classes are renewed by the customer each month from My account → Classes (a new UPI payment that staff verify) |
| 3   | Length of each live class | Under 60 minutes                                                   | Sessions are under an hour (free Google Meet limit); class pages show "Session length: Under 60 minutes"                                                                                                      |
| 4   | Seats per batch           | Unlimited                                                          | No seat counts are shown; batches never close as "Full" (the apps still support a limit if the clinic sets one later)                                                                                         |
| 5   | Recorded course access    | Both lifetime and 12 months                                        | Each course shows "Lifetime access" or "12 months of access"; access starts when payment is verified                                                                                                          |
| 6   | Product delivery          | Both clinic pickup and home delivery — **anywhere in India**       | Checkout offers pickup or delivery to every PIN code in India, with a picker of all 36 states and union territories                                                                                           |
| 7   | GST                       | Not GST-registered                                                 | No GST, GSTIN or tax-invoice wording anywhere                                                                                                                                                                 |
| 8   | Customer login            | Email + password                                                   | Unchanged (no OTP)                                                                                                                                                                                            |
| 9   | Booking rules             | _Not answered yet_                                                 | Current defaults stay: booking at least 2 hours ahead, online cancellation up to 24 hours before. **Confirm with the clinic**                                                                                 |
| 10  | Show service prices       | No                                                                 | The API returns `price: null` for services, so no fee appears on service pages or in booking                                                                                                                  |
| 11  | Free consultation         | Phone, video call or in person · 10 minutes                        | The form offers those three choices and says it is a free 10-minute conversation                                                                                                                              |
| 12  | Who checks UPI payments   | The CEO, daily                                                     | Customers are told payments are checked once a day, so confirmation can take up to a day. The checker's name isn't shown publicly                                                                             |

The clinic's target is customers across India: online classes and courses work from anywhere, and
products ship to any PIN code.
