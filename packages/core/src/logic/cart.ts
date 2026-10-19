/**
 * Pure cart operations. The cart on the device holds only product ids and quantities;
 * prices, stock and totals always come from the server (`POST /cart/quote`).
 */
import type { CartLine, CartProblem, ID } from "../models";

/** Upper bound for any single line, even when stock is higher. */
export const MAX_LINE_QUANTITY = 20;

const clamp = (n: number, max: number) => Math.max(0, Math.min(Math.floor(n), max));

/** Add `quantity` of a product, never exceeding `maxQuantity` (from the product's stock). */
export function addToCart(
  lines: CartLine[],
  productId: ID,
  quantity: number,
  maxQuantity = MAX_LINE_QUANTITY,
): CartLine[] {
  const limit = Math.min(maxQuantity, MAX_LINE_QUANTITY);
  const existing = lines.find((l) => l.productId === productId);
  const next = clamp((existing?.quantity ?? 0) + quantity, limit);
  if (next === 0) return lines.filter((l) => l.productId !== productId);
  if (existing) return lines.map((l) => (l.productId === productId ? { ...l, quantity: next } : l));
  return [...lines, { productId, quantity: next }];
}

/** Set a line's quantity; 0 removes it. */
export function setQuantity(
  lines: CartLine[],
  productId: ID,
  quantity: number,
  maxQuantity = MAX_LINE_QUANTITY,
): CartLine[] {
  const next = clamp(quantity, Math.min(maxQuantity, MAX_LINE_QUANTITY));
  if (next === 0) return lines.filter((l) => l.productId !== productId);
  return lines.some((l) => l.productId === productId)
    ? lines.map((l) => (l.productId === productId ? { ...l, quantity: next } : l))
    : [...lines, { productId, quantity: next }];
}

export function removeFromCart(lines: CartLine[], productId: ID): CartLine[] {
  return lines.filter((l) => l.productId !== productId);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

/** Apply the server's stock corrections from a quote: reduce or drop lines it cannot supply. */
export function applyQuoteProblems(lines: CartLine[], problems: CartProblem[]): CartLine[] {
  let next = lines;
  for (const p of problems) next = setQuantity(next, p.productId, p.availableQuantity);
  return next;
}

/** Parse a persisted cart defensively (device storage is untrusted input). */
export function parseStoredCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const lines: CartLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { productId, quantity } = item as Record<string, unknown>;
    if (typeof productId !== "string" || productId.length === 0 || productId.length > 64) continue;
    if (typeof quantity !== "number" || !Number.isFinite(quantity)) continue;
    const q = clamp(quantity, MAX_LINE_QUANTITY);
    if (q > 0 && !lines.some((l) => l.productId === productId)) lines.push({ productId, quantity: q });
  }
  return lines;
}
