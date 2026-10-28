/**
 * The part of the sample catalog the clinic owner can change in the Admin area: live classes (with
 * their batches), shop products and recorded courses. It is kept in the mock's state in both
 * languages — like rows in a real database — and turned into the per-language records the public
 * endpoints read. Sample content from the fixtures is copied in when the mock first starts.
 */
import type { Bilingual, ClassFeeType, ImageRef, Level, Locale } from "../models";
import type { BatchRec, Catalog, ClassRec, CourseRec, LessonRec, ProductRec } from "./catalog";

export type TextList = { en: string[]; ta: string[] | null };

export type StoredBatch = {
  id: string;
  classId: string;
  name: Bilingual | null;
  startsAt: string;
  durationMinutes: number;
  sessionsCount: number;
  scheduleNote: Bilingual | null;
  seatLimit: number | null;
  registrationOpen: boolean;
  meetingUrl: string | null;
};

export type StoredClass = {
  id: string;
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  description: Bilingual;
  audience: Bilingual;
  level: Level;
  language: Bilingual;
  feeType: ClassFeeType;
  fee: number;
  feeIncludes: TextList;
  materials: TextList;
  instructorName: Bilingual | null;
  image: ImageRef | null;
  isSample: boolean;
  isPublished: boolean;
  /** True once the clinic has changed it (sample schedules then stop moving forward). */
  edited: boolean;
  createdAt: string;
  batches: StoredBatch[];
};

export type StoredProduct = {
  id: string;
  slug: string;
  name: Bilingual;
  categoryId: string | null;
  size: Bilingual | null;
  price: number;
  mrp: number | null;
  isFeatured: boolean;
  sortOrder: number;
  shortDescription: Bilingual;
  description: Bilingual;
  benefits: TextList;
  ingredients: Bilingual | null;
  usage: Bilingual | null;
  image: ImageRef | null;
  isSample: boolean;
  isPublished: boolean;
  createdAt: string;
};

export type StoredLesson = {
  id: string;
  position: number;
  title: Bilingual;
  durationMinutes: number | null;
  isFreePreview: boolean;
  notes: Bilingual;
  videoUrl: string | null;
};

export type StoredCourse = {
  id: string;
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  description: Bilingual;
  category: Bilingual | null;
  level: Level;
  language: Bilingual | null;
  price: number;
  accessDays: number | null;
  cover: ImageRef | null;
  outcomes: TextList;
  instructor: { name: Bilingual; bio: Bilingual | null } | null;
  isSample: boolean;
  isPublished: boolean;
  createdAt: string;
  lessons: StoredLesson[];
};

export type EditableCatalog = { classes: StoredClass[]; products: StoredProduct[]; courses: StoredCourse[] };

// ── Text helpers ─────────────────────────────────────────────

/** English and Tamil fixture text → one record; Tamil is null when the fixture had none (it fell back to English). */
const both = (en: string, ta: string | undefined): Bilingual => ({ en, ta: ta !== undefined && ta !== en ? ta : null });
const bothOrNull = (en: string | null, ta: string | null | undefined): Bilingual | null =>
  en === null ? null : both(en, ta ?? undefined);
const list = (en: string[], ta: string[] | undefined): TextList => ({
  en,
  ta: ta && JSON.stringify(ta) !== JSON.stringify(en) ? ta : null,
});

export const pick = (text: Bilingual, locale: Locale): string => (locale === "ta" && text.ta ? text.ta : text.en);
const pickOrNull = (text: Bilingual | null, locale: Locale): string | null => (text ? pick(text, locale) : null);
const pickList = (text: TextList, locale: Locale): string[] => (locale === "ta" && text.ta ? text.ta : text.en);

/**
 * A field the Admin area edits in one language only (batch name, size, instructor): keep the
 * Tamil version while the English is unchanged; drop it once the English changes.
 */
export function retext(old: Bilingual | null, en: string | null): Bilingual | null {
  if (!en) return null;
  return { en, ta: old && old.en === en ? old.ta : null };
}

