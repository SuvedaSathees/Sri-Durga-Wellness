/**
 * Form controls. Labels and hints arrive translated; `error` is the English key from the form
 * controller and is translated here. Errors are announced when they appear.
 */
import { forwardRef, useState, type ReactNode } from "react";
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@sdw/controllers";
import { theme } from "../../theme";
import { Icon } from "./Icon";
import { Text } from "./Text";

function FieldError({ error }: { error?: string }) {
  const t = useT();
  if (!error) return null;
  return (
    <Text variant="small" style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
      {t(error)}
    </Text>
  );
}

type TextFieldProps = Omit<TextInputProps, "onChangeText" | "value"> & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, required, value, onChangeText, multiline, style, ...input },
  ref,
) {
  const t = useT();
  const a11yLabel = `${label}${required ? "" : `, ${t("optional")}`}${error ? `. ${t(error)}` : ""}`;
  return (
    <View style={styles.field}>
      <Text variant="label">
        {label}
        {required ? null : <Text variant="small"> ({t("optional")})</Text>}
      </Text>
      {hint ? <Text variant="small">{hint}</Text> : null}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={a11yLabel}
        accessibilityHint={hint}
        placeholderTextColor={theme.color.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline ? styles.multiline : null, error ? styles.invalid : null, style]}
        {...input}
      />
      <FieldError error={error} />
    </View>
  );
});

export function Checkbox({
  label,
  checked,
  onChange,
  error,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={styles.checkRow}
        hitSlop={4}
      >
        <View style={[styles.box, checked ? styles.boxOn : null, error ? styles.invalid : null]}>
          {checked ? <Icon name="checkmark" size={16} color={theme.color.onPrimary} /> : null}
        </View>
        <Text style={styles.checkLabel}>{label}</Text>
      </Pressable>
      <FieldError error={error} />
    </View>
  );
}

/** Single choice from a few options, shown as selectable cards (radio semantics). */
export function ChoiceGroup<V extends string>({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: V | "";
  onChange: (v: V) => void;
  options: Array<{ value: V; label: string; description?: string; disabled?: boolean }>;
  error?: string;
}) {
  return (
    <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text variant="label">{label}</Text>
      <View style={styles.choices}>
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              disabled={o.disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: !!o.disabled }}
              style={({ pressed }) => [
                styles.choice,
                selected ? styles.choiceOn : null,
                pressed ? styles.choicePressed : null,
                o.disabled ? { opacity: 0.5 } : null,
              ]}
            >
              <View style={[styles.radio, selected ? styles.radioOn : null]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.choiceText}>
                <Text variant="label">{o.label}</Text>
                {o.description ? <Text variant="small">{o.description}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <FieldError error={error} />
    </View>
  );
}

/**
 * Pick one value from a long list (e.g. states). Shows like a text field; tapping opens a
 * full-height sheet with the options, the current one ticked.
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const shown = current?.label ?? placeholder ?? "";
  return (
    <View style={styles.field}>
      <Text variant="label">
        {label}
        {required ? null : <Text variant="small"> ({t("optional")})</Text>}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}${current ? `, ${current.label}` : ""}${error ? `. ${t(error)}` : ""}`}
        accessibilityHint={placeholder}
        style={[styles.input, styles.selectRow, error ? styles.invalid : null]}
      >
        <Text style={[styles.selectValue, current ? null : { color: theme.color.textMuted }]} numberOfLines={1}>
          {shown}
        </Text>
        <Icon name="chevron-down" size={18} color={theme.color.textMuted} />
      </Pressable>
      <FieldError error={error} />
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={[styles.sheet, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
          <View style={styles.sheetHead}>
            <Text variant="h3" style={{ flex: 1 }} accessibilityRole="header">
              {label}
            </Text>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" hitSlop={10} style={styles.sheetClose}>
              <Text variant="label" style={{ color: theme.color.primary }}>
                {t("Close")}
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            initialNumToRender={20}
            renderItem={({ item }) => {
              const selected = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [styles.option, pressed ? styles.choicePressed : null]}
                >
                  <Text style={{ flex: 1 }}>{item.label}</Text>
                  {selected ? <Icon name="checkmark" size={20} color={theme.color.primary} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.color.inputBorder,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
    color: theme.color.text,
    fontSize: 16,
  },
  multiline: { minHeight: 120 },
  invalid: { borderColor: theme.color.danger },
  error: { color: theme.color.danger, fontWeight: "600" },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    minHeight: theme.touchTarget,
    paddingVertical: 4,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.color.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.surface,
    marginTop: 1,
  },
  boxOn: { backgroundColor: theme.color.primary, borderColor: theme.color.primary },
  checkLabel: { flex: 1 },
  choices: { gap: 10 },
  choice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
  },
  choiceOn: {
    borderColor: theme.color.primary,
    backgroundColor: theme.color.surfaceMuted,
    borderWidth: 2,
    padding: 13,
  },
  choicePressed: { backgroundColor: theme.color.accentSoft },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.color.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  radioOn: { borderColor: theme.color.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.color.primary },
  choiceText: { flex: 1, gap: 2 },
  selectRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectValue: { flex: 1, fontSize: 16, color: theme.color.text },
  sheet: { flex: 1, backgroundColor: theme.color.bg },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  sheetClose: { minHeight: theme.touchTarget, justifyContent: "center" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: theme.touchTarget + 4,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
});
