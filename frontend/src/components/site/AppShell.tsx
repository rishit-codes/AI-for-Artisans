import { Link, NavLink, useLocation } from "react-router-dom";
import { Bell, Compass, Home, LineChart, Search, Settings, Store, TrendingUp, User } from "lucide-react";
import { ReactNode } from "react";

const nav = [
  { to: "/dashboard", icon: Home, label: "Home", hindi: "घर" },
  { to: "/trends", icon: TrendingUp, label: "Trends", hindi: "रुझान" },
  { to: "/mandi", icon: Store, label: "Mandi", hindi: "मंडी" },
  { to: "/advisor", icon: Compass, label: "Advisor", hindi: "सलाहकार" },
  { to: "/reports", icon: LineChart, label: "Reports", hindi: "रिपोर्ट" },
  { to: "/profile", icon: User, label: "Profile", hindi: "प्रोफ़ाइल" },
];

export const AppShell = ({
  children,
  title,
  hindi,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  hindi: string;
  subtitle?: string;
}) => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background-deep text-foreground">
      <div className="grid lg:grid-cols-[240px_1fr] min-h-screen">
        <aside className="hidden lg:flex flex-col bg-background border-r border-border p-5 sticky top-0 h-screen">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display text-lg">अ</div>
            <div>
              <div className="font-display text-lg leading-none">ArtisanGPS</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">बहीखाता</div>
            </div>
          </Link>
          <nav className="flex-1 space-y-1">
            {nav.map((it) => {
              const active = pathname === it.to;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-primary/15 text-foreground font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <it.icon size={16} />
                  <span>{it.label}</span>
                  <span className="ml-auto font-hindi text-xs opacity-60">{it.hindi}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 p-4 rounded-xl bg-secondary text-secondary-foreground">
            <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 font-data">Cluster</div>
            <div className="font-display text-lg mt-1">Varanasi · Weave</div>
            <div className="text-xs opacity-70 mt-1 font-hindi">वाराणसी · बुनकर समूह</div>
          </div>
        </aside>

        <div className="flex flex-col min-w-0">
          <header>
            <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl flex items-center gap-4 px-5 lg:px-8 h-16 border-b border-border">
              <div className="flex items-center gap-2 max-w-md w-full lg:w-80 mr-auto border border-border rounded-full px-3 py-1.5 bg-card/40">
                <Search size={16} className="text-muted-foreground" />
                <input
                  placeholder="Search SKUs, mandi, festivals…"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
              </div>
              <button className="relative p-2 rounded-full hover:bg-muted">
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
              </button>
              <NavLink to="/settings" className="p-2 rounded-full hover:bg-muted" aria-label="Settings"><Settings size={16} /></NavLink>
              <NavLink to="/profile" className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground grid place-items-center text-sm font-display hover:opacity-90">र</NavLink>
            </div>
            <div className="px-5 lg:px-8 pb-5 pt-2">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h1 className="font-display text-3xl lg:text-4xl tracking-tight">{title}</h1>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-data ml-auto">{hindi}</div>
                  </div>
                  {subtitle && <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{subtitle}</p>}
                </div>
                <div className="text-xs font-data text-muted-foreground">
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-5 lg:p-8 space-y-8">
            {children}
            <footer className="pt-8 pb-4 text-xs text-muted-foreground font-data flex items-center justify-between border-t border-border">
              <span>ArtisanGPS · बहीखाता v0.4 · {new Date().getFullYear()}</span>
              <Link to="/" className="hover:text-foreground">← home</Link>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
