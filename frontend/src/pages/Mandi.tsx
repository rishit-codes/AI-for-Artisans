import { useState } from "react";
import { ArrowDown, ArrowUp, MapPin, Truck, Filter, Download } from "lucide-react";
import AppShell from "@/components/site/AppShell";

const markets = ["Local · वाराणसी", "Surat", "Delhi", "Jaipur", "Mumbai"];

const rows = [
  { item: "Cotton yarn (40s)", hindi: "सूती धागा", unit: "₹/kg", prices: [268, 254, 261, 272, 279], delta: -4.2, supply: "high" },
  { item: "Natural indigo dye", hindi: "नील रंग", unit: "₹/kg", prices: [1840, 1790, 1860, 1820, 1900], delta: 1.8, supply: "tight" },
  { item: "Banarasi silk", hindi: "बनारसी रेशम", unit: "₹/m", prices: [2840, 2900, 2810, 2870, 2950], delta: 0, supply: "stable" },
  { item: "Brass sheet", hindi: "पीतल चादर", unit: "₹/kg", prices: [612, 598, 605, 620, 615], delta: -1.1, supply: "high" },
  { item: "Terracotta clay", hindi: "गीली मिट्टी", unit: "₹/qtl", prices: [480, 510, 495, 470, 530], delta: 2.6, supply: "tight" },
  { item: "Lac base", hindi: "लाख", unit: "₹/kg", prices: [920, 940, 935, 950, 960], delta: 0.6, supply: "stable" },
  { item: "Zari thread (gold)", hindi: "ज़री", unit: "₹/m", prices: [142, 138, 145, 144, 150], delta: -0.8, supply: "stable" },
  { item: "Madhubani paper", hindi: "मधुबनी काग़ज़", unit: "₹/sheet", prices: [38, 41, 39, 42, 44], delta: 1.1, supply: "high" },
];

const suppliers = [
  { name: "Surat Yarn Co-op", item: "Cotton 40s", lead: "2 days", trust: 4.8, savings: "₹14/kg" },
  { name: "Bhuj Indigo Collective", item: "Natural indigo", lead: "5 days", trust: 4.6, savings: "₹50/kg" },
  { name: "Moradabad Brass Union", item: "Brass sheet", lead: "3 days", trust: 4.7, savings: "₹14/kg" },
  { name: "Khurja Clay Suppliers", item: "Terracotta", lead: "1 day", trust: 4.5, savings: "₹30/qtl" },
];

const Mandi = () => {
  const [tab, setTab] = useState<"prices" | "suppliers">("prices");
  return (
    <AppShell title="Mandi · Live Material Prices" hindi="मंडी भाव" subtitle="Compare raw-material prices across India and surface the cheapest verified supplier for every craft.">
      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-card border border-border rounded-full p-1">
          <button onClick={() => setTab("prices")} className={`px-4 py-1.5 text-xs rounded-full ${tab === "prices" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}>Prices</button>
          <button onClick={() => setTab("suppliers")} className={`px-4 py-1.5 text-xs rounded-full ${tab === "suppliers" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}>Suppliers</button>
        </div>
        <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-card"><Filter size={12} /> Cluster: Varanasi</button>
        <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-card"><MapPin size={12} /> Within 800 km</button>
        <button className="ml-auto flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground"><Download size={12} /> Export CSV</button>
      </div>

      {tab === "prices" ? (
        <>
          {/* Hero stat strip */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { l: "Cheapest today", v: "Cotton 40s", d: "₹254/kg · Surat", tone: "forest" },
              { l: "Sharpest spike", v: "Terracotta", d: "+2.6% w/w", tone: "accent" },
              { l: "Best swap", v: "Indigo → Bhuj", d: "Save ₹50/kg", tone: "primary" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border bg-card p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-data">{s.l}</div>
                <div className="font-display text-2xl mt-2">{s.v}</div>
                <div className={`text-xs mt-1 font-data text-${s.tone}`}>{s.d}</div>
              </div>
            ))}
          </div>

          {/* Price table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
              <div>
                <div className="font-display text-xl">Comparative Mandi Sheet</div>
                <div className="text-xs text-muted-foreground font-hindi">तुलनात्मक मंडी भाव — हर बाज़ार, हर हफ़्ते</div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data">updated 06 May · 09:14 IST</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data border-b border-border">
                    <th className="text-left px-5 py-3">Material</th>
                    <th className="text-left px-3 py-3">Unit</th>
                    {markets.map((m) => <th key={m} className="text-right px-3 py-3">{m}</th>)}
                    <th className="text-right px-3 py-3">7d Δ</th>
                    <th className="text-right px-5 py-3">Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const min = Math.min(...r.prices);
                    return (
                      <tr key={r.item} className={`border-b border-border/60 ${i % 2 ? "bg-background-deep/40" : ""}`}>
                        <td className="px-5 py-3.5">
                          <div className="font-medium">{r.item}</div>
                          <div className="text-xs font-hindi text-muted-foreground">{r.hindi}</div>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-muted-foreground font-data">{r.unit}</td>
                        {r.prices.map((p, j) => (
                          <td key={j} className={`px-3 py-3.5 text-right font-data ${p === min ? "text-forest font-semibold" : ""}`}>
                            {p === min && "★ "}₹{p.toLocaleString("en-IN")}
                          </td>
                        ))}
                        <td className={`px-3 py-3.5 text-right font-data ${r.delta < 0 ? "text-forest" : r.delta > 0 ? "text-accent" : "text-muted-foreground"}`}>
                          <span className="inline-flex items-center gap-0.5">
                            {r.delta < 0 ? <ArrowDown size={12} /> : r.delta > 0 ? <ArrowUp size={12} /> : null}
                            {Math.abs(r.delta).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-data ${
                            r.supply === "high" ? "bg-forest/15 text-forest" :
                            r.supply === "tight" ? "bg-accent/15 text-accent" :
                            "bg-muted text-muted-foreground"
                          }`}>{r.supply}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {suppliers.map((s) => (
            <div key={s.name} className="rounded-2xl border border-border bg-card p-6 hover:shadow-paper transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-xl">{s.name}</div>
                  <div className="text-xs text-muted-foreground font-data mt-1">{s.item}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground font-data">trust</div>
                  <div className="font-display text-2xl text-forest">{s.trust}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Lead time</div>
                  <div className="font-data flex items-center gap-1.5 mt-1"><Truck size={14} /> {s.lead}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Savings</div>
                  <div className="font-data text-primary mt-1">{s.savings}</div>
                </div>
              </div>
              <button className="mt-5 w-full text-sm py-2.5 rounded-full bg-secondary text-secondary-foreground hover:bg-foreground transition-colors">
                Request quote · भाव माँगें
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Mandi;
