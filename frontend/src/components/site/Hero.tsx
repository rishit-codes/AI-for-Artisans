import heroImg from "@/assets/hero-artisan.jpg";
import { ArrowRight, MapPin, Cloud, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section id="top" className="relative pt-28 pb-16 lg:pt-36 lg:pb-24">
      {/* paper grain background */}
      <div className="absolute inset-0 -z-10 grain opacity-[0.06]" />
      <div className="absolute -top-32 -left-32 w-[60vw] h-[60vw] -z-10 opacity-60"
           style={{ background: "var(--gradient-glow)" }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10 lg:gap-14 items-end">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-data tracking-wide text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
            Built with 1,200+ artisans across 14 craft clusters
          </div>

          <h1 className="mt-7 font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-balance">
            A digital ledger for{" "}
            <span className="italic text-secondary">हस्तकला</span>
            <br />
            built from the{" "}
            <span className="relative inline-block">
              <span className="relative z-10">cluster outward.</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-primary/40 -z-0" />
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg text-muted-foreground leading-relaxed">
            ArtisanGPS turns daily mandi prices, weather, festivals and global craft
            trends into one quiet, weighty dashboard — the kind a village accountant
            would keep, if the accountant could see the future.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-secondary text-secondary-foreground font-medium hover:bg-foreground transition-colors"
              style={{ boxShadow: "var(--shadow-ink)" }}
            >
              Open my ledger
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#preview"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-border-strong hover:bg-card transition-colors"
            >
              See a real day
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-5">
            <Stat n="₹4.2L" l="avg. monthly stock value tracked" />
            <Stat n="14" l="craft clusters · pottery to pashmina" />
            <Stat n="2.3×" l="clearer demand vs. spreadsheet" />
          </div>
        </div>

        {/* Right: composed hero image with overlay cards */}
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden border border-border"
               style={{ boxShadow: "var(--shadow-ink)" }}>
            <img
              src={heroImg}
              alt="Master weaver at her loom in Jaipur"
              className="w-full h-full object-cover"
              width={1280}
              height={1600}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center gap-2 text-secondary-foreground text-xs font-data tracking-wide">
              <MapPin size={14} /> Bagru cluster · Rajasthan
            </div>
          </div>

          {/* floating cards */}
          <div className="absolute -left-6 top-10 hidden sm:block animate-float">
            <FloatCard>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cloud size={14} /> Jaipur · today
              </div>
              <div className="font-data text-2xl mt-1">31°C</div>
              <div className="text-[11px] text-forest font-medium">Good drying day</div>
            </FloatCard>
          </div>

          <div className="absolute -right-4 bottom-10 hidden sm:block animate-float" style={{ animationDelay: "1.4s" }}>
            <FloatCard tone="primary">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles size={14} /> Festival lift
              </div>
              <div className="font-data text-2xl mt-1">+38%</div>
              <div className="text-[11px] text-foreground/70">Diwali · 12 days out</div>
            </FloatCard>
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat = ({ n, l }: { n: string; l: string }) => (
  <div>
    <div className="font-display text-3xl text-secondary">{n}</div>
    <div className="text-xs text-muted-foreground mt-1 max-w-[180px]">{l}</div>
  </div>
);

const FloatCard = ({ children, tone }: { children: React.ReactNode; tone?: "primary" }) => (
  <div
    className={`px-4 py-3 rounded-2xl border border-border w-[180px] backdrop-blur-md ${
      tone === "primary" ? "bg-primary/95 text-foreground" : "bg-card/95"
    }`}
    style={{ boxShadow: "var(--shadow-paper)" }}
  >
    {children}
  </div>
);

export default Hero;
