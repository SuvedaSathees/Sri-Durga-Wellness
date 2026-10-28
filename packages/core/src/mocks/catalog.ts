/**
 * Read-only sample catalogue for the mock backend, built once per language from the fixtures.
 * Ids are stable across languages, so switching language keeps carts and links valid.
 */
import type {
  BlogPost,
  Branch,
  ClassBatch,
  ClassFeeType,
  DoctorDetail,
  Faq,
  ImageRef,
  Level,
  Locale,
  Paise,
  ProductCategory,
  ServiceMode,
  SiteInfo,
} from "../models";
import { addDaysToKey, clinicTimeToUtc, dateKey } from "../logic/dates";
import { lines } from "../logic/misc";
import * as EN from "./fixtures/sample-en";
import * as TA from "./fixtures/sample-ta";
import { CONTENT_EN, CONTENT_TA } from "./fixtures/content";

/** Clinic decisions recorded in docs/REQUIREMENTS.md §6 — the real backend reads these from its settings. */
const SHOW_SERVICE_PRICES = false;

const img = (path: string | null | undefined, alt = ""): ImageRef | null => (path ? { url: path, alt } : null);
const placeholder = (file: string) => `/images/placeholders/${file}`;
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return h * 60 + m;
};

export const SAMPLE_LESSON_NOTES_EN =
  "Sample lesson. The clinic will add this lesson's video and notes.\n\n## In this lesson\n- What you'll practise\n- How long to spend on it\n- What to try before the next lesson";

export type DoctorRec = DoctorDetail & { schedule: Array<{ weekday: number; start: number; end: number }> };

export type ServiceRec = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  durationMinutes: number;
  price: Paise | null;
  mode: ServiceMode;
  icon: string | null;
  isBookable: boolean;
  isSample: boolean;
  doctorIds: string[];
};

export type ProductRec = {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
  size: string | null;
  price: Paise;
  mrp: Paise | null;
  isFeatured: boolean;
  sortOrder: number;
  shortDescription: string;
  description: string;
  benefits: string[];
  ingredients: string | null;
  usage: string | null;
  image: ImageRef | null;
  initialStock: number;
  isSample: boolean;
  /** False = hidden from the shop by the clinic (kept for existing orders). */
  isPublished: boolean;
};

export type BatchRec = Omit<ClassBatch, "seatsLeft" | "isOpen" | "closedReason" | "price"> & {
  classId: string;
  seatLimit: number | null;
  registrationOpen: boolean;
  /** Private Google Meet link set by the clinic; only confirmed students receive it. */
  meetingUrl: string | null;
};

export type ClassRec = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  audience: string;
  level: Level;
  language: string;
  feeType: ClassFeeType;
  fee: Paise;
  feeIncludes: string[];
  materials: string[];
  instructorName: string | null;
  image: ImageRef | null;
  batches: BatchRec[];
  isSample: boolean;
  isPublished: boolean;
};

export type LessonRec = {
  id: string;
  position: number;
  title: string;
  durationMinutes: number | null;
  isFreePreview: boolean;
  notes: string;
  /** YouTube or Vimeo link added by the clinic. */
  videoUrl: string | null;
};

export type CourseRec = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string | null;
  level: Level;
  language: string | null;
  price: Paise;
  accessDays: number | null;
  cover: ImageRef | null;
  outcomes: string[];
  instructor: { name: string; bio: string | null } | null;
  lessons: LessonRec[];
  isSample: boolean;
  isPublished: boolean;
};

export type Catalog = {
  site: SiteInfo;
  branches: Branch[];
  doctors: DoctorRec[];
  services: ServiceRec[];
  categories: ProductCategory[];
  products: ProductRec[];
  classes: ClassRec[];
  courses: CourseRec[];
  posts: BlogPost[];
  faqs: Faq[];
  content: Record<string, string>;
};

