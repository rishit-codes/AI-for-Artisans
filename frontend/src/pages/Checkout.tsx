import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/site/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { placeMarketplaceOrder, payMarketplaceOrder } from "@/lib/api";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

interface LineResult {
  productId: string;
  name: string;
  state: "pending" | "ordering" | "paying" | "done" | "failed";
  error?: string;
  orderId?: string;
}

let parsedPhone = "";
try {
  const raw = localStorage.getItem("user");
  if (raw) {
    const bio = JSON.parse(raw)?.bio;
    if (bio) parsedPhone = JSON.parse(bio)?.phone || "";
  }
} catch { /* no saved phone — leave blank */ }

const Checkout = () => {
  const { user } = useAuth();
  const { items, removeItem, clear, totalPrice } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [city, setCity] = useState((user?.location as string) || "");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState(parsedPhone);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<LineResult[] | null>(null);
  // Cart items (and therefore useCart().totalPrice) drain to zero as each
  // line succeeds and is removed — freeze the amount being charged at the
  // moment checkout starts so the summary panel doesn't decay to "Total ₹0"
  // mid-checkout.
  const [frozenTotal, setFrozenTotal] = useState<number | null>(null);
  const [frozenItems, setFrozenItems] = useState<typeof items>([]);

  if (items.length === 0 && !results) {
    return (
      <AppShell title="Checkout" hindi="चेकआउट">
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-sm text-muted-foreground mb-4">Your cart is empty.</p>
          <Link to="/marketplace" className="inline-block px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            Browse marketplace
          </Link>
        </div>
      </AppShell>
    );
  }

  const formValid = address.trim() && city.trim() && state.trim() && pincode.trim();

  const handlePlaceOrder = async () => {
    if (!formValid) {
      toast.error("Fill in your full shipping address first.");
      return;
    }
    setSubmitting(true);
    setFrozenTotal(totalPrice);
    setFrozenItems(items);
    const lineResults: LineResult[] = items.map((i) => ({ productId: i.productId, name: i.name, state: "pending" }));
    setResults([...lineResults]);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      lineResults[i].state = "ordering";
      setResults([...lineResults]);
      try {
        const order = await placeMarketplaceOrder({
          product_id: item.productId,
          quantity: item.quantity,
          shipping_address: address,
          shipping_city: city,
          shipping_state: state,
          shipping_pincode: pincode,
          buyer_phone: phone || undefined,
        });
        lineResults[i].orderId = order.id;
        lineResults[i].state = "paying";
        setResults([...lineResults]);

        await payMarketplaceOrder(order.id);
        lineResults[i].state = "done";
        removeItem(item.productId);
      } catch (err) {
        lineResults[i].state = "failed";
        lineResults[i].error = err instanceof Error ? err.message : "Something went wrong";
      }
      setResults([...lineResults]);
    }
    setSubmitting(false);
  };

  const allDone = results && results.every((r) => r.state === "done");
  const anyFailed = results && results.some((r) => r.state === "failed");

  return (
    <AppShell title="Checkout" hindi="चेकआउट" subtitle="Sandbox payment — no real card or bank details required">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          {!results ? (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="font-display text-lg">Shipping address</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address line"
                  className="sm:col-span-2 text-sm px-3 py-2.5 rounded-lg border border-border bg-background"
                />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="text-sm px-3 py-2.5 rounded-lg border border-border bg-background"
                />
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="text-sm px-3 py-2.5 rounded-lg border border-border bg-background"
                />
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Pincode"
                  className="text-sm px-3 py-2.5 rounded-lg border border-border bg-background"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="text-sm px-3 py-2.5 rounded-lg border border-border bg-background"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <div className="font-display text-lg">
                {allDone ? "Order placed" : anyFailed ? "Some items couldn't be ordered" : "Placing your order…"}
              </div>
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.productId} className="flex items-center gap-3 text-sm py-1">
                    {r.state === "done" ? (
                      <CheckCircle2 size={16} className="text-forest shrink-0" />
                    ) : r.state === "failed" ? (
                      <XCircle size={16} className="text-destructive shrink-0" />
                    ) : (
                      <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                    )}
                    <span className="flex-1">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.state === "ordering" && "Creating order…"}
                      {r.state === "paying" && "Processing payment…"}
                      {r.state === "done" && "Paid & confirmed"}
                      {r.state === "failed" && (r.error || "Failed")}
                      {r.state === "pending" && "Waiting…"}
                    </span>
                  </div>
                ))}
              </div>
              {allDone && (
                <div className="pt-3 flex gap-3">
                  <Link to="/profile" onClick={() => navigate("/profile")} className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    View my purchases
                  </Link>
                  <Link to="/marketplace" className="px-5 py-2.5 rounded-full border border-border text-sm hover:bg-muted">
                    Keep shopping
                  </Link>
                </div>
              )}
              {anyFailed && !submitting && (
                <p className="text-xs text-muted-foreground pt-2">
                  Items that succeeded were removed from your cart. Anything that failed (e.g. stock ran out) stayed in your cart — go back to review it.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sticky top-20 space-y-4">
          <div className="font-display text-lg">Order summary</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(results ? frozenItems : items).map((i) => (
              <div key={i.productId} className="flex items-center justify-between text-xs">
                <span className="truncate mr-2">{i.name} × {i.quantity}</span>
                <span className="font-data shrink-0">{inr(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Total</span>
            <span className="font-data font-semibold">{inr(results ? (frozenTotal ?? 0) : totalPrice)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} />
            Sandbox gateway — always succeeds, no real money moves.
          </div>
          {!results && (
            <button
              onClick={handlePlaceOrder}
              disabled={submitting || !formValid}
              className="w-full px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? "Processing…" : `Pay ${inr(totalPrice)} (sandbox)`}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Checkout;
