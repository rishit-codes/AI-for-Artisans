import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell, Globe, Lock, Palette, CreditCard, Smartphone, Languages, LogOut, Check, Loader2, Trash2, ShieldCheck, MailCheck } from "lucide-react";
import AppShell from "@/components/site/AppShell";
import { useAuth } from "@/hooks/use-auth";
import {
  updateProfile, deleteAccountApi,
  setup2FA, verify2FASetup, disable2FA, requestEmailVerification,
  TwoFASetupResponse,
} from "@/lib/api";

const sections = [
  { id: "account", label: "Account", hindi: "खाता", icon: Lock },
  { id: "security", label: "Security", hindi: "सुरक्षा", icon: ShieldCheck },
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

// No backend concept of a "connected sales channel" exists yet — this is a
// placeholder list, not live integration state. "Connect" is intentionally
// wired to say so rather than pretend to do something.
const channels = [
  { name: "Etsy", connected: false, sub: "Not connected" },
  { name: "Amazon Karigar", connected: false, sub: "Not connected" },
  { name: "Instagram Shop", connected: false, sub: "Not connected" },
  { name: "WhatsApp Business", connected: false, sub: "Not connected" },
  { name: "Flipkart Samarth", connected: false, sub: "Not connected" },
  { name: "Shopify storefront", connected: false, sub: "Not connected" },
];

interface NotificationPrefs {
  orders: boolean;
  mandi: boolean;
  festival: boolean;
  weekly: boolean;
  marketing: boolean;
}

const DEFAULT_NOTIF: NotificationPrefs = { orders: true, mandi: true, festival: true, weekly: false, marketing: false };

interface AppearancePrefs {
  largerText: boolean;
  reduceMotion: boolean;
  language: "hi" | "en";
}

const DEFAULT_APPEARANCE: AppearancePrefs = { largerText: false, reduceMotion: false, language: "hi" };

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, logoutAllDevices, updateUser } = useAuth();
  const [active, setActive] = useState("account");
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [twoFaSetupData, setTwoFaSetupData] = useState<TwoFASetupResponse | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [settingUp2FA, setSettingUp2FA] = useState(false);
  const [confirming2FA, setConfirming2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const totpEnabled = !!(user?.totp_enabled as boolean | undefined);
  const emailVerified = !!(user?.email_verified as boolean | undefined);

  let parsedBio: Record<string, unknown> = {};
  try {
    parsedBio = user?.bio ? JSON.parse(user.bio as string) : {};
  } catch { /* corrupt bio — treat as empty rather than crash the settings page */ }

  const notif: NotificationPrefs = { ...DEFAULT_NOTIF, ...(parsedBio.notificationPrefs as Partial<NotificationPrefs> | undefined) };
  const appearance: AppearancePrefs = { ...DEFAULT_APPEARANCE, ...(parsedBio.appearance as Partial<AppearancePrefs> | undefined) };

  // Every toggle below persists to the server immediately (same bio-merge
  // pattern as the Account tab) instead of only living in local component
  // state — previously these reset on every reload and had no real effect.
  const savePreference = async (patch: Record<string, unknown>) => {
    const newBio = JSON.stringify({ ...parsedBio, ...patch });
    try {
      await updateProfile({ bio: newBio });
      updateUser({ bio: newBio });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save preference.");
    }
  };

  const setNotif = (next: NotificationPrefs) => savePreference({ notificationPrefs: next });
  const setAppearance = (next: AppearancePrefs) => savePreference({ appearance: next });

  const [accountForm, setAccountForm] = useState({
    full_name: (user?.full_name as string) || "",
    location: (user?.location as string) || "",
    workshopName: (parsedBio.workshopName as string) || "",
    phone: (parsedBio.phone as string) || "",
    gstin: (parsedBio.gstin as string) || "",
  });

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      await logoutAllDevices();
      navigate("/login");
    } catch (e) {
      toast.error("Couldn't reach the server to sign out other devices — signed out locally instead.");
      logout();
      navigate("/login");
    } finally {
      setSigningOutAll(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccountApi(deletePassword);
      toast.success("Account deleted.");
      logout();
      navigate("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleStart2FASetup = async () => {
    setSettingUp2FA(true);
    try {
      const data = await setup2FA();
      setTwoFaSetupData(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start 2FA setup.");
    } finally {
      setSettingUp2FA(false);
    }
  };

  const handleConfirm2FASetup = async () => {
    setConfirming2FA(true);
    try {
      await verify2FASetup(twoFaCode);
      updateUser({ totp_enabled: true });
      setTwoFaSetupData(null);
      setTwoFaCode("");
      toast.success("Two-factor authentication enabled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Incorrect code.");
    } finally {
      setConfirming2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    setDisabling2FA(true);
    try {
      await disable2FA(disable2FAPassword);
      updateUser({ totp_enabled: false });
      setShowDisable2FA(false);
      setDisable2FAPassword("");
      toast.success("Two-factor authentication disabled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to disable 2FA.");
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      await requestEmailVerification();
      toast.success("Verification email sent — check your inbox.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send verification email.");
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    try {
      const newBio = JSON.stringify({
        ...parsedBio,
        workshopName: accountForm.workshopName.trim(),
        phone: accountForm.phone.trim(),
        gstin: accountForm.gstin.trim(),
      });
      await updateProfile({
        full_name: accountForm.full_name.trim(),
        location: accountForm.location.trim(),
        bio: newBio,
      });
      updateUser({ full_name: accountForm.full_name.trim(), location: accountForm.location.trim(), bio: newBio });
      toast.success("Account details saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save account details.");
    } finally {
      setSavingAccount(false);
    }
  };

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
                <label className="block">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">Full name</div>
                  <input
                    value={accountForm.full_name}
                    onChange={(e) => setAccountForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">Workshop name</div>
                  <input
                    value={accountForm.workshopName}
                    onChange={(e) => setAccountForm((f) => ({ ...f, workshopName: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">Phone</div>
                  <input
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">Email</div>
                  <input
                    value={(user?.email as string) || ""}
                    disabled
                    title="Email can't be changed from here yet"
                    className="w-full px-3 py-2.5 text-sm rounded-lg bg-muted border border-border text-muted-foreground cursor-not-allowed"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">GSTIN</div>
                  <input
                    value={accountForm.gstin}
                    onChange={(e) => setAccountForm((f) => ({ ...f, gstin: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">Cluster / location</div>
                  <input
                    value={accountForm.location}
                    onChange={(e) => setAccountForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                <button
                  onClick={handleSignOutAll}
                  disabled={signingOutAll}
                  className="text-xs text-destructive flex items-center gap-2 hover:underline disabled:opacity-50"
                >
                  {signingOutAll ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                  Sign out of all devices
                </button>
                <button
                  onClick={handleSaveAccount}
                  disabled={savingAccount}
                  className="text-sm px-5 py-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50 flex items-center gap-2"
                >
                  {savingAccount && <Loader2 size={12} className="animate-spin" />}
                  Save changes
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-destructive font-data mb-2">Danger zone</div>
                {!showDeleteDialog ? (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-xs text-destructive flex items-center gap-2 hover:underline"
                  >
                    <Trash2 size={12} /> Delete account
                  </button>
                ) : (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-xs text-foreground/85">
                      This permanently deletes your account and everything in it — products, orders, sales, tasks. This can't be undone. Enter your password to confirm.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Password"
                        className="px-3 py-2 text-sm rounded-lg bg-background border border-border"
                      />
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount || !deletePassword}
                        className="text-xs px-4 py-2 rounded-full bg-destructive text-destructive-foreground disabled:opacity-40 flex items-center gap-2"
                      >
                        {deletingAccount && <Loader2 size={12} className="animate-spin" />}
                        Permanently delete
                      </button>
                      <button
                        onClick={() => { setShowDeleteDialog(false); setDeletePassword(""); }}
                        className="text-xs px-4 py-2 rounded-full border border-border hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {active === "security" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="font-display text-xl mb-1">Email verification</div>
                <div className="text-xs font-hindi text-muted-foreground mb-4">ईमेल सत्यापन</div>
                {emailVerified ? (
                  <div className="flex items-center gap-2 text-sm text-forest">
                    <MailCheck size={16} /> Your email is verified.
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <p className="text-sm text-muted-foreground">Your email address hasn't been verified yet.</p>
                    <button
                      onClick={handleResendVerification}
                      disabled={sendingVerification}
                      className="text-xs px-4 py-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50 flex items-center gap-2"
                    >
                      {sendingVerification && <Loader2 size={12} className="animate-spin" />}
                      Send verification email
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="font-display text-xl mb-1">Two-factor authentication</div>
                <div className="text-xs font-hindi text-muted-foreground mb-4">दो-चरणीय सत्यापन</div>

                {totpEnabled ? (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-forest mb-4">
                      <ShieldCheck size={16} /> Two-factor authentication is enabled.
                    </div>
                    {!showDisable2FA ? (
                      <button onClick={() => setShowDisable2FA(true)} className="text-xs text-destructive hover:underline">
                        Disable 2FA
                      </button>
                    ) : (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                        <p className="text-xs text-foreground/85 mb-3">Enter your password to disable two-factor authentication.</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="password"
                            value={disable2FAPassword}
                            onChange={(e) => setDisable2FAPassword(e.target.value)}
                            placeholder="Password"
                            className="px-3 py-2 text-sm rounded-lg bg-background border border-border"
                          />
                          <button
                            onClick={handleDisable2FA}
                            disabled={disabling2FA || !disable2FAPassword}
                            className="text-xs px-4 py-2 rounded-full bg-destructive text-destructive-foreground disabled:opacity-40 flex items-center gap-2"
                          >
                            {disabling2FA && <Loader2 size={12} className="animate-spin" />} Disable
                          </button>
                          <button onClick={() => { setShowDisable2FA(false); setDisable2FAPassword(""); }} className="text-xs px-4 py-2 rounded-full border border-border hover:bg-muted">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : twoFaSetupData ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Scan this QR code with Google Authenticator, Authy, or a similar app, then enter the 6-digit code to confirm.</p>
                    <img src={twoFaSetupData.qr_code_data_uri} alt="2FA QR code" className="w-40 h-40 rounded-lg border border-border" />
                    <p className="text-[11px] text-muted-foreground font-data">Can't scan? Enter this key manually: <span className="text-foreground">{twoFaSetupData.secret}</span></p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="px-3 py-2 text-sm rounded-lg bg-background border border-border tracking-[0.3em] font-data text-center w-32"
                      />
                      <button
                        onClick={handleConfirm2FASetup}
                        disabled={confirming2FA || twoFaCode.length !== 6}
                        className="text-xs px-4 py-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 flex items-center gap-2"
                      >
                        {confirming2FA && <Loader2 size={12} className="animate-spin" />} Confirm & enable
                      </button>
                      <button onClick={() => { setTwoFaSetupData(null); setTwoFaCode(""); }} className="text-xs px-4 py-2 rounded-full border border-border hover:bg-muted">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <p className="text-sm text-muted-foreground">Add an authenticator app as a second sign-in step.</p>
                    <button
                      onClick={handleStart2FASetup}
                      disabled={settingUp2FA}
                      className="text-xs px-4 py-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50 flex items-center gap-2"
                    >
                      {settingUp2FA && <Loader2 size={12} className="animate-spin" />} Set up 2FA
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {active === "notifications" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Notifications</div>
              <div className="text-xs font-hindi text-muted-foreground mb-4">कब आपको आवाज़ देनी है</div>
              <Row label="Low-stock alerts" hindi="कम स्टॉक पर"><Toggle on={notif.orders} onChange={(v) => setNotif({ ...notif, orders: v })} /></Row>
              <Row label="Mandi price drops" hindi="मंडी सस्ती हो"><Toggle on={notif.mandi} onChange={(v) => setNotif({ ...notif, mandi: v })} /></Row>
              <Row label="Festival demand alerts" hindi="त्योहार से पहले"><Toggle on={notif.festival} onChange={(v) => setNotif({ ...notif, festival: v })} /></Row>
              <Row label="Weekly summary" hindi="साप्ताहिक रिपोर्ट"><Toggle on={notif.weekly} onChange={(v) => setNotif({ ...notif, weekly: v })} /></Row>
              <Row label="Marketing & tips" hindi="नई सुविधाएँ"><Toggle on={notif.marketing} onChange={(v) => setNotif({ ...notif, marketing: v })} /></Row>
              <div className="mt-4 p-4 rounded-xl bg-secondary/10 text-xs text-muted-foreground space-y-1.5">
                <p>Shown in the in-app notification bell only right now — there's no WhatsApp, SMS, or email delivery yet.</p>
                <p>Low-stock, mandi and festival alerts are already live. Weekly summary and marketing tips aren't sent anywhere yet — your preference is saved for when they are.</p>
              </div>
            </div>
          )}

          {active === "language" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Language & region</div>
              <div className="text-xs font-hindi text-muted-foreground mb-2">आपकी ज़ुबान</div>
              <p className="text-xs text-muted-foreground mb-6">Only Hindi and English interface labels exist right now — this toggles whether Hindi subtitles show throughout the app.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { id: "hi" as const, label: "हिन्दी + English", sub: "Hindi subtitles shown" },
                  { id: "en" as const, label: "English only", sub: "Hindi subtitles hidden" },
                ].map((l) => {
                  const on = appearance.language === l.id;
                  return (
                    <button key={l.id} onClick={() => setAppearance({ ...appearance, language: l.id })} className={`text-left p-4 rounded-xl border transition-all ${on ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
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
                  <select disabled value="inr" className="w-full px-3 py-2.5 text-sm rounded-lg bg-muted border border-border text-muted-foreground cursor-not-allowed">
                    <option value="inr">₹ INR · Indian Rupee</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">Other currencies aren't supported yet — every figure in the app is INR.</p>
                </label>
                <label>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data mb-1.5">Timezone</div>
                  <select disabled value="ist" className="w-full px-3 py-2.5 text-sm rounded-lg bg-muted border border-border text-muted-foreground cursor-not-allowed">
                    <option value="ist">Asia/Kolkata · IST</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {active === "appearance" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Appearance</div>
              <div className="text-xs font-hindi text-muted-foreground mb-2">रंग और रूप</div>
              <p className="text-xs text-muted-foreground mb-4">Only one color theme exists right now, so there's no theme picker here — just the two accessibility options below, which take effect immediately across the app.</p>
              <div className="space-y-1">
                <Row label="Larger text" hindi="बड़ा अक्षर"><Toggle on={appearance.largerText} onChange={(v) => setAppearance({ ...appearance, largerText: v })} /></Row>
                <Row label="Reduce motion" hindi="कम हलचल"><Toggle on={appearance.reduceMotion} onChange={(v) => setAppearance({ ...appearance, reduceMotion: v })} /></Row>
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
                    <button
                      onClick={() => toast.info(`${c.name} integration isn't built yet — no backend support for connected sales channels.`)}
                      className={`text-xs px-3 py-1.5 rounded-full ${c.connected ? "bg-forest/15 text-forest" : "bg-primary text-primary-foreground"}`}
                    >
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
                  <button
                    onClick={() => toast.info("Paid plans aren't live yet — everyone's on Free for now.")}
                    className="text-sm px-5 py-2 rounded-full bg-primary text-primary-foreground"
                  >
                    Upgrade to Master
                  </button>
                  <button
                    onClick={() => toast.info("Paid plans aren't live yet — everyone's on Free for now.")}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Compare plans →
                  </button>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-background-deep border border-border text-xs text-muted-foreground text-center">
                Usage metering (AI calls, mandi lookups, storage) isn't implemented yet — there's nothing to bill against on the Free plan regardless.
              </div>
            </div>
          )}

          {active === "devices" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-xl mb-1">Active devices</div>
              <div className="text-xs font-hindi text-muted-foreground mb-6">किन फ़ोनों से लॉगिन</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div>
                    <div className="text-sm flex items-center gap-2">
                      This device
                      <span className="text-[10px] bg-forest/15 text-forest px-2 py-0.5 rounded-full font-data uppercase tracking-wider">active now</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-data mt-0.5">{user?.email as string}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-background-deep border border-border text-xs text-muted-foreground">
                Per-device session tracking (device name, location, last-seen) isn't implemented — there's no session table behind it yet.
                What <span className="font-medium text-foreground">is</span> real: "Sign out of all devices" on the Account tab immediately
                invalidates every token issued for your account, everywhere, the next time each one is used.
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;
