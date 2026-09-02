import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { confirmPasswordReset } from "@/lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token — use the link from your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-paper">
        {done ? (
          <div className="text-center">
            <CheckCircle2 size={32} className="text-forest mx-auto mb-4" />
            <div className="font-display text-xl mb-2">Password reset</div>
            <p className="text-sm text-muted-foreground mb-6">Sign in with your new password.</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="font-display text-xl mb-1">Set a new password</div>
            <p className="text-xs text-muted-foreground mb-2">Choose a new password for your account.</p>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-data">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
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
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />} Reset password
            </button>
            <Link to="/login" className="block text-center text-xs text-muted-foreground hover:text-foreground">
              ← Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
