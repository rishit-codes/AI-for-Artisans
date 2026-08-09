import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Download, FileText, TrendingUp, IndianRupee, Calendar,
  Package2, ShoppingBag, AlertCircle, CheckCircle2, Clock,
  BarChart2, ArrowUpRight, ArrowDownRight, Loader2, Plus, FileSpreadsheet,
} from "lucide-react";
import AppShell from "@/components/site/AppShell";
import { getGstSummary, downloadGstSummaryCsv, downloadGstSummaryPdf, getPurchaseHistory, recordPurchase, PurchaseCreatePayload } from "@/lib/api";

/* ─── data ─── */

const months = [
  { m: "Dec", rev: 38, cost: 22, orders: 34 },
  { m: "Jan", rev: 42, cost: 24, orders: 41 },
  { m: "Feb", rev: 51, cost: 28, orders: 58 },
  { m: "Mar", rev: 47, cost: 26, orders: 52 },
  { m: "Apr", rev: 58, cost: 31, orders: 67 },
  { m: "May", rev: 64, cost: 33, orders: 74 },
];

const reports = [
  { name: "Monthly P&L · April", hindi: "मासिक लाभ-हानि", date: "01 May 2026", size: "248 KB", type: "PDF", status: "ready" },
  { name: "GST filing helper · Q4", hindi: "जीएसटी सहायक", date: "12 Apr 2026", size: "112 KB", type: "XLSX", status: "ready" },
  { name: "Mandi sourcing summary", hindi: "मंडी सारांश", date: "28 Apr 2026", size: "84 KB", type: "PDF", status: "ready" },
  { name: "Festival demand forecast", hindi: "त्योहार मांग", date: "20 Apr 2026", size: "196 KB", type: "PDF", status: "ready" },
  { name: "Stock movement · March", hindi: "स्टॉक रिपोर्ट", date: "02 Apr 2026", size: "320 KB", type: "XLSX", status: "ready" },
  { name: "May P&L · generating…", hindi: "मई रिपोर्ट", date: "—", size: "—", type: "PDF", status: "pending" },
];

const categories = [
  { name: "Banarasi silk", hindi: "बनारसी रेशम", revenue: 28400, cost: 14200, units: 18, trend: 12 },
  { name: "Indigo dupattas", hindi: "नील दुपट्टा", revenue: 19600, cost: 8900, units: 14, trend: 8 },
  { name: "Brass diya sets", hindi: "पीतल दीया", revenue: 14720, cost: 6100, units: 32, trend: -4 },
  { name: "Terracotta planters", hindi: "मिट्टी गमला", revenue: 9600, cost: 4500, units: 30, trend: 22 },
  { name: "Khurja bowls", hindi: "खुरजा कटोरा", revenue: 7480, cost: 3800, units: 11, trend: -2 },
];

