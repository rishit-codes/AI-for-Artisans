const stack = [
  { k: "Llama 3.3 · Groq", v: "Streaming Hindi advisor" },
  { k: "SARIMA → DeepAR", v: "Demand forecast, MAPE-promoted" },
  { k: "Open-Meteo", v: "Weather for drying & firing" },
  { k: "Festival service", v: "2025–2027 dates · per-craft lift" },
  { k: "FastAPI · Postgres", v: "JWT auth, RLS, real APIs" },
  { k: "Edge functions", v: "Mandi scraper, sub-200ms" },
];

const StackSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-background-deep border-y border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5">
          <div className="text-xs uppercase tracking-[0.22em] text-primary font-data">· Built on ·</div>
          <h2 className="mt-4 font-display text-5xl tracking-tight">
            Boring tech,<br />
            <span className="italic text-secondary">trustworthy outputs.</span>
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
            We made the choices a 55-year-old potter would never see, but would feel:
            sub-200ms responses, offline-tolerant, Hindi-first prompts, no dark
            patterns, no upsells.
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {stack.map((s, i) => (
              <div
                key={s.k}
                className={`flex items-center justify-between px-6 py-5 ${
                  i !== stack.length - 1 ? "border-b border-border" : ""
                } hover:bg-background transition-colors`}
              >
                <div className="font-data text-sm text-secondary">{s.k}</div>
                <div className="text-sm text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StackSection;
