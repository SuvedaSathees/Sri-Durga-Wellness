import { Ionicons, type IoniconsName } from "@expo/vector-icons";
import { tokens } from "@sdw/tokens";

export type IconName = IoniconsName;

/** Decorative by default (hidden from screen readers); give the parent control the label. */
export function Icon({
  name,
  size = 20,
  color = tokens.color.primary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Map of the API's service icon names to Ionicons. */
export const SERVICE_ICONS: Record<string, IconName> = {
  care: "heart-outline",
  stethoscope: "medkit-outline",
  nutrition: "nutrition-outline",
  activity: "fitness-outline",
  breath: "water-outline",
  sparkle: "sparkles-outline",
};
