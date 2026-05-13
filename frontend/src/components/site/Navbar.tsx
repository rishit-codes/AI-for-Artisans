import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Trends", href: "#trends" },
  { label: "Mandi", href: "#mandi" },
  { label: "Festivals", href: "#festivals" },
  { label: "Voices", href: "#voices" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/85 backdrop-blur-xl border-b border-border" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 group">
          <span className="relative w-9 h-9 grid place-items-center rounded-full bg-secondary text-secondary-foreground font-display text-lg">
            अ
            <span className="absolute -inset-1 rounded-full bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <div className="leading-none">
            <div className="font-display text-lg tracking-tight">ArtisanGPS</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-data">
              The Artisan's Ledger
            </div>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm text-foreground/75 hover:text-foreground transition-colors relative group"
            >
              {l.label}
              <span className="absolute left-4 right-4 bottom-1.5 h-px bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="/dashboard" className="text-sm text-foreground/70 hover:text-foreground">
            Sign in
          </a>
          <a
            href="#cta"
            className="text-sm font-medium px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-foreground transition-colors"
          >
            Open the Ledger →
          </a>
        </div>

        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg hover:bg-muted"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background border-t border-border px-6 py-4 flex flex-col gap-2">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 text-sm">
              {l.label}
            </a>
          ))}
          <a
            href="#cta"
            onClick={() => setOpen(false)}
            className="mt-2 text-center px-4 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm"
          >
            Open the Ledger
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
