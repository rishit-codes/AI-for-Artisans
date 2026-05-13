const festivals = [
  { name: "Akshaya Tritiya", hindi: "अक्षय तृतीया", date: "10 May", lift: "+22%", crafts: "gold, brass" },
  { name: "Rath Yatra", hindi: "रथ यात्रा", date: "27 Jun", lift: "+14%", crafts: "wood, idols" },
  { name: "Raksha Bandhan", hindi: "रक्षा बंधन", date: "9 Aug", lift: "+31%", crafts: "thread, silver" },
  { name: "Onam", hindi: "ഓണം", date: "27 Aug", lift: "+28%", crafts: "kasavu, pookalam" },
  { name: "Navratri", hindi: "नवरात्रि", date: "22 Sep", lift: "+44%", crafts: "bandhani, chaniya" },
  { name: "Diwali", hindi: "दीवाली", date: "20 Oct", lift: "+62%", crafts: "diya, textile, sweets" },
  { name: "Eid-al-Adha", hindi: "ईद उल-अज़हा", date: "27 May", lift: "+19%", crafts: "embroidery, leather" },
  { name: "Pongal", hindi: "பொங்கல்", date: "14 Jan", lift: "+24%", crafts: "kolam, pottery" },
];

const FestivalCalendar = () => {
  return (
    <section id="festivals" className="py-24 lg:py-32 bg-secondary text-secondary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]"
           style={{ backgroundImage: "radial-gradient(circle at 20% 30%, hsl(var(--primary)) 0, transparent 40%), radial-gradient(circle at 80% 70%, hsl(var(--accent)) 0, transparent 40%)" }} />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
        <div className="grid lg:grid-cols-12 gap-10 mb-12 items-end">
          <div className="lg:col-span-7">
            <div className="text-xs uppercase tracking-[0.22em] text-primary font-data">· Festival Lift ·</div>
            <h2 className="mt-4 font-display text-5xl lg:text-6xl tracking-tight">
              The calendar your<br />
              <span className="italic text-primary">grandmother knew by heart.</span>
            </h2>
          </div>
          <p className="lg:col-span-5 text-secondary-foreground/75 leading-relaxed">
            2025-2027 dates baked in. Per-craft demand multipliers. Pongal lifts kolam clay
            differently than it lifts banana-leaf weaving — the ledger knows the difference.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {festivals.map((f) => (
            <div
              key={f.name}
              className="group rounded-2xl border border-secondary-foreground/15 p-5 hover:border-primary hover:bg-secondary-foreground/[0.04] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="font-data text-xs uppercase tracking-wider text-secondary-foreground/60">{f.date}</div>
                <span className="font-data text-sm text-primary font-medium">{f.lift}</span>
              </div>
              <div className="font-display text-2xl mt-3 leading-tight">{f.name}</div>
              <div className="font-hindi text-secondary-foreground/70 text-sm mt-1">{f.hindi}</div>
              <div className="mt-4 pt-4 border-t border-secondary-foreground/10 text-xs text-secondary-foreground/60">
                lifts: {f.crafts}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FestivalCalendar;
