import { TrendingUp, Sprout, Package, Wand2, BarChart3, Bell } from "lucide-react";

const rows = [
  {
    no: "01",
    icon: TrendingUp,
    title: "Trend Feed",
    hindi: "क्या बिक रहा है",
    body: "Global craft demand, scraped, ranked and translated. See the motif before it lands at the wholesaler.",
    tag: "AI · daily",
  },
  {
    no: "02",
    icon: Sprout,
    title: "Mandi Watch",
    hindi: "कच्चा माल",
    body: "Live wholesale prices for cotton, indigo, brass, clay — Local · Surat · Delhi side-by-side.",
    tag: "Live feed",
  },
  {
    no: "03",
    icon: Package,
    title: "Production Advisor",
    hindi: "क्या बनाएँ",
    body: "Demand × stock × festival × weather. One number: how many to make this week.",
    tag: "ML · SARIMA → DeepAR",
  },
  {
    no: "04",
    icon: Wand2,
    title: "Groq Assistant",
    hindi: "सलाहकार",
    body: "Streaming Llama 3.3 trained on Indian craft context. Hindi, Urdu, Tamil — your voice.",
    tag: "Chat · Hindi/EN",
  },
  {
    no: "05",
    icon: BarChart3,
    title: "Stock Ledger",
    hindi: "बहीखाता",
    body: "Lifetime earnings, listed vs. unlisted, low-stock alerts. The book your father kept, made gentle.",
    tag: "Always-on",
  },
  {
    no: "06",
    icon: Bell,
    title: "Festival Lift",
    hindi: "त्यौहार",
    body: "Per-craft multipliers for Diwali, Eid, Pongal, Onam — 2025-2027 baked in.",
    tag: "Calendar",
  },
];

const FeatureLedger = () => {
  return (
    <section id="trends" className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 items-end mb-14">
          <div className="lg:col-span-7">
            <div className="text-xs uppercase tracking-[0.22em] text-primary font-data">
              · The Ledger ·
            </div>
            <h2 className="mt-4 font-display text-5xl lg:text-6xl tracking-tight text-balance">
              Six pages. One quiet promise:<br />
              <span className="italic text-secondary">no more guessing.</span>
            </h2>
          </div>
          <p className="lg:col-span-5 text-muted-foreground leading-relaxed">
            ArtisanGPS is not a marketplace, not a course, not another WhatsApp group.
            It's the part of running your workshop that stays open in a tab — the
            numbers, the seasons, the second opinion at 6 a.m.
          </p>
        </div>

        <div className="border-t border-border-strong">
          {rows.map((r, i) => (
            <LedgerRow key={r.no} {...r} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
};

const LedgerRow = ({
  no,
  icon: Icon,
  title,
  hindi,
  body,
  tag,
  reverse,
}: {
  no: string;
  icon: any;
  title: string;
  hindi: string;
  body: string;
  tag: string;
  reverse?: boolean;
}) => (
  <div
    className={`group grid grid-cols-12 gap-6 py-8 lg:py-10 border-b border-border-strong hover:bg-card transition-colors`}
  >
    <div className="col-span-2 lg:col-span-1 font-data text-xs text-muted-foreground pt-2">
      {no}
    </div>
    <div className="col-span-10 lg:col-span-1">
      <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary grid place-items-center group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
        <Icon size={20} strokeWidth={1.6} />
      </div>
    </div>
    <div className="col-span-12 lg:col-span-5">
      <div className="font-display text-3xl lg:text-4xl tracking-tight">{title}</div>
      <div className="font-hindi text-muted-foreground mt-1">{hindi}</div>
    </div>
    <div className="col-span-12 lg:col-span-4 text-foreground/80 leading-relaxed">
      {body}
    </div>
    <div className="col-span-12 lg:col-span-1 text-right">
      <span className="inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-border bg-background font-data text-muted-foreground">
        {tag}
      </span>
    </div>
  </div>
);

export default FeatureLedger;