const gstTimeline = [
  { date: "20 Mar", label: "GSTR-3B filed", status: "done" },
  { date: "11 Apr", label: "GSTR-1 filed", status: "done" },
  { date: "20 Apr", label: "GSTR-3B filed", status: "done" },
  { date: "11 May", label: "GSTR-1 due", status: "upcoming" },
  { date: "20 May", label: "GSTR-3B due", status: "upcoming" },
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ─── page ─── */

const getPeriodRange = (period: "this_month" | "last_month"): { from?: string; to?: string; label: string } => {
  const now = new Date();
  if (period === "this_month") {
    return { label: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
  }
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    from: fmt(lastMonthStart),
    to: fmt(lastMonthEnd),
    label: lastMonthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
  };
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "categories" | "gst">("overview");
  const [gstPeriod, setGstPeriod] = useState<"this_month" | "last_month">("this_month");
  const [purchaseForm, setPurchaseForm] = useState({ material_name: "", amount: "", gst_rate: "5", purchase_date: new Date().toISOString().slice(0, 10), notes: "" });
  const max = Math.max(...months.map((m) => m.rev));
  const totalRev = months.reduce((s, m) => s + m.rev, 0) * 1000;
  const totalCost = months.reduce((s, m) => s + m.cost, 0) * 1000;
  const totalProfit = totalRev - totalCost;
  const totalOrders = months.reduce((s, m) => s + m.orders, 0);
  const avgMargin = Math.round(((totalRev - totalCost) / totalRev) * 100);

  const queryClient = useQueryClient();
  const { from: periodFrom, to: periodTo, label: periodLabel } = getPeriodRange(gstPeriod);

  const { data: gstSummary, isLoading: isGstLoading } = useQuery({
    queryKey: ["gstSummary", periodFrom, periodTo],
    queryFn: () => getGstSummary(periodFrom, periodTo),
  });

  const { data: purchases } = useQuery({
    queryKey: ["purchaseHistory", periodFrom, periodTo],
    queryFn: () => getPurchaseHistory(periodFrom, periodTo),
  });

  const purchaseMutation = useMutation({
    mutationFn: (payload: PurchaseCreatePayload) => recordPurchase(payload),
    onSuccess: () => {
      toast.success("Purchase logged — input GST credit updated.");
      queryClient.invalidateQueries({ queryKey: ["gstSummary"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseHistory"] });
      setPurchaseForm({ material_name: "", amount: "", gst_rate: "5", purchase_date: new Date().toISOString().slice(0, 10), notes: "" });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to log purchase."),
  });

  const handleLogPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(purchaseForm.amount);
    if (!purchaseForm.material_name.trim() || !amount || amount <= 0) {
      toast.error("Enter a material name and a valid amount.");
      return;
    }
    purchaseMutation.mutate({
      material_name: purchaseForm.material_name.trim(),
      amount,
      gst_rate: parseFloat(purchaseForm.gst_rate),
      purchase_date: purchaseForm.purchase_date,
      notes: purchaseForm.notes.trim() || undefined,
    });
  };

  const handleDownloadGstCsv = async () => {
    try {
      toast.info("Generating GST summary CSV...");
      await downloadGstSummaryCsv(periodFrom, periodTo);
      toast.success("GST summary (.csv) downloaded!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to download the GST summary CSV.");
    }
  };

  const handleDownloadGstPdf = async () => {
    try {
      toast.info("Generating GST summary PDF...");
      await downloadGstSummaryPdf(periodFrom, periodTo);
      toast.success("GST summary (.pdf) downloaded!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to download the GST summary PDF.");
    }
  };

  return (
    <AppShell
      title="Reports · रिपोर्ट"
      hindi="हिसाब-किताब"
      subtitle="Auto-generated ledgers, GST helpers and sourcing summaries — exportable in one tap."
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "6-mo revenue", hindi: "कुल आय", value: inr(totalRev), tone: "text-primary", icon: IndianRupee, delta: "+14%" },
          { label: "6-mo profit", hindi: "कुल मुनाफा", value: inr(totalProfit), tone: "text-forest", icon: TrendingUp, delta: "+18%" },
          { label: "Avg margin", hindi: "औसत मार्जिन", value: `${avgMargin}%`, tone: "text-secondary", icon: BarChart2, delta: "healthy" },
          { label: "Total orders", hindi: "कुल आर्डर", value: String(totalOrders), tone: "text-foreground", icon: ShoppingBag, delta: "+21%" },
          { label: "SKUs tracked", hindi: "उत्पाद", value: "42", tone: "text-foreground", icon: Package2, delta: "5 low stock" },
          { label: "Next GST due", hindi: "जीएसटी", value: "20 May", tone: "text-accent", icon: Calendar, delta: "7 days" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] uppercase tracking-[0.18em] font-data leading-tight">{k.label}</span>
              <k.icon size={13} />
            </div>
            <div className={`font-display text-2xl mt-1 ${k.tone}`}>{k.value}</div>
            <div className="text-[10px] font-hindi text-muted-foreground">{k.hindi}</div>
            <div className="text-[10px] font-data text-muted-foreground/70 mt-auto">{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-full w-fit">
        {(["overview", "categories", "gst"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-full text-xs font-data capitalize transition-colors ${
              activeTab === t ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t === "gst" ? "GST timeline" : t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Bar chart */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="font-display text-xl">Revenue vs cost · 6 months</div>
                <div className="text-xs text-muted-foreground font-hindi mt-0.5">आय बनाम लागत — हज़ार रुपये में</div>
              </div>
              <div className="flex gap-4 text-[10px] uppercase tracking-wider font-data text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-secondary" /> Cost</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-forest/40 border border-forest" /> Profit</span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-52">
              {months.map((m) => (
                <div key={m.m} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="relative w-full flex items-end gap-1 h-44">
                    <div
                      className="flex-1 bg-primary/80 rounded-t-md hover:bg-primary transition-colors cursor-pointer"
                      style={{ height: `${(m.rev / max) * 100}%` }}
                      title={`Revenue: ₹${m.rev}k`}
                    />
                    <div
                      className="flex-1 bg-secondary/70 rounded-t-md hover:bg-secondary transition-colors cursor-pointer"
                      style={{ height: `${(m.cost / max) * 100}%` }}
                      title={`Cost: ₹${m.cost}k`}
                    />
                    <div
                      className="flex-1 bg-forest/30 border border-forest/40 rounded-t-md"
                      style={{ height: `${((m.rev - m.cost) / max) * 100}%` }}
                      title={`Profit: ₹${m.rev - m.cost}k`}
                    />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">{m.m}</div>
                </div>
              ))}
            </div>

            {/* Monthly breakdown mini-table */}
            <div className="mt-6 border-t border-border pt-4 overflow-x-auto">
              <table className="w-full text-xs font-data">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left pb-2">Month</th>
                    <th className="text-right pb-2">Revenue</th>
                    <th className="text-right pb-2">Cost</th>
                    <th className="text-right pb-2">Profit</th>
                    <th className="text-right pb-2">Margin</th>
                    <th className="text-right pb-2">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, i) => {
                    const profit = m.rev - m.cost;
                    const margin = Math.round((profit / m.rev) * 100);
                    const isLast = i === months.length - 1;
                    return (
                      <tr key={m.m} className={`border-t border-border/50 ${isLast ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        <td className="py-2">{m.m} {isLast && <span className="text-primary ml-1">← current</span>}</td>
                        <td className="py-2 text-right">₹{m.rev}k</td>
                        <td className="py-2 text-right">₹{m.cost}k</td>
                        <td className="py-2 text-right text-forest">₹{profit}k</td>
                        <td className="py-2 text-right">{margin}%</td>
                        <td className="py-2 text-right">{m.orders}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Saved reports */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
              <div>
                <div className="font-display text-lg">Saved reports</div>
                <div className="text-xs text-muted-foreground font-hindi">पुरानी रिपोर्ट</div>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90">+ Generate</button>
            </div>
            <div className="divide-y divide-border flex-1">
              {reports.map((r) => (
                <div key={r.name} className="px-4 py-3 flex items-center gap-3 hover:bg-background-deep/40 transition-colors">
                  <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${
                    r.status === "pending" ? "bg-muted text-muted-foreground" : "bg-secondary/10 text-secondary"
                  }`}>
                    {r.status === "pending" ? <Clock size={15} /> : <FileText size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{r.name}</div>
                    <div className="text-[10px] font-hindi text-muted-foreground">{r.hindi} · {r.date}</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted font-data shrink-0">{r.type}</div>
                  {r.status === "ready" ? (
                    <button className="p-1.5 rounded-full hover:bg-muted text-foreground shrink-0">
                      <Download size={13} />
                    </button>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
            <div>
              <div className="font-display text-xl">Category P&L breakdown</div>
              <div className="text-xs text-muted-foreground font-hindi mt-0.5">श्रेणी-वार लाभ-हानि — मई 2026</div>
            </div>
            <button className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted flex items-center gap-1.5">
              <Download size={12} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground font-data border-b border-border">
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-right px-3 py-3">Units sold</th>
                  <th className="text-right px-3 py-3">Revenue</th>
                  <th className="text-right px-3 py-3">Cost</th>
                  <th className="text-right px-3 py-3">Gross profit</th>
                  <th className="text-right px-3 py-3">Margin</th>
                  <th className="text-right px-5 py-3">Trend</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const profit = c.revenue - c.cost;
                  const margin = Math.round((profit / c.revenue) * 100);
                  const maxRev = Math.max(...categories.map((x) => x.revenue));
                  return (
                    <tr key={c.name} className="border-b border-border/60 last:border-0 hover:bg-background transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs font-hindi text-muted-foreground">{c.hindi}</div>
                        <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden max-w-[120px]">
                          <div className="h-full bg-primary/60" style={{ width: `${(c.revenue / maxRev) * 100}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right font-data">{c.units}</td>
                      <td className="px-3 py-4 text-right font-data">{inr(c.revenue)}</td>
                      <td className="px-3 py-4 text-right font-data text-muted-foreground">{inr(c.cost)}</td>
                      <td className="px-3 py-4 text-right font-data text-forest font-semibold">{inr(profit)}</td>
                      <td className="px-3 py-4 text-right font-data">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          margin >= 50 ? "bg-forest/15 text-forest" : margin >= 40 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {margin}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex items-center gap-0.5 text-xs font-data font-semibold ${
                          c.trend > 0 ? "text-forest" : "text-destructive"
                        }`}>
                          {c.trend > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {Math.abs(c.trend)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-secondary/5 border-t border-border font-semibold">
                  <td className="px-5 py-3 text-sm">Total</td>
                  <td className="px-3 py-3 text-right font-data text-sm">
                    {categories.reduce((s, c) => s + c.units, 0)}
                  </td>
                  <td className="px-3 py-3 text-right font-data text-sm">
                    {inr(categories.reduce((s, c) => s + c.revenue, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-data text-sm text-muted-foreground">
                    {inr(categories.reduce((s, c) => s + c.cost, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-data text-sm text-forest">
                    {inr(categories.reduce((s, c) => s + c.revenue - c.cost, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-data text-sm" colSpan={2}>
                    {Math.round(
                      (categories.reduce((s, c) => s + (c.revenue - c.cost), 0) /
                        categories.reduce((s, c) => s + c.revenue, 0)) * 100
                    )}% blended
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeTab === "gst" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="font-display text-xl mb-1">GST compliance timeline</div>
            <div className="text-xs font-hindi text-muted-foreground mb-6">जीएसटी अनुपालन — Q1 2026</div>
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
              {gstTimeline.map((g, i) => (
                <div key={i} className="relative pb-5 last:pb-0 flex items-start gap-4">
                  <div className={`absolute -left-[18px] top-0.5 w-3.5 h-3.5 rounded-full ring-4 ring-card flex items-center justify-center ${
                    g.status === "done" ? "bg-forest" : "bg-primary"
                  }`}>
                    {g.status === "done"
                      ? <CheckCircle2 size={8} className="text-white" />
                      : <Clock size={8} className="text-primary-foreground" />}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-data text-muted-foreground">{g.date}</div>
                    <div className="text-sm mt-0.5">{g.label}</div>
                    <div className={`text-[10px] mt-0.5 font-data font-semibold ${
                      g.status === "done" ? "text-forest" : "text-primary"
                    }`}>
                      {g.status === "done" ? "Completed ✓" : "Upcoming"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-baseline justify-between mb-1 gap-3 flex-wrap">
                <div className="font-display text-xl">GST summary · {periodLabel}</div>
                <div className="flex bg-muted rounded-full p-0.5">
                  {(["this_month", "last_month"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setGstPeriod(p)}
                      className={`px-3 py-1 rounded-full text-[10px] font-data uppercase tracking-wider transition-colors ${
                        gstPeriod === p ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {p === "this_month" ? "This month" : "Last month"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs font-hindi text-muted-foreground mb-5">कर योग्य बिक्री और जीएसटी सारांश</div>

              {isGstLoading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Calculating from your sales ledger...
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {[
                      { l: "Taxable sales", v: inr(gstSummary?.taxable_value || 0), sub: `${gstSummary?.sale_count || 0} sale(s) this period` },
                      { l: "Output GST (collected)", v: inr(gstSummary?.output_gst || 0), sub: "Per-category GST rate on sales" },
                      { l: "Input GST (paid on materials)", v: inr(gstSummary?.input_gst || 0), sub: `${gstSummary?.purchase_count || 0} purchase(s) logged — eligible for credit` },
                      { l: "Net GST payable", v: inr(gstSummary?.net_payable || 0), sub: "After input tax credit offset", accent: true },
                    ].map((r) => (
                      <div key={r.l} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <div className="text-sm">{r.l}</div>
                          <div className="text-[10px] text-muted-foreground font-data mt-0.5">{r.sub}</div>
                        </div>
                        <div className={`font-data text-lg font-semibold ${(r as any).accent ? "text-primary" : ""}`}>
                          {r.v}
                        </div>
                      </div>
                    ))}
                  </div>

                  {gstSummary && gstSummary.category_breakdown.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data mb-2">Category-wise output GST</div>
                      <div className="space-y-1.5">
                        {gstSummary.category_breakdown.map((c) => (
                          <div key={c.category} className="flex items-center justify-between text-xs font-data">
                            <span className="text-muted-foreground">{c.category} · {c.gst_rate}%</span>
                            <span>{inr(c.output_gst)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium">Download your GST summary</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    A single-page summary for {periodLabel} — net payable <strong>{inr(gstSummary?.net_payable || 0)}</strong>. Use it as a
                    reference alongside your CA or the GST portal; it's not a substitute for an official filing.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleDownloadGstCsv}
                  className="text-xs px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={12} /> Download CSV
                </button>
                <button
                  onClick={handleDownloadGstPdf}
                  className="text-xs px-4 py-1.5 rounded-full border border-primary/40 bg-background hover:bg-muted flex items-center gap-1.5"
                >
                  <FileText size={12} /> Download PDF
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-lg mb-1">Log a material purchase</div>
              <div className="text-xs text-muted-foreground mb-4">Raw material purchases feed your input GST tax credit above.</div>
              <form onSubmit={handleLogPurchase} className="grid grid-cols-2 gap-3">
                <input
                  value={purchaseForm.material_name}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, material_name: e.target.value }))}
                  placeholder="Material (e.g. Raw silk yarn)"
                  className="col-span-2 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchaseForm.amount}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="Amount (₹)"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
                />
                <select
                  value={purchaseForm.gst_rate}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, gst_rate: e.target.value }))}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
                >
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
                <input
                  type="date"
                  value={purchaseForm.purchase_date}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, purchase_date: e.target.value }))}
                  className="col-span-2 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
                />
                <button
                  type="submit"
                  disabled={purchaseMutation.isPending}
                  className="col-span-2 text-xs px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {purchaseMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Log purchase
                </button>
              </form>

              {purchases && purchases.length > 0 && (
                <ul className="mt-4 divide-y divide-border text-xs max-h-40 overflow-y-auto">
                  {purchases.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2">
                      <div>
                        <div>{p.material_name}</div>
                        <div className="text-[10px] text-muted-foreground font-data">{p.purchase_date}</div>
                      </div>
                      <span className="font-data text-muted-foreground">{inr(p.amount)} · {p.gst_rate}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved reports (always visible at bottom in overview) */}
      {activeTab !== "overview" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
            <div>
              <div className="font-display text-xl">Saved reports</div>
              <div className="text-xs text-muted-foreground font-hindi">पुरानी रिपोर्ट — डाउनलोड करें</div>
            </div>
            <button className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90">+ Generate new</button>
          </div>
          <div className="divide-y divide-border">
            {reports.map((r) => (
              <div key={r.name} className="px-5 py-4 flex items-center gap-4 hover:bg-background-deep/40 transition-colors">
                <div className={`w-10 h-10 rounded-lg grid place-items-center ${
                  r.status === "pending" ? "bg-muted text-muted-foreground" : "bg-secondary/10 text-secondary"
                }`}>
                  {r.status === "pending" ? <Clock size={16} /> : <FileText size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground font-hindi">{r.hindi}</div>
                </div>
                <div className="hidden sm:block text-xs font-data text-muted-foreground">{r.date}</div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted font-data">{r.type}</div>
                <div className="hidden sm:block text-xs font-data text-muted-foreground w-16 text-right">{r.size}</div>
                {r.status === "ready" ? (
                  <button className="p-2 rounded-full hover:bg-muted text-foreground"><Download size={14} /></button>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Reports;
