/** EN | தமிழ் segmented control. */
import { Pressable, StyleSheet, View } from "react-native";
import { useLocale, useT } from "@sdw/controllers";
import type { Locale } from "@sdw/core";
import { theme } from "../../theme";
import { Text } from "./Text";

const OPTIONS: Array<{ value: Locale; short: string; name: string }> = [
  { value: "en", short: "EN", name: "English" },
  { value: "ta", short: "தமிழ்", name: "தமிழ் (Tamil)" },
];

export function LanguageToggle() {
  const [locale, setLocale] = useLocale();
  const t = useT();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={`${t("Language")} · மொழி`}>
      {OPTIONS.map((o) => {
        const selected = locale === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => setLocale(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.name}
            style={[styles.option, selected ? styles.selected : null]}
          >
            <Text variant="label" style={{ color: selected ? theme.color.onPrimary : theme.color.text, fontSize: 14 }}>
              {o.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    padding: 3,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    backgroundColor: theme.color.surface,
    alignSelf: "flex-start",
  },
  option: {
    minWidth: 64,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { backgroundColor: theme.color.primary },
});
