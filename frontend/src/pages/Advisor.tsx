import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Calendar as CalendarIcon, Check, ChevronDown,
  Package2, Plus, Settings2, Share2, Sparkles, TrendingUp,
} from "lucide-react";
import AppShell from "@/components/site/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useAdvisor } from "@/hooks/use-advisor";
import { useQuery } from "@tanstack/react-query";
import { getAdvisorFeed, type AdvisorFeedNode, type AdvisorRecommendation } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const Advisor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    profile, capacity, setCapacityOverride, recommendations, materials, recentPace,
    isRecommendationsLoading, plan, addToPlan, removeFromPlan, clearProfile,
  } = useAdvisor();
  const [expanded, setExpanded] = useState<string | null>(null);

  const craftType = (user?.craft_type as string) || "textile";

  const { data: feedData, isLoading: isFeedLoading } = useQuery({
    queryKey: ["advisorFeed", craftType],
    queryFn: async (): Promise<AdvisorFeedNode[]> => {
      if (!profile) return [];
      return getAdvisorFeed(craftType);
    },
    enabled: !!profile,
  });

  useEffect(() => {
    if (!profile) navigate("/advisor/onboarding", { replace: true });
  }, [profile, navigate]);

  const planSummary = useMemo(() => {
    const units = plan.reduce((s, i) => s + i.quantity, 0);
    const revenue = plan.reduce((s, i) => s + i.quantity * i.unit_revenue, 0);
    const cost = plan.reduce((s, i) => s + i.quantity * (i.unit_cost ?? 0), 0);
    const margin = revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0;
    return { units, revenue, cost, margin };
  }, [plan]);

  const overcommit = capacity > 0 && planSummary.units > capacity * 4;

  const nextFestival = recommendations.find((r) => r.festival)?.festival;
  const nextFestivalDays = recommendations.find((r) => r.festival)?.festival_days_away;
  const risingMaterials = materials.filter((m) => m.trend === "up");

  if (!profile) return null;

  return (
    <AppShell
      title="Production Advisor"
      hindi="उत्पादन सलाहकार"
      subtitle="What to make, how much, and when — tuned to your craft, capacity and the festival calendar."
    >
      {/* Context strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card/40 p-4 lg:p-5 flex flex-wrap items-center gap-2 lg:gap-4"
      >
        <Chip label={craftType} className="capitalize" />
        <Chip label={profile.skill} className="capitalize" />
        <Chip label={`${profile.equipment} tools/looms`} />
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
              {recentPace && recentPace.weeks_of_history > 0 && (
                <div className="text-xs text-muted-foreground font-data">Your recent pace: {recentPace.avg_units_per_week} u/w</div>
              )}
            </div>
            <Slider
              defaultValue={[capacity]}
              min={4} max={120} step={2}
              onValueChange={(v) => setCapacityOverride(v[0])}
              className="mt-5"
            />
            <p className="text-xs text-muted-foreground mt-3">
              Adjust to rescale suggested batch sizes across your recommendations.
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
              ) : feedData && feedData.length > 0 ? (
                feedData.map((node, i) => (
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
                        {node.pills?.map((p, idx) => (
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
            <SectionHeader title="This week's batches" hindi="इस सप्ताह की बुनाई" subtitle="Top picks from your own listed products, ranked by real festival proximity and forecasted demand." />
            {isRecommendationsLoading ? (
              <div className="flex items-center justify-center py-10 bg-card/40 rounded-2xl border border-border mt-4">
                <Loader2 className="animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground font-data">Building your recommendations...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-sm text-muted-foreground p-5 rounded-2xl border border-border bg-card/40 mt-4">
                No listed products yet — <Link to="/profile" className="text-primary hover:underline">add a product</Link> to get personalized batch recommendations.
              </div>
            ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              <AnimatePresence>
                {recommendations.slice(0, 3).map((rec, i) => {
                  const inPlan = !!plan.find((p) => p.product_id === rec.product_id);
                  const isOpen = expanded === rec.product_id;
                  const margin = rec.unit_cost != null
                    ? Math.round(((rec.unit_revenue - rec.unit_cost) / rec.unit_revenue) * 100)
                    : null;
                  return (
                    <motion.div
                      key={rec.product_id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-secondary/30 overflow-hidden shrink-0 grid place-items-center">
                          {rec.image_url ? (
                            <img src={rec.image_url} alt={rec.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <Package2 size={18} className="text-secondary-foreground/60" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-lg leading-tight">{rec.product_name}</div>
                          {rec.material && <div className="text-xs text-muted-foreground">{rec.material}</div>}
                        </div>
                        {rec.festival && <Badge variant="secondary" className="font-data text-[10px]">{rec.festival}</Badge>}
                      </div>

                      <div className="flex items-end justify-between gap-3 pt-1">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Suggested batch</div>
                          <div className="font-display text-3xl leading-none mt-1">{rec.suggested_batch}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">units</div>
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
                        <Stat label="Cost/unit" value={rec.unit_cost != null ? inr(rec.unit_cost) : "Not logged"} />
                        <Stat label="Revenue/unit" value={inr(rec.unit_revenue)} />
                        <Stat label="Margin" value={margin != null ? `${margin}%` : "—"} />
                      </div>

                      <button
                        onClick={() => setExpanded(isOpen ? null : rec.product_id)}
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
                            if (inPlan) {
                              const item = plan.find((p) => p.product_id === rec.product_id);
                              if (item) { removeFromPlan(item.id); toast("Removed from plan"); }
                            } else {
                              addToPlan(rec); toast.success(`${rec.product_name} added to plan`);
                            }
                          }}
                        >
                          {inPlan ? <><Check size={14} className="mr-1" /> In plan</> : <><Plus size={14} className="mr-1" /> Add to plan</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toast.info("Sharing isn't available yet.")}>
                          <Share2 size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            )}
          </section>

          {/* Calendar */}
          <section>
            <SectionHeader title="4-week production calendar" hindi="चार सप्ताह की योजना" subtitle="Batches you've added, scheduled across the next month." icon={<CalendarIcon size={14} />} />
            <div className="rounded-2xl border border-border bg-card/40 p-4 mt-4">
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((week) => {
                  const items = plan.filter((i) => i.week === week);
                  return (
                    <div key={week} className="rounded-xl border border-border bg-background p-3 min-h-[140px] flex flex-col">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Week {week}</div>
                      <div className="text-xs text-muted-foreground mb-2">{items.length} batch{items.length !== 1 ? "es" : ""}</div>
                      <div className="space-y-2 flex-1">
                        {items.length === 0 && (
                          <div className="text-xs text-muted-foreground/60 italic">Open</div>
                        )}
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            whileHover={{ y: -2 }}
                            className="rounded-lg bg-secondary/20 border border-secondary/30 p-2 text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate">{item.product_name}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground font-data">
                              <span>{item.quantity} units</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {plan.length === 0 && (
                <p className="text-xs text-muted-foreground mt-3">Add batches above to populate your monthly plan.</p>
              )}
            </div>
          </section>

          {/* Materials list */}
          <section>
            <SectionHeader title="Raw materials for your craft" hindi="कच्चा माल" subtitle="Live mandi prices for the materials most relevant to your craft." icon={<Package2 size={14} />} />
            <div className="rounded-2xl border border-border bg-card/40 mt-4 overflow-hidden">
              {materials.length === 0 ? (
                <p className="text-sm text-muted-foreground p-5">No mandi price data available for your craft yet — check the <Link to="/mandi" className="text-primary hover:underline">Mandi page</Link>.</p>
              ) : (
                <>
                  <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-data border-b border-border">
                    <div className="col-span-5">Material</div>
                    <div className="col-span-3">Best mandi</div>
                    <div className="col-span-2 text-right">Trend</div>
                    <div className="col-span-2 text-right">Action</div>
                  </div>
                  {materials.map((m, idx) => {
                    const bestCity = m.local_best ? `Local (${m.local_price})` : m.surat_best ? `Surat (${m.surat_price})` : m.delhi_best ? `Delhi (${m.delhi_price})` : "—";
                    return (
                      <div key={idx} className="grid grid-cols-12 px-5 py-3 text-sm border-b border-border last:border-b-0">
                        <div className="col-span-5">{m.commodity}</div>
                        <div className="col-span-3"><Link to="/mandi" className="text-primary hover:underline">{bestCity}</Link></div>
                        <div className="col-span-2 text-right font-data capitalize">{m.trend || "—"}</div>
                        <div className="col-span-2 text-right font-data">{m.action || "—"}</div>
                      </div>
                    );
                  })}
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
              <SummaryRow label="Est. margin" value={planSummary.cost > 0 ? `${planSummary.margin}%` : "—"} />
            </div>
            {nextFestival && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data mb-2">Next festival</div>
                <Badge variant="outline" className="font-data text-[10px]">{nextFestival} · {nextFestivalDays}d away</Badge>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <span className="font-display text-base">Your recent pace</span>
            </div>
            {recentPace && recentPace.weeks_of_history > 0 ? (
              <>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on your own sales over the last {recentPace.weeks_of_history} weeks
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="rounded-lg bg-background p-3 border border-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Units / week</div>
                    <div className="font-display text-2xl mt-1">{recentPace.avg_units_per_week}</div>
                  </div>
                  <div className="rounded-lg bg-background p-3 border border-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Revenue / mo</div>
                    <div className="font-display text-2xl mt-1">{inr(recentPace.avg_revenue_per_month)}</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">Log a few sales in Reports to see your own pace here.</p>
            )}
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
              {risingMaterials.map((m) => (
                <RiskItem key={m.commodity} tone="primary" text={`${m.commodity} is trending up — buy raw stock now if you use it.`} />
              ))}
              {nextFestival && nextFestivalDays != null && (
                <RiskItem tone="muted" text={`${nextFestival} demand window closes in ${nextFestivalDays} days.`} />
              )}
              {!overcommit && risingMaterials.length === 0 && !nextFestival && (
                <RiskItem tone="muted" text="No risk flags right now." />
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