/** `epoch` anchors the sample schedule ("a class starting in 3 days") to when the mock started. */
export function buildCatalog(locale: Locale, epoch: Date): Catalog {
  const ta = locale === "ta";
  const pick = <T, K extends keyof T & string>(base: T, overlay: Record<string, string> | undefined, key: K): T[K] =>
    ta && overlay?.[key] !== undefined ? (overlay[key] as T[K]) : base[key];

  const branches: Branch[] = EN.SAMPLE_BRANCHES.map((b) => ({
    id: `br_${b.slug}`,
    slug: b.slug,
    name: pick(b, TA.TAMIL_BRANCHES[b.slug], "name"),
    addressLine: b.addressLine,
    city: b.city,
    state: b.state,
    pincode: b.pincode,
    phone: null,
    openingHours: pick(b, TA.TAMIL_BRANCHES[b.slug], "openingHours"),
    mapUrl: null,
    isPickupPoint: b.isPickupPoint,
    isSample: true,
  }));

  const serviceId = (slug: string) => `svc_${slug}`;
  const doctors: DoctorRec[] = EN.SAMPLE_DOCTORS.map((d) => {
    const t = TA.TAMIL_DOCTORS[d.slug];
    return {
      id: `doc_${d.slug}`,
      slug: d.slug,
      name: pick(d, t, "name"),
      specialisation: pick(d, t, "specialisation"),
      qualifications: pick(d, t, "qualifications"),
      experienceYears: null,
      languages: d.languages,
      shortBio: pick(d, t, "shortBio"),
      bio: pick(d, t, "bio"),
      photo: img(placeholder("doctor.webp")),
      acceptsAppointments: true,
      isSample: true,
      serviceIds: d.services.map(serviceId),
      schedule: d.schedule.map(([weekday, start, end]) => ({ weekday, start: minutes(start), end: minutes(end) })),
    };
  });

  const services: ServiceRec[] = EN.SAMPLE_SERVICES.map((s) => {
    const t = TA.TAMIL_SERVICES[s.slug];
    return {
      id: serviceId(s.slug),
      slug: s.slug,
      name: pick(s, t, "name"),
      summary: pick(s, t, "summary"),
      description: pick(s, t, "description"),
      durationMinutes: s.durationMinutes,
      // The clinic chose not to show service prices when booking (decision 10), so the API sends none.
      price: SHOW_SERVICE_PRICES ? s.price : null,
      mode: s.mode,
      icon: s.icon,
      isBookable: true,
      isSample: true,
      doctorIds: doctors.filter((d) => d.serviceIds.includes(serviceId(s.slug))).map((d) => d.id),
    };
  });

  const categories: ProductCategory[] = EN.SAMPLE_CATEGORIES.map((c) => ({
    id: `cat_${c.slug}`,
    slug: c.slug,
    name: pick(c, TA.TAMIL_CATEGORIES[c.slug], "name"),
  }));

  const products: ProductRec[] = EN.SAMPLE_PRODUCTS.map((p, i) => {
    const t = TA.TAMIL_PRODUCTS[p.slug];
    const name = pick(p, t, "name");
    return {
      id: `prd_${p.slug}`,
      slug: p.slug,
      name,
      categoryId: `cat_${p.category}`,
      size: ta && t?.size ? t.size : p.size,
      price: p.price,
      mrp: p.mrp,
      isFeatured: p.isFeatured,
      sortOrder: i,
      shortDescription: pick(p, t, "shortDescription"),
      description: pick(p, t, "description"),
      benefits: lines(ta && t?.benefits ? t.benefits : p.benefits),
      ingredients: ta && t?.ingredients ? t.ingredients : p.ingredients,
      usage: ta && t?.usage ? t.usage : p.usage,
      image: img(p.image, name),
      initialStock: p.stock,
      isSample: true,
      isPublished: true,
    };
  });

  const today = dateKey(epoch);
  const batchText = (text: string) => (ta ? (TA.TAMIL_BATCH_TEXT[text] ?? text) : text);
  const instructorName = (slug: string) => doctors.find((d) => d.slug === slug)?.name ?? null;

  const classes: ClassRec[] = EN.SAMPLE_CLASSES.map((c) => {
    const t = TA.TAMIL_CLASSES[c.slug];
    const id = `cls_${c.slug}`;
    return {
      id,
      slug: c.slug,
      title: pick(c, t, "title"),
      summary: pick(c, t, "summary"),
      description: pick(c, t, "description"),
      audience: pick(c, t, "audience"),
      level: c.level,
      language: pick(c, t, "language"),
      feeType: c.feeType,
      fee: c.fee,
      feeIncludes: lines(ta && t?.feeIncludes ? t.feeIncludes : c.feeIncludes),
      materials: lines(ta && t?.materials ? t.materials : c.materials),
      instructorName: instructorName(c.instructor),
      image: img(placeholder("class-default.webp")),
      isSample: true,
      isPublished: true,
      batches: c.batches.map((b, i) => ({
        id: `bat_${c.slug}_${i + 1}`,
        classId: id,
        name: batchText(b.name),
        startsAt: clinicTimeToUtc(addDaysToKey(today, b.startInDays), b.hour * 60 + b.minute).toISOString(),
        durationMinutes: b.durationMinutes,
        sessionsCount: b.sessionsCount,
        scheduleNote: batchText(b.scheduleNote),
        seatLimit: b.seatLimit,
        registrationOpen: true,
        meetingUrl: null,
      })),
    };
  });

  const courses: CourseRec[] = EN.SAMPLE_COURSES.map((c) => {
    const t = TA.TAMIL_COURSES[c.slug];
    const instructor = doctors.find((d) => d.slug === c.instructor);
    return {
      id: `crs_${c.slug}`,
      slug: c.slug,
      title: ta && t ? t.title : c.title,
      summary: ta && t ? t.summary : c.summary,
      description: ta && t ? t.description : c.description,
      category: ta && t ? t.category : c.category,
      level: c.level,
      language: ta && t ? t.language : c.language,
      price: c.price,
      accessDays: c.accessDays,
      cover: img(c.cover),
      outcomes: ta && t ? lines(t.outcomes) : c.outcomes,
      instructor: instructor ? { name: instructor.name, bio: instructor.shortBio } : null,
      isSample: true,
      isPublished: true,
      lessons: c.lessons.map((l, i) => ({
        id: `les_${c.slug}_${i + 1}`,
        position: i + 1,
        title: ta && t?.lessons[i] ? t.lessons[i]! : l.title,
        durationMinutes: l.durationMinutes,
        isFreePreview: "isFreePreview" in l && l.isFreePreview === true,
        notes: ta ? TA.TAMIL_SAMPLE_LESSON_NOTES : SAMPLE_LESSON_NOTES_EN,
        videoUrl: null,
      })),
    };
  });

  // Blog posts stay in English until the clinic writes Tamil versions (as on the original website).
  const posts: BlogPost[] = EN.SAMPLE_POSTS.map((p) => ({
    id: `post_${p.slug}`,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    cover: img(p.cover),
    tags: p.tags,
    publishedAt: new Date(epoch.getTime() - p.daysAgo * 86_400_000).toISOString(),
  }));

  const faqs: Faq[] = EN.SAMPLE_FAQS.map((f, i) => {
    const t = TA.TAMIL_FAQS[f.question];
    return { id: `faq_${i + 1}`, question: pick(f, t, "question"), answer: pick(f, t, "answer") };
  });

  const content = ta ? { ...CONTENT_EN, ...CONTENT_TA } : { ...CONTENT_EN };

  const site: SiteInfo = {
    clinicName: ta ? "ஸ்ரீ துர்கா வெல்னஸ்" : "Sri Durga Wellness",
    tagline: ta ? "சமநிலைக்கும் நலத்துக்குமான உங்கள் பயணம்" : "Your journey to balance and well-being",
    // Contact details are deliberately empty: only clinic-approved details may be shown.
    contact: { phone: null, whatsapp: null, email: null },
    social: { instagram: null, facebook: null, youtube: null },
    branches,
    features: { upiPayments: true, homeDelivery: true, clinicPickup: true, onlineBooking: true },
    shop: { deliveryFee: 6000, freeDeliveryFrom: 200000, paymentWindowHours: 24, deliversAllIndia: true },
    consultation: { durationMinutes: 10, methods: ["PHONE", "VIDEO", "IN_PERSON"] },
    payments: { checksPerDay: 1 },
    isSampleContent: true,
  };

  return { site, branches, doctors, services, categories, products, classes, courses, posts, faqs, content };
}

/**
 * Demo UPI payee. "@invalid" is not a real UPI handle, so no money can reach anyone if a tester
 * scans it. The live backend returns the clinic's real UPI ID from its own configuration.
 */
export const MOCK_UPI = { payeeVpa: "sample.clinic@invalid", payeeName: "Sample clinic (demo — do not pay)" } as const;
