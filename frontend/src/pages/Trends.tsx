import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrends, getTrendIntelligence, getMarketInsights } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Bookmark,
  Heart,
  MessageCircle,
  MoreVertical,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Sun,
  ChevronRight,
} from "lucide-react";
import AppShell from "@/components/site/AppShell";
import textileImg from "@/assets/craft-textile.jpg";
import potteryImg from "@/assets/craft-pottery.jpg";
import metalImg from "@/assets/craft-metal.jpg";

/* ---------------- mock data ---------------- */

type Trend = {
  id: number;
  author: string;
  title: string;
  content: string;
  timestamp: string;
  hindi?: string;
  image?: string;
  tags: string[];
  badge?: { label: string; tone: "primary" | "forest" | "secondary" | "destructive" };
  likes: string;
  comments: number;
  category: "Textiles" | "Pottery" | "Home Decor" | "Metal";
};

const TRENDS: Trend[] = [
  {
    id: 1,
    author: "Meera · Textile Insights",
    hindi: "मीरा · कपड़ा सूचना",
    title: "Peak demand in wedding silks",
    content:
      "Banarasi handlooms with festive reds are pulling +38% query volume on IndiaMart this fortnight. Surat cotton is down 4.2% — best buy window for the next 9 days.",
    timestamp: "2 hours ago",
    image: textileImg,
    tags: ["WeddingSilk", "FloralMotif", "Textiles"],
    badge: { label: "Trending now", tone: "primary" },
    likes: "1,245",
    comments: 89,
    category: "Textiles",
  },
  {
    id: 2,
    author: "Ramesh · Khurja Pottery",
    hindi: "रमेश · खुरजा कुम्हार",
    title: "Karwa Chauth gifting bowls",
    content:
      "Glazed serving bowls in cobalt + ivory are moving fast in Delhi NCR. Cluster lead time 14 days — start a 60-unit batch this week to catch the festival window.",
    timestamp: "5 hours ago",
    image: potteryImg,
    tags: ["Pottery", "Gifting", "Diwali"],
    badge: { label: "+24% MoM", tone: "forest" },
    likes: "842",
    comments: 41,
    category: "Pottery",
  },
  {
    id: 3,
    author: "Moradabad Metal Cluster",
    hindi: "मुरादाबाद धातु",
    title: "EU buyer queries up 22%",
    content:
      "Brass diya sets and engraved planters are seeing strong export pull from Germany and the Netherlands. Lock 4-week stock — indigo-finish lines are outperforming antique-finish 1.6x.",
    timestamp: "Yesterday",
    image: metalImg,
    tags: ["Metal", "Export", "Diwali"],
    badge: { label: "Export pull", tone: "secondary" },
    likes: "1,612",
    comments: 124,
    category: "Metal",
  },
  {
    id: 4,
    author: "Aanya · Home Decor",
    hindi: "आन्या · सजावट",
    title: "Terracotta planters: urban balcony wave",
    content:
      "Searches for 'terracotta planter set of 3' on Meesho up 14% WoW. Pair listings with macramé hangers — bundles convert 1.9x better than single SKUs.",
    timestamp: "Yesterday",
    tags: ["HomeDecor", "Terracotta", "BalconyGarden"],
    likes: "503",
    comments: 27,
    category: "Home Decor",
  },
  {
    id: 5,
    author: "Bagru Block-Print Co-op",
    hindi: "बगरू छपाई",
    title: "Risk: indigo dye supply tightening",
    content:
      "Bagru reports 6-day delays on natural indigo. Lock raw stock for the next 4 weeks; consider madder-red as a substitute for floral motif lines.",
    timestamp: "2 days ago",
    tags: ["RiskAlert", "Dye", "Textiles"],
    badge: { label: "Risk", tone: "destructive" },
    likes: "318",
    comments: 52,
    category: "Textiles",
  },
  {
    id: 6,
    author: "Jaipur Cluster Desk",
    hindi: "जयपुर डेस्क",
    title: "Festival lift: Diwali in 19 days",
    content:
      "Brass diya demand will lift +61% in 19 days. If your batch lead time is under 21 days, start 40 units this week. Pre-orders are already 2.3x last year's pace.",
    timestamp: "3 days ago",
    tags: ["Diwali", "Forecast", "Metal"],
    badge: { label: "Forecast", tone: "primary" },
    likes: "974",
    comments: 68,
    category: "Metal",
  },
];

