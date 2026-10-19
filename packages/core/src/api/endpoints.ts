/**
 * Every endpoint the apps call — the single source of truth in code for docs/API_CONTRACT.md.
 *
 * STATUS: all endpoints are PROPOSED. None is assumed to exist on the backend yet. When the backend
 * team confirms or changes one, update its method/path here (and the contract doc); screens and
 * hooks do not change. `tests/contract.test.ts` checks that every endpoint here is documented in the
 * contract and implemented by the mock backend.
 *
 * Paths are relative to the configured API base URL (which includes the version, e.g. ".../v1").
 * `:name` segments are path parameters, filled and URL-encoded by `buildPath`.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * none: never send the access token.
 * optional: send it when signed in (response may include the customer's own data).
 * required: the API answers 401 without a valid token.
 */
export type AuthRequirement = "none" | "optional" | "required";

export type Endpoint = {
  readonly id: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly auth: AuthRequirement;
};

const ep = <
  const I extends string,
  const M extends HttpMethod,
  const P extends string,
  const A extends AuthRequirement,
>(
  id: I,
  method: M,
  path: P,
  auth: A,
) => ({ id, method, path, auth }) as const;

export const endpoints = {
  auth: {
    register: ep("auth.register", "POST", "/auth/register", "none"),
    login: ep("auth.login", "POST", "/auth/login", "none"),
    refresh: ep("auth.refresh", "POST", "/auth/refresh", "none"),
    logout: ep("auth.logout", "POST", "/auth/logout", "optional"),
    forgotPassword: ep("auth.forgotPassword", "POST", "/auth/forgot-password", "none"),
    resetPassword: ep("auth.resetPassword", "POST", "/auth/reset-password", "none"),
  },
  me: {
    get: ep("me.get", "GET", "/me", "required"),
    update: ep("me.update", "PATCH", "/me", "required"),
    changePassword: ep("me.changePassword", "POST", "/me/password", "required"),
  },
  content: {
    site: ep("content.site", "GET", "/site", "none"),
    blocks: ep("content.blocks", "GET", "/content/blocks", "none"),
    policy: ep("content.policy", "GET", "/content/policies/:slug", "none"),
    faqs: ep("content.faqs", "GET", "/faqs", "none"),
    testimonials: ep("content.testimonials", "GET", "/testimonials", "none"),
    posts: ep("content.posts", "GET", "/posts", "none"),
    post: ep("content.post", "GET", "/posts/:slug", "none"),
  },
  catalog: {
    services: ep("catalog.services", "GET", "/services", "none"),
    service: ep("catalog.service", "GET", "/services/:slug", "none"),
    doctors: ep("catalog.doctors", "GET", "/doctors", "none"),
    doctor: ep("catalog.doctor", "GET", "/doctors/:slug", "none"),
  },
  booking: {
    availability: ep("booking.availability", "GET", "/availability", "none"),
    create: ep("booking.create", "POST", "/appointments", "optional"),
    consultation: ep("booking.consultation", "POST", "/consultation-requests", "optional"),
    contact: ep("booking.contact", "POST", "/contact-messages", "optional"),
  },
  shop: {
    categories: ep("shop.categories", "GET", "/product-categories", "none"),
    products: ep("shop.products", "GET", "/products", "none"),
    product: ep("shop.product", "GET", "/products/:slug", "none"),
    quote: ep("shop.quote", "POST", "/cart/quote", "none"),
    createOrder: ep("shop.createOrder", "POST", "/orders", "required"),
  },
  payments: {
    get: ep("payments.get", "GET", "/payments/:paymentId", "required"),
    submit: ep("payments.submit", "POST", "/payments/:paymentId/submission", "required"),
  },
  classes: {
    list: ep("classes.list", "GET", "/classes", "none"),
    get: ep("classes.get", "GET", "/classes/:slug", "optional"),
    register: ep("classes.register", "POST", "/class-batches/:batchId/registrations", "required"),
  },
  courses: {
    list: ep("courses.list", "GET", "/courses", "none"),
    get: ep("courses.get", "GET", "/courses/:slug", "optional"),
    lesson: ep("courses.lesson", "GET", "/courses/:slug/lessons/:lessonId", "optional"),
    enrol: ep("courses.enrol", "POST", "/courses/:slug/enrolments", "required"),
    completeLesson: ep("courses.completeLesson", "PUT", "/me/lessons/:lessonId/completion", "required"),
  },
  account: {
    appointments: ep("account.appointments", "GET", "/me/appointments", "required"),
    appointment: ep("account.appointment", "GET", "/me/appointments/:appointmentId", "required"),
    cancelAppointment: ep("account.cancelAppointment", "POST", "/me/appointments/:appointmentId/cancel", "required"),
    orders: ep("account.orders", "GET", "/me/orders", "required"),
    order: ep("account.order", "GET", "/me/orders/:reference", "required"),
    payments: ep("account.payments", "GET", "/me/payments", "required"),
    registrations: ep("account.registrations", "GET", "/me/class-registrations", "required"),
    registration: ep("account.registration", "GET", "/me/class-registrations/:registrationId", "required"),
    renewRegistration: ep(
      "account.renewRegistration",
      "POST",
      "/me/class-registrations/:registrationId/renewals",
      "required",
    ),
    courses: ep("account.courses", "GET", "/me/courses", "required"),
  },
} as const;

/** Flat list of every endpoint (used by the mock router and the contract tests). */
export const allEndpoints: Endpoint[] = Object.values(endpoints).flatMap((group) => Object.values(group));

export type PathParams = Record<string, string | number>;

/** "/services/:slug" + { slug: "a b" } → "/services/a%20b". Throws if a parameter is missing. */
export function buildPath(path: string, params: PathParams = {}): string {
  return path.replace(/:([A-Za-z]+)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined || value === "") throw new Error(`Missing path parameter "${name}" for ${path}`);
    return encodeURIComponent(String(value));
  });
}
