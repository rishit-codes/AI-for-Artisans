import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { requestPasswordReset } from "@/lib/api";
import { toast } from "sonner";

const CRAFT_TYPES = [
  "Textiles",
  "Pottery",
  "Metalwork",
  "Woodwork",
  "Jewelry",
  "Painting",
  "Leather",
  "Other",
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWith2FA, register } = useAuth();
  const from = (location.state as { from?: string })?.from || "/dashboard";

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    craft_type: "Textiles",
    location: "",
    website: "", // honeypot — real users never see or fill this field; see backend RegisterRequest.website
  });

  const patch = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await login(form.email, form.password);
        if (res.requires2fa && res.pendingToken) {
          setPendingToken(res.pendingToken);
          return;
        }
        if (!res.success) throw new Error(res.error || "Login failed");
      } else {
        if (!form.full_name.trim()) throw new Error("Please enter your name");
        if (!form.location.trim()) throw new Error("Please enter your location");
        const res = await register({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          craft_type: form.craft_type,
          location: form.location,
          website: form.website,
        });
        if (!res.success) throw new Error(res.error || "Registration failed");
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await loginWith2FA(pendingToken, twoFaCode);
      if (!res.success) throw new Error(res.error || "Incorrect code");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(form.email);
      setResetSent(true);
      toast.success("If that email is registered, a reset link has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-deep flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground grid place-items-center font-display text-xl">
            अ
          </div>
          <div>
            <div className="font-display text-xl leading-none">ArtisanGPS</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data mt-0.5">
              बहीखाता
            </div>
          </div>
        </Link>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-border bg-card p-7 shadow-paper"
        >
          {pendingToken ? (
            <form onSubmit={handleTwoFaSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck size={16} className="text-primary" /> Two-factor authentication
              </div>
              <p className="text-xs text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
              <Field label="Authentication code">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  className="input-base tracking-[0.3em] text-center font-data text-lg"
                />
              </Field>
              {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}
              <button
                type="submit"
                disabled={loading || twoFaCode.length !== 6}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />} Verify
              </button>
              <button
                type="button"
                onClick={() => { setPendingToken(null); setTwoFaCode(""); setError(null); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back to sign in
              </button>
            </form>
          ) : mode === "forgot" ? (
            resetSent ? (
              <div className="text-center space-y-3 py-2">
                <p className="text-sm">If that email is registered, a reset link has been sent.</p>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setResetSent(false); }}
                  className="text-xs text-primary hover:underline"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-muted-foreground">Enter your account email and we'll send a password reset link.</p>
                <Field label="Email address">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={patch("email")}
                    required
                    className="input-base"
                  />
                </Field>
                {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />} Send reset link
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  ← Back to sign in
                </button>
              </form>
            )
          ) : (
          <>
          {/* Toggle */}
          <div className="flex bg-background border border-border rounded-full p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "register" ? 12 : -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Register-only fields */}
              {mode === "register" && (
                <>
                  <Field label="Full name · पूरा नाम">
                    <input
                      type="text"
                      placeholder="Ramesh Kumar"
                      value={form.full_name}
                      onChange={patch("full_name")}
                      required
                      className="input-base"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Craft type">
                      <select
                        value={form.craft_type}
                        onChange={patch("craft_type")}
                        className="input-base"
                      >
                        {CRAFT_TYPES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Location · शहर">
                      <input
                        type="text"
                        placeholder="Jaipur, India"
                        value={form.location}
                        onChange={patch("location")}
                        required
                        className="input-base"
                      />
                    </Field>
                  </div>
                  {/* Honeypot — off-screen, not display:none (some bots skip that), so
                      naive form-filling bots still populate it while sighted humans and
                      screen readers never encounter it. Any value here fails registration
                      server-side (RegisterRequest.website). */}
                  <div
                    style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
                    aria-hidden="true"
                  >
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={patch("website")}
                    />
                  </div>
                </>
              )}

              <Field label="Email address">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={patch("email")}
                  required
                  autoComplete="email"
                  className="input-base"
                />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                    value={form.password}
                    onChange={patch("password")}
                    required
                    minLength={mode === "register" ? 8 : undefined}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="input-base pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(null); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </Field>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {loading
                  ? "Please wait…"
                  : mode === "login"
                  ? "Sign in to ArtisanGPS"
                  : "Create my account"}
              </button>

              {/* Demo hint */}
              {mode === "login" && (
                <p className="text-center text-xs text-muted-foreground font-data pt-1">
                  Demo:{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        email: "ramesh@example.com",
                        password: "password123",
                      }))
                    }
                  >
                    fill demo credentials
                  </button>
                </p>
              )}
            </motion.form>
          </AnimatePresence>
          </>
          )}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          By continuing you agree to our terms.
          <br />
          © 2026 ArtisanGPS · बहीखाता
        </p>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-data">
      {label}
    </label>
    {children}
  </div>
);

export default Login;