const NICHE_INSIGHTS = [
  { niche: "Hand-block printed dupattas", confidence: 87, status: "capturing_market", momentum: "+12%", season: "Diwali" },
  { niche: "Banarasi wedding silk", confidence: 81, status: "trending_up", momentum: "+9%", season: "Wedding" },
  { niche: "Cobalt serving bowls", confidence: 74, status: "stable", momentum: "+2%", season: "None" },
  { niche: "Antique brass planters", confidence: 58, status: "cooling_down", momentum: "-4%", season: "None" },
];

const MATERIAL_FORECAST = [
  { name: "Cotton (Surat)", price: "₹6,093", status: "Price drop", trend: "5.2% ↘", down: true },
  { name: "Copper", price: "₹7,09,750", status: "High cost alert", trend: "2.4% ↗", down: false },
  { name: "Natural indigo", price: "₹1,840", status: "Supply tight", trend: "1.1% ↗", down: false },
  { name: "Terracotta clay", price: "₹420", status: "Stable", trend: "0.3% ↗", down: false },
];

const AI_SUGGESTION = {
  text: "Cotton prices dropped 5.2% in Surat this week — consider stocking 4 weeks of raw cotton before festival demand pushes prices back up. Pair with your wedding-silk SKUs for the Diwali pre-order window.",
};

const TABS = ["All trends", "Home decor", "Textiles", "Pottery", "Saved"] as const;
type Tab = (typeof TABS)[number];

/* ---------------- helpers ---------------- */

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

const badgeStyles = {
  primary: "text-primary bg-primary/10 border-primary/20",
  forest: "text-forest bg-forest/10 border-forest/20",
  secondary: "text-secondary bg-secondary/10 border-secondary/20",
  destructive: "text-destructive bg-destructive/10 border-destructive/20",
};

/* ---------------- page ---------------- */

