import { useNavigation } from "@react-navigation/native";
import { useMyOrders, useT } from "@sdw/controllers";
import { AuthGate, Button, EmptyView, QueryView, Screen } from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";
import { Group } from "../components/Group";
import { OrderRow } from "../components/Rows";

function Content() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const orders = useMyOrders({ pageSize: 48 });
  return (
    <Screen onRefresh={() => orders.refetch()}>
      <QueryView
        query={orders}
        isEmpty={(p) => p.items.length === 0}
        empty={
          <EmptyView
            icon="receipt-outline"
            title={t("No orders yet")}
            body={t("Your shop orders and their status will appear here.")}
            action={
              <Button onPress={() => navigation.navigate("Tabs", { screen: "ShopTab" })}>{t("Visit the shop")}</Button>
            }
          />
        }
      >
        {(page) => (
          <Group>
            {page.items.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </Group>
        )}
      </QueryView>
    </Screen>
  );
}

export function OrdersScreen() {
  return (
    <AuthGate>
      <Content />
    </AuthGate>
  );
}
