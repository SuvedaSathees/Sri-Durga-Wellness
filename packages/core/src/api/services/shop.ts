import type {
  CartQuote,
  CartQuoteRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  Paginated,
  Product,
  ProductCategory,
  ProductQuery,
  ProductSummary,
} from "../../models";
import type { ApiClient } from "../client";
import { endpoints } from "../endpoints";

export function createShopService(api: ApiClient) {
  return {
    categories: (signal?: AbortSignal) => api.request<ProductCategory[]>(endpoints.shop.categories, { signal }),
    products: (query: ProductQuery = {}, signal?: AbortSignal) =>
      api.request<Paginated<ProductSummary>>(endpoints.shop.products, { query, signal }),
    product: (slug: string, signal?: AbortSignal) =>
      api.request<Product>(endpoints.shop.product, { params: { slug }, signal }),
    /** Server-side prices, stock check and delivery fee for the device cart. */
    quote: (body: CartQuoteRequest, signal?: AbortSignal) =>
      api.request<CartQuote>(endpoints.shop.quote, { body, signal }),
    placeOrder: (body: CreateOrderRequest, idempotencyKey: string) =>
      api.request<CreateOrderResponse>(endpoints.shop.createOrder, { body, idempotencyKey }),
  };
}

export type ShopService = ReturnType<typeof createShopService>;
