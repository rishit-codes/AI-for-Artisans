import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home, Search } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-6 overflow-hidden relative">
      <div className="absolute inset-0 grain opacity-[0.08] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-30 blur-3xl"
           style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)" }} />
      <div className="absolute -bottom-40 -left-40 w-[36rem] h-[36rem] rounded-full opacity-30 blur-3xl"
           style={{ background: "radial-gradient(circle, hsl(var(--secondary) / 0.4), transparent 70%)" }} />

      <div className="relative max-w-2xl text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-data mb-6">
          404 · पृष्ठ नहीं मिला
        </div>

        <div className="font-display text-[10rem] md:text-[14rem] leading-none tracking-tighter">
          <span className="italic text-muted-foreground/40">4</span>
          <span className="text-primary">०</span>
          <span className="italic text-muted-foreground/40">4</span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl mt-2 tracking-tight text-balance">
          The loom you were looking for<br />
          <span className="italic text-muted-foreground">isn't on this page.</span>
        </h1>

        <p className="mt-5 text-muted-foreground max-w-md mx-auto">
          It may have moved to a different cluster, or this thread was never woven.
          Let's get you back to the ledger.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
            <ArrowLeft size={14} /> Back to landing
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-card hover:bg-muted transition-colors text-sm">
            <Home size={14} /> Open dashboard
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-border max-w-sm mx-auto">
          <div className="flex items-center gap-2 px-4 py-3 rounded-full border border-border bg-card text-left">
            <Search size={14} className="text-muted-foreground" />
            <input placeholder="Search SKUs, mandi, festivals…" className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" />
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-data">
            requested · {location.pathname}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
