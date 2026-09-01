import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section id="cta" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="relative rounded-[2rem] overflow-hidden p-10 lg:p-20 text-center"
             style={{ background: "var(--gradient-warm)" }}>
          <div className="absolute inset-0 grain opacity-[0.12]" />
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full"
               style={{ background: "radial-gradient(circle, hsl(36 100% 80% / 0.5), transparent 60%)" }} />

          <div className="relative">
            <div className="font-hindi text-foreground/70 text-sm tracking-wide">— एक छोटी सी शुरुआत —</div>
            <h2 className="mt-4 font-display text-5xl lg:text-7xl tracking-tight text-foreground text-balance">
              Open your ledger.<br />
              <span className="italic">It's already warm.</span>
            </h2>
            <p className="mt-6 max-w-xl mx-auto text-foreground/75 text-lg">
              Free for the first 6 months across all 14 craft clusters we serve.
              No card. No upsells. Just the page that opens at sunrise.
            </p>

            <div className="mt-9 flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-secondary text-secondary-foreground font-medium hover:bg-foreground transition-colors"
              >
                Begin <ArrowRight size={18} />
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-foreground/60 font-data">
              <span>· Hindi · Tamil · Urdu · English ·</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
