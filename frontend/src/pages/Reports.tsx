import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Download, FileText, TrendingUp, IndianRupee, Calendar,
  Package2, ShoppingBag, AlertCircle, CheckCircle2, Clock,
  BarChart2, Loader2, Plus, FileSpreadsheet,
} from "lucide-react";
import AppShell from "@/components/site/AppShell";
import {
  getGstSummary, downloadGstSummaryCsv, downloadGstSummaryPdf, getPurchaseHistory, recordPurchase, PurchaseCreatePayload,
  getReportsSummary,
} from "@/lib/api";

/* ─── data ─── */

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

// GSTR-3B is due the 20th of the month following the taxable period, for most small taxpayers.
const nextGstDueDate = (): { label: string; daysAway: number } => {
  const now = new Date();
  let due = new Date(now.getFullYear(), now.getMonth(), 20);
  if (now.getDate() > 20) due = new Date(now.getFullYear(), now.getMonth() + 1, 20);
  const daysAway = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  return { label: due.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), daysAway };
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "categories" | "gst">("overview");
  const [gstPeriod, setGstPeriod] = useState<"this_month" | "last_month">("this_month");
  const [purchaseForm, setPurchaseForm] = useState({ material_name: "", amount: "", gst_rate: "5", purchase_date: new Date().toISOString().slice(0, 10), notes: "" });

  const queryClient = useQueryClient();
  const { from: periodFrom, to: periodTo, label: periodLabel } = getPeriodRange(gstPeriod);

  const { data: reportsData, isLoading: isReportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ["reportsSummary"],
    queryFn: () => getReportsSummary(6),
  });

  const monthly = reportsData?.monthly || [];
  const totalRev = reportsData?.total_revenue || 0;
  const totalProfit = reportsData?.total_profit || 0;
  const totalOrders = reportsData?.total_orders || 0;
  const totalProducts = reportsData?.total_products || 0;
  const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;
  const maxMonthlyValue = Math.max(1, ...monthly.map((m) => Math.max(m.revenue, m.cost)));
  const gstDue = nextGstDueDate();

  const handleDownloadMonthlyPnl = () => {
    if (!monthly.length) return;
    const headers = "Month,Revenue,Cost,Profit,Orders\n";
    const rows = monthly.map((m) => `${m.label} ${m.month.slice(0, 4)},${m.revenue},${m.cost},${m.profit},${m.orders}`).join("\n");
    const blob = new Blob(["﻿" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Monthly-PnL-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Monthly P&L (.csv) downloaded!");
  };

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
          { label: "6-mo revenue", hindi: "कुल आय", value: inr(totalRev), tone: "text-primary", icon: IndianRupee, delta: "from your sales ledger" },
          { label: "6-mo profit", hindi: "कुल मुनाफा", value: inr(totalProfit), tone: "text-forest", icon: TrendingUp, delta: "revenue − logged purchases" },
          { label: "Avg margin", hindi: "औसत मार्जिन", value: `${avgMargin}%`, tone: "text-secondary", icon: BarChart2, delta: totalRev > 0 ? "healthy" : "no sales yet" },
          { label: "Total orders", hindi: "कुल आर्डर", value: String(totalOrders), tone: "text-foreground", icon: ShoppingBag, delta: "6 months" },
          { label: "SKUs tracked", hindi: "उत्पाद", value: String(totalProducts), tone: "text-foreground", icon: Package2, delta: "all products" },
          { label: "Next GST due", hindi: "जीएसटी", value: gstDue.label, tone: "text-accent", icon: Calendar, delta: `${gstDue.daysAway} days` },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] uppercase tracking-[0.18em] font-data leading-tight">{k.label}</span>
              <k.icon size={13} />
            </div>
            <div className={`font-display text-2xl mt-1 ${k.tone}`}>{isReportsLoading && k.label !== "Next GST due" ? "…" : k.value}</div>
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
            {isReportsLoading ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground gap-2">
                <Loader2 size={14} className="animate-spin" /> Loading your sales ledger...
              </div>
            ) : monthly.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground italic">
                No sales recorded yet — record a sale to see your revenue trend here.
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between gap-2 h-52">
                  {monthly.map((m, i) => {
                    const isCurrent = i === monthly.length - 1;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div className="relative w-full flex items-end gap-1 h-44">
                          <div
                            className="flex-1 bg-primary/80 rounded-t-md hover:bg-primary transition-colors cursor-pointer"
                            style={{ height: `${(m.revenue / maxMonthlyValue) * 100}%` }}
                            title={`Revenue: ${inr(m.revenue)}`}
                          />
                          <div
                            className="flex-1 bg-secondary/70 rounded-t-md hover:bg-secondary transition-colors cursor-pointer"
                            style={{ height: `${(m.cost / maxMonthlyValue) * 100}%` }}
                            title={`Cost: ${inr(m.cost)}`}
                          />
                          <div
                            className="flex-1 bg-forest/30 border border-forest/40 rounded-t-md"
                            style={{ height: `${(Math.max(0, m.profit) / maxMonthlyValue) * 100}%` }}
                            title={`Profit: ${inr(m.profit)}`}
                          />
                        </div>
                        <div className={`text-[10px] uppercase tracking-wider font-data ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}`}>{m.label}</div>
                      </div>
                    );
                  })}
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
                      {monthly.map((m, i) => {
                        const margin = m.revenue > 0 ? Math.round((m.profit / m.revenue) * 100) : 0;
                        const isLast = i === monthly.length - 1;
                        return (
                          <tr key={m.month} className={`border-t border-border/50 ${isLast ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                            <td className="py-2">{m.label} {isLast && <span className="text-primary ml-1">← current</span>}</td>
                            <td className="py-2 text-right">{inr(m.revenue)}</td>
                            <td className="py-2 text-right">{inr(m.cost)}</td>
                            <td className="py-2 text-right text-forest">{inr(m.profit)}</td>
                            <td className="py-2 text-right">{m.revenue > 0 ? `${margin}%` : "—"}</td>
                            <td className="py-2 text-right">{m.orders}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Saved reports */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
              <div>
                <div className="font-display text-lg">Saved reports</div>
                <div className="text-xs text-muted-foreground font-hindi">पुरानी रिपोर्ट</div>
              </div>
              <button onClick={() => refetchReports()} className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90">Refresh</button>
            </div>
            <div className="divide-y divide-border flex-1">
              <div className="px-4 py-3 flex items-center gap-3 hover:bg-background-deep/40 transition-colors">
                <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0 bg-secondary/10 text-secondary">
                  <FileText size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">Monthly P&L · last 6 months</div>
                  <div className="text-[10px] font-hindi text-muted-foreground">मासिक लाभ-हानि · वास्तविक डेटा</div>
                </div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted font-data shrink-0">CSV</div>
                <button onClick={handleDownloadMonthlyPnl} disabled={!monthly.length} className="p-1.5 rounded-full hover:bg-muted text-foreground shrink-0 disabled:opacity-40">
                  <Download size={13} />
                </button>
              </div>
              <div className="px-4 py-3 flex items-center gap-3 hover:bg-background-deep/40 transition-colors">
                <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0 bg-secondary/10 text-secondary">
                  <FileText size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">GST summary · this month</div>
                  <div className="text-[10px] font-hindi text-muted-foreground">जीएसटी सहायक · वास्तविक डेटा</div>
                </div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted font-data shrink-0">CSV</div>
                <button onClick={handleDownloadGstCsv} className="p-1.5 rounded-full hover:bg-muted text-foreground shrink-0">
                  <Download size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
            <div>
              <div className="font-display text-xl">Category breakdown · last 6 months</div>
              <div className="text-xs text-muted-foreground font-hindi mt-0.5">श्रेणी-वार बिक्री — वास्तविक डेटा</div>
            </div>
          </div>
          {isReportsLoading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Loading category breakdown...
            </div>
          ) : !reportsData || reportsData.categories.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground italic">
              No sales recorded yet — record a sale to see category performance here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground font-data border-b border-border">
                    <th className="text-left px-5 py-3">Category</th>
                    <th className="text-right px-3 py-3">Units sold</th>
                    <th className="text-right px-5 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.categories.map((c) => {
                    const maxRev = Math.max(...reportsData.categories.map((x) => x.revenue), 1);
                    return (
                      <tr key={c.category} className="border-b border-border/60 last:border-0 hover:bg-background transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium">{c.category}</div>
                          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden max-w-[160px]">
                            <div className="h-full bg-primary/60" style={{ width: `${(c.revenue / maxRev) * 100}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-4 text-right font-data">{c.units}</td>
                        <td className="px-5 py-4 text-right font-data font-semibold">{inr(c.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-secondary/5 border-t border-border font-semibold">
                    <td className="px-5 py-3 text-sm">Total</td>
                    <td className="px-3 py-3 text-right font-data text-sm">
                      {reportsData.categories.reduce((s, c) => s + c.units, 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-data text-sm">
                      {inr(reportsData.categories.reduce((s, c) => s + c.revenue, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
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

      {/* Saved reports (always visible at bottom, outside overview which has its own panel) */}
      {activeTab !== "overview" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
            <div>
              <div className="font-display text-xl">Saved reports</div>
              <div className="text-xs text-muted-foreground font-hindi">पुरानी रिपोर्ट — डाउनलोड करें</div>
            </div>
            <button onClick={() => refetchReports()} className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90">Refresh</button>
          </div>
          <div className="divide-y divide-border">
            <div className="px-5 py-4 flex items-center gap-4 hover:bg-background-deep/40 transition-colors">
              <div className="w-10 h-10 rounded-lg grid place-items-center bg-secondary/10 text-secondary">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">Monthly P&L · last 6 months</div>
                <div className="text-xs text-muted-foreground font-hindi">मासिक लाभ-हानि · वास्तविक डेटा</div>
              </div>
              <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted font-data">CSV</div>
              <button onClick={handleDownloadMonthlyPnl} disabled={!monthly.length} className="p-2 rounded-full hover:bg-muted text-foreground disabled:opacity-40">
                <Download size={14} />
              </button>
            </div>
            <div className="px-5 py-4 flex items-center gap-4 hover:bg-background-deep/40 transition-colors">
              <div className="w-10 h-10 rounded-lg grid place-items-center bg-secondary/10 text-secondary">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">GST summary · this month</div>
                <div className="text-xs text-muted-foreground font-hindi">जीएसटी सहायक · वास्तविक डेटा</div>
              </div>
              <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted font-data">CSV</div>
              <button onClick={handleDownloadGstCsv} className="p-2 rounded-full hover:bg-muted text-foreground">
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Reports;
