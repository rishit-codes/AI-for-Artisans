import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMandiArbitrage, getMandiScrapingLogs, triggerMandiScrape, calculateArbitrage, ArbitrageCalcResult, exportCSVApi, downloadSourcingSheetCsvApi, downloadSourcingSheetPdfApi } from "@/lib/api";
import { ArrowDown, ArrowUp, MapPin, Truck, Filter, Download, RefreshCw, Terminal, CheckCircle2, Calculator, FileText, Sparkles, AlertCircle, FileSpreadsheet } from "lucide-react";
import AppShell from "@/components/site/AppShell";
import { toast } from "sonner";

const defaultMarkets = ["Local · वाराणसी", "Surat", "Delhi", "Jaipur", "Mumbai"];

// Artisan clusters mapped to their nearest of the 5 tracked wholesale mandi hubs.
const CLUSTERS = [
  { id: "varanasi", label: "Varanasi", hindi: "वाराणसी", city: "Varanasi", hub: null },
  { id: "jaipur-sanganer", label: "Jaipur / Sanganer", hindi: "जयपुर · सांगानेर", city: "Jaipur", hub: null },
  { id: "khurja", label: "Khurja", hindi: "खुर्जा", city: "Delhi", hub: "Delhi" },
  { id: "moradabad", label: "Moradabad", hindi: "मुरादाबाद", city: "Delhi", hub: "Delhi" },
] as const;

