import type { ID, ImageRef, ISODateTime, PageQuery, Paise, Reference, SampleFlag } from "./common";
import type { Payment } from "./payment";

export type ProductCategory = { id: ID; slug: string; name: string };

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type ProductSummary = SampleFlag & {
  id: ID;
  slug: string;
  name: string;
  category: ProductCategory | null;
  size: string | null;
  price: Paise;
  /** Maximum retail price, shown struck through when higher than `price`. */
  mrp: Paise | null;
  image: ImageRef | null;
  stockStatus: StockStatus;
  /** Most a customer can order right now (0 when out of stock). */
  maxQuantity: number;
};

export type Product = ProductSummary & {
  shortDescription: string;
  /** Markdown. */
  description: string;
  benefits: string[];
  ingredients: string | null;
  usage: string | null;
  images: ImageRef[];
};

export type ProductSort = "featured" | "price-asc" | "price-desc" | "newest" | "name";

export type ProductQuery = PageQuery & { category?: string; sort?: ProductSort; q?: string };

/** A cart line as stored on the device. Prices are never stored — the server quotes them. */
export type CartLine = { productId: ID; quantity: number };

export type FulfilmentMethod = "PICKUP" | "DELIVERY";

export type CartQuoteRequest = { items: CartLine[]; fulfilment?: FulfilmentMethod };

export type CartProblem = {
  productId: ID;
  code: "OUT_OF_STOCK" | "QUANTITY_REDUCED" | "UNAVAILABLE";
  /** Quantity the server can supply (0 when the item must be removed). */
  availableQuantity: number;
};

export type QuoteLine = {
  product: ProductSummary;
  quantity: number;
  unitPrice: Paise;
  lineTotal: Paise;
};

export type CartQuote = {
  lines: QuoteLine[];
  problems: CartProblem[];
  subtotal: Paise;
  deliveryFee: Paise;
  total: Paise;
};

export type Address = {
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
};

export type CreateOrderRequest = {
  items: CartLine[];
  fulfilment: FulfilmentMethod;
  pickupBranchId?: ID;
  address?: Address;
  contact: { name: string; email: string; phone: string };
  notes?: string;
};

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_SUBMITTED"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type OrderItem = {
  productId: ID;
  /** Name and size at the time of ordering. */
  name: string;
  size: string | null;
  unitPrice: Paise;
  quantity: number;
  lineTotal: Paise;
  image: ImageRef | null;
};

export type OrderEvent = { status: OrderStatus; note: string | null; at: ISODateTime };

export type OrderSummary = {
  id: ID;
  reference: Reference;
  status: OrderStatus;
  total: Paise;
  itemCount: number;
  createdAt: ISODateTime;
};

export type Order = OrderSummary & {
  fulfilment: FulfilmentMethod;
  pickupBranch: { id: ID; name: string; addressLine: string; city: string } | null;
  address: Address | null;
  contact: { name: string; email: string; phone: string };
  items: OrderItem[];
  subtotal: Paise;
  deliveryFee: Paise;
  notes: string | null;
  trackingInfo: string | null;
  /** Unpaid orders are released after this time. */
  paymentDueAt: ISODateTime | null;
  payment: Payment | null;
  events: OrderEvent[];
};

export type CreateOrderResponse = { order: Order; payment: Payment };
