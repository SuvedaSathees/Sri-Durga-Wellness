import type { ConsultationMethod } from "./booking";
import type { ID, ImageRef, ISODateTime, Paise, SampleFlag } from "./common";

export type Branch = SampleFlag & {
  id: ID;
  slug: string;
  name: string;
  addressLine: string;
  city: string;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  /** Free text, one line per row, e.g. "Mon – Sat · 9:00 AM – 7:00 PM". */
  openingHours: string | null;
  /** Google Maps link for directions. */
  mapUrl: string | null;
  isPickupPoint: boolean;
};

/** Public clinic information and feature switches (GET /site). */
export type SiteInfo = {
  clinicName: string;
  tagline: string;
  contact: {
    phone: string | null;
    /** Digits only with country code, for wa.me links, e.g. "919876543210". */
    whatsapp: string | null;
    email: string | null;
  };
  social: { instagram: string | null; facebook: string | null; youtube: string | null };
  branches: Branch[];
  features: {
    /** False until the clinic has configured its UPI ID — checkout and paid registrations are disabled. */
    upiPayments: boolean;
    homeDelivery: boolean;
    clinicPickup: boolean;
    onlineBooking: boolean;
  };
  shop: {
    deliveryFee: Paise;
    /** Orders at or above this subtotal ship free; null = no free-delivery threshold. */
    freeDeliveryFrom: Paise | null;
    /** How long an unpaid order is held, in hours. */
    paymentWindowHours: number;
    /** True when home delivery reaches every PIN code in India. */
    deliversAllIndia: boolean;
  };
  /** Free consultation: how long it lasts and the ways it can happen. */
  consultation: { durationMinutes: number; methods: ConsultationMethod[] };
  /** How UPI payments are checked by clinic staff. */
  payments: {
    /** How many times a day staff check submitted UPI payments (1 = once a day). */
    checksPerDay: number;
  };
  /** True while the backend is serving development sample data. */
  isSampleContent: boolean;
};

export type Doctor = SampleFlag & {
  id: ID;
  slug: string;
  name: string;
  specialisation: string;
  qualifications: string;
  experienceYears: number | null;
  languages: string | null;
  shortBio: string;
  photo: ImageRef | null;
  acceptsAppointments: boolean;
};

export type DoctorDetail = Doctor & { bio: string; serviceIds: ID[] };

export type ServiceMode = "IN_PERSON" | "ONLINE" | "BOTH";

export type Service = SampleFlag & {
  id: ID;
  slug: string;
  name: string;
  summary: string;
  durationMinutes: number;
  /** Null when the clinic prefers not to show a price (its current choice for all services). */
  price: Paise | null;
  mode: ServiceMode;
  /** Icon name from the shared icon set, e.g. "care", "breath". */
  icon: string | null;
  isBookable: boolean;
};

export type ServiceDetail = Service & {
  /** Markdown. */
  description: string;
  doctors: Doctor[];
};

export type Faq = { id: ID; question: string; /** Markdown. */ answer: string };

/** Only testimonials with recorded consent that staff have approved are ever returned. */
export type Testimonial = { id: ID; authorName: string; authorDetail: string | null; quote: string };

/** Editable text blocks for the home page, keyed like "home.hero.title". */
export type ContentBlocks = Record<string, string>;

export type PolicyPage = {
  slug: "privacy-policy" | "terms-of-use" | "refund-and-cancellation-policy" | "medical-disclaimer";
  title: string;
  /** Markdown. */
  body: string;
  updatedAt: ISODateTime;
  /** Language the body is written in; may be "en" when no approved Tamil version exists yet. */
  bodyLocale: "en" | "ta";
};

export type BlogPostSummary = {
  id: ID;
  slug: string;
  title: string;
  excerpt: string;
  cover: ImageRef | null;
  tags: string[];
  publishedAt: ISODateTime;
};

export type BlogPost = BlogPostSummary & { /** Markdown. */ content: string };
