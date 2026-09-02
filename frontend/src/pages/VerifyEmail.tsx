import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { confirmEmailVerification } from "@/lib/api";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing verification token.");
      return;
    }
    // The token is single-use; guard against StrictMode's double effect
    // invocation (and any remount) re-sending it and turning a success into
    // a false "invalid token" error.
    if (attempted.current === token) return;
    attempted.current = token;
    confirmEmailVerification(token)
      .then(() => setStatus("success"))
      .catch((e) => {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Verification failed.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-paper">
        {status === "loading" && (
          <>
            <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Verifying your email…</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={32} className="text-forest mx-auto mb-4" />
            <div className="font-display text-xl mb-2">Email verified</div>
            <p className="text-sm text-muted-foreground mb-6">Your email address has been confirmed.</p>
            <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
              Go to dashboard
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={32} className="text-destructive mx-auto mb-4" />
            <div className="font-display text-xl mb-2">Verification failed</div>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Link to="/login" className="inline-block px-5 py-2.5 rounded-full border border-border text-sm hover:bg-muted">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