/** "Morning Yoga Flow!" → "morning-yoga-flow", made unique among `taken`. */
export function slugify(text: string, taken: Set<string>, fallback: string): string {
  const base =
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || fallback;
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

// ── Seeding from the sample fixtures ─────────────────────────

export function seedEditable(en: Catalog, ta: Catalog, createdAt: string): EditableCatalog {
  const classes: StoredClass[] = en.classes.map((c) => {
    const t = ta.classes.find((x) => x.id === c.id);
    return {
      id: c.id,
      slug: c.slug,
      title: both(c.title, t?.title),
      summary: both(c.summary, t?.summary),
      description: both(c.description, t?.description),
      audience: both(c.audience, t?.audience),
      level: c.level,
      language: both(c.language, t?.language),
      feeType: c.feeType,
      fee: c.fee,
      feeIncludes: list(c.feeIncludes, t?.feeIncludes),
      materials: list(c.materials, t?.materials),
      instructorName: bothOrNull(c.instructorName, t?.instructorName),
      image: c.image,
      isSample: c.isSample,
      isPublished: true,
      edited: false,
      createdAt,
      batches: c.batches.map((b) => {
        const tb = t?.batches.find((x) => x.id === b.id);
        return {
          id: b.id,
          classId: c.id,
          name: bothOrNull(b.name, tb?.name),
          startsAt: b.startsAt,
          durationMinutes: b.durationMinutes,
          sessionsCount: b.sessionsCount,
          scheduleNote: bothOrNull(b.scheduleNote, tb?.scheduleNote),
          seatLimit: b.seatLimit,
          registrationOpen: b.registrationOpen,
          meetingUrl: null,
        };
      }),
    };
  });

  const products: StoredProduct[] = en.products.map((p) => {
    const t = ta.products.find((x) => x.id === p.id);
    return {
      id: p.id,
      slug: p.slug,
      name: both(p.name, t?.name),
      categoryId: p.categoryId,
      size: bothOrNull(p.size, t?.size),
      price: p.price,
      mrp: p.mrp,
      isFeatured: p.isFeatured,
      sortOrder: p.sortOrder,
      shortDescription: both(p.shortDescription, t?.shortDescription),
      description: both(p.description, t?.description),
      benefits: list(p.benefits, t?.benefits),
      ingredients: bothOrNull(p.ingredients, t?.ingredients),
      usage: bothOrNull(p.usage, t?.usage),
      image: p.image,
      isSample: p.isSample,
      isPublished: true,
      createdAt,
    };
  });

  const courses: StoredCourse[] = en.courses.map((c) => {
    const t = ta.courses.find((x) => x.id === c.id);
    return {
      id: c.id,
      slug: c.slug,
      title: both(c.title, t?.title),
      summary: both(c.summary, t?.summary),
      description: both(c.description, t?.description),
      category: bothOrNull(c.category, t?.category),
      level: c.level,
      language: bothOrNull(c.language, t?.language),
      price: c.price,
      accessDays: c.accessDays,
      cover: c.cover,
      outcomes: list(c.outcomes, t?.outcomes),
      instructor: c.instructor
        ? {
            name: both(c.instructor.name, t?.instructor?.name),
            bio: bothOrNull(c.instructor.bio, t?.instructor?.bio),
          }
        : null,
      isSample: c.isSample,
      isPublished: true,
      createdAt,
      lessons: c.lessons.map((l) => {
        const tl = t?.lessons.find((x) => x.id === l.id);
        return {
          id: l.id,
          position: l.position,
          title: both(l.title, tl?.title),
          durationMinutes: l.durationMinutes,
          isFreePreview: l.isFreePreview,
          notes: both(l.notes, tl?.notes),
          videoUrl: null,
        };
      }),
    };
  });

  return { classes, products, courses };
}

/**
 * Sample batches are dated relative to when the mock started ("starts in 3 days"). Data is now kept
 * between visits, so whole weeks are added to classes the clinic hasn't edited, keeping the samples
 * in the future (and on the same weekdays).
 */
export function moveSampleSchedule(store: EditableCatalog, weeks: number): void {
  if (weeks <= 0) return;
  const ms = weeks * 7 * 86_400_000;
  for (const c of store.classes) {
    if (!c.isSample || c.edited) continue;
    for (const b of c.batches) b.startsAt = new Date(new Date(b.startsAt).getTime() + ms).toISOString();
  }
}

// ── Per-language records for the public endpoints ────────────

export function classRec(c: StoredClass, locale: Locale): ClassRec {
  return {
    id: c.id,
    slug: c.slug,
    title: pick(c.title, locale),
    summary: pick(c.summary, locale),
    description: pick(c.description, locale),
    audience: pick(c.audience, locale),
    level: c.level,
    language: pick(c.language, locale),
    feeType: c.feeType,
    fee: c.fee,
    feeIncludes: pickList(c.feeIncludes, locale),
    materials: pickList(c.materials, locale),
    instructorName: pickOrNull(c.instructorName, locale),
    image: c.image,
    isSample: c.isSample,
    isPublished: c.isPublished,
    batches: c.batches.map(
      (b): BatchRec => ({
        id: b.id,
        classId: b.classId,
        name: pickOrNull(b.name, locale),
        startsAt: b.startsAt,
        durationMinutes: b.durationMinutes,
        sessionsCount: b.sessionsCount,
        scheduleNote: pickOrNull(b.scheduleNote, locale),
        seatLimit: b.seatLimit,
        registrationOpen: b.registrationOpen,
        meetingUrl: b.meetingUrl,
      }),
    ),
  };
}

export function productRec(p: StoredProduct, locale: Locale): ProductRec {
  const name = pick(p.name, locale);
  return {
    id: p.id,
    slug: p.slug,
    name,
    categoryId: p.categoryId,
    size: pickOrNull(p.size, locale),
    price: p.price,
    mrp: p.mrp,
    isFeatured: p.isFeatured,
    sortOrder: p.sortOrder,
    shortDescription: pick(p.shortDescription, locale),
    description: pick(p.description, locale),
    benefits: pickList(p.benefits, locale),
    ingredients: pickOrNull(p.ingredients, locale),
    usage: pickOrNull(p.usage, locale),
    image: p.image ? { ...p.image, alt: p.image.alt ? name : "" } : null,
    initialStock: 0,
    isSample: p.isSample,
    isPublished: p.isPublished,
  };
}

export function courseRec(c: StoredCourse, locale: Locale): CourseRec {
  return {
    id: c.id,
    slug: c.slug,
    title: pick(c.title, locale),
    summary: pick(c.summary, locale),
    description: pick(c.description, locale),
    category: pickOrNull(c.category, locale),
    level: c.level,
    language: pickOrNull(c.language, locale),
    price: c.price,
    accessDays: c.accessDays,
    cover: c.cover,
    outcomes: pickList(c.outcomes, locale),
    instructor: c.instructor
      ? { name: pick(c.instructor.name, locale), bio: pickOrNull(c.instructor.bio, locale) }
      : null,
    isSample: c.isSample,
    isPublished: c.isPublished,
    lessons: c.lessons.map(
      (l): LessonRec => ({
        id: l.id,
        position: l.position,
        title: pick(l.title, locale),
        durationMinutes: l.durationMinutes,
        isFreePreview: l.isFreePreview,
        notes: pick(l.notes, locale),
        videoUrl: l.videoUrl,
      }),
    ),
  };
}
