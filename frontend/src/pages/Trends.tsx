import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCommunityTrends, getTrendIntelligence, getMarketInsights, resolveImageUrl, CommunityTrendItem } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Bookmark,
  MapPin,
  MoreVertical,
  Package2,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Sun,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/site/AppShell";

const TABS = ["All trends", "Home decor", "Textiles", "Pottery", "Saved"] as const;
type Tab = (typeof TABS)[number];

/* ---------------- helpers ---------------- */

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const statusColor = (s: string) => {
  switch (s) {
    case "capturing_market": return "text-forest";
    case "trending_up": return "text-secondary";
    case "stable": return "text-muted-foreground";
    case "cooling_down": return "text-accent";
    default: return "text-muted-foreground";
  }
};
const statusBg = (s: string) => {
  switch (s) {
    case "capturing_market": return "bg-forest";
    case "trending_up": return "bg-secondary";
    case "stable": return "bg-muted-foreground";
    case "cooling_down": return "bg-accent";
    default: return "bg-muted-foreground";
  }
};
const statusLabel = (s: string) => ({
  capturing_market: "Capturing market",
  trending_up: "Trending up",
  stable: "Stable",
  cooling_down: "Cooling down",
}[s] || s);

// Loosely matches a real product's free-text category/craft_type against a tab —
// real listings aren't constrained to a fixed enum the way the old LLM schema was.
const matchesTab = (item: CommunityTrendItem, tab: Tab) => {
  if (tab === "All trends" || tab === "Saved") return true;
  const needle = tab.replace(" ", "").toLowerCase();
  const haystack = `${item.category || ""} ${item.craft_type || ""}`.toLowerCase();
  if (tab === "Home decor") return haystack.includes("home") || haystack.includes("decor");
  return haystack.includes(needle);
};

/* ---------------- page ---------------- */

