import { ArrowUpRight, ArrowDownRight, Bookmark, MessageCircle } from "lucide-react";
import textileImg from "@/assets/craft-textile.jpg";

const DashboardPreview = () => {
  return (
    <section id="preview" className="py-24 lg:py-32 bg-background-deep relative overflow-hidden">
      <div className="absolute inset-0 grain opacity-[0.05]" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
        <div className="max-w-2xl mb-12">
          <div className="text-xs uppercase tracking-[0.22em] text-primary font-data">· A Real Tuesday ·</div>
          <h2 className="mt-4 font-display text-5xl lg:text-6xl tracking-tight">
            6:42 a.m.<br />
            <span className="italic text-secondary">Ramesh opens the app.</span>
          </h2>
        </div>

        {/* Mock dashboard frame */}
        <div className="rounded-3xl border border-border-strong bg-background overflow-hidden"
             style={{ boxShadow: "var(--shadow-ink)" }}>
          {/* topbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground grid place-items-center text-xs font-display">अ</div>
              <div className="text-sm font-medium">Namaste, Ramesh ji</div>
              <span className="font-hindi text-xs text-muted-foreground">— बहीखाता खुला है</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground font-data">
              <span>Jaipur · 31°C</span>
              <span className="w-1 h-1 rounded-full bg-border-strong" />
              <span className="text-forest">Mandi: open</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-px bg-border">
            {/* Left rail */}
            <aside className="lg:col-span-2 bg-background p-5 hidden lg:block">
              {["Home", "Trends", "Mandi", "Crafts", "Production", "Profile"].map((n, i) => (
                <div
                  key={n}
                  className={`text-sm py-2.5 px-3 rounded-lg mb-1 ${
                    i === 1 ? "bg-primary/15 text-foreground font-medium border-l-2 border-primary" : "text-muted-foreground"
                  }`}
                >
                  {n}
                </div>
              ))}
            </aside>

            {/* Main */}
            <div className="lg:col-span-7 bg-background p-5 lg:p-7 space-y-5">
              {/* stat row */}
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Total products" value="42" />
                <Stat label="Listed" value="31" tone="forest" />
                <Stat label="Low stock" value="04" tone="danger" />
              </div>

              {/* priority action */}
              <div className="rounded-2xl border border-border bg-card p-4 flex gap-4">
                <img src={textileImg} loading="lazy" width={120} height={120} alt="Block-print stack" className="w-24 h-24 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-primary font-data">Today's priority</div>
                  <div className="font-display text-xl mt-1 leading-tight">Start 18 indigo dupattas before Friday</div>
                  <div className="font-hindi text-sm text-muted-foreground mt-1">शुक्रवार से पहले 18 दुपट्टे शुरू करें</div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground font-data">
                    <span className="text-forest">+38% Diwali lift</span> · drying weather holds 4 days
                  </div>
                </div>
              </div>

              {/* trend cards */}
              <div className="grid sm:grid-cols-2 gap-3">
                <TrendCard
                  badge="Rising"
                  badgeTone="forest"
                  title="Peacock motifs"
                  meta="+142% on Etsy this week"
                />
                <TrendCard
                  badge="Falling"
                  badgeTone="danger"
                  title="Plain mirror-work"
                  meta="−18% wholesale interest"
                  down
                />
              </div>
            </div>

            {/* Right rail — assistant */}
            <aside className="lg:col-span-3 bg-card p-5 space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data flex items-center gap-2">
                <MessageCircle size={12} /> Groq advisor
              </div>
              <Bubble who="you">कितने दुपट्टे बनाऊँ?</Bubble>
              <Bubble who="ai">
                इस हफ्ते 18 बनाइए। दिवाली में मांग बढ़ेगी और कपास सस्ता है। मैं सुझाव देती हूँ —
                <span className="inline-block w-1.5 h-3.5 align-middle bg-primary ml-0.5 animate-pulse" />
              </Bubble>
            </aside>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground font-data">
          <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
          live preview · data shown is illustrative
        </div>
      </div>
    </section>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: "forest" | "danger" }) => {
  const color =
    tone === "forest" ? "text-forest" : tone === "danger" ? "text-destructive" : "text-secondary";
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <div className={`font-data text-3xl font-semibold ${color}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
};

const TrendCard = ({
  badge,
  badgeTone,
  title,
  meta,
  down,
}: {
  badge: string;
  badgeTone: "forest" | "danger";
  title: string;
  meta: string;
  down?: boolean;
}) => (
  <div className="rounded-xl border border-border bg-background p-4 flex flex-col justify-between min-h-[110px]">
    <div className="flex items-start justify-between">
      <span
        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-data ${
          badgeTone === "forest" ? "bg-forest/10 text-forest" : "bg-destructive/10 text-destructive"
        }`}
      >
        {badge}
      </span>
      <Bookmark size={14} className="text-muted-foreground" />
    </div>
    <div>
      <div className="font-display text-lg leading-tight">{title}</div>
      <div className="text-xs text-muted-foreground font-data mt-1 flex items-center gap-1">
        {down ? <ArrowDownRight size={12} className="text-destructive" /> : <ArrowUpRight size={12} className="text-forest" />}
        {meta}
      </div>
    </div>
  </div>
);

const Bubble = ({ who, children }: { who: "you" | "ai"; children: React.ReactNode }) => (
  <div
    className={`text-sm px-3.5 py-2.5 rounded-2xl max-w-[95%] ${
      who === "you"
        ? "bg-secondary text-secondary-foreground ml-auto rounded-br-sm font-hindi"
        : "bg-background border border-border rounded-bl-sm font-hindi"
    }`}
  >
    {children}
  </div>
);

export default DashboardPreview;
