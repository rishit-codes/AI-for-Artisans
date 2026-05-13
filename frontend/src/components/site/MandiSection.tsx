import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import potteryImg from "@/assets/craft-pottery.jpg";

type Row = {
  item: string;
  hindi: string;
  unit: string;
  local: number;
  surat: number;
  delhi: number;
  delta: number; // %
};

const rows: Row[] = [
  { item: "Cotton yarn (40s)", hindi: "सूती धागा", unit: "₹/kg", local: 268, surat: 254, delhi: 261, delta: -4.2 },
  { item: "Natural indigo dye", hindi: "नील रंग", unit: "₹/kg", local: 1840, surat: 1790, delhi: 1860, delta: 1.8 },
  { item: "Banarasi silk", hindi: "बनारसी रेशम", unit: "₹/m", local: 2840, surat: 2900, delhi: 2810, delta: 0 },
  { item: "Brass sheet", hindi: "पीतल चादर", unit: "₹/kg", local: 612, surat: 598, delhi: 605, delta: -1.1 },
  { item: "Terracotta clay", hindi: "गीली मिट्टी", unit: "₹/qtl", local: 480, surat: 510, delhi: 495, delta: 2.6 },
];

const MandiSection = () => {
  return (
    <section id="mandi" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-28">
          <div className="text-xs uppercase tracking-[0.22em] text-primary font-data">· Mandi Watch ·</div>
          <h2 className="mt-4 font-display text-5xl tracking-tight">
            The phone calls<br />
            <span className="italic text-secondary">that don't happen anymore.</span>
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Local. Surat. Delhi. Three columns, updated four times a day, with a
            sparkline so you can see whether yesterday lied. This is the page our
            users open second — right after the greeting.
          </p>

          <div className="mt-8 rounded-2xl overflow-hidden border border-border">
            <img src={potteryImg} loading="lazy" width={1024} height={1024} alt="Potter's hands" className="w-full h-56 object-cover" />
            <div className="p-4 bg-card">
              <div className="font-display text-lg">Khurja cluster</div>
              <div className="text-xs text-muted-foreground">142 active artisans · clay −2.6% this week</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-border-strong bg-card overflow-hidden"
               style={{ boxShadow: "var(--shadow-paper)" }}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-display text-xl">Today · 6 May 2026</div>
                <div className="text-xs text-muted-foreground font-data">last sync 04:18 am IST</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-forest font-data">
                <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
                live
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
                  {rows.map((r) => (
                    <tr key={r.item} className="border-b border-border/60 last:border-0 hover:bg-background transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-medium">{r.item}</div>
                        <div className="font-hindi text-xs text-muted-foreground">{r.hindi} · {r.unit}</div>
                      </td>
                      <td className="py-4 px-3 text-right font-data">₹{r.local.toLocaleString()}</td>
                      <td className="py-4 px-3 text-right font-data text-muted-foreground">₹{r.surat.toLocaleString()}</td>
                      <td className="py-4 px-3 text-right font-data text-muted-foreground">₹{r.delhi.toLocaleString()}</td>
                      <td className="py-4 px-5 text-right">
                        <Delta v={r.delta} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 bg-background-deep border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground font-data">
              <span>Sparklines from 90-day SARIMA forecast · MAPE 7.2%</span>
              <span className="text-forest">↓ Buy cotton this week — predicted floor</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Delta = ({ v }: { v: number }) => {
  if (v === 0)
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground font-data">
        <Minus size={12} /> 0.0%
      </span>
    );
  const up = v > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 font-data ${
        up ? "text-destructive" : "text-forest"
      }`}
    >
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
};

export default MandiSection;
