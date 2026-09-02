import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { MarketplaceProduct } from "@/lib/api";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  artisanId: string;
  artisanName: string;
  stockQty: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: MarketplaceProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

// Scoped per-user so a shared browser (or logging into a different account)
// never mixes one person's cart into another's — matches the same isolation
// principle as the JWT/localStorage "user" pattern in use-auth.tsx, just for
// cart state instead of session state.
const storageKey = (userId: string | undefined) => `cart:${userId || "anonymous"}`;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.email as string | undefined;
  const [items, setItems] = useState<CartItem[]>([]);

  // Mutators below persist synchronously alongside setItems instead of via a
  // separate effect keyed on [items, userId] — that shape raced against the
  // hydration effect on a full page reload (AuthProvider resolves userId one
  // commit after CartProvider's initial mount, and the write-effect would
  // fire in that same commit using the *stale* pre-hydration items value,
  // clobbering the just-loaded cart with []). A ref sidesteps the race
  // entirely since mutations only ever happen after the user is looking at
  // a hydrated cart, never as a passive reaction to userId changing.
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(userId));
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, [userId]);

  const persist = useCallback((next: CartItem[]) => {
    try {
      localStorage.setItem(storageKey(userIdRef.current), JSON.stringify(next));
    } catch {
      // storage unavailable — cart just won't persist across reloads
    }
  }, []);

  const addItem = useCallback((product: MarketplaceProduct, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      const cap = product.stock_qty;
      const next = existing
        ? prev.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: Math.min(i.quantity + quantity, cap) }
              : i
          )
        : [
            ...prev,
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.image_url,
              artisanId: product.artisan_id,
              artisanName: product.artisan_name,
              stockQty: cap,
              quantity: Math.min(quantity, cap),
            },
          ];
      persist(next);
      return next;
    });
  }, [persist]);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      persist(next);
      return next;
    });
  }, [persist]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      const next = prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stockQty)) } : i))
        .filter((i) => i.quantity > 0);
      persist(next);
      return next;
    });
  }, [persist]);

  const clear = useCallback(() => {
    setItems([]);
    persist([]);
  }, [persist]);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clear, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
