/**
 * The device cart: product ids and quantities, persisted in non-sensitive storage.
 * A tiny external store (subscribe / getSnapshot) so React reads it with useSyncExternalStore.
 */
import {
  addToCart,
  applyQuoteProblems,
  parseStoredCart,
  removeFromCart,
  setQuantity,
  type CartLine,
  type CartProblem,
  type ID,
} from "@sdw/core";
import { STORAGE_KEYS, type PreferenceStorage } from "../storage";

export type CartStore = {
  getSnapshot(): CartLine[];
  subscribe(listener: () => void): () => void;
  /** Resolves once the saved cart has been read from storage. */
  ready: Promise<void>;
  add(productId: ID, quantity: number, maxQuantity?: number): void;
  setQuantity(productId: ID, quantity: number, maxQuantity?: number): void;
  remove(productId: ID): void;
  applyProblems(problems: CartProblem[]): void;
  clear(): void;
};

export function createCartStore(storage: PreferenceStorage): CartStore {
  let lines: CartLine[] = [];
  let loaded = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());
  const persist = () => {
    // Never write before the saved cart has been read, or it would be overwritten.
    if (!loaded) return;
    void Promise.resolve(
      lines.length ? storage.setItem(STORAGE_KEYS.cart, JSON.stringify(lines)) : storage.removeItem(STORAGE_KEYS.cart),
    ).catch(() => undefined);
  };
  const update = (next: CartLine[]) => {
    lines = next;
    persist();
    emit();
  };

  const readSaved = async (): Promise<CartLine[]> => {
    try {
      const raw = await storage.getItem(STORAGE_KEYS.cart);
      return raw ? parseStoredCart(JSON.parse(raw)) : [];
    } catch {
      return [];
    }
  };

  const ready = readSaved().then((saved) => {
    // Items added while storage was loading are merged into the saved cart.
    const pending = lines;
    lines = pending.reduce((acc, l) => addToCart(acc, l.productId, l.quantity), saved);
    loaded = true;
    if (pending.length) persist();
    emit();
  });

  return {
    getSnapshot: () => lines,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    ready,
    add: (id, qty, max) => update(addToCart(lines, id, qty, max)),
    setQuantity: (id, qty, max) => update(setQuantity(lines, id, qty, max)),
    remove: (id) => update(removeFromCart(lines, id)),
    applyProblems: (problems) => update(applyQuoteProblems(lines, problems)),
    clear: () => update([]),
  };
}