const Trends = () => {
  const [tab, setTab] = useState<Tab>("All trends");
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("bookmarkedTrends") || "[]"); } catch { return []; }
  });

  const { data: rawTrends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["trends", tab === "Saved" ? "All Trends" : tab],
    queryFn: () => getTrends(tab === "Saved" ? "All Trends" : tab),
  });

  const mappedTrends = useMemo(() => {
    if (!rawTrends || rawTrends.length === 0) return TRENDS;
    return rawTrends.map((t: any) => ({
      ...t,
      image: t.image_url || textileImg,
      badge: t.performance_badge ? { label: t.performance_badge, tone: "primary" as const } : undefined,
      category: t.category || "Textiles",
    }));
  }, [rawTrends]);

  const filtered = useMemo(() => {
    const base = mappedTrends;
    if (tab === "All trends") return base;
    if (tab === "Saved") return base.filter((t) => bookmarks.includes(t.id));
    return base.filter(
      (t) =>
        t.category === tab ||
        t.tags?.some((tag: string) => tag.toLowerCase() === tab.replace(" ", "").toLowerCase()),
    );
  }, [tab, bookmarks, mappedTrends]);

  return (
    <AppShell
      title="Trends ledger"
      hindi="रुझान · what India is buying"
      subtitle="A social feed of demand, mandi prices and festival pull across 6 craft clusters. Refreshed every 30 minutes."
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
          {isTrendsLoading ? (
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
                bookmarked={bookmarks.includes(t.id)}
                onToggleBookmark={() =>
                  setBookmarks((b) =>
                    b.includes(t.id) ? b.filter((x) => x !== t.id) : [...b, t.id],
                  )
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
    <button className="w-9 h-9 rounded-full grid place-items-center text-primary hover:bg-primary/10 transition-colors shrink-0">
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
    <button className="w-9 h-9 rounded-full grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted shrink-0">
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
  trend: Trend;
  index: number;
  bookmarked: boolean;
  onToggleBookmark: () => void;
}) => {
  const [liked, setLiked] = useState(false);
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden"
    >
      <header className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-primary/15 text-primary grid place-items-center font-display text-base">
          {trend.author.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold leading-tight truncate">{trend.author}</div>
          <div className="text-[12px] text-muted-foreground flex items-center gap-2">
            <span>{trend.timestamp}</span>
            {trend.hindi && <span className="font-hindi opacity-70">· {trend.hindi}</span>}
          </div>
        </div>
        {trend.badge && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${badgeStyles[trend.badge.tone]}`}>
            {trend.badge.label}
          </span>
        )}
        <button className="p-1.5 text-muted-foreground hover:text-foreground">
          <MoreVertical size={16} />
        </button>
      </header>

      {trend.image && (
        <div className="border-y border-border">
          <img src={trend.image} alt={trend.title} className="w-full h-[320px] object-cover" />
        </div>
      )}

      <div className="p-5 space-y-3">
        <h3 className="font-display text-xl leading-snug">{trend.title}</h3>
        <p className="text-[13px] text-foreground/80 leading-relaxed">{trend.content}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {trend.tags.map((tag) => (
            <span key={tag} className="text-[13px] font-semibold text-forest">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-6 pt-3 border-t border-border">
          <button
            onClick={() => setLiked((v) => !v)}
            className={`flex items-center gap-1.5 text-[13px] transition-colors ${
              liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
            }`}
          >
            <Heart size={16} fill={liked ? "currentColor" : "none"} />
            <span className="font-data">{trend.likes}</span>
          </button>
          <button className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle size={16} />
            <span className="font-data">{trend.comments}</span>
          </button>
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
        : `No trends in ${tab} this week. Try another category.`}
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

  const insights = data?.insights?.map((i: any) => ({
    niche: i.niche,
    confidence: i.confidence_score,
    status: i.status,
    momentum: i.trend_momentum,
    season: i.upcoming_season,
  })) || NICHE_INSIGHTS;

  return (
  <div className="rounded-2xl bg-card border border-border border-l-4 border-l-forest p-5 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <Activity size={16} className="text-forest" />
      <span className="font-display text-base">Textile insights</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-data ml-auto">live trends</span>
    </div>
    <div className="space-y-4">
      {insights.map((n: any, i: number) => (
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
  const suggestion = data?.ai_suggestion || AI_SUGGESTION;

  return (
    <div className="rounded-2xl bg-secondary/5 border border-secondary/20 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground grid place-items-center shrink-0">
          <Sparkles size={18} />
        </div>
        <div>
          <div className="text-sm font-display font-semibold">{suggestion.title || "Artisan AI suggestion"}</div>
          <div className="text-[11px] text-secondary font-data">{suggestion.subtitle || "Market optimization tip"} · सुझाव</div>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-foreground/85">{suggestion.text}</p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 w-full bg-card border border-secondary/30 text-secondary text-[13px] font-bold rounded-lg py-2.5 hover:bg-background transition-colors flex items-center justify-center gap-2"
      >
        Calculate potential profit
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
            <div className="mt-4 rounded-lg bg-card border-l-4 border-l-secondary p-4 space-y-2 text-[12px]">
              <div className="font-semibold text-forest">Estimated margin impact: +12.4%</div>
              <div className="flex justify-between text-muted-foreground font-data">
                <span>Reduced base material cost</span><span>−₹4.20 / unit</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-data">
                <span>Bulk sourcing savings</span><span>−₹1.10 / unit</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between font-bold text-forest">
                <span>Projected net added profit</span><span>₹12,450 / batch</span>
              </div>
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

  const rawList = data?.material_forecast || MATERIAL_FORECAST;
  const mappedList = rawList.map((m: any) => ({
    name: m.name,
    price: m.price,
    status: m.status,
    trend: m.trend,
    down: m.trend.includes("↘") || m.trend.includes("-") || m.status.toLowerCase().includes("drop") || m.status === "Price Drop",
  }));

  const list = showAll ? mappedList : mappedList.slice(0, 2);
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-base">Raw material forecast</span>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-[12px] text-secondary font-data hover:underline"
        >
          {showAll ? "Show less" : "View all"}
        </button>
      </div>
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
                <span className="text-[13px] font-semibold truncate">{m.name}</span>
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
    </div>
  );
};
