import { Award, MapPin, Phone, Mail, Globe, Languages, Edit3, Star } from "lucide-react";
import AppShell from "@/components/site/AppShell";
import textileImg from "@/assets/craft-textile.jpg";

const skills = [
  { name: "Banarasi handloom", level: 92 },
  { name: "Natural dyeing", level: 78 },
  { name: "Zari work", level: 85 },
  { name: "Block printing", level: 64 },
];

const milestones = [
  { y: "1998", e: "Started weaving under guru Shyam Lal ji" },
  { y: "2007", e: "First independent loom · Lallapura" },
  { y: "2014", e: "GI tag certification for Banarasi silk" },
  { y: "2021", e: "Joined Karigar Karyashala collective" },
  { y: "2025", e: "Onboarded ArtisanGPS · went pan-India" },
];

const Profile = () => {
  return (
    <AppShell title="My Karigar Card" hindi="कारीगर परिचय" subtitle="A living identity for the artisan — craft, cluster, certifications and conversation.">
      {/* Hero card */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
        <div className="absolute inset-0 opacity-20">
          <img src={textileImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/40" />
        <div className="relative p-8 lg:p-10 grid md:grid-cols-[180px_1fr_auto] gap-8 items-center">
          <div className="w-36 h-36 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-display text-6xl ring-4 ring-background shadow-paper">
            र
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-data">Master Weaver · Varanasi</div>
            <h2 className="font-display text-4xl lg:text-5xl mt-1">Ramesh Prajapati</h2>
            <div className="font-hindi text-xl text-muted-foreground mt-1">रमेश प्रजापति · वाराणसी</div>
            <div className="flex flex-wrap gap-2 mt-4">
              {["Banarasi silk", "Natural dye", "GI certified", "27 yrs"].map((t) => (
                <span key={t} className="text-[11px] uppercase tracking-wider font-data px-3 py-1 rounded-full bg-background border border-border">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="text-sm px-5 py-2.5 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-2"><Edit3 size={14} /> Edit card</button>
            <button className="text-sm px-5 py-2.5 rounded-full border border-border bg-background">Share public link</button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: contact + skills */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="font-display text-lg mb-4">Contact</div>
            <div className="space-y-3 text-sm">
              {[
                { i: MapPin, t: "Lallapura, Varanasi · UP 221002" },
                { i: Phone, t: "+91 98765 43210" },
                { i: Mail, t: "ramesh@artisangps.in" },
                { i: Globe, t: "artisangps.in/r-prajapati" },
                { i: Languages, t: "Hindi · Bhojpuri · little English" },
              ].map((c) => (
                <div key={c.t} className="flex items-center gap-3 text-foreground/85">
                  <c.i size={14} className="text-muted-foreground" /> {c.t}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="font-display text-lg mb-4">Craft skills</div>
            <div className="space-y-4">
              {skills.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>{s.name}</span>
                    <span className="font-data text-muted-foreground">{s.level}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${s.level}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle/right: timeline + ratings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-baseline justify-between mb-6">
              <div className="font-display text-lg">Karigar journey</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-data">since 1998</div>
            </div>
            <div className="relative pl-6">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
              {milestones.map((m, i) => (
                <div key={m.y} className="relative pb-5 last:pb-0">
                  <div className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full ring-4 ring-card ${i === milestones.length - 1 ? "bg-primary" : "bg-secondary"}`} />
                  <div className="font-data text-xs text-muted-foreground">{m.y}</div>
                  <div className="text-sm mt-0.5">{m.e}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Award size={14} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-data">Certifications</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li>· GI tag — Banarasi silk (2014)</li>
                <li>· Handloom Mark · Govt. of India</li>
                <li>· Cluster lead · Karigar Karyashala</li>
                <li>· Fair-trade verified · 2023</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em] font-data">Buyer rating</span>
                <Star size={14} />
              </div>
              <div className="font-display text-5xl">4.9</div>
              <div className="text-xs text-muted-foreground font-data mt-1">across 184 verified reviews</div>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3].map((r, i) => (
                  <div key={r} className="flex items-center gap-2 text-xs font-data">
                    <span className="w-3 text-muted-foreground">{r}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${[88, 9, 3][i]}%` }} />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{[88, 9, 3][i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Profile;
