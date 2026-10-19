/**
 * Every React Query cache key in one place. Public content keys include the language, because the
 * API returns translated content; switching language then shows cached results instantly.
 * Everything under "me" is private to the signed-in customer and is cleared on sign-out.
 */
import type { AvailabilityQuery, Locale, PageQuery, ProductQuery } from "@sdw/core";

export const qk = {
  session: ["session"] as const,
  site: (l: Locale) => ["site", l] as const,
  blocks: (l: Locale, prefix: string) => ["content", l, prefix] as const,
  policy: (l: Locale, slug: string) => ["policy", l, slug] as const,
  faqs: (l: Locale) => ["faqs", l] as const,
  testimonials: (l: Locale) => ["testimonials", l] as const,
  posts: (l: Locale, q: PageQuery & { tag?: string }) => ["posts", l, q] as const,
  post: (l: Locale, slug: string) => ["post", l, slug] as const,
  services: (l: Locale) => ["services", l] as const,
  service: (l: Locale, slug: string) => ["service", l, slug] as const,
  doctors: (l: Locale, serviceId?: string) => ["doctors", l, serviceId ?? "all"] as const,
  doctor: (l: Locale, slug: string) => ["doctor", l, slug] as const,
  availability: (l: Locale, q: AvailabilityQuery) => ["availability", l, q] as const,
  categories: (l: Locale) => ["categories", l] as const,
  products: (l: Locale, q: ProductQuery) => ["products", l, q] as const,
  product: (l: Locale, slug: string) => ["product", l, slug] as const,
  quote: (l: Locale, cart: unknown, fulfilment: string) => ["quote", l, cart, fulfilment] as const,
  classes: (l: Locale) => ["classes", l] as const,
  /** Includes the viewer, because the response lists their own registrations. */
  liveClass: (l: Locale, slug: string) => ["me", "class", l, slug] as const,
  courses: (l: Locale, category?: string) => ["courses", l, category ?? "all"] as const,
  course: (l: Locale, slug: string) => ["me", "course", l, slug] as const,
  lesson: (l: Locale, slug: string, lessonId: string) => ["me", "lesson", l, slug, lessonId] as const,
  // Private
  me: ["me"] as const,
  payment: (l: Locale, id: string) => ["me", "payment", l, id] as const,
  myAppointments: (l: Locale, scope: string) => ["me", "appointments", l, scope] as const,
  myAppointment: (l: Locale, id: string) => ["me", "appointment", l, id] as const,
  myOrders: (l: Locale, q: PageQuery) => ["me", "orders", l, q] as const,
  myOrder: (l: Locale, ref: string) => ["me", "order", l, ref] as const,
  myPayments: (l: Locale, open: boolean) => ["me", "payments", l, open] as const,
  myRegistrations: (l: Locale) => ["me", "registrations", l] as const,
  myRegistration: (l: Locale, id: string) => ["me", "registration", l, id] as const,
  myCourses: (l: Locale) => ["me", "courses", l] as const,
};
