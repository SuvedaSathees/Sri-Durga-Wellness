/** Free consultation request (mobile): short form, then a confirmation with the reference. */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useConsultationRequest, useContentBlocks, useForm, useSession, useSite, useT } from "@sdw/controllers";
import {
  CONSULTATION_METHOD_LABEL,
  consultationMethods,
  consultationSchema,
  type ConsultationRequestInput,
} from "@sdw/core";
import {
  Button,
  Card,
  Checkbox,
  ChoiceGroup,
  FormError,
  Icon,
  Markdown,
  Screen,
  Stack,
  Text,
  TextField,
} from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { theme } from "../../../theme";

export function ConsultationScreen({ navigation }: RootScreenProps<"Consultation">) {
  const t = useT();
  const { user } = useSession();
  const blocks = useContentBlocks("consultation.");
  const request = useConsultationRequest();
  const [reference, setReference] = useState<string | null>(null);
  const form = useForm(consultationSchema, {
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    preferredMethod: "" as unknown as "PHONE",
    reason: "",
    consent: false as unknown as true,
  });
  const v = form.values;
  const settings = useSite().data?.consultation;
  const methods = settings?.methods.length ? settings.methods : consultationMethods;
  const minutes = settings?.durationMinutes ?? null;
  const submit = form.handleSubmit(async (data) => {
    const res = await request.mutateAsync(data as ConsultationRequestInput);
    setReference(res.reference);
  });

  if (reference) {
    return (
      <Screen>
        <View style={styles.done} accessible accessibilityLiveRegion="polite">
          <View style={styles.doneIcon}>
            <Icon name="checkmark-circle" size={40} color={theme.color.success} />
          </View>
          <Text variant="h1" style={styles.center}>
            {t("Thank you")}
          </Text>
          <Text style={styles.center}>
            {t("Thank you. A member of our team will contact you shortly to arrange your free consultation.")}
          </Text>
          <Text variant="label">
            {t("Your reference:")} {reference}
          </Text>
        </View>
        <Button fullWidth onPress={() => navigation.navigate("Tabs", { screen: "ServicesTab" })}>
          {t("Explore our services")}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen keyboard>
      <Stack>
        <Text variant="h1">{t("Request a free consultation")}</Text>
        <Text variant="lead">
          {blocks.text("consultation.intro") || t("Request a free consultation and we'll call you to arrange a time.")}
        </Text>
        {minutes ? (
          <Text variant="small">
            {t("A free {minutes}-minute conversation — by phone, by video call or at the clinic.", { minutes })}
          </Text>
        ) : null}
      </Stack>
      <FormError message={form.formError} />
      <TextField
        label={t("Full name")}
        required
        autoComplete="name"
        textContentType="name"
        value={v.name}
        onChangeText={(x) => form.setField("name", x)}
        error={form.errorFor("name")}
      />
      <TextField
        label={t("Mobile number")}
        required
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        value={v.phone}
        onChangeText={(x) => form.setField("phone", x)}
        error={form.errorFor("phone")}
      />
      <TextField
        label={t("Email")}
        required
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={v.email}
        onChangeText={(x) => form.setField("email", x)}
        error={form.errorFor("email")}
      />
      <ChoiceGroup
        label={t("Choose how you'd like to have the consultation")}
        value={v.preferredMethod}
        onChange={(x) => form.setField("preferredMethod", x)}
        options={methods.map((m) => ({ value: m, label: t(CONSULTATION_METHOD_LABEL[m]) }))}
        error={form.errorFor("preferredMethod")}
      />
      <TextField
        label={t("What you'd like help with")}
        hint={t("A few words are enough. Please don't include detailed medical records.")}
        required
        multiline
        value={v.reason}
        onChangeText={(x) => form.setField("reason", x)}
        error={form.errorFor("reason")}
      />
      <Checkbox
        label={t("I agree to the clinic contacting me about this request, as described in the Privacy Policy.")}
        checked={v.consent === true}
        onChange={(x) => form.setField("consent", x)}
        error={form.errorFor("consent")}
      />
      <Button fullWidth icon="chatbubble-ellipses-outline" loading={form.submitting} onPress={() => void submit()}>
        {t("Request my free consultation")}
      </Button>
      {blocks.text("consultation.privacy") ? (
        <Card>
          <Markdown text={blocks.text("consultation.privacy")} />
        </Card>
      ) : null}
      <Button variant="ghost" onPress={() => navigation.navigate("Policy", { slug: "privacy-policy" })}>
        {t("Privacy Policy")}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  done: { alignItems: "center", gap: 12, paddingVertical: 16 },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.color.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
});
