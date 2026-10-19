/**
 * Image sources. The live API returns absolute https URLs; the mock backend returns site paths
 * such as "/images/placeholders/doctor.webp", which are bundled with the app.
 */
import type { ImageSourcePropType } from "react-native";

const BUNDLED: Record<string, ImageSourcePropType> = {
  "blog-classes.webp": require("../../assets/images/placeholders/blog-classes.webp"),
  "blog-default.webp": require("../../assets/images/placeholders/blog-default.webp"),
  "blog-first-visit.webp": require("../../assets/images/placeholders/blog-first-visit.webp"),
  "blog-routine.webp": require("../../assets/images/placeholders/blog-routine.webp"),
  "class-default.webp": require("../../assets/images/placeholders/class-default.webp"),
  "clinic.webp": require("../../assets/images/placeholders/clinic.webp"),
  "course-breath.webp": require("../../assets/images/placeholders/course-breath.webp"),
  "course-default.webp": require("../../assets/images/placeholders/course-default.webp"),
  "course-eating.webp": require("../../assets/images/placeholders/course-eating.webp"),
  "course-yoga.webp": require("../../assets/images/placeholders/course-yoga.webp"),
  "doctor.webp": require("../../assets/images/placeholders/doctor.webp"),
  "hero.webp": require("../../assets/images/placeholders/hero.webp"),
  "intro.webp": require("../../assets/images/placeholders/intro.webp"),
  "product-bottle.webp": require("../../assets/images/placeholders/product-bottle.webp"),
  "product-cushion.webp": require("../../assets/images/placeholders/product-cushion.webp"),
  "product-default.webp": require("../../assets/images/placeholders/product-default.webp"),
  "product-mat.webp": require("../../assets/images/placeholders/product-mat.webp"),
  "product-oil.webp": require("../../assets/images/placeholders/product-oil.webp"),
  "product-soap.webp": require("../../assets/images/placeholders/product-soap.webp"),
  "product-tea.webp": require("../../assets/images/placeholders/product-tea.webp"),
};

export const HERO_IMAGE: ImageSourcePropType = require("../../assets/images/hero-forest.webp");

export function imageSource(
  url: string | null | undefined,
  fallback: keyof typeof BUNDLED | null = null,
): ImageSourcePropType | null {
  if (url && /^https:\/\//i.test(url)) return { uri: url };
  const file = url?.split("/").pop();
  if (file && BUNDLED[file]) return BUNDLED[file]!;
  return fallback ? BUNDLED[fallback]! : null;
}

export type PlaceholderName = keyof typeof BUNDLED;
