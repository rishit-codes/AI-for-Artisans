import { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardSummary, getProducts, getMandiPrices, advisorChatStream, getDashboardPriority, resolveImageUrl, getTasks, createTask, updateTask, Task, getCommunityTrends } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { parseNotificationPrefs } from "@/components/site/AppShell";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  Bookmark,
  CalendarClock,
  Compass,
  Home,
  LineChart,
  ListTodo,
  Mic,
  MicOff,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Check,
  Circle,
  Clock,
  Store,
  TrendingDown,
  TrendingUp,
  User,
  Search,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import textileImg from "@/assets/craft-textile.jpg";
import potteryImg from "@/assets/craft-pottery.jpg";
import metalImg from "@/assets/craft-metal.jpg";

/* ---------------- speech recognition (not in standard TS lib types) ---------------- */

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

/* ---------------- data ---------------- */

/* ---------------- page ---------------- */

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background-deep text-foreground">
      <div className="grid lg:grid-cols-[240px_1fr] min-h-screen">
        <Sidebar />
        <div className="flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-5 lg:p-8 space-y-8">
            <Greeting />
            <KPIRow />
            <div className="grid xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <PriorityCard />
                <TasksPanel />
                <MandiWidget />
                <StockLedger />
              </div>
              <div className="space-y-6">
                <ChatPanel />
                <TrendsCard />
                <FestivalNudge />
              </div>
            </div>
            <footer className="pt-8 pb-4 text-xs text-muted-foreground font-data flex items-center justify-between border-t border-border">
            <span>ArtisanGPS · बहीखाता v0.4</span>
              <Link to="/" className="hover:text-foreground">← back to landing</Link>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

/* ---------------- chrome ---------------- */

const Sidebar = () => {
  const { user } = useAuth();
  const items = [
    { to: "/dashboard", icon: Home, label: "Home", hindi: "घर" },
    { to: "/trends", icon: TrendingUp, label: "Trends", hindi: "रुझान" },
    { to: "/mandi", icon: Store, label: "Mandi", hindi: "मंडी" },
    { to: "/marketplace", icon: ShoppingBag, label: "Marketplace", hindi: "बाज़ार" },
    { to: "/advisor", icon: Compass, label: "Advisor", hindi: "सलाहकार" },
    { to: "/reports", icon: LineChart, label: "Reports", hindi: "रिपोर्ट" },
    { to: "/profile", icon: User, label: "Profile", hindi: "प्रोफ़ाइल" },
    ...(user?.role === "admin" ? [{ to: "/admin", icon: ShieldCheck, label: "Admin", hindi: "व्यवस्थापक" }] : []),
  ];
  return (
    <aside className="hidden lg:flex flex-col bg-background border-r border-border p-5 sticky top-0 h-screen">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display text-lg">अ</div>
        <div>
          <div className="font-display text-lg leading-none">ArtisanGPS</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">बहीखाता</div>
        </div>
      </Link>
      <nav className="flex-1 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end
            className={({ isActive }) =>
              `w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary/15 text-foreground font-medium border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`
            }
          >
            <it.icon size={16} />
            <span>{it.label}</span>
            <span className="font-hindi text-xs ml-auto opacity-60">{it.hindi}</span>
          </NavLink>
        ))}
      </nav>
      <div className="rounded-xl border border-border bg-card p-3 text-xs">
        <div className="font-display text-sm">{(user?.location as string) || "Your cluster"}</div>
        <div className="text-muted-foreground font-data mt-0.5">{(user?.craft_type as string) || "Artisan"}</div>
        <Link to="/mandi" className="mt-3 inline-block text-primary font-data text-xs hover:underline">compare mandi prices →</Link>
      </div>
    </aside>
  );
};

interface DashboardSummary {
  low_stock_items?: Array<{ id: number; name: string; stock_qty: number }>;
}

