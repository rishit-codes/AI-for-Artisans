import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Award, MapPin, Phone, Mail, Globe, Languages, Edit3, Star, Package2, ShoppingBag, TrendingUp, ExternalLink, BadgeCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "@/lib/api";
import AppShell from "@/components/site/AppShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import textileImg from "@/assets/craft-textile.jpg";
import potteryImg from "@/assets/craft-pottery.jpg";
import metalImg from "@/assets/craft-metal.jpg";

/* ─── data ─── */

const rameshSkills = [
  { name: "Banarasi handloom", level: 92 },
  { name: "Natural dyeing", level: 78 },
  { name: "Zari work", level: 85 },
  { name: "Block printing", level: 64 },
];

const rameshMilestones = [
  { y: "1998", e: "Started weaving under guru Shyam Lal ji" },
  { y: "2007", e: "First independent loom · Lallapura" },
  { y: "2014", e: "GI tag certification for Banarasi silk" },
  { y: "2021", e: "Joined Karigar Karyashala collective" },
  { y: "2025", e: "Onboarded ArtisanGPS · went pan-India" },
];

const rameshProducts = [
  { name: "Indigo dupatta", hindi: "नील दुपट्टा", sku: "DUP-IND-018", price: 1450, stock: 12, img: textileImg, tag: "Bestseller", tone: "primary" },
  { name: "Banarasi stole", hindi: "बनारसी स्टोल", sku: "TEX-BAN-007", price: 3200, stock: 0, img: textileImg, tag: "Out of stock", tone: "destructive" },
  { name: "Brass diya set", hindi: "पीतल दीया", sku: "BRS-DIY-011", price: 920, stock: 28, img: metalImg, tag: "Listed", tone: "forest" },
  { name: "Khurja serving bowl", hindi: "खुरजा कटोरा", sku: "POT-KHU-042", price: 680, stock: 4, img: potteryImg, tag: "Low stock", tone: "accent" },
];

const rameshOrders = [
  { id: "#A-2841", buyer: "Priya Mehta, Mumbai", item: "Indigo dupatta × 3", date: "10 May", status: "Shipped", value: 4350 },
  { id: "#A-2839", buyer: "Etsy — Germany", item: "Brass diya set × 5", date: "08 May", status: "Processing", value: 4600 },
  { id: "#A-2836", buyer: "Ananya Stores, Delhi", item: "Banarasi stole × 2", date: "06 May", status: "Delivered", value: 6400 },
  { id: "#A-2831", buyer: "FabIndia Wholesale", item: "Block-print cotton × 12", date: "02 May", status: "Delivered", value: 14400 },
  { id: "#A-2828", buyer: "Ritu Bhatia, Bangalore", item: "Zari dupatta × 1", date: "29 Apr", status: "Delivered", value: 1850 },
];

