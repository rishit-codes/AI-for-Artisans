const items = [
  "बनारसी silk · ₹2,840/m",
  "Cotton yarn · ↓ 4.2%",
  "Diwali · 12 days",
  "Block-print indigo · ↑ 8%",
  "Pashmina greasy · ₹6,120/kg",
  "Jaipur 31°C · drying day",
  "Bagru cluster · 142 active",
  "Brass scrap · ↓ 1.1%",
  "Eid-al-Adha · 58 days",
  "Surat mandi · live",
];

const Marquee = () => {
  const list = [...items, ...items];
  return (
    <section aria-hidden className="border-y border-border bg-background-deep py-4 overflow-hidden">
      <div className="flex gap-10 animate-marquee whitespace-nowrap font-data text-sm text-muted-foreground">
        {list.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <span className="text-primary">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default Marquee;
