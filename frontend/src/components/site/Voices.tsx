import metalImg from "@/assets/craft-metal.jpg";
import potteryImg from "@/assets/craft-pottery.jpg";
import textileImg from "@/assets/craft-textile.jpg";

const voices = [
  {
    img: textileImg,
    name: "Sunita Devi",
    role: "Block-print, Bagru",
    quote:
      "पहले मैं फ़ोन करके दाम पूछती थी। अब सुबह उठकर बस ऐप खोलती हूँ — और जान जाती हूँ कि कितना बनाना है।",
    en: "I used to call around for prices. Now I open the app at sunrise and just know what to make.",
  },
  {
    img: potteryImg,
    name: "Ramesh Yadav",
    role: "Khurja pottery",
    quote:
      "Diwali se pehle 200 diye banaye. App ne kaha thi — bechne mein 4 din lage. Pehle 3 hafte lagte the.",
    en: "Made 200 diyas before Diwali. The app said so. Sold them in 4 days. Used to take three weeks.",
  },
  {
    img: metalImg,
    name: "Aisha Khan",
    role: "Brassware, Moradabad",
    quote:
      "मेरे लिए सबसे बड़ी बात — हिंदी में सलाह। अंग्रेज़ी की दुकानें मेरे लिए नहीं हैं।",
    en: "The biggest thing for me — advice in Hindi. The English-only apps aren't built for me.",
  },
];

const Voices = () => {
  return (
    <section id="voices" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.22em] text-primary font-data">· Voices ·</div>
          <h2 className="mt-4 font-display text-5xl lg:text-6xl tracking-tight">
            Three artisans.<br />
            <span className="italic text-secondary">Three honest mornings.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {voices.map((v, i) => (
            <article
              key={v.name}
              className={`group relative rounded-3xl border border-border bg-card overflow-hidden ${
                i === 1 ? "md:translate-y-8" : ""
              }`}
              style={{ boxShadow: "var(--shadow-paper)" }}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={v.img}
                  alt={v.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6">
                <div className="font-display text-xl text-secondary leading-snug font-hindi">
                  "{v.quote}"
                </div>
                <div className="text-xs text-muted-foreground mt-3 italic">{v.en}</div>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.role}</div>
                  </div>
                  <div className="font-display text-3xl text-primary opacity-30">{String(i + 1).padStart(2, "0")}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Voices;
