import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { CartProvider, useCart } from "@/hooks/use-cart";
import { AuthProvider } from "@/hooks/use-auth";
import type { MarketplaceProduct } from "@/lib/api";

const product: MarketplaceProduct = {
  id: "p1",
  artisan_id: "a1",
  artisan_name: "Seller One",
  name: "Test Pot",
  price: 100,
  stock_qty: 3,
  created_at: "2026-01-01T00:00:00",
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <CartProvider>{children}</CartProvider>
  </AuthProvider>
);

describe("useCart", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it("adds an item and computes totals", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product, 2));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice).toBe(200);
  });

  it("caps added quantity at the product's stock", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product, 10));
    expect(result.current.items[0].quantity).toBe(3);
  });

  it("merges repeated add-to-cart calls for the same product instead of duplicating the line", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product, 1));
    act(() => result.current.addItem(product, 1));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it("merged quantity is still capped at stock", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product, 2));
    act(() => result.current.addItem(product, 2));
    expect(result.current.items[0].quantity).toBe(3);
  });

  it("setQuantity removes the line once dropped to 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product, 1));
    act(() => result.current.setQuantity("p1", 0));
    expect(result.current.items).toHaveLength(0);
  });

  it("removeItem drops the line", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product, 1));
    act(() => result.current.removeItem("p1"));
    expect(result.current.items).toHaveLength(0);
  });

  it("clear empties both state and storage", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product, 1));
    act(() => result.current.clear());
    expect(result.current.items).toEqual([]);
    expect(localStorage.getItem("cart:anonymous")).toBe("[]");
  });

  // Regression test: a prior implementation wrote to localStorage from a
  // separate effect keyed on [items, userId]. On a fresh mount that effect
  // fired using a stale (pre-hydration) items value the same commit userId
  // resolved in, clobbering whatever had just been read from storage. A
  // remount here reproduces that "reload" scenario.
  it("persists across an unmount/remount (simulates a full page reload)", () => {
    const { result, unmount } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product, 2));
    unmount();

    const { result: result2 } = renderHook(() => useCart(), { wrapper });
    expect(result2.current.items).toHaveLength(1);
    expect(result2.current.items[0].quantity).toBe(2);
    expect(result2.current.items[0].productId).toBe("p1");
  });
});
