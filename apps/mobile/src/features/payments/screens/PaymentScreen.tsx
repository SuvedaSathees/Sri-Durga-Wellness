/**
 * UPI payment on the phone: open the customer's UPI app with the amount and reference filled in,
 * then enter the UTR. The clinic verifies it; this screen only reflects the API's status and
 * re-checks it every 30 seconds while verification is pending. It never marks anything paid.
 */
import { useLayoutEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import { useConfig, useForm, useFormat, usePayment, useSession, useSite, useSubmitUtr, useT } from "@sdw/controllers";
import {
  buildUpiUri,
  canSubmitUtr,
  paymentStage,
  PAYMENT_PURPOSE_LABEL,
  PAYMENT_STATUS,
  utrSubmissionSchema,
  type Payment,
} from "@sdw/core";
import {
  AuthGate,
  Badge,
  Button,
  Card,
  ErrorView,
  Facts,
  FormError,
  Icon,
  LoadingView,
  Notice,
  Screen,
  Stack,
  Text,
  TextField,
} from "../../../components/ui";
import type { RootNavigation, RootScreenProps } from "../../../navigation/types";
import { openExternal } from "../../../platform/links";
import { theme } from "../../../theme";

function useAccountTarget(payment: Payment) {
  const navigation = useNavigation<RootNavigation>();
  if (payment.purpose === "ORDER")
    return { label: "View my order", go: () => navigation.navigate("Order", { reference: payment.reference }) };
  if (payment.purpose === "CLASS" || payment.purpose === "CLASS_RENEWAL")
    return { label: "View my classes", go: () => navigation.navigate("MyClasses") };
  return { label: "View my courses", go: () => navigation.navigate("MyCourses") };
}

function PayStep({ payment }: { payment: Payment }) {
  const t = useT();
  const f = useFormat();
  const { user } = useSession();
  const config = useConfig();
  const submit = useSubmitUtr(payment.id);
  const form = useForm(utrSubmissionSchema, { utr: "", payerName: user?.name ?? "" });
  const [copied, setCopied] = useState(false);
  const upi = payment.upi;

  if (!upi || !canSubmitUtr(payment)) {
    return (
      <Notice tone="warning" title={t("Online payment isn't available yet")}>
        {t("Please contact the clinic to complete this payment.")}
      </Notice>
    );
  }
  const uri = buildUpiUri(upi, payment.amount);
  const copy = () =>
    Clipboard.setStringAsync(upi.payeeVpa)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => undefined);

  return (
    <Stack gap={16}>
      {config.apiMode === "mock" ? (
        <Notice tone="warning" title={t("Demo payment")}>
          {t(
            "This is sample data. The UPI ID below is not a real account and can't receive money — please don't send a real payment. Enter any 12-digit number as the reference.",
          )}
        </Notice>
      ) : null}
      {payment.status === "REJECTED" ? (
        <Notice tone="danger" title={t("We couldn't verify your payment")}>
          <Stack gap={4}>
            {payment.rejectionReason ? (
              <Text style={{ color: theme.color.danger }}>{payment.rejectionReason}</Text>
            ) : null}
            <Text style={{ color: theme.color.danger }}>
              {t("Please check the UPI reference and submit it again, or contact the clinic.")}
            </Text>
          </Stack>
        </Notice>
      ) : null}

      <Card>
        <Stack gap={14}>
          <View style={styles.stepHead}>
            <View style={styles.stepNo}>
              <Text style={styles.stepNoText}>1</Text>
            </View>
            <Text variant="h3" style={{ flex: 1 }}>
              {t("Pay {amount} by UPI", { amount: f.price(payment.amount) })}
            </Text>
          </View>
          <Button
            fullWidth
            icon="open-outline"
            onPress={() =>
              void openExternal(uri, {
                title: t("No UPI app found"),
                body: t("Copy the UPI ID and pay from your UPI app, then come back and enter the reference."),
              })
            }
          >
            {t("Pay with a UPI app")}
          </Button>
          <Facts
            items={[
              { label: t("UPI ID"), value: upi.payeeVpa },
              { label: t("Pay to"), value: upi.payeeName },
              { label: t("Amount"), value: f.price(payment.amount) },
              { label: t("Note / remarks"), value: upi.note },
            ]}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={copied ? "checkmark" : "copy-outline"}
            onPress={() => void copy()}
            accessibilityLabel={t("Copy UPI ID")}
          >
            {copied ? t("Copied") : t("Copy UPI ID")}
          </Button>
          {payment.dueAt ? (
            <Text variant="small">
              {t("Please pay by {time}, or the items or seat are released.", { time: f.dateTime(payment.dueAt) })}
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Card>
        <Stack gap={14}>
          <View style={styles.stepHead}>
            <View style={styles.stepNo}>
              <Text style={styles.stepNoText}>2</Text>
            </View>
            <Text variant="h3" style={{ flex: 1 }}>
              {t("Tell us your UPI reference")}
            </Text>
          </View>
          <Text variant="small">
            {t(
              "After paying, your UPI app shows a 12-digit transaction reference (UTR). Enter it here so our team can find and verify your payment.",
            )}
          </Text>
          <FormError message={form.formError} />
          <TextField
            label={t("UPI transaction reference (UTR)")}
            required
            keyboardType="number-pad"
            autoCorrect={false}
            value={form.values.utr}
            onChangeText={(x) => form.setField("utr", x)}
            error={form.errorFor("utr")}
            hint={t("Usually 12 digits, for example 412345678901")}
          />
          <TextField
            label={t("Name on the paying account")}
            required
            textContentType="name"
            value={form.values.payerName}
            onChangeText={(x) => form.setField("payerName", x)}
            error={form.errorFor("payerName")}
          />
          <Button
            fullWidth
            loading={form.submitting}
            onPress={() => void form.handleSubmit((data) => submit.mutateAsync(data))()}
          >
            {t("Submit for verification")}
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}

function Outcome({ payment }: { payment: Payment }) {
  const t = useT();
  const f = useFormat();
  const target = useAccountTarget(payment);
  const stage = paymentStage(payment);
  const checksPerDay = useSite().data?.payments.checksPerDay ?? 1;
  if (stage === "waiting")
    return (
      <Card>
        <Stack gap={12}>
          <View style={[styles.outcomeIcon, { backgroundColor: theme.color.infoBg }]}>
            <Icon name="time-outline" size={28} color={theme.color.info} />
          </View>
          <Text variant="h2">{t("We're checking your payment")}</Text>
          <Text>
            {t(
              "Thank you. Our team will match UPI reference ending {last4} with the clinic's account. This page updates by itself.",
              { last4: payment.utrLast4 ?? "····" },
            )}
          </Text>
          <Text>
            {checksPerDay === 1
              ? t("The clinic checks UPI payments once a day, so confirmation can take up to a day.")
              : t("The clinic checks UPI payments {count} times a day.", { count: checksPerDay })}
          </Text>
          <Text variant="small">
            {t("Your booking or order is confirmed only after the clinic has verified the payment.")}
          </Text>
          <Button variant="secondary" onPress={target.go}>
            {t(target.label)}
          </Button>
        </Stack>
      </Card>
    );
  if (stage === "verified")
    return (
      <Card>
        <Stack gap={12}>
          <View style={[styles.outcomeIcon, { backgroundColor: theme.color.successBg }]}>
            <Icon name="checkmark-circle" size={28} color={theme.color.success} />
          </View>
          <Text variant="h2">{t("Payment verified")}</Text>
          <Text>
            {payment.verifiedAt
              ? t("The clinic verified your payment on {date}.", { date: f.dateTime(payment.verifiedAt) })
              : t("The clinic has verified your payment.")}
          </Text>
          <Button onPress={target.go}>{t(target.label)}</Button>
        </Stack>
      </Card>
    );
  return (
    <Notice tone="neutral" title={t("This payment is closed")}>
      {t("It was cancelled or the time to pay ran out. Nothing more is needed from you.")}
    </Notice>
  );
}

function PaymentBody({ paymentId }: { paymentId: string }) {
  const t = useT();
  const payment = usePayment(paymentId);
  if (payment.isPending) return <LoadingView />;
  if (payment.isError || !payment.data)
    return <ErrorView error={payment.error} onRetry={() => void payment.refetch()} />;
  const p = payment.data;
  const stage = paymentStage(p);
  const status = PAYMENT_STATUS[p.status];
  return (
    <Screen keyboard onRefresh={() => payment.refetch()}>
      <Stack gap={6}>
        <Text variant="eyebrow">{t(PAYMENT_PURPOSE_LABEL[p.purpose])}</Text>
        <Text variant="h2">{p.description}</Text>
        <View style={styles.statusRow}>
          <Text variant="small">
            {t("Reference")}: {p.reference}
          </Text>
          <Badge tone={status.tone}>{t(status.label)}</Badge>
        </View>
      </Stack>
      {stage === "pay" || stage === "retry" ? <PayStep payment={p} /> : <Outcome payment={p} />}
    </Screen>
  );
}

export function PaymentScreen({ route, navigation }: RootScreenProps<"Payment">) {
  const t = useT();
  useLayoutEffect(() => navigation.setOptions({ title: t("Payment") }), [navigation, t]);
  return (
    <AuthGate>
      <PaymentBody paymentId={route.params.paymentId} />
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  stepHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.color.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNoText: { color: theme.color.onPrimary, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  outcomeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
});
