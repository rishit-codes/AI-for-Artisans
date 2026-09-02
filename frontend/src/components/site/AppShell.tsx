import { Link, NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, CalendarClock, Compass, Home, LineChart, ListTodo, Search, Settings, ShieldCheck, ShoppingBag, ShoppingCart, Store, TrendingDown, TrendingUp, User } from "lucide-react";
import { ReactNode, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getDashboardPriority, getDashboardSummary, getMandiPrices } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DashboardSummary {
  low_stock_items?: Array<{ id: number; name: string; stock_qty: number }>;
}

interface DashboardPriority {
  title?: string;
  festival?: string;
  festival_date?: string;
}

interface NotificationPrefs {
  orders: boolean;
  mandi: boolean;
  festival: boolean;
}

// Settings > Notifications persists these to the same bio JSON blob every
// other preference on this page uses — read it back here so a toggle
// actually changes what the bell shows, app-wide.
export const parseNotificationPrefs = (bio: unknown): NotificationPrefs => {
  const defaults: NotificationPrefs = { orders: true, mandi: true, festival: true };
  if (typeof bio !== "string" || !bio) return defaults;
  try {
    const parsed = JSON.parse(bio);
    return { ...defaults, ...(parsed.notificationPrefs || {}) };
  } catch {
    return defaults;
  }
};

