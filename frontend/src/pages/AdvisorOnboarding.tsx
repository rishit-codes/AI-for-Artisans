import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import AppShell from "@/components/site/AppShell";
import { CLUSTERS } from "@/data/advisorRecommendations";
import { AdvisorProfile, Goal, Skill, useAdvisor } from "@/hooks/use-advisor";
import { toast } from "sonner";

const SKILLS: { id: Skill; label: string; hindi: string; desc: string }[] = [
  { id: "beginner", label: "Beginner", hindi: "नया कारीगर", desc: "Just starting out · 0–2 years" },
  { id: "intermediate", label: "Intermediate", hindi: "मँझा हुआ", desc: "Comfortable · 3–8 years" },
  { id: "established", label: "Established", hindi: "स्थापित", desc: "Master · 9+ years, regular orders" },
];

const GOALS: { id: Goal; label: string; hindi: string }[] = [
  { id: "income", label: "Income stability", hindi: "स्थिर आय" },
  { id: "festival", label: "Festival push", hindi: "त्यौहार" },
  { id: "export", label: "Export ready", hindi: "निर्यात" },
  { id: "learning", label: "Learning the market", hindi: "सीखना" },
];

const AdvisorOnboarding = () => {
  const navigate = useNavigate();
  const { setProfile, profile } = useAdvisor();
  const [step, setStep] = useState(0);

  const [draft, setDraft] = useState<Partial<AdvisorProfile>>(profile ?? {
    cluster: undefined, skill: "beginner", equipment: 1, yearsPracticing: 1, capacity: 20, goal: "income",
  });

  const cluster = CLUSTERS.find((c) => c.id === draft.cluster);

  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    if (!draft.cluster || !draft.skill || !draft.goal) return;
    setProfile({
      cluster: draft.cluster,
      skill: draft.skill,
      equipment: draft.equipment ?? 1,
      yearsPracticing: draft.yearsPracticing ?? 1,
      capacity: draft.capacity ?? 20,
      goal: draft.goal,
    });
    toast.success("Your first plan is ready");
    navigate("/advisor");
  };

  const canAdvance = step === 0 ? !!draft.cluster : step === 1 ? !!draft.skill && (draft.equipment ?? 0) > 0 : !!draft.goal && (draft.capacity ?? 0) > 0;

  return (
    <AppShell
      title="Set up your Advisor"
      hindi="शुरुआत करें"
      subtitle="Three quick steps. We'll tailor every batch recommendation to your craft, capacity and goals."
    >
      <div className="max-w-3xl mx-auto w-full">
        {/* Stepper */}
        <div className="flex items-center gap-3 mb-6">
          {["Cluster & craft", "Skill & setup", "Capacity & goal"].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-data border ${i <= step ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"}`}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <div className={`text-xs ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{label}</div>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 lg:p-8 min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex-1">
                <Header icon={<Compass size={16} />} title="Which cluster do you belong to?" hindi="आपका क्लस्टर" />
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  {CLUSTERS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setDraft({ ...draft, cluster: c.id })}
                      className={`text-left rounded-xl border p-4 transition ${draft.cluster === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="font-display text-lg leading-tight">{c.label}</div>
                      <div className="text-xs text-muted-foreground font-hindi mt-0.5">{c.hindi}</div>
                      <div className="text-xs text-muted-foreground mt-2">{c.craft}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex-1">
                <Header title="Skill & setup" hindi="कौशल और साधन" />
                <div className="space-y-3 mt-5">
                  {SKILLS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setDraft({ ...draft, skill: s.id })}
                      className={`w-full text-left rounded-xl border p-4 transition flex items-start gap-3 ${draft.skill === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mt-1 ${draft.skill === s.id ? "border-primary bg-primary" : "border-border"}`} />
                      <div>
                        <div className="font-display text-base">{s.label} <span className="text-xs text-muted-foreground font-hindi ml-2">{s.hindi}</span></div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-data">Number of {cluster?.equipment ?? "tools"}</label>
                    <Input
                      type="number" min={1} max={50}
                      value={draft.equipment ?? 1}
                      onChange={(e) => setDraft({ ...draft, equipment: parseInt(e.target.value || "1", 10) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-data">Years practicing · <span className="text-foreground">{draft.yearsPracticing}</span></label>
                    <Slider
                      value={[draft.yearsPracticing ?? 1]}
                      min={0} max={40} step={1}
                      onValueChange={(v) => setDraft({ ...draft, yearsPracticing: v[0] })}
                      className="mt-4"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex-1">
                <Header icon={<Sparkles size={16} />} title="Capacity & goal" hindi="क्षमता और लक्ष्य" />
                <div className="mt-5">
                  <div className="flex items-baseline justify-between">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-data">I can make</label>
                    <span className="font-display text-2xl">{draft.capacity} <span className="text-sm text-muted-foreground">units / week</span></span>
                  </div>
                  <Slider
                    value={[draft.capacity ?? 20]} min={4} max={120} step={2}
                    onValueChange={(v) => setDraft({ ...draft, capacity: v[0] })}
                    className="mt-4"
                  />
                </div>
                <div className="mt-6">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-data mb-3">Primary goal</div>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setDraft({ ...draft, goal: g.id })}
                        className={`px-4 py-2 rounded-full border text-sm transition ${draft.goal === g.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}
                      >
                        {g.label} <span className="font-hindi text-xs opacity-70 ml-1">{g.hindi}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-border">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="ghost" onClick={back}><ArrowLeft size={14} className="mr-1" /> Back</Button>
              )}
              {profile && (
                <Link to="/advisor" className="text-xs text-muted-foreground hover:text-foreground">Skip — keep current plan</Link>
              )}
            </div>
            {step < 2 ? (
              <Button onClick={next} disabled={!canAdvance}>Next <ArrowRight size={14} className="ml-1" /></Button>
            ) : (
              <Button onClick={finish} disabled={!canAdvance}>Generate my first plan <Sparkles size={14} className="ml-1" /></Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const Header = ({ icon, title, hindi }: { icon?: React.ReactNode; title: string; hindi: string }) => (
  <div>
    <div className="flex items-baseline gap-3 flex-wrap">
      <h2 className="font-display text-2xl lg:text-3xl tracking-tight inline-flex items-center gap-2">{icon}{title}</h2>
      <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-data">{hindi}</span>
    </div>
  </div>
);

export default AdvisorOnboarding;