const Trends = () => {
  const [tab, setTab] = useState<Tab>("All trends");
  const [bookmarks, setBookmarks] = useState<CommunityTrendItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("bookmarkedTrends") || "[]"); } catch { return []; }
  });
  const setAndPersistBookmarks = (updater: (b: CommunityTrendItem[]) => CommunityTrendItem[]) => {
    setBookmarks((b) => {
      const next = updater(b);
      localStorage.setItem("bookmarkedTrends", JSON.stringify(next));
      return next;
    });
  };

  // staleTime: 0 + refetchOnMount: "always" — the backend reshuffles a fresh
  // random sample on every call, so caching here would defeat the point;
  // every visit to this page should show a different set of real listings.
  const { data: items, isLoading } = useQuery({
    queryKey: ["communityTrends"],
    queryFn: getCommunityTrends,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const filtered = useMemo(() => {
    if (tab === "Saved") return bookmarks;
    return (items || []).filter((t) => matchesTab(t, tab));
  }, [tab, bookmarks, items]);

  return (
    <AppShell
      title="Trends ledger"
      hindi="रुझान · what India is buying"
      subtitle="Real, live listings from other artisans on the platform — a fresh random set every time you open this page."
    >
      <div className="flex flex-col lg:flex-row gap-8 xl:gap-14 items-start">
        {/* Feed column */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:max-w-[680px] flex-1 space-y-5"
        >
          <FilterBar tab={tab} setTab={setTab} />
          {tab !== "Saved" && isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filtered.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            filtered.map((t, i) => (
              <TrendCard
                key={t.id}
                trend={t}
                index={i}
                bookmarked={bookmarks.some((b) => b.id === t.id)}
                onToggleBookmark={() =>
                  setAndPersistBookmarks((b) => {
                    const already = b.some((x) => x.id === t.id);
                    return already ? b.filter((x) => x.id !== t.id) : [...b, t];
                  })
                }
              />
            ))
          )}
        </motion.section>

        {/* Intelligence column */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-[380px] lg:flex-shrink-0 lg:sticky lg:top-4 lg:self-start space-y-6"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="font-display text-base">Market intelligence</span>
            <span className="font-hindi text-xs text-muted-foreground ml-1">बाज़ार</span>
          </div>
          <NicheInsightsCard currentTab={tab} />
          <AISuggestionCard />
          <MaterialForecastCard />
        </motion.aside>
      </div>
    </AppShell>
  );
};

export default Trends;

/* ---------------- filter bar ---------------- */

const FilterBar = ({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) => (
  <div className="rounded-3xl bg-card border border-border shadow-sm p-3 flex items-center gap-3">
    <button
      onClick={() => toast.info("Advanced filters aren't available yet — use the category tabs for now.")}
      className="w-9 h-9 rounded-full grid place-items-center text-primary hover:bg-primary/10 transition-colors shrink-0"
    >
      <SlidersHorizontal size={16} />
    </button>
    <div className="flex items-center gap-2 overflow-x-auto flex-1 no-scrollbar">
      {TABS.map((t) => {
        const active = tab === t;
        return (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-border-strong/40"
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
    <span className="w-px h-8 bg-border shrink-0" />
    <button
      onClick={() => toast.info("Search isn't available yet — use the category tabs for now.")}
      className="w-9 h-9 rounded-full grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
    >
      <Search size={16} />
    </button>
  </div>
);

/* ---------------- trend card ---------------- */

const TrendCard = ({
  trend,
  index,
  bookmarked,
  onToggleBookmark,
}: {
  trend: CommunityTrendItem;
  index: number;
  bookmarked: boolean;
  onToggleBookmark: () => void;
}) => {
  const listedText =
    trend.days_listed === undefined || trend.days_listed === null
      ? ""
      : trend.days_listed === 0
      ? "Listed today"
      : `Listed ${trend.days_listed} day${trend.days_listed === 1 ? "" : "s"} ago`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden"
    >
      <header className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-primary/15 text-primary grid place-items-center font-display text-base shrink-0">
          {trend.author.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold leading-tight truncate">{trend.author}</div>
          <div className="text-[12px] text-muted-foreground flex items-center gap-2">
            {listedText && <span>{listedText}</span>}
            {trend.location && (
              <span className="flex items-center gap-0.5"><MapPin size={10} />{trend.location}</span>
            )}
          </div>
        </div>
        {trend.craft_type && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border text-primary bg-primary/10 border-primary/20 capitalize">
            {trend.craft_type}
          </span>
        )}
        <button
          onClick={() => toast.info("Post actions aren't available yet.")}
          className="p-1.5 text-muted-foreground hover:text-foreground"
        >
          <MoreVertical size={16} />
        </button>
      </header>

      <div className="border-y border-border h-[320px] bg-muted grid place-items-center overflow-hidden">
        {trend.image_url ? (
          <img src={resolveImageUrl(trend.image_url)} alt={trend.product_name} className="w-full h-full object-cover" />
        ) : (
          <Package2 size={40} className="text-muted-foreground" />
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl leading-snug">{trend.product_name}</h3>
          <span className="font-data text-lg shrink-0">{inr(trend.price)}</span>
        </div>
        {trend.material && <p className="text-[13px] text-foreground/80">{trend.material}</p>}
        {trend.category && (
          <span className="text-[13px] font-semibold text-forest">#{trend.category}</span>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <Link
            to={`/karigar/${trend.artisan_id}`}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            View {trend.author}'s profile
          </Link>
          <button
            onClick={onToggleBookmark}
            className={`flex items-center gap-1.5 text-[13px] ml-auto transition-colors ${
              bookmarked ? "text-secondary" : "text-muted-foreground hover:text-secondary"
            }`}
          >
            <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
            <span>{bookmarked ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
};

/* ---------------- skeleton ---------------- */

const SkeletonCard = () => (
  <div className="rounded-3xl bg-card border border-border p-5 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-muted" />
      <div className="space-y-2 flex-1">
        <div className="h-3 w-32 bg-muted rounded" />
        <div className="h-2 w-20 bg-muted rounded" />
      </div>
    </div>
    <div className="h-48 bg-muted rounded-2xl" />
    <div className="h-4 w-2/3 bg-muted rounded" />
    <div className="h-3 w-full bg-muted rounded" />
    <div className="h-3 w-5/6 bg-muted rounded" />
  </div>
);

const EmptyState = ({ tab }: { tab: Tab }) => (
  <div className="rounded-3xl bg-card border border-dashed border-border p-10 text-center">
    <div className="font-display text-xl">Nothing here yet</div>
    <p className="text-sm text-muted-foreground mt-2">
      {tab === "Saved"
        ? "Bookmark a trend to see it here. Tap the Save button on any card."
        : `No other artisans have listed products in ${tab} yet. Try another category, or check back later.`}
    </p>
  </div>
);

/* ---------------- intelligence: niche insights ---------------- */

const NicheInsightsCard = ({ currentTab }: { currentTab: Tab }) => {
  const categoryMap: Record<string, string> = {
    "Textiles": "textile",
    "Pottery": "pottery",
    "Home decor": "home_decor_brassware",
  };
  const marketCat = categoryMap[currentTab] || "textile";
  const { data } = useQuery({
    queryKey: ["marketInsights", marketCat],
    queryFn: () => getMarketInsights(marketCat),
    staleTime: 5 * 60 * 1000,
  });

  const insights = data?.insights?.map((i) => ({
    niche: i.niche,
    confidence: i.confidence_score,
    status: i.status,
    momentum: i.trend_momentum,
    season: i.upcoming_season,
  })) || [];

  return (
  <div className="rounded-2xl bg-card border border-border border-l-4 border-l-forest p-5 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <Activity size={16} className="text-forest" />
      <span className="font-display text-base">Niche insights</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-data ml-auto">live signals</span>
    </div>
    {insights.length === 0 ? (
      <p className="text-[12px] text-muted-foreground italic">
        Not enough market signal data yet for this category — check back once a few days of Google Trends data have been collected.
      </p>
    ) : (
    <div className="space-y-4">
      {insights.map((n, i) => (
        <motion.div
          key={n.niche}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 * i }}
          className="space-y-1.5 pb-4 border-b border-border last:border-b-0 last:pb-0"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[13px] font-semibold leading-tight">{n.niche}</span>
            <div className="text-right shrink-0">
              <div className={`text-sm font-data font-semibold ${statusColor(n.status)}`}>{n.confidence}%</div>
              <div className="text-[8px] uppercase font-bold tracking-wider text-muted-foreground">confidence</div>
            </div>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${n.confidence}%` }}
              transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
              className={`h-full ${statusBg(n.status)}`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className={statusColor(n.status)}>{statusLabel(n.status)}</span>
            <span className={`font-data font-semibold ${n.momentum.startsWith("+") ? "text-forest" : "text-destructive"}`}>
              {n.momentum} {n.momentum.startsWith("+") ? "↗" : "↘"}
            </span>
          </div>
          {n.season !== "None" && (
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-wider">
              <Sun size={10} /> Season: {n.season}
            </div>
          )}
        </motion.div>
      ))}
    </div>
    )}
    <p className="mt-4 text-[10px] italic text-muted-foreground font-data">
      Algorithm: (30d trend momentum × 0.6) + (festival proximity × 0.4)
    </p>
  </div>
  );
};

/* ---------------- intelligence: AI suggestion ---------------- */

const AISuggestionCard = () => {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["trendIntelligence"],
    queryFn: getTrendIntelligence,
    staleTime: 5 * 60 * 1000,
  });
  const suggestion = data?.ai_suggestion;

  return (
    <div className="rounded-2xl bg-secondary/5 border border-secondary/20 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground grid place-items-center shrink-0">
          <Sparkles size={18} />
        </div>
        <div>
          <div className="text-sm font-display font-semibold">{suggestion?.title || "Artisan AI suggestion"}</div>
          <div className="text-[11px] text-secondary font-data">{suggestion?.subtitle || "Market optimization tip"} · सुझाव</div>
        </div>
      </div>
      {suggestion?.text ? (
        <p className="text-[13px] leading-relaxed text-foreground/85">{suggestion.text}</p>
      ) : (
        <p className="text-[13px] leading-relaxed text-muted-foreground italic">
          The AI tip generator is unavailable right now — try again in a few minutes.
        </p>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 w-full bg-card border border-secondary/30 text-secondary text-[13px] font-bold rounded-lg py-2.5 hover:bg-background transition-colors flex items-center justify-center gap-2"
      >
        Estimate real cost impact
        <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-lg bg-card border-l-4 border-l-secondary p-4 space-y-2 text-[12px] text-foreground/85">
              <p>
                This tip isn't tied to a specific product or quantity, so we can't honestly show a per-unit
                margin breakdown here. For a real cost estimate against a specific material and destination city,
                use the sourcing calculator on the Mandi page.
              </p>
              <Link
                to="/mandi"
                className="inline-flex items-center gap-1 text-secondary font-bold hover:underline pt-1"
              >
                Open Mandi cost calculator <ChevronRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------------- intelligence: material forecast ---------------- */

const MaterialForecastCard = () => {
  const [showAll, setShowAll] = useState(false);
  const { data } = useQuery({
    queryKey: ["trendIntelligence"],
    queryFn: getTrendIntelligence,
    staleTime: 5 * 60 * 1000,
  });

  const rawList = data?.material_forecast || [];
  const mappedList = rawList.map((m) => ({
    name: m.name,
    price: m.price,
    status: m.status,
    trend: m.trend,
    dataSource: m.data_source,
    down: m.trend.includes("↘") || m.trend.includes("-") || m.status.toLowerCase().includes("drop") || m.status === "Price Drop",
  }));

  const list = showAll ? mappedList : mappedList.slice(0, 2);
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-base">Raw material forecast</span>
        {mappedList.length > 2 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-[12px] text-secondary font-data hover:underline"
          >
            {showAll ? "Show less" : "View all"}
          </button>
        )}
      </div>
      {list.length === 0 ? (
        <p className="text-[12px] text-muted-foreground italic">No commodity data available right now.</p>
      ) : (
      <div className="space-y-3">
        {list.map((m) => (
          <div key={m.name} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted grid place-items-center shrink-0">
              {m.down ? (
                <TrendingDown size={14} className="text-forest" />
              ) : (
                <TrendingUp size={14} className="text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold truncate flex items-center gap-1.5">
                  {m.name}
                  <span
                    title={m.dataSource === "live" ? "Live Alpha Vantage rate" : "Alpha Vantage rate-limited — calibrated estimate, not live"}
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-data shrink-0 ${m.dataSource === "live" ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}
                  >
                    {m.dataSource === "live" ? "Live" : "Est."}
                  </span>
                </span>
                <span className="text-sm font-data font-bold">{m.price}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className={`text-[11px] ${m.down ? "text-forest" : "text-destructive"}`}>{m.status}</span>
                <span className={`text-[12px] font-data font-semibold ${m.down ? "text-forest" : "text-destructive"}`}>
                  {m.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
