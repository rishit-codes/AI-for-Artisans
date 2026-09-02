import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, Package2 } from "lucide-react";
import AppShell from "@/components/site/AppShell";
import { resolveImageUrl } from "@/lib/api";
import { useCart } from "@/hooks/use-cart";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const Cart = () => {
  const { items, removeItem, setQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  return (
    <AppShell title="Your cart" hindi="कार्ट" subtitle="Review items before checkout">
      {items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <ShoppingCart size={28} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Your cart is empty.</p>
          <Link to="/marketplace" className="inline-block px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            Browse marketplace
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden grid place-items-center shrink-0">
                  {item.imageUrl ? (
                    <img src={resolveImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package2 size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base leading-tight truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">by {item.artisanName}</div>
                  <div className="font-data text-sm mt-1">{inr(item.price)} each</div>
                </div>
                <div className="flex items-center gap-2 border border-border rounded-full px-2 py-1">
                  <button
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    className="p-1 rounded-full hover:bg-muted"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm w-6 text-center font-data">{item.quantity}</span>
                  <button
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stockQty}
                    className="p-1 rounded-full hover:bg-muted disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <div className="font-data text-sm w-20 text-right">{inr(item.price * item.quantity)}</div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-2 rounded-full hover:bg-destructive/10 text-destructive"
                  aria-label="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sticky top-20 space-y-4">
            <div className="font-display text-lg">Order summary</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-data">{inr(totalPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Each item may be sold by a different artisan; checkout places one order per seller and settles each through the sandbox payment gateway.
            </p>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Cart;
