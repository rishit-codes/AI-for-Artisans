import { useState } from "react";
import { Bell, Globe, Lock, Palette, CreditCard, Smartphone, Languages, LogOut, Check } from "lucide-react";
import AppShell from "@/components/site/AppShell";

const sections = [
  { id: "account", label: "Account", hindi: "खाता", icon: Lock },
  { id: "notifications", label: "Notifications", hindi: "सूचना", icon: Bell },
  { id: "language", label: "Language & region", hindi: "भाषा", icon: Languages },
  { id: "appearance", label: "Appearance", hindi: "रंग-रूप", icon: Palette },
  { id: "channels", label: "Sales channels", hindi: "बिक्री मंच", icon: Globe },
  { id: "billing", label: "Billing", hindi: "भुगतान", icon: CreditCard },
  { id: "devices", label: "Devices", hindi: "उपकरण", icon: Smartphone },
];

const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!on)}
    className={`relative w-10 h-5 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${on ? "translate-x-5" : ""}`} />
  </button>
);

const Row = ({ label, hindi, children }: { label: string; hindi?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
    <div>
      <div className="text-sm">{label}</div>
      {hindi && <div className="text-xs font-hindi text-muted-foreground mt-0.5">{hindi}</div>}
    </div>
    {children}
  </div>
);

const channels = [
  { name: "Etsy", connected: true, sub: "ramesh-prajapati.etsy.com" },
  { name: "Amazon Karigar", connected: true, sub: "Seller ID · A2X8…" },
  { name: "Instagram Shop", connected: true, sub: "@ramesh.weaves" },
  { name: "WhatsApp Business", connected: true, sub: "+91 98765 43210" },
  { name: "Flipkart Samarth", connected: false, sub: "Connect to expand" },
  { name: "Shopify storefront", connected: false, sub: "Coming soon" },
];

const Settings = () => {
  const [active, setActive] = useState("account");
  const [notif, setNotif] = useState({ orders: true, mandi: true, festival: true, weekly: false, marketing: false });
  const [theme, setTheme] = useState("paper");
  const [lang, setLang] = useState("hi");

  return (
    <AppShell title="Settings · सेटिंग्स" hindi="व्यवस्था" subtitle="Tune ArtisanGPS to your workshop — language, notifications, channels, and identity.">
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Section nav */}
        <aside className="rounded-2xl border border-border bg-card p-2 h-fit lg:sticky lg:top-32">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active === s.id ? "bg-primary/15 text-foreground border-l-2 border-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <s.icon size={14} />
              <span>{s.label}</span>
              <span className="ml-auto text-[10px] font-hindi opacity-60">{s.hindi}</span>
            </button>
          ))}
        </aside>

        {/* Panel */}
        <div className="space-y-6 min-w-0">
          {active === "account" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Account</div>
              <div className="text-xs font-hindi text-muted-foreground mb-6">अपनी पहचान</div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { l: "Full name", v: "Ramesh Prajapati" },
                  { l: "Workshop name", v: "Lallapura Looms" },
                  { l: "Phone", v: "+91 98765 43210" },
                  { l: "Email", v: "ramesh@artisangps.in" },
                  { l: "GSTIN", v: "09ABCDE1234F2Z5" },
                  { l: "Cluster", v: "Varanasi · Weave" },
                ].map((f) => (
                  <label key={f.l} className="block">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">{f.l}</div>
                    <input defaultValue={f.v} className="w-full px-3 py-2.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-primary" />
                  </label>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                <button className="text-xs text-destructive flex items-center gap-2 hover:underline"><LogOut size={12} /> Sign out of all devices</button>
                <button className="text-sm px-5 py-2.5 rounded-full bg-primary text-primary-foreground">Save changes</button>
              </div>
            </div>
          )}

          {active === "notifications" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Notifications</div>
              <div className="text-xs font-hindi text-muted-foreground mb-4">कब आपको आवाज़ देनी है</div>
              <Row label="New orders" hindi="नए आर्डर पर"><Toggle on={notif.orders} onChange={(v) => setNotif({ ...notif, orders: v })} /></Row>
              <Row label="Mandi price drops" hindi="मंडी सस्ती हो"><Toggle on={notif.mandi} onChange={(v) => setNotif({ ...notif, mandi: v })} /></Row>
              <Row label="Festival demand alerts" hindi="त्योहार से पहले"><Toggle on={notif.festival} onChange={(v) => setNotif({ ...notif, festival: v })} /></Row>
              <Row label="Weekly summary" hindi="साप्ताहिक रिपोर्ट"><Toggle on={notif.weekly} onChange={(v) => setNotif({ ...notif, weekly: v })} /></Row>
              <Row label="Marketing & tips" hindi="नई सुविधाएँ"><Toggle on={notif.marketing} onChange={(v) => setNotif({ ...notif, marketing: v })} /></Row>
              <div className="mt-4 p-4 rounded-xl bg-secondary/10 text-xs text-muted-foreground">
                Notifications are sent via WhatsApp and in-app. SMS is reserved for order events only.
              </div>
            </div>
          )}

          {active === "language" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Language & region</div>
              <div className="text-xs font-hindi text-muted-foreground mb-6">आपकी ज़ुबान</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { id: "hi", label: "हिन्दी", sub: "Hindi · Devanagari" },
                  { id: "en", label: "English", sub: "Latin" },
                  { id: "ta", label: "தமிழ்", sub: "Tamil" },
                  { id: "ur", label: "اردو", sub: "Urdu · Nastaliq" },
                  { id: "bn", label: "বাংলা", sub: "Bengali" },
                  { id: "gu", label: "ગુજરાતી", sub: "Gujarati" },
                ].map((l) => {
                  const on = lang === l.id;
                  return (
                    <button key={l.id} onClick={() => setLang(l.id)} className={`text-left p-4 rounded-xl border transition-all ${on ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                      <div className="flex items-center justify-between">
                        <div className="font-display text-lg">{l.label}</div>
                        {on && <Check size={16} className="text-primary" />}
                      </div>
                      <div className="text-xs text-muted-foreground font-data mt-1">{l.sub}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <label>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">Currency</div>
                  <select className="w-full px-3 py-2.5 text-sm rounded-lg bg-background border border-border">
                    <option>₹ INR · Indian Rupee</option><option>$ USD</option><option>€ EUR</option>
                  </select>
                </label>
                <label>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">Timezone</div>
                  <select className="w-full px-3 py-2.5 text-sm rounded-lg bg-background border border-border">
                    <option>Asia/Kolkata · IST</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {active === "appearance" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Appearance</div>
              <div className="text-xs font-hindi text-muted-foreground mb-6">रंग और रूप</div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { id: "paper", label: "Paper", hex: ["#f5f0e6", "#1a1a1a", "#c2410c"] },
                  { id: "indigo", label: "Indigo night", hex: ["#0f1228", "#e9e3d3", "#7c5cff"] },
                  { id: "terracotta", label: "Terracotta", hex: ["#f9eee2", "#3a1f1a", "#c2410c"] },
                ].map((t) => {
                  const on = theme === t.id;
                  return (
                    <button key={t.id} onClick={() => setTheme(t.id)} className={`p-4 rounded-xl border transition-all ${on ? "border-primary ring-2 ring-primary/20" : "border-border hover:bg-muted"}`}>
                      <div className="flex gap-1 mb-3">
                        {t.hex.map((h) => <div key={h} className="flex-1 h-10 rounded" style={{ background: h }} />)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">{t.label}</div>
                        {on && <Check size={14} className="text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 space-y-1">
                <Row label="High contrast" hindi="गहरा अंतर"><Toggle on={false} onChange={() => {}} /></Row>
                <Row label="Larger text" hindi="बड़ा अक्षर"><Toggle on={true} onChange={() => {}} /></Row>
                <Row label="Reduce motion"><Toggle on={false} onChange={() => {}} /></Row>
              </div>
            </div>
          )}

          {active === "channels" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Sales channels</div>
              <div className="text-xs font-hindi text-muted-foreground mb-6">जहाँ-जहाँ आपकी दुकान</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {channels.map((c) => (
                  <div key={c.name} className="p-4 rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground font-data mt-0.5">{c.sub}</div>
                    </div>
                    <button className={`text-xs px-3 py-1.5 rounded-full ${c.connected ? "bg-forest/15 text-forest" : "bg-primary text-primary-foreground"}`}>
                      {c.connected ? "Connected" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "billing" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Billing</div>
              <div className="text-xs font-hindi text-muted-foreground mb-6">शुल्क और सदस्यता</div>
              <div className="rounded-xl p-5 bg-gradient-to-br from-secondary/10 to-primary/10 border border-border">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-data">Current plan</div>
                <div className="font-display text-3xl mt-1">Karigar · Free</div>
                <div className="text-xs text-muted-foreground mt-2">Free for first 6 months across all 14 craft clusters. No card on file.</div>
                <div className="mt-4 flex items-center gap-3">
                  <button className="text-sm px-5 py-2 rounded-full bg-primary text-primary-foreground">Upgrade to Master</button>
                  <button className="text-sm text-muted-foreground hover:text-foreground">Compare plans →</button>
                </div>
              </div>
              <div className="mt-6 grid sm:grid-cols-3 gap-4 text-center">
                {[
                  { l: "AI calls used", v: "1,284", sub: "of ∞" },
                  { l: "Mandi lookups", v: "342", sub: "this month" },
                  { l: "Storage", v: "112 MB", sub: "of 5 GB" },
                ].map((s) => (
                  <div key={s.l} className="p-4 rounded-xl bg-background-deep border border-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">{s.l}</div>
                    <div className="font-display text-2xl mt-1">{s.v}</div>
                    <div className="text-xs text-muted-foreground font-data">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "devices" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Active devices</div>
              <div className="text-xs font-hindi text-muted-foreground mb-6">किन फ़ोनों से लॉगिन</div>
              <div className="space-y-2">
                {[
                  { d: "Redmi Note 13 · Varanasi", t: "Active now", current: true },
                  { d: "Workshop tablet · Lenovo", t: "2 hours ago" },
                  { d: "Web · Chrome on Windows", t: "Yesterday, 6:42 PM" },
                ].map((d) => (
                  <div key={d.d} className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div>
                      <div className="text-sm flex items-center gap-2">{d.d} {d.current && <span className="text-[10px] bg-forest/15 text-forest px-2 py-0.5 rounded-full font-data uppercase tracking-wider">this device</span>}</div>
                      <div className="text-xs text-muted-foreground font-data mt-0.5">{d.t}</div>
                    </div>
                    {!d.current && <button className="text-xs text-destructive hover:underline">Sign out</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;
