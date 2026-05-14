import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Calendar as CalendarIcon, Check, ChevronDown, Compass,
  IndianRupee, Package2, Plus, Settings2, Share2, Sparkles, TrendingUp, X,
} from "lucide-react";
import AppShell from "@/components/site/AppShell";
import { useAdvisor } from "@/hooks/use-advisor";
import { CLUSTERS, CLUSTER_BENCHMARKS, RECOMMENDATIONS } from "@/data/advisorRecommendations";
import { useQuery } from "@tanstack/react-query";
import { getAdvisorFeed } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const Advisor = () => {
  const navigate = useNavigate();
  const { profile, capacity, setCapacityOverride, recommendations, plan, addToPlan, removeFromPlan, clearProfile } = useAdvisor();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: feedData, isLoading: isFeedLoading } = useQuery({
    queryKey: ["advisorFeed", profile?.cluster],
    queryFn: () => profile ? getAdvisorFeed(profile.cluster) : Promise.resolve([]),
    enabled: !!profile,
  });

  useEffect(() => {
    if (!profile) navigate("/advisor/onboarding", { replace: true });
  }, [profile, navigate]);

  const cluster = profile ? CLUSTERS.find((c) => c.id === profile.cluster)! : null;
  const benchmark = profile ? CLUSTER_BENCHMARKS[profile.cluster] : null;

  const planSummary = useMemo(() => {
    const items = plan.map((p) => {
      const rec = RECOMMENDATIONS.find((r) => r.id === p.recId)!;
      return { ...p, rec };
    });
    const units = items.reduce((s, i) => s + i.quantity, 0);
    const revenue = items.reduce((s, i) => s + i.quantity * i.rec.unitRevenue, 0);
    const cost = items.reduce((s, i) => s + i.quantity * i.rec.unitMaterialCost, 0);
    const margin = revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0;
    const festivals = Array.from(new Set(items.map((i) => i.rec.festival)));
    return { items, units, revenue, cost, margin, festivals };
  }, [plan]);

  const overcommit = capacity > 0 && planSummary.units > capacity * 4;

  const materialsList = useMemo(() => {
    const map = new Map<string, { name: string; mandi: string; unit: string; quantity: number; cost: number }>();
    planSummary.items.forEach(({ rec, quantity }) => {
      rec.materials.forEach((m) => {
        const key = `${m.name}@${m.mandi}`;
        const prev = map.get(key) ?? { name: m.name, mandi: m.mandi, unit: m.unit, quantity: 0, cost: 0 };
        prev.quantity += m.perUnit * quantity;
        prev.cost += m.perUnit * quantity * m.pricePerUnit;
        map.set(key, prev);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
  }, [planSummary]);

  const materialsTotal = materialsList.reduce((s, m) => s + m.cost, 0);

  if (!profile || !cluster || !benchmark) return null;

  return (
    <AppShell
      title="Production Advisor"
      hindi="उत्पादन सलाहकार"
      subtitle="What to make, how much, and when — tuned to your cluster, capacity and the festival calendar."
    >
      {/* Context strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card/40 p-4 lg:p-5 flex flex-wrap items-center gap-2 lg:gap-4"
      >
        <Chip icon={<Compass size={13} />} label={cluster.label} hindi={cluster.hindi} />
        <Chip label={cluster.craft} />
        <Chip label={profile.skill} className="capitalize" />
        <Chip label={`${profile.equipment} ${cluster.equipment}`} />
        <Chip label={`${capacity} units / week`} />
        <Chip label={profile.goal} className="capitalize" />
        <Link to="/advisor/onboarding" className="ml-auto text-xs font-data text-primary hover:underline inline-flex items-center gap-1">
          <Settings2 size={13} /> Edit setup
        </Link>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {/* Capacity dial */}
          <section className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-data">Weekly capacity</div>
                <div className="font-display text-2xl mt-1">{capacity} units / week</div>
              </div>
              <div className="text-xs text-muted-foreground font-data">Cluster avg: {benchmark.avgUnitsPerWeek} u/w</div>
            </div>
            <Slider
              defaultValue={[capacity]}
              min={4} max={120} step={2}
              onValueChange={(v) => setCapacityOverride(v[0])}
              className="mt-5"
            />
            <p className="text-xs text-muted-foreground mt-3">
              Adjust to rescale every recommendation, materials list, and your monthly plan in real time.
            </p>
          </section>

          {/* AI Dynamic Feed */}
          <section>
            <SectionHeader title="Live AI Advisor Feed" hindi="सीधा सुझाव" subtitle="Dynamic timeline based on weather, market trends, and festival proximity." icon={<Sparkles size={14} className="text-primary" />} />
            <div className="mt-4 space-y-4">
              {isFeedLoading ? (
                <div className="flex items-center justify-center py-10 bg-card/40 rounded-2xl border border-border">
                  <Loader2 className="animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground font-data">Generating live feed...</span>
                </div>
              ) : feedData && (feedData as any[]).length > 0 ? (
                (feedData as any[]).map((node, i) => (
                  <div key={i} className="relative pl-6 pb-6 last:pb-0 border-l border-border ml-2">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">{node.timeLabel}</div>
                        {node.badge && (
                          <Badge variant="secondary" className="font-data text-[10px] uppercase">{node.badge.label}</Badge>
                        )}
                      </div>
                      <h4 className="font-display text-lg">{node.title}</h4>
                      <p className="text-sm text-foreground/80 mt-1">{node.description}</p>
                      
                      {node.aiAdvice && (
                        <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                          {node.aiAdvice}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {node.pills?.map((p: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="font-data text-[10px] bg-background">
                            {p.label}
                          </Badge>
                        ))}
                        {node.estimatedTime && (
                          <Badge variant="outline" className="font-data text-[10px] bg-background text-muted-foreground">⏱ {node.estimatedTime}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground p-5 rounded-2xl border border-border bg-card/40">No feed available.</div>
              )}
            </div>
          </section>

          {/* Recommendations */}
          <section>
            <SectionHeader title="This week's batches" hindi="इस सप्ताह की बुनाई" subtitle="Top 3 picks for your cluster, festival proximity and capacity." />
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              <AnimatePresence>
                {recommendations.slice(0, 3).map((rec, i) => {
                  const inPlan = !!plan.find((p) => p.recId === rec.id);
                  const isOpen = expanded === rec.id;
                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-secondary/30 grid place-items-center text-2xl">{rec.thumb}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-lg leading-tight">{rec.product}</div>
                          <div className="text-xs text-muted-foreground font-hindi">{rec.hindi}</div>
                        </div>
                        <Badge variant="secondary" className="font-data text-[10px]">{rec.festival}</Badge>
                      </div>

                      <div className="flex items-end justify-between gap-3 pt-1">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Suggested batch</div>
                          <div className="font-display text-3xl leading-none mt-1">{rec.baseBatch}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">units · {rec.leadDays}d lead</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Confidence</div>
                          <div className="font-data text-lg mt-1">{rec.confidence}%</div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${rec.confidence}%` }} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] font-data">
                        <Stat label="Cost/unit" value={inr(rec.unitMaterialCost)} />
                        <Stat label="Revenue/unit" value={inr(rec.unitRevenue)} />
                        <Stat label="Margin" value={`${Math.round(((rec.unitRevenue - rec.unitMaterialCost) / rec.unitRevenue) * 100)}%`} />
                      </div>

                      <button
                        onClick={() => setExpanded(isOpen ? null : rec.id)}
                        className="text-xs text-primary inline-flex items-center gap-1 hover:underline self-start"
                      >
                        Why this? <ChevronDown size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="text-xs text-muted-foreground overflow-hidden"
                          >
                            {rec.rationale}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center gap-2 mt-auto pt-2">
                        <Button
                          size="sm"
                          variant={inPlan ? "secondary" : "default"}
                          className="flex-1"
                          onClick={() => {
                            if (inPlan) { removeFromPlan(rec.id); toast("Removed from plan"); }
                            else { addToPlan(rec.id); toast.success(`${rec.product} added to plan`); }
                          }}
                        >
                          {inPlan ? <><Check size={14} className="mr-1" /> In plan</> : <><Plus size={14} className="mr-1" /> Add to plan</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toast("Shared with cluster")}>
                          <Share2 size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>

          {/* Calendar */}
          <section>
            <SectionHeader title="4-week production calendar" hindi="चार सप्ताह की योजना" subtitle="Batches you've added, scheduled across the next month." icon={<CalendarIcon size={14} />} />
            <div className="rounded-2xl border border-border bg-card/40 p-4 mt-4">
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((week) => {
                  const items = planSummary.items.filter((i) => i.week === week);
                  return (
                    <div key={week} className="rounded-xl border border-border bg-background p-3 min-h-[140px] flex flex-col">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Week {week}</div>
                      <div className="text-xs text-muted-foreground mb-2">{items.length} batch{items.length !== 1 ? "es" : ""}</div>
                      <div className="space-y-2 flex-1">
                        {items.length === 0 && (
                          <div className="text-xs text-muted-foreground/60 italic">Open</div>
                        )}
                        {items.map(({ rec, quantity, recId }) => (
                          <motion.div
                            key={recId}
                            whileHover={{ y: -2 }}
                            className="rounded-lg bg-secondary/20 border border-secondary/30 p-2 text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{rec.thumb}</span>
                              <span className="font-medium truncate">{rec.product}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground font-data">
                              <span>{quantity} units</span>
                              <span>{rec.festival}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {planSummary.items.length === 0 && (
                <p className="text-xs text-muted-foreground mt-3">Add batches above to populate your monthly plan.</p>
              )}
            </div>
          </section>

          {/* Materials list */}
          <section>
            <SectionHeader title="Materials shopping list" hindi="कच्चा माल सूची" subtitle="Aggregated across every batch in your plan, grouped by mandi." icon={<Package2 size={14} />} />
            <div className="rounded-2xl border border-border bg-card/40 mt-4 overflow-hidden">
              {materialsList.length === 0 ? (
                <p className="text-sm text-muted-foreground p-5">Your shopping list will appear once you add batches to the plan.</p>
              ) : (
                <>
                  <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-data border-b border-border">
                    <div className="col-span-5">Material</div>
                    <div className="col-span-3">Mandi</div>
                    <div className="col-span-2 text-right">Quantity</div>
                    <div className="col-span-2 text-right">Est. cost</div>
                  </div>
                  {materialsList.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-12 px-5 py-3 text-sm border-b border-border last:border-b-0">
                      <div className="col-span-5">{m.name}</div>
                      <div className="col-span-3"><Link to="/mandi" className="text-primary hover:underline">{m.mandi}</Link></div>
                      <div className="col-span-2 text-right font-data">{m.quantity.toFixed(2)} {m.unit}</div>
                      <div className="col-span-2 text-right font-data">{inr(Math.round(m.cost))}</div>
                    </div>
                  ))}
                  <div className="grid grid-cols-12 px-5 py-3 bg-secondary/10 text-sm font-medium">
                    <div className="col-span-10">Total estimated material spend</div>
                    <div className="col-span-2 text-right font-data">{inr(Math.round(materialsTotal))}</div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <span className="font-display text-base">Plan summary</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground font-data">Month</span>
            </div>
            <div className="mt-4 space-y-3">
              <SummaryRow label="Units planned" value={`${planSummary.units}`} />
              <SummaryRow label="Est. revenue" value={inr(planSummary.revenue)} accent />
              <SummaryRow label="Est. margin" value={`${planSummary.margin}%`} />
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data mb-2">Festival coverage</div>
              <div className="flex flex-wrap gap-1.5">
                {planSummary.festivals.length === 0 && <span className="text-xs text-muted-foreground italic">No batches yet</span>}
                {planSummary.festivals.map((f) => (
                  <Badge key={f} variant="outline" className="font-data text-[10px]">{f}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <span className="font-display text-base">Cluster benchmark</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Artisans in <span className="text-foreground font-medium">{cluster.label}</span> are averaging
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-lg bg-background p-3 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Units / week</div>
                <div className="font-display text-2xl mt-1">{benchmark.avgUnitsPerWeek}</div>
              </div>
              <div className="rounded-lg bg-background p-3 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Revenue / mo</div>
                <div className="font-display text-2xl mt-1">{inr(benchmark.avgRevenue)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-destructive" />
              <span className="font-display text-base">Risk flags</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs">
              {overcommit && (
                <RiskItem tone="destructive" text={`Plan exceeds 4-week capacity by ${planSummary.units - capacity * 4} units. Trim a batch or raise capacity.`} />
              )}
              <RiskItem tone="primary" text="Surat cotton +6.4% expected next 2 weeks — buy raw stock now if cotton-based." />
              <RiskItem tone="muted" text="Diwali demand window closes T-19 days. Brass diya queries will cool after." />
              {!overcommit && planSummary.items.length > 0 && (
                <RiskItem tone="muted" text="No capacity conflicts detected." />
              )}
            </ul>
          </div>

          <button
            onClick={() => { clearProfile(); navigate("/advisor/onboarding"); }}
            className="w-full text-xs text-muted-foreground hover:text-destructive font-data text-left px-1"
          >
            Reset advisor profile
          </button>
        </aside>
      </div>
    </AppShell>
  );
};

const Chip = ({ icon, label, hindi, className = "" }: { icon?: React.ReactNode; label: string; hindi?: string; className?: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-border text-xs font-data ${className}`}>
    {icon}
    <span>{label}</span>
    {hindi && <span className="font-hindi text-muted-foreground">· {hindi}</span>}
  </span>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 px-2 py-1.5">
    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-foreground">{value}</div>
  </div>
);

const SectionHeader = ({ title, hindi, subtitle, icon }: { title: string; hindi: string; subtitle: string; icon?: React.ReactNode }) => (
  <div>
    <div className="flex items-baseline gap-3 flex-wrap">
      <h2 className="font-display text-2xl lg:text-3xl tracking-tight inline-flex items-center gap-2">
        {icon}{title}
      </h2>
      <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-data">{hindi}</span>
    </div>
    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
  </div>
);

const SummaryRow = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex items-baseline justify-between">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`font-data ${accent ? "font-display text-2xl text-foreground" : "text-base"}`}>{value}</span>
  </div>
);

const RiskItem = ({ tone, text }: { tone: "destructive" | "primary" | "muted"; text: string }) => {
  const dot = tone === "destructive" ? "bg-destructive" : tone === "primary" ? "bg-primary" : "bg-muted-foreground/50";
  return (
    <li className="flex gap-2 text-muted-foreground">
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      <span>{text}</span>
    </li>
  );
};

export default Advisor;
