import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Package2, Search, ShoppingCart, MapPin } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/site/AppShell";
import { getMarketplaceProducts, resolveImageUrl } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const Marketplace = () => {
  const { user } = useAuth();
  const { addItem, totalItems } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["marketplaceProducts", category, search],
    queryFn: () => getMarketplaceProducts({ category: category || undefined, search: search || undefined }),
  });

  const categories = Array.from(new Set((products || []).map((p) => p.category).filter(Boolean))) as string[];

  return (
    <AppShell title="Marketplace" hindi="बाज़ार" subtitle="Buy directly from other artisans on the platform">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex items-center gap-2 max-w-md w-full border border-border rounded-full px-3 py-2 bg-card"
        >
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </form>
        <Link
          to="/cart"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <ShoppingCart size={16} />
          Cart {totalItems > 0 && <span className="bg-primary-foreground/20 rounded-full px-2 py-0.5 text-xs">{totalItems}</span>}
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${!category ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${category === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading products…</div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl text-sm">
          No listed products found{search || category ? " for this filter" : " yet"}.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const isOwnProduct = Boolean(user?.id) && p.artisan_id === String(user?.id);
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="h-40 overflow-hidden bg-muted grid place-items-center">
                  {p.image_url ? (
                    <img src={resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package2 size={28} className="text-muted-foreground" />
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div>
                    <div className="font-display text-lg leading-tight">{p.name}</div>
                    {p.material && <div className="text-xs text-muted-foreground mt-0.5">{p.material}</div>}
                  </div>
                  <Link to={`/karigar/${p.artisan_id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <MapPin size={11} />
                    {p.artisan_name}{p.artisan_location ? ` · ${p.artisan_location}` : ""}
                  </Link>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="font-data text-lg">{inr(p.price)}</div>
                    <div className="text-[11px] text-muted-foreground">{p.stock_qty} in stock</div>
                  </div>
                  <button
                    disabled={Boolean(isOwnProduct)}
                    onClick={() => {
                      addItem(p);
                      toast.success(`Added "${p.name}" to cart`);
                    }}
                    className="w-full mt-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isOwnProduct ? "This is your own listing" : undefined}
                  >
                    {isOwnProduct ? "Your listing" : "Add to cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
};

export default Marketplace;