interface DashboardPriority {
  title?: string;
  festival?: string;
  festival_date?: string;
}

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
        <button
          className="relative w-9 h-9 rounded-lg border border-border bg-card grid place-items-center hover:border-primary/60"
          aria-label="Notifications"
        >
          <Bell size={14} />
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
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-data grid place-items-center">
      {totalItems > 9 ? "9+" : totalItems}
    </span>
  );
};

const Topbar = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    toast.info("Search isn't wired up to real results yet — try Mandi, Trends, or Profile directly for now.");
  };

  return (
    <div className="sticky top-0 z-20 backdrop-blur bg-background/85 border-b border-border px-5 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search materials, SKUs, festivals…"
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/60 placeholder:text-muted-foreground"
          />
        </div>
      </form>
      <div className="flex items-center gap-3 text-xs text-muted-foreground font-data">
        {user?.location ? <span className="hidden md:inline">{user.location as string}</span> : null}
        <NotificationsBell />
        <Link to="/cart" aria-label="Cart" className="relative w-9 h-9 rounded-lg border border-border bg-card grid place-items-center hover:border-primary/60">
          <ShoppingCart size={14} />
          <CartBadge />
        </Link>
        <Link to="/settings" aria-label="Settings" className="w-9 h-9 rounded-lg border border-border bg-card grid place-items-center hover:border-primary/60">
          <Settings size={14} />
        </Link>
        <Link
          to="/profile"
          aria-label="Profile"
          className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-display hover:opacity-90 uppercase"
        >
          {(user?.full_name as string)?.charAt(0) || "?"}
        </Link>
      </div>
    </div>
  );
};

const Greeting = () => {
  const { user } = useAuth();
  const now = new Date();
  const weekday = now.toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const firstName = (user?.full_name as string)?.split(" ")[0] || "there";
  return (
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <div className="text-xs uppercase tracking-[0.22em] text-primary font-data">
          · {weekday} · {dateStr} ·
        </div>
        <h1 className="mt-2 font-display text-4xl lg:text-5xl tracking-tight">
          Namaste, {firstName} ji.
        </h1>
        <p className="font-hindi text-muted-foreground mt-1">— बहीखाता खुला है, चाय रखिए।</p>
      </div>
      <button className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2">
        <Sparkles size={14} /> Ask the ledger
      </button>
    </div>
  );
};

/* ---------------- widgets ---------------- */

const KPIRow = () => {
  const { data } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: getDashboardSummary,
  });

  const items = [
    { label: "Total products", hindi: "कुल माल", value: String(data?.total_products ?? "0").padStart(2, '0'), tone: "secondary" },
    { label: "Listed online", hindi: "ऑनलाइन", value: String(data?.listed_count ?? "0").padStart(2, '0'), tone: "forest" },
    { label: "Low stock", hindi: "कम स्टॉक", value: String(Array.isArray(data?.low_stock_items) ? data.low_stock_items.length : "0").padStart(2, '0'), tone: "danger" },
    { label: "Total stock value", hindi: "कुल मूल्य", value: data?.total_stock_value ? `₹${(data.total_stock_value as number).toLocaleString()}` : "₹0", tone: "primary" },
  ];
  const toneClass = (t: string) =>
    t === "forest" ? "text-forest" : t === "danger" ? "text-destructive" : t === "primary" ? "text-primary" : "text-secondary";
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((k) => (
        <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
          <div className={`font-data text-3xl lg:text-4xl font-semibold ${toneClass(k.tone)}`}>{k.value}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{k.label}</div>
          <div className="font-hindi text-xs text-muted-foreground/80 mt-0.5">{k.hindi}</div>
        </div>
      ))}
    </div>
  );
};

