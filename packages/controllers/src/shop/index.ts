/** Shop hooks: products, the device cart, server quotes and placing orders. */
import { useRef, useSyncExternalStore } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cartCount,
  idempotencyKey,
  isApiError,
  type CreateOrderRequest,
  type FulfilmentMethod,
  type ProductQuery,
} from "@sdw/core";
import { useApi, useApp } from "../provider";
import { qk } from "../query-keys";

export * from "./cart-store";

export function useCategories() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.categories(locale),
    queryFn: ({ signal }) => api.shop.categories(signal),
    staleTime: 10 * 60_000,
  });
}

export function useProducts(query: ProductQuery = {}) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.products(locale, query),
    queryFn: ({ signal }) => api.shop.products(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(slug: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({ queryKey: qk.product(locale, slug), queryFn: ({ signal }) => api.shop.product(slug, signal) });
}

export function useCart() {
  const { cart } = useApp().runtime;
  const lines = useSyncExternalStore(cart.subscribe, cart.getSnapshot, cart.getSnapshot);
  return {
    lines,
    count: cartCount(lines),
    add: cart.add,
    setQuantity: cart.setQuantity,
    remove: cart.remove,
    clear: cart.clear,
    applyProblems: cart.applyProblems,
  };
}

/** Server prices, stock problems and delivery fee for the current cart. */
export function useCartQuote(fulfilment: FulfilmentMethod = "PICKUP") {
  const api = useApi();
  const { locale } = useApp();
  const { lines } = useCart();
  return useQuery({
    queryKey: qk.quote(locale, lines, fulfilment),
    queryFn: ({ signal }) => api.shop.quote({ items: lines, fulfilment }, signal),
    enabled: lines.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/**
 * Places the order. The idempotency key stays the same across retries of one checkout, so a
 * network failure followed by "try again" can't create two orders.
 */
export function usePlaceOrder() {
  const api = useApi();
  const qc = useQueryClient();
  const { runtime, locale } = useApp();
  const { cart } = runtime;
  const key = useRef(idempotencyKey());
  return useMutation({
    mutationFn: (body: Omit<CreateOrderRequest, "items">) =>
      api.shop.placeOrder({ ...body, items: cart.getSnapshot() }, key.current),
    onSuccess: ({ order, payment }) => {
      key.current = idempotencyKey();
      cart.clear();
      void qc.invalidateQueries({ queryKey: qk.me });
      void qc.invalidateQueries({ queryKey: ["products"] });
      qc.setQueryData(qk.payment(locale, payment.id), payment);
      qc.setQueryData(qk.myOrder(locale, order.reference), order);
    },
    onError: (error) => {
      if (isApiError(error) && error.code === "OUT_OF_STOCK") void qc.invalidateQueries({ queryKey: ["quote"] });
    },
  });
}
