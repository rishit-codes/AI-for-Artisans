import { Download, FileText, TrendingUp, IndianRupee, Calendar } from "lucide-react";
import AppShell from "@/components/site/AppShell";

const reports = [
  { name: "Monthly P&L · April", hindi: "मासिक लाभ-हानि", date: "01 May 2026", size: "248 KB", type: "PDF" },
  { name: "GST filing helper · Q4", hindi: "जीएसटी सहायक", date: "12 Apr 2026", size: "112 KB", type: "XLSX" },
  { name: "Mandi sourcing summary", hindi: "मंडी सारांश", date: "28 Apr 2026", size: "84 KB", type: "PDF" },
  { name: "Festival demand forecast", hindi: "त्योहार मांग", date: "20 Apr 2026", size: "196 KB", type: "PDF" },
  { name: "Stock movement · March", hindi: "स्टॉक रिपोर्ट", date: "02 Apr 2026", size: "320 KB", type: "XLSX" },
];

const months = [
  { m: "Dec", rev: 38, cost: 22 },
  { m: "Jan", rev: 42, cost: 24 },
  { m: "Feb", rev: 51, cost: 28 },
  { m: "Mar", rev: 47, cost: 26 },
  { m: "Apr", rev: 58, cost: 31 },
  { m: "May", rev: 64, cost: 33 },
];

const Reports = () => {
  const max = Math.max(...months.map((m) => m.rev));
  return (
    <AppShell title="Reports · रिपोर्ट" hindi="हिसाब-किताब" subtitle="Auto-generated ledgers, GST helpers and sourcing summaries — exportable in one tap.">
      {/* Topline */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <div className="font-display text-xl">Revenue vs cost · 6 months</div>
              <div className="text-xs text-muted-foreground font-hindi">आय बनाम लागत — हज़ार में</div>
            </div>
            <div className="flex gap-3 text-[10px] uppercase tracking-wider font-data text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Cost</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4 h-56">
            {months.map((m) => (
              <div key={m.m} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex items-end gap-1 h-48">
                  <div className="flex-1 bg-primary rounded-t-md" style={{ height: `${(m.rev / max) * 100}%` }} />
                  <div className="flex-1 bg-secondary rounded-t-md" style={{ height: `${(m.cost / max) * 100}%` }} />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">{m.m}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {[
            { i: IndianRupee, l: "Net profit (mo)", v: "₹31,400", d: "+12% vs Apr", tone: "text-forest" },
            { i: TrendingUp, l: "Margin", v: "48.4%", d: "healthy", tone: "text-primary" },
            { i: Calendar, l: "Next GST due", v: "20 May", d: "12 days", tone: "text-accent" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-data">{s.l}</span>
                <s.i size={14} />
              </div>
              <div className="font-display text-2xl">{s.v}</div>
              <div className={`text-xs font-data mt-1 ${s.tone}`}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Exports */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
          <div>
            <div className="font-display text-xl">Saved reports</div>
            <div className="text-xs text-muted-foreground font-hindi">पुरानी रिपोर्ट — डाउनलोड करें</div>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground">+ Generate new</button>
        </div>
        <div className="divide-y divide-border">
          {reports.map((r) => (
            <div key={r.name} className="px-5 py-4 flex items-center gap-4 hover:bg-background-deep/40">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 grid place-items-center text-secondary">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground font-hindi">{r.hindi}</div>
              </div>
              <div className="hidden sm:block text-xs font-data text-muted-foreground">{r.date}</div>
              <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted font-data">{r.type}</div>
              <div className="hidden sm:block text-xs font-data text-muted-foreground w-16 text-right">{r.size}</div>
              <button className="p-2 rounded-full hover:bg-muted text-foreground"><Download size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default Reports;
