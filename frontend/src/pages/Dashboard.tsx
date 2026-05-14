import { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getProducts, getMandiPrices, advisorChatStream } from "@/lib/api";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Bookmark,
  Compass,
  Home,
  LineChart,
  Send,
  Settings,
  Sparkles,
  Store,
  TrendingUp,
  User,
  Search,
} from "lucide-react";
import textileImg from "@/assets/craft-textile.jpg";
import potteryImg from "@/assets/craft-pottery.jpg";
import metalImg from "@/assets/craft-metal.jpg";

/* ---------------- data ---------------- */

const mandiRows = [
  { item: "Cotton yarn (40s)", hindi: "सूती धागा", unit: "₹/kg", local: 268, surat: 254, delhi: 261, delta: -4.2 },
  { item: "Natural indigo dye", hindi: "नील रंग", unit: "₹/kg", local: 1840, surat: 1790, delhi: 1860, delta: 1.8 },
  { item: "Banarasi silk", hindi: "बनारसी रेशम", unit: "₹/m", local: 2840, surat: 2900, delhi: 2810, delta: 0 },
  { item: "Brass sheet", hindi: "पीतल चादर", unit: "₹/kg", local: 612, surat: 598, delhi: 605, delta: -1.1 },
  { item: "Terracotta clay", hindi: "गीली मिट्टी", unit: "₹/qtl", local: 480, surat: 510, delhi: 495, delta: 2.6 },
  { item: "Lac bangles base", hindi: "लाख", unit: "₹/kg", local: 920, surat: 940, delhi: 935, delta: 0.6 },
];

const stockRows = [
  { sku: "DUP-IND-018", name: "Indigo dupatta", hindi: "नील दुपट्टा", img: textileImg, qty: 12, low: 8, price: 1450, status: "Listed" },
  { sku: "POT-KHU-042", name: "Khurja serving bowl", hindi: "खुरजा कटोरा", img: potteryImg, qty: 4, low: 6, price: 680, status: "Low" },
  { sku: "BRS-DIY-011", name: "Brass diya set", hindi: "पीतल दीया", img: metalImg, qty: 28, low: 10, price: 920, status: "Listed" },
  { sku: "TEX-BAN-007", name: "Banarasi stole", hindi: "बनारसी स्टोल", img: textileImg, qty: 0, low: 5, price: 3200, status: "Out" },
  { sku: "POT-TER-019", name: "Terracotta planter", hindi: "मिट्टी गमला", img: potteryImg, qty: 17, low: 8, price: 320, status: "Listed" },
];

const seedChat: { who: "you" | "ai"; text: string }[] = [
  { who: "ai", text: "नमस्ते रमेश जी। आज दुपट्टे और दीया दोनों की मांग है। पूछिए — मैं हाजिर हूँ।" },
  { who: "you", text: "इस हफ्ते कितने दुपट्टे बनाऊँ?" },
  { who: "ai", text: "इस हफ्ते 18 बनाइए। दिवाली में मांग बढ़ेगी (+38%) और कपास इस हफ्ते सबसे सस्ता है — ₹254/kg सूरत में।" },
  { who: "you", text: "और बनारसी स्टोल?" },
  { who: "ai", text: "स्टोल अभी out-of-stock है। पहले 6 स्टोल की बुनाई शुरू कीजिए — रक्षा बंधन (9 अगस्त) से माँग आएगी।" },
];

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
              <span>ArtisanGPS · बहीखाता v0.4 · sample data</span>
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
  const items = [
    { to: "/dashboard", icon: Home, label: "Home", hindi: "घर" },
    { to: "/trends", icon: TrendingUp, label: "Trends", hindi: "रुझान" },
    { to: "/mandi", icon: Store, label: "Mandi", hindi: "मंडी" },
    { to: "/advisor", icon: Compass, label: "Advisor", hindi: "सलाहकार" },
    { to: "/reports", icon: LineChart, label: "Reports", hindi: "रिपोर्ट" },
    { to: "/profile", icon: User, label: "Profile", hindi: "प्रोफ़ाइल" },
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
        <div className="font-display text-sm">Khurja cluster</div>
        <div className="text-muted-foreground font-data mt-0.5">142 active artisans</div>
        <button className="mt-3 text-primary font-data text-xs hover:underline">switch cluster →</button>
      </div>
    </aside>
  );
};