const PriorityCard = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardPriority"],
    queryFn: getDashboardPriority,
  });

  const addMutation = useMutation({
    mutationFn: (title: string) => createTask({ title, source: "dashboard_priority" }),
    onSuccess: () => {
      toast.success("Added to today's tasks.");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add task."),
  });

  const snoozeMutation = useMutation({
    mutationFn: (title: string) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return createTask({
        title,
        source: "dashboard_priority",
        status: "snoozed",
        due_date: tomorrow.toISOString().slice(0, 10),
      });
    },
    onSuccess: () => {
      toast.success("Snoozed until tomorrow.");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to snooze."),
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-strong bg-card p-5 flex flex-col sm:flex-row gap-5 animate-pulse"
           style={{ boxShadow: "var(--shadow-paper)" }}>
        <div className="w-full sm:w-44 h-44 rounded-xl bg-muted/50" />
        <div className="flex-1 flex flex-col space-y-4">
          <div className="w-1/3 h-3 bg-muted rounded" />
          <div className="w-3/4 h-6 bg-muted rounded" />
          <div className="w-1/2 h-4 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="w-16 h-4 bg-muted rounded" />
            <div className="w-16 h-4 bg-muted rounded" />
          </div>
          <div className="mt-auto flex gap-2">
            <div className="w-24 h-9 bg-muted rounded-full" />
            <div className="w-20 h-9 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const title = data?.title || "No urgent priority right now";
  const hindi_title = data?.hindi_title || "अभी कोई ज़रूरी काम नहीं";
  const image_url = resolveImageUrl(data?.image_url as string) || textileImg;
  const metrics = (data?.metrics as string[]) || ["Check back as festivals or stock levels change"];

  return (
    <div className="rounded-2xl border border-border-strong bg-card p-5 flex flex-col sm:flex-row gap-5"
         style={{ boxShadow: "var(--shadow-paper)" }}>
      <img 
        src={image_url as string} 
        loading="lazy" 
        alt="Priority item" 
        className="w-full sm:w-44 h-44 rounded-xl object-cover" 
        onError={(e) => {
          e.currentTarget.src = textileImg;
        }}
      />
      <div className="flex-1 flex flex-col">
        <div className="text-[10px] uppercase tracking-wider text-primary font-data">Today's priority · आज का काम</div>
        <div className="font-display text-2xl mt-1 leading-tight">{title as string}</div>
        <div className="font-hindi text-muted-foreground mt-1">{hindi_title as string}</div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground font-data">
          {metrics.map((metric: string, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <span className={i === 0 ? "text-forest" : ""}>{metric}</span>
              {i < metrics.length - 1 && <span className="w-1 h-1 rounded-full bg-border-strong self-center" />}
            </div>
          ))}
        </div>
      <div className="mt-auto pt-4 flex gap-2">
          <button
            onClick={() => addMutation.mutate(title as string)}
            disabled={!data?.title || addMutation.isPending}
            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to today
          </button>
          <button
            onClick={() => snoozeMutation.mutate(title as string)}
            disabled={!data?.title || snoozeMutation.isPending}
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Snooze
          </button>
        </div>
      </div>
    </div>
  );
};

const TasksPanel = () => {
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(),
  });

  const doneMutation = useMutation({
    mutationFn: (task: Task) => updateTask(task.id, { status: task.status === "done" ? "pending" : "done" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: Error) => toast.error(e.message || "Failed to update task."),
  });

  const today = new Date().toISOString().slice(0, 10);
  const relevant = tasks.filter((t) => t.status === "done" || t.due_date === today || t.status === "snoozed");
  if (relevant.length === 0) return null;

  const sorted = [...relevant].sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-[10px] uppercase tracking-wider text-primary font-data mb-3">Today's tasks · आज के काम</div>
      <div className="space-y-2">
        {sorted.map((t) => (
          <div key={t.id} className="flex items-center gap-3 text-sm">
            <button
              onClick={() => doneMutation.mutate(t)}
              disabled={doneMutation.isPending}
              className={`shrink-0 ${t.status === "done" ? "text-forest" : "text-muted-foreground hover:text-foreground"}`}
              aria-label={t.status === "done" ? "Mark as not done" : "Mark as done"}
            >
              {t.status === "done" ? <Check size={16} /> : <Circle size={16} />}
            </button>
            <span className={`flex-1 ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
            {t.status === "snoozed" && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-data">
                <Clock size={11} /> Snoozed
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const MandiWidget = () => {
  const { user } = useAuth();
  const craftType = (user?.craft_type as string) || "Textiles";

  const { data } = useQuery({
    queryKey: ["mandiPrices", craftType],
    queryFn: () => getMandiPrices(craftType),
  });

  const parseVal = (str: string) => {
    const val = parseFloat(str?.replace(/[^0-9.]/g, "") || "0");
    return isNaN(val) ? 0 : val;
  };
  const parseUnit = (str: string) => {
    const parts = str?.split("/");
    return parts?.length > 1 ? `/${parts[1]}` : "unit";
  };

  const rows = data ? data.slice(0, 3).map((r) => ({
    item: r.commodity,
    hindi: r.sub,
    unit: parseUnit(r.local_price),
    local: parseVal(r.local_price),
    surat: parseVal(r.surat_price),
    delhi: parseVal(r.delhi_price),
  })) : [];
  return (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-primary font-data">Mandi watch · मंडी भाव</div>
        <div className="font-display text-xl mt-0.5">Three markets, one screen</div>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-data border-b border-border">
            <th className="py-3 px-5 font-normal">Material</th>
            <th className="py-3 px-3 font-normal text-right">Local</th>
            <th className="py-3 px-3 font-normal text-right">Surat</th>
            <th className="py-3 px-3 font-normal text-right">Delhi</th>
            <th className="py-3 px-5 font-normal text-right">7-day</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const min = Math.min(r.local, r.surat, r.delhi);
            const cell = (v: number) =>
              v === min
                ? "text-forest font-semibold"
                : "text-muted-foreground";
            return (
              <tr key={r.item} className="border-b border-border/60 last:border-0 hover:bg-background transition-colors">
                <td className="py-3.5 px-5">
                  <div className="font-medium">{r.item}</div>
                  <div className="font-hindi text-xs text-muted-foreground">{r.hindi} · {r.unit}</div>
                </td>
                <td className={`py-3.5 px-3 text-right font-data ${cell(r.local)}`}>₹{r.local.toLocaleString()}</td>
                <td className={`py-3.5 px-3 text-right font-data ${cell(r.surat)}`}>₹{r.surat.toLocaleString()}</td>
                <td className={`py-3.5 px-3 text-right font-data ${cell(r.delhi)}`}>₹{r.delhi.toLocaleString()}</td>
                <td className="py-3.5 px-5 text-right text-muted-foreground font-data text-xs">—</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <div className="p-4 bg-background-deep border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground font-data">
      <span>Green = cheapest mandi today</span>
      <Link to="/mandi" className="text-primary hover:underline">See full comparison →</Link>
    </div>
  </div>
  );
};

const StockLedger = () => {
  const { data } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const rows = data && data.length > 0 ? data.map((p) => ({
    sku: p.id ? p.id.toString().substring(0, 8).toUpperCase() : "SKU",
    name: p.name,
    hindi: p.category || "General",
    img: resolveImageUrl(p.image_url) || textileImg,
    qty: p.stock_qty || 0,
    low: 5,
    price: p.price || 0,
    status: p.stock_qty === 0 ? "Out" : (p.stock_qty < 5 ? "Low" : (p.is_listed ? "Listed" : "Unlisted"))
  })) : [];

  return (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-primary font-data">Stock ledger · स्टॉक बही</div>
        <div className="font-display text-xl mt-0.5">What's on the shelf</div>
      </div>
      <Link to="/profile" className="text-xs font-data text-primary hover:underline">+ add product</Link>
    </div>
    <div className="divide-y divide-border">
      {rows.slice(0, 5).map((s) => {
        const pct = Math.min(100, (s.qty / Math.max(s.low * 2, 1)) * 100);
        const tone =
          s.status === "Out" ? "destructive" :
          s.status === "Low" ? "primary" : "forest";
        const toneBg =
          tone === "destructive" ? "bg-destructive/10 text-destructive" :
          tone === "primary" ? "bg-primary/15 text-primary" : "bg-forest/10 text-forest";
        const barColor =
          tone === "destructive" ? "bg-destructive" :
          tone === "primary" ? "bg-primary" : "bg-forest";
        return (
          <div key={s.sku} className="px-5 py-4 flex items-center gap-4 hover:bg-background transition-colors">
            <img src={s.img} loading="lazy" alt={s.name} className="w-14 h-14 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">{s.name}</div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-data ${toneBg}`}>
                  {s.status}
                </span>
              </div>
              <div className="font-hindi text-xs text-muted-foreground">{s.hindi} · {s.sku}</div>
              <div className="mt-2 h-1 rounded-full bg-border overflow-hidden max-w-xs">
                <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="font-data text-lg">{s.qty}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">on hand</div>
            </div>
            <div className="text-right">
              <div className="font-data text-sm">₹{s.price.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">unit</div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
  );
};

const ChatPanel = () => {
  const STORAGE_KEY = "dashboard_chat_history";
  const [messages, setMessages] = useState<{ who: "you" | "ai"; text: string }[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Stop any active mic session on unmount
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const speechSupported = typeof window !== "undefined" && !!(getSpeechRecognitionCtor());

  const toggleListening = () => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      toast.error("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => {
      toast.error("Couldn't hear you clearly. Try again.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Persist chat to localStorage (keep last 30 messages)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  const send = async () => {
    if (typing) return;
    const q = input.trim();
    if (!q) return;
    
    const history = messages.map((m) => ({
      role: m.who === "ai" ? "assistant" : "user",
      content: m.text
    }));

    setMessages((m) => [...m, { who: "you", text: q }]);
    setInput("");
    setTyping(true);

    try {
      const res = await advisorChatStream({
        message: q,
        conversation_history: history,
      });

      if (!res.body) throw new Error("No response body");
      setTyping(false);
      
      setMessages((m) => [...m, { who: "ai", text: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            text: newMessages[lastIndex].text + chunk,
          };
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
      setTyping(false);
      setMessages((m) => [...m, { who: "ai", text: "I am sorry, I am having trouble connecting to the AI service." }]);
    }
  };

  const quick = ["कितने दीया बनाऊँ?", "कौन सा रंग सस्ता है?", "अगला त्योहार कब है?"];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-[560px]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-display text-xs">स</div>
          <div>
            <div className="text-sm font-medium leading-none">Saathi (साथी)</div>
          </div>
        </div>
        <span className="text-[10px] font-data text-forest flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" /> online
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/10">
        {messages.length === 0 && !typing && (
          <div className="text-center text-xs text-muted-foreground px-6 py-8">
            Ask Saathi about materials, batch sizes, or upcoming festivals — try one of the prompts below, or type your own.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm px-3.5 py-2.5 rounded-2xl max-w-[88%] font-hindi ${
              m.who === "you"
                ? "bg-secondary text-secondary-foreground ml-auto rounded-br-sm"
                : "bg-card border border-border rounded-bl-sm"
            }`}
          >
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 max-w-[60%] flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
          </div>
        )}
      </div>

      <div className="px-3 pt-2 pb-1 border-t border-border flex flex-wrap gap-1.5 bg-card">
        {quick.map((q) => (
          <button
            key={q}
            onClick={() => setInput(q)}
            className="text-[11px] font-hindi px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="p-3 bg-card flex gap-2"
      >
        {speechSupported && (
          <button
            type="button"
            onClick={() => setVoiceLang((l) => (l === "hi-IN" ? "en-IN" : "hi-IN"))}
            title="Voice input language"
            className="w-10 h-10 rounded-lg border border-border grid place-items-center text-[10px] font-data text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors flex-shrink-0"
          >
            {voiceLang === "hi-IN" ? "हिं" : "EN"}
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about materials, batches, festivals…"
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm font-hindi focus:outline-none focus:border-primary/60"
        />
        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Stop listening" : "Speak your question"}
            className={`w-10 h-10 rounded-lg grid place-items-center transition-colors flex-shrink-0 ${
              isListening
                ? "bg-destructive/15 text-destructive animate-pulse"
                : "border border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
            }`}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
        )}
        <button
          type="submit"
          disabled={typing || !input.trim()}
          className="w-10 h-10 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

const TrendsCard = () => {
  // Same real, freshly-randomized feed the Trends page uses — a real other
  // artisan's real live listing, never a fabricated "+142% on Etsy" style
  // stat this app has no data to actually back.
  const { data: items, isLoading } = useQuery({
    queryKey: ["communityTrends"],
    queryFn: getCommunityTrends,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const top3 = (items || []).slice(0, 3);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-primary font-data">Trends · रुझान</div>
          <div className="font-display text-lg mt-0.5">Other artisans right now</div>
        </div>
        <Link to="/trends" aria-label="See all trends" className="text-muted-foreground hover:text-primary">
          <Bookmark size={14} />
        </Link>
      </div>
      {isLoading ? (
        <div className="text-xs text-muted-foreground py-2">Loading…</div>
      ) : top3.length === 0 ? (
        <div className="text-xs text-muted-foreground py-2">No other artisans have listed products yet.</div>
      ) : (
        top3.map((t) => <CommunityTrendRow key={t.id} name={t.author} product={t.product_name} price={t.price} category={t.category} />)
      )}
    </div>
  );
};

const CommunityTrendRow = ({ name, product, price, category }: { name: string; product: string; price: number; category?: string }) => (
  <div className="flex items-center justify-between border-t border-border first:border-0 pt-3 first:pt-0 gap-3">
    <div className="min-w-0">
      <div className="font-medium text-sm truncate">{product}</div>
      <div className="text-xs text-muted-foreground font-data flex items-center gap-1 mt-0.5 truncate">
        by {name}{category ? ` · ${category}` : ""}
      </div>
    </div>
    <span className="text-xs font-data font-semibold shrink-0">₹{price.toLocaleString("en-IN")}</span>
  </div>
);

const FestivalNudge = () => {
  const { data } = useQuery({
    queryKey: ["dashboardPriority"],
    queryFn: getDashboardPriority,
    staleTime: 5 * 60 * 1000,
  });

  const festivalName = (data?.festival as string) || "Diwali";
  // Dynamically compute days away from API response
  const festDate = data?.festival_date as string | undefined;
  const daysAway = festDate
    ? Math.max(0, Math.ceil((new Date(festDate).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
  <div className="rounded-2xl border border-secondary/40 bg-secondary text-secondary-foreground p-5 relative overflow-hidden">
    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
    <div className="relative">
      <div className="text-[10px] uppercase tracking-wider text-primary font-data">Next festival · अगला त्योहार</div>
      <div className="font-display text-3xl mt-2 leading-tight">{festivalName}</div>
      {daysAway !== null && (
        <div className="font-data text-sm text-secondary-foreground/70 mt-1">{daysAway} days away</div>
      )}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="font-data text-lg text-primary">{data?.metrics?.[0] ?? "Checking…"}</div>
          <div className="text-[10px] uppercase tracking-wider text-secondary-foreground/60">expected demand lift</div>
        </div>
        <Link to="/profile" className="text-xs font-data text-primary hover:underline">plan stock →</Link>
      </div>
    </div>
  </div>
  );
};

export default Dashboard;
