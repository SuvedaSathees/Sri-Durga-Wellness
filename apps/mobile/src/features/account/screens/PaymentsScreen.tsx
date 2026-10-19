import { useMyPayments, useT } from "@sdw/controllers";
import { AuthGate, EmptyView, Notice, QueryView, Screen, Stack } from "../../../components/ui";
import { Group } from "../components/Group";
import { PaymentRow } from "../components/Rows";

function Content() {
  const t = useT();
  const payments = useMyPayments(false);
  return (
    <Screen onRefresh={() => payments.refetch()}>
      <Stack>
        <Notice tone="info">
          {t(
            "Every UPI payment is checked by our team before it is marked as verified — usually within one working day.",
          )}
        </Notice>
        <QueryView
          query={payments}
          empty={
            <EmptyView
              icon="card-outline"
              title={t("No payments yet")}
              body={t("Payments for orders, classes and courses will appear here.")}
            />
          }
        >
          {(list) => (
            <Group>
              {list.map((p) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </Group>
          )}
        </QueryView>
      </Stack>
    </Screen>
  );
}

export function PaymentsScreen() {
  return (
    <AuthGate>
      <Content />
    </AuthGate>
  );
}
