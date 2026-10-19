/** Contact: one-tap call / WhatsApp / email (only when the clinic has provided them), branches and a message form. */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useContactMessage, useContentBlocks, useForm, useSite, useT } from "@sdw/controllers";
import { contactSchema, lines, mailtoLink, telLink, whatsappLink, type ContactInput } from "@sdw/core";
import { Button, Card, FormError, Notice, QueryView, Screen, Text, TextField } from "../../../components/ui";
import { openExternal, openWebPage } from "../../../platform/links";

const EMPTY: ContactInput = { name: "", email: "", phone: "", subject: "", message: "" };

function MessageForm() {
  const t = useT();
  const form = useForm(contactSchema, EMPTY);
  const send = useContactMessage();
  const [reference, setReference] = useState<string | null>(null);

  if (reference) {
    return (
      <View style={styles.gap}>
        <Notice tone="success" title={t("Thank you — your message has been sent.")}>
          {t("We'll reply by email as soon as we can, usually within one working day.")}
        </Notice>
        <Text>
          {t("Your reference")}: <Text style={{ fontWeight: "700" }}>{reference}</Text>
        </Text>
        <Button
          variant="secondary"
          onPress={() => {
            form.reset();
            setReference(null);
          }}
        >
          {t("Send another message")}
        </Button>
      </View>
    );
  }

  const submit = form.handleSubmit(async (data) => {
    const res = await send.mutateAsync(data);
    setReference(res.reference);
  });

  return (
    <View style={styles.gap}>
      <FormError message={form.formError} />
      <TextField
        label={t("Your name")}
        required
        autoComplete="name"
        textContentType="name"
        value={form.values.name}
        onChangeText={(v) => form.setField("name", v)}
        error={form.errorFor("name")}
      />
      <TextField
        label={t("Email")}
        required
        autoComplete="email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.values.email}
        onChangeText={(v) => form.setField("email", v)}
        error={form.errorFor("email")}
      />
      <TextField
        label={t("Phone")}
        autoComplete="tel"
        keyboardType="phone-pad"
        value={form.values.phone ?? ""}
        onChangeText={(v) => form.setField("phone", v)}
        error={form.errorFor("phone")}
      />
      <TextField
        label={t("Subject")}
        required
        value={form.values.subject}
        onChangeText={(v) => form.setField("subject", v)}
        error={form.errorFor("subject")}
      />
      <TextField
        label={t("Message")}
        required
        multiline
        value={form.values.message}
        onChangeText={(v) => form.setField("message", v)}
        error={form.errorFor("message")}
      />
      <Text variant="small">
        {t("Please don't include detailed medical information here. We'll talk about your health privately.")}
      </Text>
      <Button onPress={() => void submit()} loading={form.submitting} icon="send-outline" fullWidth>
        {t("Send message")}
      </Button>
    </View>
  );
}

export function ContactScreen() {
  const t = useT();
  const site = useSite();
  const blocks = useContentBlocks("contact.");
  const noApp = { title: t("Couldn't open this"), body: t("No app on this device can open this link.") };

  return (
    <Screen keyboard onRefresh={() => site.refetch()}>
      <Text variant="h1">{t("We're here to help")}</Text>
      {blocks.text("contact.intro") ? <Text variant="lead">{blocks.text("contact.intro")}</Text> : null}
      <QueryView query={site} isEmpty={() => false}>
        {(info) => {
          const c = info.contact;
          const hasContact = !!(c.phone || c.whatsapp || c.email);
          return (
            <View style={styles.gap}>
              {hasContact ? (
                <View style={styles.gap}>
                  {c.phone ? (
                    <Button
                      variant="secondary"
                      icon="call-outline"
                      fullWidth
                      onPress={() => void openExternal(telLink(c.phone!), noApp)}
                    >
                      {t("Call {phone}", { phone: c.phone })}
                    </Button>
                  ) : null}
                  {c.whatsapp ? (
                    <Button
                      variant="secondary"
                      icon="logo-whatsapp"
                      fullWidth
                      onPress={() => void openExternal(whatsappLink(c.whatsapp!), noApp)}
                    >
                      {t("Chat on WhatsApp")}
                    </Button>
                  ) : null}
                  {c.email ? (
                    <Button
                      variant="secondary"
                      icon="mail-outline"
                      fullWidth
                      onPress={() => void openExternal(mailtoLink(c.email!), noApp)}
                    >
                      {c.email}
                    </Button>
                  ) : null}
                </View>
              ) : (
                <Notice tone="info">{t("Contact details will be added soon.")}</Notice>
              )}
              {info.branches.map((b) => (
                <Card key={b.id}>
                  <View style={{ gap: 6 }}>
                    <Text variant="h3">{b.name}</Text>
                    <Text>{[b.addressLine, b.city, b.state, b.pincode].filter(Boolean).join(", ")}</Text>
                    {b.openingHours ? (
                      <>
                        <Text variant="label">{t("Opening hours")}</Text>
                        {lines(b.openingHours).map((l) => (
                          <Text key={l} variant="small">
                            {l}
                          </Text>
                        ))}
                      </>
                    ) : null}
                    {b.phone ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="call-outline"
                        onPress={() => void openExternal(telLink(b.phone!), noApp)}
                      >
                        {b.phone}
                      </Button>
                    ) : null}
                    {b.mapUrl ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="location-outline"
                        onPress={() => void openWebPage(b.mapUrl!)}
                      >
                        {t("Get directions on Google Maps")}
                      </Button>
                    ) : null}
                  </View>
                </Card>
              ))}
            </View>
          );
        }}
      </QueryView>
      <Card>
        <View style={styles.gap}>
          <Text variant="h2">{t("Send us a message")}</Text>
          <MessageForm />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ gap: { gap: 14 } });