const rameshChannels = [
  { name: "Etsy", handle: "ramesh-prajapati.etsy.com", sales: "₹28.4k / mo", connected: true },
  { name: "Amazon Karigar", handle: "Seller ID A2X8…", sales: "₹19.1k / mo", connected: true },
  { name: "Instagram", handle: "@ramesh.weaves", sales: "₹6.2k / mo", connected: true },
  { name: "WhatsApp Business", handle: "+91 98765 43210", sales: "₹11.5k / mo", connected: true },
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ─── page ─── */

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "channels">("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSkills, setEditSkills] = useState("");
  const [editMilestones, setEditMilestones] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editLanguages, setEditLanguages] = useState("");
  const [editCraftStory, setEditCraftStory] = useState("");
  const [editGiCertified, setEditGiCertified] = useState(false);
  const [editGiYear, setEditGiYear] = useState("");

  const isRamesh = user?.email === "ramesh@example.com";
  let parsedBio: any = {};
  try {
    parsedBio = user?.bio ? JSON.parse(user?.bio as string) : {};
  } catch { }

  const skillsList = (isRamesh && !user?.bio) ? rameshSkills : (parsedBio.skills || []);
  const milestonesList = (isRamesh && !user?.bio) ? rameshMilestones : (parsedBio.milestones || []);
  const channelsList = (isRamesh && !user?.bio) ? rameshChannels : (parsedBio.channels || []);
  const ordersList = isRamesh ? rameshOrders : [];
  const productsList = isRamesh ? rameshProducts : []; // Mapped backend products omitted for MVP simplicity
  const revMay = isRamesh ? "₹64k" : "₹0";
  const rating = isRamesh ? "4.9 ★" : "New ★";
  const craftStory = parsedBio.craftStory || (isRamesh && !user?.bio
    ? "I am a third-generation master weaver based in the heart of Jaipur, Rajasthan. My family has been dedicated to the intricate art of Banarasi silk weaving for over seven decades."
    : "");
  const giCertified: boolean = parsedBio.giCertified ?? (isRamesh && !user?.bio);
  const giYear = parsedBio.giYear || (isRamesh && !user?.bio ? "2014" : "");

  const statusTone = (s: string) =>
    s === "Delivered" ? "text-forest bg-forest/10" : s === "Shipped" ? "text-secondary bg-secondary/10" : "text-primary bg-primary/10";

  const handleEditOpen = () => {
    setEditSkills(skillsList.map((s: any) => `${s.name},${s.level}`).join("\n"));
    setEditMilestones(milestonesList.map((m: any) => `${m.y},${m.e}`).join("\n"));
    setEditPhone(parsedBio.phone || (isRamesh && !user?.bio ? "+91 98765 43210" : ""));
    setEditPincode(parsedBio.pincode || (isRamesh && !user?.bio ? "UP 221002" : ""));
    setEditLanguages(parsedBio.languages || (isRamesh && !user?.bio ? "Hindi · Bhojpuri · little English" : ""));
    setEditCraftStory(craftStory);
    setEditGiCertified(giCertified);
    setEditGiYear(giYear);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    const newSkills = editSkills.split("\n").filter(Boolean).map(line => {
      const [name, level] = line.split(",");
      return { name: name?.trim(), level: parseInt(level?.trim() || "50") };
    });
    const newMilestones = editMilestones.split("\n").filter(Boolean).map(line => {
      const [y, ...e] = line.split(",");
      return { y: y?.trim(), e: e.join(",").trim() };
    });

    const newBio = JSON.stringify({
      skills: newSkills,
      milestones: newMilestones,
      channels: channelsList,
      phone: editPhone.trim(),
      pincode: editPincode.trim(),
      languages: editLanguages.trim(),
      craftStory: editCraftStory.trim(),
      giCertified: editGiCertified,
      giYear: editGiYear.trim(),
    });

    try {
      const res = await updateProfile({ bio: newBio });
      updateUser({ bio: newBio });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  return (
    <AppShell
      title="My Karigar Card"
      hindi="कारीगर परिचय"
      subtitle="A living identity for the artisan — craft, cluster, certifications and conversation."
    >
      {/* Hero card */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
        <div className="absolute inset-0 opacity-20">
          <img src={textileImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/40" />
        <div className="relative p-8 lg:p-10 grid md:grid-cols-[180px_1fr_auto] gap-8 items-center">
          <div className="w-36 h-36 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-display text-6xl ring-4 ring-background shadow-paper uppercase">
            {user?.full_name?.charAt(0) || "र"}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-data capitalize">Master Weaver · {user?.location || "Varanasi"}</div>
            <h2 className="font-display text-4xl lg:text-5xl mt-1 capitalize">{user?.full_name || "Ramesh Prajapati"}</h2>
            <div className="font-hindi text-xl text-muted-foreground mt-1 capitalize">{user?.full_name || "रमेश प्रजापति"} · {user?.location || "वाराणसी"}</div>
            <div className="flex flex-wrap gap-2 mt-4">
              {giCertified && (
                <span className="text-[11px] uppercase tracking-wider font-data px-3 py-1 rounded-full bg-forest/10 text-forest border border-forest/30 inline-flex items-center gap-1.5">
                  <BadgeCheck size={12} /> GI Certified{giYear ? ` · ${giYear}` : ""}
                </span>
              )}
              {[user?.craft_type || "Banarasi silk", "Natural dye", "27 yrs"].map((t) => (
                <span key={t} className="text-[11px] uppercase tracking-wider font-data px-3 py-1 rounded-full bg-background border border-border">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={handleEditOpen} className="text-sm px-5 py-2.5 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-2 hover:opacity-90">
              <Edit3 size={14} /> Edit card
            </button>
            {user?.id && (
              <Link
                to={`/karigar/${user.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-5 py-2.5 rounded-full border border-border bg-background inline-flex items-center gap-2 hover:bg-muted"
              >
                <ExternalLink size={14} /> Share public link
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Avg rating", hindi: "रेटिंग", value: rating, tone: "text-primary" },
          { label: "Active orders", hindi: "आर्डर", value: ordersList.length.toString(), tone: "text-secondary" },
          { label: "Listed products", hindi: "उत्पाद", value: productsList.length.toString(), tone: "text-forest" },
          { label: "Revenue · May", hindi: "आय", value: revMay, tone: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">{s.label}</div>
            <div className={`font-display text-3xl mt-1 ${s.tone}`}>{s.value}</div>
            <div className="text-xs font-hindi text-muted-foreground mt-0.5">{s.hindi}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-full w-fit">
        {(["overview", "products", "orders", "channels"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-full text-xs font-data capitalize transition-colors ${activeTab === t ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact + skills */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-lg mb-4">Contact</div>
              <div className="space-y-3 text-sm">
                {[
                  { i: MapPin, t: `${user?.location || "Lallapura, Varanasi"}${parsedBio.pincode || (isRamesh && !user?.bio ? " · UP 221002" : "") ? ` · ${parsedBio.pincode || (isRamesh && !user?.bio ? "UP 221002" : "")}` : ""}` },
                  { i: Phone, t: parsedBio.phone || (isRamesh && !user?.bio ? "+91 98765 43210" : "Add phone number") },
                  { i: Mail, t: user?.email || "ramesh@artisangps.in" },
                  { i: Globe, t: `artisangps.in/${user?.full_name?.split(' ')[0].toLowerCase() || "r-prajapati"}` },
                  { i: Languages, t: parsedBio.languages || (isRamesh && !user?.bio ? "Hindi · Bhojpuri · little English" : "Add languages") },
                ].map((c) => (
                  <div key={c.t} className="flex items-center gap-3 text-foreground/85">
                    <c.i size={14} className="text-muted-foreground shrink-0" /> {c.t}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-lg mb-4">Craft skills</div>
              {skillsList.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">No skills added yet.</div>
              ) : (
                <div className="space-y-4">
                  {skillsList.map((s: any) => (
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
              )}
            </div>
          </div>

          {/* Timeline + ratings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-lg mb-3">Craft story</div>
              {craftStory ? (
                <p className="text-sm text-foreground/85 leading-relaxed">{craftStory}</p>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Add your craft story from "Edit card" — it appears on your public Karigar card.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-baseline justify-between mb-6">
                <div className="font-display text-lg">Karigar journey</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-data">since {milestonesList[0]?.y || new Date().getFullYear()}</div>
              </div>

              {milestonesList.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">Your journey will appear here once added.</div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
                  {milestonesList.map((m: any, i: number) => (
                    <div key={m.y} className="relative pb-5 last:pb-0">
                      <div className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full ring-4 ring-card ${i === milestonesList.length - 1 ? "bg-primary" : "bg-secondary"}`} />
                      <div className="font-data text-xs text-muted-foreground">{m.y}</div>
                      <div className="text-sm mt-0.5">{m.e}</div>
                    </div>
                  ))}
                </div>
              )}
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
      )}

      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-data">{productsList.length} products</div>
            <button className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5">
              <Package2 size={12} /> + Add product
            </button>
          </div>
          {productsList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-2xl">
              No products listed yet.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {productsList.map((p: any) => {
                const toneMap: Record<string, string> = {
                  primary: "bg-primary/10 text-primary border-primary/20",
                  destructive: "bg-destructive/10 text-destructive border-destructive/20",
                  forest: "bg-forest/10 text-forest border-forest/20",
                  accent: "bg-accent/10 text-accent border-accent/20",
                };
                return (
                  <div key={p.sku} className="rounded-2xl border border-border bg-card overflow-hidden group hover:shadow-paper transition-shadow">
                    <div className="relative h-44 overflow-hidden">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className={`absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-data font-bold ${toneMap[p.tone || "primary"]}`}>
                        {p.tag || "Listed"}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="font-display text-lg leading-tight">{p.name}</div>
                      <div className="font-hindi text-xs text-muted-foreground">{p.hindi}</div>
                      <div className="flex items-end justify-between mt-3">
                        <div>
                          <div className="font-data text-xl">{inr(p.price)}</div>
                          <div className="text-[10px] text-muted-foreground font-data">{p.stock} on hand · {p.sku}</div>
                        </div>
                        <button className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted font-data">Edit</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-baseline justify-between">
            <div>
              <div className="font-display text-xl">Recent orders</div>
              <div className="text-xs font-hindi text-muted-foreground">हाल के आर्डर — सभी मंच</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-data text-muted-foreground">
              <ShoppingBag size={13} />
              {ordersList.length} shown
            </div>
          </div>
          {ordersList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground italic">No orders yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {ordersList.map((o: any) => (
                <div key={o.id} className="px-5 py-4 flex items-center gap-4 hover:bg-background transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary grid place-items-center font-data text-xs shrink-0">
                    {o.id.slice(1, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{o.item}</div>
                    <div className="text-xs text-muted-foreground">{o.buyer}</div>
                  </div>
                  <div className="hidden sm:block text-xs font-data text-muted-foreground">{o.date}</div>
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-data font-bold ${statusTone(o.status)}`}>
                    {o.status}
                  </span>
                  <div className="text-right">
                    <div className="font-data text-sm font-semibold">{inr(o.value)}</div>
                    <div className="text-[10px] text-muted-foreground font-data">{o.id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs font-data text-muted-foreground">
            <span>Total shown: {inr(ordersList.reduce((s: number, o: any) => s + o.value, 0))}</span>
            <button className="hover:text-foreground underline">View full order history →</button>
          </div>
        </div>
      )}

      {activeTab === "channels" && (
        <div className="grid sm:grid-cols-2 gap-5">
          {channelsList.map((c: any) => (
            <div key={c.name} className="rounded-2xl border border-border bg-card p-6 hover:shadow-paper transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-xl">{c.name}</div>
                  <div className="text-xs text-muted-foreground font-data mt-1">{c.handle}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-forest/10 text-forest font-data font-bold shrink-0">
                  Connected
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Revenue this month</div>
                  <div className="font-data text-2xl mt-1 text-forest">{c.sales}</div>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted flex items-center gap-1.5">
                  <TrendingUp size={11} /> View analytics
                </button>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted grid place-items-center text-muted-foreground">
              <ExternalLink size={18} />
            </div>
            <div className="font-display text-lg">Add a channel</div>
            <div className="text-xs text-muted-foreground">Connect Flipkart Samarth, Shopify, or a custom storefront.</div>
            <button className="text-xs px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90">+ Connect</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Craft Skills (format: Skill Name, Skill Level 1-100)</Label>
              <Textarea
                value={editSkills}
                onChange={e => setEditSkills(e.target.value)}
                placeholder="Banarasi handloom, 92&#10;Natural dyeing, 78"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Karigar Journey (format: Year, Description)</Label>
              <Textarea
                value={editMilestones}
                onChange={e => setEditMilestones(e.target.value)}
                placeholder="2014, GI tag certification&#10;2025, Joined ArtisanGPS"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>State & Pincode</Label>
                <Input
                  value={editPincode}
                  onChange={e => setEditPincode(e.target.value)}
                  placeholder="UP 221002"
                />
              </div>
              <div className="space-y-2">
                <Label>Languages</Label>
                <Input
                  value={editLanguages}
                  onChange={e => setEditLanguages(e.target.value)}
                  placeholder="Hindi, English"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Craft Story (shown on your public Karigar card)</Label>
              <Textarea
                value={editCraftStory}
                onChange={e => setEditCraftStory(e.target.value)}
                placeholder="Tell buyers about your craft, your training, and what makes your work unique."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="flex items-center gap-2 pb-2">
                <input
                  id="gi-certified"
                  type="checkbox"
                  checked={editGiCertified}
                  onChange={e => setEditGiCertified(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="gi-certified" className="cursor-pointer">GI certified</Label>
              </div>
              <div className="space-y-2">
                <Label>GI Certification Year</Label>
                <Input
                  value={editGiYear}
                  onChange={e => setEditGiYear(e.target.value)}
                  placeholder="2014"
                  disabled={!editGiCertified}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Profile;