// 7-day price trend sparkline — minimal inline SVG, no charting library needed
const Sparkline = ({ points }: { points: number[] }) => {
  if (!points || points.length < 2) {
    return <span className="text-[10px] text-muted-foreground/60">—</span>;
  }
  const width = 64;
  const height = 22;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * height).toFixed(1)}`);
  const trendUp = points[points.length - 1] >= points[0];
  const color = trendUp ? "#ef4444" : "#10b981"; // rising cost = red, falling cost = green (good for buyers)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block align-middle">
      <polyline points={coords.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// Cross-browser local file download helper
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const Mandi = () => {
  const [tab, setTab] = useState<"prices" | "calculator" | "suppliers" | "audit">("prices");

  // Cluster filter — drives which mandi city is "Local" across the Prices & Calculator tabs
  const [clusterId, setClusterId] = useState<(typeof CLUSTERS)[number]["id"]>("varanasi");
  const activeCluster = CLUSTERS.find((c) => c.id === clusterId) ?? CLUSTERS[0];

  // Calculator Form State
  const [calcMaterial, setCalcMaterial] = useState<string>("Cotton yarn (40s)");
  const [calcQuantity, setCalcQuantity] = useState<number>(50);
  const [calcDestination, setCalcDestination] = useState<string>("Varanasi");
  const [showOrderSheetModal, setShowOrderSheetModal] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const handleClusterChange = (id: (typeof CLUSTERS)[number]["id"]) => {
    setClusterId(id);
    const next = CLUSTERS.find((c) => c.id === id);
    if (next) {
      setCalcDestination(next.city);
      toast.success(`Cluster set to ${next.label}${next.hub ? ` (via ${next.hub} hub)` : ""}`);
    }
  };

  // 1. Live 5-City Arbitrage Query — recalculates "local" rates for the selected cluster
  const { data: arbitrageData, isLoading: isArbitrageLoading } = useQuery({
    queryKey: ["mandiArbitrage", activeCluster.city],
    queryFn: () => getMandiArbitrage(activeCluster.city),
  });

  // 2. Audit Logs Query
  const { data: auditLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ["mandiScrapingLogs"],
    queryFn: () => getMandiScrapingLogs(50),
    refetchInterval: 10000,
  });

  // 3. Calculator Query
  const { data: calcResult, isLoading: isCalcLoading } = useQuery({
    queryKey: ["arbitrageCalculation", calcMaterial, calcQuantity, calcDestination],
    queryFn: () => calculateArbitrage({ commodity_name: calcMaterial, quantity: calcQuantity, destination_city: calcDestination }),
    enabled: tab === "calculator" || showOrderSheetModal,
  });

  // 4. Manual Scrape Trigger Mutation
  const scrapeMutation = useMutation({
    mutationFn: triggerMandiScrape,
    onSuccess: (res) => {
      toast.success(`Scraped ${res.scraped_cities?.length || 5} mandis! Added ${res.log_count || 40} audit logs.`);
      queryClient.invalidateQueries({ queryKey: ["mandiArbitrage"] });
      queryClient.invalidateQueries({ queryKey: ["mandiScrapingLogs"] });
      queryClient.invalidateQueries({ queryKey: ["arbitrageCalculation"] });
    },
    onError: (err: Error) => {
      toast.error(`Scraping error: ${err.message}`);
    }
  });

  const markets = arbitrageData?.markets || defaultMarkets;
  const displayRows = arbitrageData?.rows || [];
  const suppliers = arbitrageData?.suppliers || [];

  // Export 5-City Arbitrage CSV to User's Local File System
  const exportCSV = async () => {
    try {
      toast.info("Downloading CSV file...");
      await exportCSVApi();
      toast.success("CSV file downloaded to your system!");
    } catch {
      // Client-side fallback
      if (!displayRows || displayRows.length === 0) {
        toast.error("No mandi data available to export.");
        return;
      }
      const headers = "Material,Hindi Name,Unit,Varanasi (Local),Surat,Delhi,Jaipur,Mumbai,Arbitrage Savings,Supply Status\n";
      const csvRows = displayRows.map(r => 
        `"${r.item}","${r.hindi}","${r.unit}",${r.prices.join(",")},"${r.arbitrage_savings}","${r.supply}"`
      ).join("\n");
      const filename = `mandi-arbitrage-prices-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadFile("\uFEFF" + headers + csvRows, filename, "text/csv;charset=utf-8;");
      toast.success(`Downloaded ${filename}!`);
    }
  };

  // Download Official Sourcing Order Sheet as CSV
  const handleDownloadSourcingSheetCsv = async () => {
    if (!calcMaterial) {
      toast.error("Calculate sourcing values first.");
      return;
    }
    try {
      toast.info("Generating Sourcing Order Sheet CSV...");
      await downloadSourcingSheetCsvApi({
        commodity_name: calcMaterial,
        quantity: calcQuantity,
        destination_city: calcDestination
      });
      toast.success("Sourcing Order Sheet (.csv) downloaded to your system!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download the sourcing sheet CSV.");
    }
  };

  // Download Official Sourcing Order Sheet as PDF
  const handleDownloadSourcingSheetPdf = async () => {
    if (!calcMaterial) {
      toast.error("Calculate sourcing values first.");
      return;
    }
    try {
      toast.info("Generating Sourcing Order Sheet PDF...");
      await downloadSourcingSheetPdfApi({
        commodity_name: calcMaterial,
        quantity: calcQuantity,
        destination_city: calcDestination
      });
      toast.success("Sourcing Order Sheet (.pdf) downloaded to your system!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download the sourcing sheet PDF.");
    }
  };


  return (
    <AppShell title="Mandi · Live Material Prices" hindi="मंडी भाव" subtitle="Compare raw-material prices across India, run bulk quantity arbitrage calculations, and download sourcing sheets.">
      {/* Navigation & Controls Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-card border border-border rounded-full p-1 shadow-sm">
          <button 
            onClick={() => setTab("prices")} 
            className={`px-4 py-1.5 text-xs rounded-full transition-all ${tab === "prices" ? "bg-secondary text-secondary-foreground font-medium shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            Prices · तुलना
          </button>
          <button 
            onClick={() => setTab("calculator")} 
            className={`px-4 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 ${tab === "calculator" ? "bg-secondary text-secondary-foreground font-medium shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Calculator size={13} className="text-primary" /> Calculator · बचत कैलकुलेटर
          </button>
          <button 
            onClick={() => setTab("suppliers")} 
            className={`px-4 py-1.5 text-xs rounded-full transition-all ${tab === "suppliers" ? "bg-secondary text-secondary-foreground font-medium shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            Suppliers · आपूर्तिकर्ता
          </button>
          <button 
            onClick={() => setTab("audit")} 
            className={`px-4 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 ${tab === "audit" ? "bg-secondary text-secondary-foreground font-medium shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Terminal size={12} /> Audit Logs · सिस्टम लॉग
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border border-border hover:bg-card cursor-pointer">
          <Filter size={12} />
          <select
            value={clusterId}
            onChange={(e) => handleClusterChange(e.target.value as (typeof CLUSTERS)[number]["id"])}
            className="bg-transparent outline-none cursor-pointer"
          >
            {CLUSTERS.map((c) => (
              <option key={c.id} value={c.id}>
                Cluster: {c.label}{c.hub ? ` (via ${c.hub})` : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => scrapeMutation.mutate()}
          disabled={scrapeMutation.isPending}
          className="flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={scrapeMutation.isPending ? "animate-spin" : ""} />
          {scrapeMutation.isPending ? "Scraping Mandis..." : "Run Mandi Scraper"}
        </button>

        {/* Export CSV Button (Downloads to local system) */}
        <button
          onClick={exportCSV}
          className="ml-auto flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* Tab 1: Live Comparative Price Matrix */}
      {tab === "prices" ? (
        <>
          {/* Hero stat strip */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { l: "Cheapest Mandi Today", v: displayRows[0]?.item || "Cotton 40s", d: `${displayRows[0]?.lowest_mandi || "Surat"} · ${displayRows[0]?.arbitrage_savings || "Lowest Rate"}`, tone: "text-emerald-500" },
              { l: "Max Arbitrage Margin", v: displayRows[1]?.item || "Indigo Dye", d: displayRows[1]?.arbitrage_savings || "Save ₹50/kg", tone: "text-amber-500" },
              { l: "Audit Verified Mandis", v: "5 Major Hubs", d: "Surat, Delhi, Jaipur, Varanasi, Mumbai", tone: "text-primary" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-data">{s.l}</div>
                <div className="font-display text-2xl mt-2">{s.v}</div>
                <div className={`text-xs mt-1 font-data ${s.tone}`}>{s.d}</div>
              </div>
            ))}
          </div>

          {/* Price table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
              <div>
                <div className="font-display text-xl">5-City Comparative Mandi Arbitrage Matrix</div>
                <div className="text-xs text-muted-foreground font-hindi">5 प्रमुख भारतीय मंडियों में कच्चे माल का रीयल-टाइम तुलनात्मक भाव</div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Live Agmarknet Sync · 5 Cities
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3">Material / सामग्री</th>
                    <th className="text-left px-3 py-3">Unit</th>
                    {markets.map((m) => <th key={m} className="text-right px-3 py-3">{m}</th>)}
                    <th className="text-right px-3 py-3">7-Day Trend</th>
                    <th className="text-right px-3 py-3">Arbitrage Savings</th>
                    <th className="text-right px-5 py-3">Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {isArbitrageLoading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-muted-foreground font-data">Loading 5-city mandi comparative matrix...</td>
                    </tr>
                  ) : displayRows.map((r, i) => {
                    const min = Math.min(...r.prices);
                    return (
                      <tr key={r.item} className={`border-b border-border/60 ${i % 2 ? "bg-background-deep/40" : ""}`}>
                        <td className="px-5 py-3.5">
                          <div className="font-medium">{r.item}</div>
                          <div className="text-xs font-hindi text-muted-foreground">{r.hindi}</div>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-muted-foreground font-data">{r.unit}</td>
                        {r.prices.map((p, j) => (
                          <td key={j} className={`px-3 py-3.5 text-right font-data ${p === min ? "text-emerald-500 font-semibold bg-emerald-500/10" : ""}`}>
                            {p === min && "★ "}₹{p.toLocaleString("en-IN")}
                          </td>
                        ))}
                        <td className="px-3 py-3.5 text-right">
                          <Sparkline points={r.sparkline} />
                        </td>
                        <td className="px-3 py-3.5 text-right font-data text-emerald-500 font-medium">
                          {r.arbitrage_savings}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-data ${
                            r.supply === "high" ? "bg-emerald-500/15 text-emerald-500" :
                            r.supply === "tight" ? "bg-amber-500/15 text-amber-500" :
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
      ) : tab === "calculator" ? (
        /* Tab 2: Interactive Arbitrage Quantity Calculator & Sourcing Sheet Generator */
        <div className="space-y-6">
          {/* Controls & Input Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
              <div>
                <div className="font-display text-2xl flex items-center gap-2">
                  <Calculator className="text-primary" size={22} />
                  Bulk Quantity Arbitrage & Freight Calculator
                </div>
                <div className="text-xs text-muted-foreground font-hindi mt-0.5">
                  मात्रा (Quantity) के आधार पर 5 मंडियों का फ्रेट शुल्क और शुद्ध बचत कैलकुलेटर
                </div>
              </div>
              <button
                onClick={() => setShowOrderSheetModal(true)}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
              >
                <FileText size={14} /> Generate Sourcing Sheet · पर्चा बनाएँ
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Material Dropdown */}
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-data font-semibold block mb-2">
                  Select Raw Material / सामग्री चुनें
                </label>
                <select
                  value={calcMaterial}
                  onChange={(e) => setCalcMaterial(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                >
                  {displayRows.length > 0 ? (
                    displayRows.map((r) => (
                      <option key={r.item} value={r.item}>
                        {r.item} ({r.hindi})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Cotton yarn (40s)">Cotton yarn (40s)</option>
                      <option value="Natural indigo dye">Natural indigo dye</option>
                      <option value="Banarasi silk">Banarasi silk</option>
                      <option value="Brass sheet">Brass sheet</option>
                      <option value="Terracotta clay">Terracotta clay</option>
                      <option value="Lac base">Lac base</option>
                      <option value="Zari thread (gold)">Zari thread (gold)</option>
                      <option value="Madhubani paper">Madhubani paper</option>
                    </>
                  )}
                </select>
              </div>

              {/* Quantity Input & Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-data font-semibold">
                    Required Quantity / मात्रा ({calcResult?.unit || "units"})
                  </label>
                  <span className="text-xs font-data font-bold text-primary">{calcQuantity} {calcResult?.unit || "units"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-20 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-data font-bold text-center"
                  />
                </div>
              </div>

              {/* Destination Cluster Selector */}
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-data font-semibold block mb-2">
                  Destination Cluster / डिलीवरी क्लस्टर
                </label>
                <select
                  value={calcDestination}
                  onChange={(e) => setCalcDestination(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                >
                  <option value="Varanasi">Varanasi Cluster (Banarasi Weaving)</option>
                  <option value="Jaipur">Jaipur / Sanganer Cluster (Block Print)</option>
                  <option value="Delhi">Khurja / Moradabad Cluster (via Delhi Hub)</option>
                  <option value="Surat">Surat Textile Hub</option>
                  <option value="Mumbai">Mumbai Craft Export Hub</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Comparison Grid */}
          {isCalcLoading ? (
            <div className="text-center py-12 text-muted-foreground font-data">Calculating delivered costs and transport surcharges across mandis...</div>
          ) : calcResult ? (
            <>
              {/* Stat Summary Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Local {calcResult.local_city} Procurement</div>
                  <div className="font-display text-2xl mt-1.5 text-foreground">₹{calcResult.local_total_cost.toLocaleString("en-IN")}</div>
                  <div className="text-xs text-muted-foreground font-data mt-1">₹{calcResult.local_unit_price} / unit · Zero Freight</div>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-data font-semibold flex items-center gap-1">
                    <Sparkles size={12} /> Best Delivered Sourcing Hub
                  </div>
                  <div className="font-display text-2xl mt-1.5 text-emerald-700 font-bold">
                    ₹{calcResult.recommended_total_delivered_cost.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-emerald-600 font-data mt-1">
                    {calcResult.recommended_mandi} Hub · Delivered (Includes ₹{calcResult.freight_cost} Freight)
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                  <div className="text-[10px] uppercase tracking-wider text-amber-600 font-data font-semibold">
                    Net Delivered Savings
                  </div>
                  <div className="font-display text-2xl mt-1.5 text-amber-700 font-bold">
                    Save ₹{calcResult.net_savings.toLocaleString("en-IN")} (-{calcResult.net_savings_pct}%)
                  </div>
                  <div className="text-xs text-amber-600 font-data mt-1">
                    {calcResult.net_savings > 0 ? "Lower than local procurement costs!" : "Local procurement is most cost-effective."}
                  </div>
                </div>
              </div>

              {/* Delivered Cost Breakdown Matrix */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="font-display text-xl">5-City Delivered Cost Breakdown ({calcResult.quantity} {calcResult.unit})</div>
                    <div className="text-xs text-muted-foreground font-hindi">कच्चा माल लागत + फ्रेट डिलीवरी शुल्क = कुल डिलीवरी लागत</div>
                  </div>
                  <div className="text-xs font-data text-primary font-medium">
                    Best Sourcing Option: {calcResult.recommended_mandi}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data border-b border-border bg-muted/30">
                        <th className="text-left px-5 py-3">Mandi City</th>
                        <th className="text-right px-4 py-3">Wholesale Rate</th>
                        <th className="text-right px-4 py-3">Raw Material Total</th>
                        <th className="text-right px-4 py-3">Estimated Freight</th>
                        <th className="text-right px-4 py-3">Total Delivered Cost</th>
                        <th className="text-right px-4 py-3">Lead Time</th>
                        <th className="text-right px-5 py-3">Net Savings vs Local</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calcResult.breakdown.map((b, i) => (
                        <tr key={b.mandi_city} className={`border-b border-border/50 ${b.is_best ? "bg-emerald-500/10 font-medium" : i % 2 ? "bg-background-deep/40" : ""}`}>
                          <td className="px-5 py-3.5 flex items-center gap-2 font-semibold">
                            {b.is_best && <span className="text-emerald-500 font-bold">★</span>}
                            {b.mandi_city} {b.mandi_city === calcResult.local_city && "(Local Hub)"}
                          </td>
                          <td className="px-4 py-3.5 text-right font-data">₹{b.unit_price} {calcResult.unit}</td>
                          <td className="px-4 py-3.5 text-right font-data text-muted-foreground">₹{b.raw_material_cost.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3.5 text-right font-data text-muted-foreground">
                            {b.freight_cost > 0 ? `+₹${b.freight_cost}` : "Free / Local"}
                          </td>
                          <td className={`px-4 py-3.5 text-right font-data font-bold ${b.is_best ? "text-emerald-600 text-base" : ""}`}>
                            ₹{b.total_delivered_cost.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3.5 text-right text-xs font-data text-muted-foreground flex items-center justify-end gap-1">
                            <Truck size={12} /> {b.lead_time}
                          </td>
                          <td className="px-5 py-3.5 text-right font-data">
                            {b.savings_vs_local > 0 ? (
                              <span className="text-emerald-600 font-semibold">+Save ₹{b.savings_vs_local.toLocaleString("en-IN")}</span>
                            ) : b.savings_vs_local === 0 ? (
                              <span className="text-muted-foreground">— Local Rate</span>
                            ) : (
                              <span className="text-amber-600">+₹{Math.abs(b.savings_vs_local).toLocaleString("en-IN")} higher</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : tab === "suppliers" ? (
        <div className="grid md:grid-cols-2 gap-5">
          {suppliers.map((s) => (
            <div key={s.name + s.item} className="rounded-2xl border border-border bg-card p-6 hover:shadow-paper transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-xl">{s.name}</div>
                  <div className="text-xs text-muted-foreground font-data mt-1">{s.item} · {s.mandi} Hub</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground font-data">trust rating</div>
                  <div className="font-display text-2xl text-emerald-500">{s.trust}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Lead time</div>
                  <div className="font-data flex items-center gap-1.5 mt-1"><Truck size={14} /> {s.lead}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Arbitrage Advantage</div>
                  <div className="font-data text-emerald-500 font-semibold mt-1">{s.savings}</div>
                </div>
              </div>
              <button
                onClick={() => toast.info("Direct supplier quotes aren't available yet.")}
                className="mt-5 w-full text-sm py-2.5 rounded-full bg-secondary text-secondary-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                Request quote · भाव माँगें
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Tab 4: Audit Logs */
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="font-display text-xl flex items-center gap-2">
                <Terminal size={18} className="text-primary" />
                Mandi Commodity Scraping Audit Log Ledger (`mandi_scraping_logs`)
              </div>
              <div className="text-xs text-muted-foreground font-hindi">
                प्रत्येक मंडी स्क्रैपिंग अनुरोध, लेटेंसी (ms) और डेटा स्रोत का पूर्ण ऑडिट रिकॉर्ड
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">
              showing last {auditLogs?.length || 0} telemetry logs
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-data">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3">Log UUID</th>
                  <th className="text-left px-4 py-3">Mandi Market</th>
                  <th className="text-left px-4 py-3">Commodity</th>
                  <th className="text-right px-4 py-3">Scraped Rate</th>
                  <th className="text-right px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Latency (ms)</th>
                  <th className="text-right px-4 py-3">Scraped Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {isLogsLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground font-data">Loading audit log entries...</td>
                  </tr>
                ) : auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log, i) => (
                    <tr key={log.id} className={`border-b border-border/50 ${i % 2 ? "bg-background-deep/40" : ""}`}>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{log.log_id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{log.mandi_city}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.commodity_name}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-500">₹{log.price_per_unit} {log.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status_code === 200 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                          HTTP {log.status_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{log.response_time_ms.toFixed(1)} ms</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {log.scraped_at ? new Date(log.scraped_at).toLocaleString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground font-data">No audit logs found. Click "Run Mandi Scraper" above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sourcing Order Sheet Preview & Download Modal */}
      {showOrderSheetModal && calcResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <div className="font-display text-2xl flex items-center gap-2">
                  <FileText className="text-primary" size={24} />
                  Verified Co-op Sourcing Order Sheet
                </div>
                <div className="text-xs text-muted-foreground font-hindi">कारीगर मंडी खरीद पर्चा — रिकॉर्ड और आपूर्तिकर्ता हेतु</div>
              </div>
              <button 
                onClick={() => setShowOrderSheetModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm px-3 py-1 rounded-full border border-border"
              >
                ✕ Close
              </button>
            </div>

            {/* Printable & Downloadable Content Box */}
            <div id="printable-sourcing-sheet" className="bg-background border border-border/80 rounded-2xl p-6 space-y-4 font-data text-sm">
              <div className="flex justify-between items-start pb-4 border-b border-border">
                <div>
                  <div className="font-display text-xl text-primary font-bold">ArtisanGPS · कारीगर खाता</div>
                  <div className="text-xs text-muted-foreground">Mandi Bulk Procurement Advisory Note</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold">Date: {new Date().toLocaleDateString("en-IN")}</div>
                  <div className="text-muted-foreground">Ref ID: AG-MANDI-{Math.floor(100000 + Math.random() * 900000)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground uppercase text-[10px]">Destination Hub</div>
                  <div className="font-bold text-foreground text-sm">{calcResult.local_city} Artisan Cluster</div>
                </div>
                <div>
                  <div className="text-muted-foreground uppercase text-[10px]">Recommended Sourcing Mandi</div>
                  <div className="font-bold text-emerald-600 text-sm">{calcResult.recommended_mandi} Wholesale Co-op</div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-[10px] uppercase border-b border-border">
                    <tr>
                      <th className="p-2.5 text-left">Commodity</th>
                      <th className="p-2.5 text-right">Quantity</th>
                      <th className="p-2.5 text-right">Mandi Rate</th>
                      <th className="p-2.5 text-right">Freight Cost</th>
                      <th className="p-2.5 text-right">Delivered Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/40">
                      <td className="p-2.5 font-bold">{calcResult.commodity_name} ({calcResult.hindi_name})</td>
                      <td className="p-2.5 text-right">{calcResult.quantity} {calcResult.unit}</td>
                      <td className="p-2.5 text-right">₹{calcResult.recommended_delivered_unit_price} / unit</td>
                      <td className="p-2.5 text-right">₹{calcResult.freight_cost}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-600">₹{calcResult.recommended_total_delivered_cost.toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-700">Estimated Arbitrage Net Savings vs Local Procurement:</span>
                <span className="font-bold text-amber-700 text-sm">Save ₹{calcResult.net_savings.toLocaleString("en-IN")} (-{calcResult.net_savings_pct}%)</span>
              </div>
            </div>

            {/* Modal Footer Actions: CSV & PDF Downloads */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleDownloadSourcingSheetCsv}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
              >
                <FileSpreadsheet size={14} /> Download CSV
              </button>

              <button
                onClick={handleDownloadSourcingSheetPdf}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-full border border-border hover:bg-card transition-colors font-medium"
              >
                <FileText size={14} /> Download PDF
              </button>

              <button
                onClick={() => setShowOrderSheetModal(false)}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Mandi;
