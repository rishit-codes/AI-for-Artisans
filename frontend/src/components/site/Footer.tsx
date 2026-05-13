const cols = [
  {
    title: "Product",
    items: ["Trends", "Mandi Watch", "Production", "Festival lift", "Stock ledger"],
  },
  {
    title: "Clusters",
    items: ["Bagru block-print", "Khurja pottery", "Moradabad brass", "Banaras silk", "Channapatna toys"],
  },
  {
    title: "Company",
    items: ["About", "Field notes", "Careers", "Press", "Contact"],
  },
];

const Footer = () => {
  return (
    <footer className="bg-foreground text-background pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 grid place-items-center rounded-full bg-primary text-foreground font-display text-xl">
                अ
              </span>
              <div>
                <div className="font-display text-2xl">ArtisanGPS</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-background/50 font-data">
                  The Artisan's Ledger
                </div>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-background/65 leading-relaxed">
              A digital co-operative quietly building infrastructure for India's
              200 million craft economy — one workshop at a time.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs text-background/50 font-data">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Stockholm · Jaipur · Bengaluru
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {cols.map((c) => (
              <div key={c.title}>
                <div className="text-[11px] uppercase tracking-wider text-background/50 font-data mb-4">
                  {c.title}
                </div>
                <ul className="space-y-2.5">
                  {c.items.map((i) => (
                    <li key={i}>
                      <a href="#" className="text-background/85 hover:text-primary transition-colors">
                        {i}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="font-display text-[clamp(4rem,16vw,16rem)] leading-none tracking-tighter text-background/10 select-none">
          हस्तकला
        </div>

        <div className="mt-8 pt-8 border-t border-background/10 flex flex-wrap items-center justify-between gap-4 text-xs text-background/50 font-data">
          <div>© 2026 ArtisanGPS Co-operative</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-background">Privacy</a>
            <a href="#" className="hover:text-background">Terms</a>
            <a href="#" className="hover:text-background">Open data</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