const NotificationsBell = () => {
  const { user } = useAuth();
  const notifPrefs = parseNotificationPrefs(user?.bio);
  const { data: summary } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: getDashboardSummary,
  });
  const { data: priority } = useQuery({
    queryKey: ["dashboardPriority"],
    queryFn: getDashboardPriority,
  });
  const { data: mandiMaterials } = useQuery({
    queryKey: ["mandiPrices", (user?.craft_type as string) || "Textiles"],
    queryFn: () => getMandiPrices((user?.craft_type as string) || "Textiles"),
    enabled: notifPrefs.mandi,
  });

  const { low_stock_items: lowStockItems } = (summary || {}) as DashboardSummary;
  const { title: priorityTitle, festival, festival_date: festivalDate } = (priority || {}) as DashboardPriority;

  const daysToFestival = festivalDate
    ? Math.max(0, Math.ceil((new Date(festivalDate).getTime() - Date.now()) / 86_400_000))
    : null;

  const notifications: { icon: typeof Bell; tone: string; text: string }[] = [];
  if (notifPrefs.orders) {
    (lowStockItems || []).slice(0, 3).forEach((item) => {
      notifications.push({
        icon: AlertTriangle,
        tone: "text-destructive",
        text: `Low stock: ${item.name} — ${item.stock_qty} left`,
      });
    });
  }
  if (priorityTitle) {
    notifications.push({ icon: ListTodo, tone: "text-primary", text: priorityTitle });
  }
  if (notifPrefs.festival && festival && daysToFestival !== null) {
    notifications.push({
      icon: CalendarClock,
      tone: "text-secondary",
      text: `${festival} is ${daysToFestival} day${daysToFestival === 1 ? "" : "s"} away — start prepping stock`,
    });
  }
  if (notifPrefs.mandi) {
    (mandiMaterials || []).filter((m) => m.action?.toLowerCase().includes("save") || m.local_best).slice(0, 2).forEach((m) => {
      notifications.push({
        icon: TrendingDown,
        tone: "text-forest",
        text: `${m.commodity}: ${m.action || "best local rate"}`,
      });
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted" aria-label="Notifications">
          <Bell size={16} />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border font-display text-sm">Notifications</div>
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">You're all caught up.</div>
        ) : (
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {notifications.map((n, i) => (
              <li key={i} className="px-4 py-3 flex items-start gap-2.5 text-sm">
                <n.icon size={14} className={`mt-0.5 shrink-0 ${n.tone}`} />
                <span>{n.text}</span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

const CartBadge = () => {
  const { totalItems } = useCart();
  if (totalItems === 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-data grid place-items-center">
      {totalItems > 9 ? "9+" : totalItems}
    </span>
  );
};

const nav = [
  { to: "/dashboard", icon: Home, label: "Home", hindi: "घर" },
  { to: "/trends", icon: TrendingUp, label: "Trends", hindi: "रुझान" },
  { to: "/mandi", icon: Store, label: "Mandi", hindi: "मंडी" },
  { to: "/marketplace", icon: ShoppingBag, label: "Marketplace", hindi: "बाज़ार" },
  { to: "/advisor", icon: Compass, label: "Advisor", hindi: "सलाहकार" },
  { to: "/reports", icon: LineChart, label: "Reports", hindi: "रिपोर्ट" },
  { to: "/profile", icon: User, label: "Profile", hindi: "प्रोफ़ाइल" },
];

const adminNavItem = { to: "/admin", icon: ShieldCheck, label: "Admin", hindi: "व्यवस्थापक" };

export const AppShell = ({
  children,
  title,
  hindi,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  hindi: string;
  subtitle?: string;
}) => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    toast.info("Search isn't wired up yet — try the Trends, Mandi, or Profile pages directly.");
  };
  return (
    <div className="min-h-screen bg-background-deep text-foreground">
      <div className="grid lg:grid-cols-[240px_1fr] min-h-screen">
        <aside className="hidden lg:flex flex-col bg-background border-r border-border p-5 sticky top-0 h-screen">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display text-lg">अ</div>
            <div>
              <div className="font-display text-lg leading-none">ArtisanGPS</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">बहीखाता</div>
            </div>
          </Link>
          <nav className="flex-1 space-y-1">
            {(user?.role === "admin" ? [...nav, adminNavItem] : nav).map((it) => {
              const active = pathname === it.to;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active
                      ? "bg-primary/15 text-foreground font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                >
                  <it.icon size={16} />
                  <span>{it.label}</span>
                  <span className="ml-auto font-hindi text-xs opacity-60">{it.hindi}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 p-4 rounded-xl bg-secondary text-secondary-foreground">
            <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 font-data">Location</div>
            <div className="font-display text-lg mt-1 capitalize">{(user?.location as string) || "Add location"}</div>
            <div className="text-xs opacity-70 mt-1 capitalize">{(user?.craft_type as string) || "Add craft type"}</div>
          </div>
        </aside>

        <div className="flex flex-col min-w-0">
          <header>
            <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl flex items-center gap-4 px-5 lg:px-8 h-16 border-b border-border">
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 max-w-md w-full lg:w-80 mr-auto border border-border rounded-full px-3 py-1.5 bg-card/40"
              >
                <Search size={16} className="text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search SKUs, mandi, festivals…"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
              </form>
              <NotificationsBell />
              <NavLink to="/cart" className="relative p-2 rounded-full hover:bg-muted" aria-label="Cart">
                <ShoppingCart size={16} />
                <CartBadge />
              </NavLink>
              <NavLink to="/settings" className="p-2 rounded-full hover:bg-muted" aria-label="Settings"><Settings size={16} /></NavLink>
              <NavLink to="/profile" className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground grid place-items-center text-sm font-display hover:opacity-90">
                {(user?.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
              </NavLink>
            </div>
            <div className="px-5 lg:px-8 pb-5 pt-2">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h1 className="font-display text-3xl lg:text-4xl tracking-tight">{title}</h1>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-data ml-auto">{hindi}</div>
                  </div>
                  {subtitle && <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{subtitle}</p>}
                </div>
                <div className="text-xs font-data text-muted-foreground">
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-5 lg:p-8 space-y-8">
            {children}
            <footer className="pt-8 pb-4 text-xs text-muted-foreground font-data flex items-center justify-between border-t border-border">
              <span>ArtisanGPS · बहीखाता v0.4 · {new Date().getFullYear()}</span>
              <Link to="/dashboard" className="hover:text-foreground">← home</Link>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