const Topbar = () => (
  <div className="sticky top-0 z-20 backdrop-blur bg-background/85 border-b border-border px-5 lg:px-8 py-3.5 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3 flex-1 max-w-md">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="search materials, SKUs, festivals…"
          className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/60 placeholder:text-muted-foreground"
        />
      </div>
    </div>
    <div className="flex items-center gap-3 text-xs text-muted-foreground font-data">
      <span className="hidden md:inline">Jaipur · 31°C</span>
      <span className="hidden md:inline w-1 h-1 rounded-full bg-border-strong" />
      <span className="text-forest hidden md:inline">mandi open</span>
      <button className="relative w-9 h-9 rounded-lg border border-border bg-card grid place-items-center hover:border-primary/60">
        <Bell size={14} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
      </button>
      <button className="w-9 h-9 rounded-lg border border-border bg-card grid place-items-center hover:border-primary/60">
        <Settings size={14} />
      </button>
      <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-display">र</div>
    </div>
  </div>
);

const Greeting = () => {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return (
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <div className="text-xs uppercase tracking-[0.22em] text-primary font-data">
          · {weekday} · {dateStr} · {timeStr} ·
        </div>
        <h1 className="mt-2 font-display text-4xl lg:text-5xl tracking-tight">
          Namaste, Ramesh ji.
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
    { label: "Total products", hindi: "कुल माल", value: String(data?.total_products ?? "42").padStart(2, '0'), tone: "secondary" },
    { label: "Listed online", hindi: "ऑनलाइन", value: String(data?.listed_count ?? "31").padStart(2, '0'), tone: "forest" },
    { label: "Low stock", hindi: "कम स्टॉक", value: String(Array.isArray(data?.low_stock_items) ? data.low_stock_items.length : "04").padStart(2, '0'), tone: "danger" },
    { label: "Total stock value", hindi: "कुल मूल्य", value: data?.total_stock_value ? `₹${(data.total_stock_value as number).toLocaleString()}` : "₹48,210", tone: "primary" },
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

const PriorityCard = () => (
  <div className="rounded-2xl border border-border-strong bg-card p-5 flex flex-col sm:flex-row gap-5"
       style={{ boxShadow: "var(--shadow-paper)" }}>
    <img src={textileImg} loading="lazy" alt="Indigo dupattas" className="w-full sm:w-44 h-44 rounded-xl object-cover" />
    <div className="flex-1 flex flex-col">
      <div className="text-[10px] uppercase tracking-wider text-primary font-data">Today's priority · आज का काम</div>
      <div className="font-display text-2xl mt-1 leading-tight">Start 18 indigo dupattas before Friday</div>
      <div className="font-hindi text-muted-foreground mt-1">शुक्रवार से पहले 18 दुपट्टे शुरू करें</div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground font-data">
        <span className="text-forest">+38% Diwali lift</span>
        <span className="w-1 h-1 rounded-full bg-border-strong self-center" />
        <span>drying weather holds 4 days</span>
        <span className="w-1 h-1 rounded-full bg-border-strong self-center" />
        <span>cotton at 90-day floor</span>
      </div>
      <div className="mt-auto pt-4 flex gap-2">
        <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90">
          Add to today
        </button>
        <button className="rounded-full border border-border px-4 py-2 text-sm hover:bg-background">
          Snooze
        </button>
      </div>
    </div>
  </div>
);

const MandiWidget = () => {
  const { data } = useQuery({
    queryKey: ["mandiPrices"],
    queryFn: () => getMandiPrices("Textiles"),
  });

  const parseVal = (str: string) => {
    const val = parseFloat(str?.replace(/[^0-9.]/g, "") || "0");
    return isNaN(val) ? 0 : val;
  };
  const parseUnit = (str: string) => {
    const parts = str?.split("/");
    return parts?.length > 1 ? `/${parts[1]}` : "unit";
  };

  const rows = data ? data.map((r: any) => ({
    item: r.commodity,
    hindi: r.sub,
    unit: parseUnit(r.local_price),
    local: parseVal(r.local_price),
    surat: parseVal(r.surat_price),
    delhi: parseVal(r.delhi_price),
    delta: r.action === "Buy" ? -2.1 : (r.action === "Wait" ? 1.5 : 0.8)
  })) : mandiRows;

  return (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-primary font-data">Mandi watch · मंडी भाव</div>
        <div className="font-display text-xl mt-0.5">Three markets, one screen</div>
      </div>
      <div className="flex items-center gap-2 text-xs text-forest font-data">
        <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" /> live · 04:18 am
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
          {rows.map((r: any) => {
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
                <td className="py-3.5 px-5 text-right"><Delta v={r.delta} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <div className="p-4 bg-background-deep border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground font-data">
      <span>Green = cheapest mandi today · SARIMA MAPE 7.2%</span>
      <span className="text-forest">↓ Buy cotton this week — predicted floor</span>
    </div>
  </div>
  );
};

const Delta = ({ v }: { v: number }) => {
  if (v === 0) return <span className="inline-flex items-center gap-1 text-muted-foreground font-data text-xs">— 0.0%</span>;
  const up = v > 0;
  return (
    <span className={`inline-flex items-center gap-1 font-data text-xs ${up ? "text-destructive" : "text-forest"}`}>
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
};

const StockLedger = () => {
  const { data } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const rows = data && data.length > 0 ? data.map((p: any) => ({
    sku: p.id ? p.id.toString().substring(0, 8).toUpperCase() : "SKU",
    name: p.name,
    hindi: p.category || "General",
    img: p.image_url || textileImg,
    qty: p.stock_qty || 0,
    low: 5,
    price: p.price || 0,
    status: p.stock_qty === 0 ? "Out" : (p.stock_qty < 5 ? "Low" : (p.is_listed ? "Listed" : "Unlisted"))
  })) : stockRows;

  return (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-primary font-data">Stock ledger · स्टॉक बही</div>
        <div className="font-display text-xl mt-0.5">What's on the shelf</div>
      </div>
      <button className="text-xs font-data text-primary hover:underline">+ add product</button>
    </div>
    <div className="divide-y divide-border">
      {rows.slice(0, 5).map((s: any) => {
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
  const [messages, setMessages] = useState(seedChat);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = async () => {
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
          <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-display text-xs">अ</div>
          <div>
            <div className="text-sm font-medium leading-none">Groq advisor</div>
            <div className="text-[10px] text-muted-foreground font-data mt-0.5">हिन्दी · powered by Llama 3.3</div>
          </div>
        </div>
        <span className="text-[10px] font-data text-forest flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" /> online
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/10">
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
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="अपनी बात लिखिए…"
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm font-hindi focus:outline-none focus:border-primary/60"
        />
        <button type="submit" className="w-10 h-10 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:opacity-90">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

const TrendsCard = () => (
  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-primary font-data">Trends · रुझान</div>
        <div className="font-display text-lg mt-0.5">This week's wind</div>
      </div>
      <Bookmark size={14} className="text-muted-foreground" />
    </div>
    <Trend up title="Peacock motifs" meta="+142% on Etsy" />
    <Trend up title="Block-print indigo" meta="+58% Pinterest saves" />
    <Trend title="Plain mirror-work" meta="−18% wholesale" />
  </div>
);

const Trend = ({ title, meta, up }: { title: string; meta: string; up?: boolean }) => (
  <div className="flex items-center justify-between border-t border-border first:border-0 pt-3 first:pt-0">
    <div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground font-data flex items-center gap-1 mt-0.5">
        {up ? <ArrowUpRight size={12} className="text-forest" /> : <ArrowDownRight size={12} className="text-destructive" />}
        {meta}
      </div>
    </div>
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-data ${
      up ? "bg-forest/10 text-forest" : "bg-destructive/10 text-destructive"
    }`}>
      {up ? "rising" : "falling"}
    </span>
  </div>
);

const FestivalNudge = () => (
  <div className="rounded-2xl border border-secondary/40 bg-secondary text-secondary-foreground p-5 relative overflow-hidden">
    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
    <div className="relative">
      <div className="text-[10px] uppercase tracking-wider text-primary font-data">Next festival · अगला त्योहार</div>
      <div className="font-display text-3xl mt-2 leading-tight">Akshaya Tritiya</div>
      <div className="font-hindi text-secondary-foreground/70 mt-1">अक्षय तृतीया · 10 May</div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="font-data text-3xl text-primary">+22%</div>
          <div className="text-[10px] uppercase tracking-wider text-secondary-foreground/60">brass &amp; gold lift</div>
        </div>
        <button className="text-xs font-data text-primary hover:underline">plan stock →</button>
      </div>
    </div>
  </div>
);

export default Dashboard;
