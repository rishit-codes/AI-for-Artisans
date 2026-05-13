export type Cluster =
  | "varanasi-weave"
  | "khurja-pottery"
  | "jaipur-block-print"
  | "moradabad-brass"
  | "channapatna-toys"
  | "kutch-embroidery";

export const CLUSTERS: { id: Cluster; label: string; hindi: string; craft: string; equipment: string }[] = [
  { id: "varanasi-weave", label: "Varanasi Weave", hindi: "वाराणसी बुनकर", craft: "Handloom silk", equipment: "looms" },
  { id: "khurja-pottery", label: "Khurja Pottery", hindi: "खुर्जा कुम्हार", craft: "Glazed ceramics", equipment: "wheels" },
  { id: "jaipur-block-print", label: "Jaipur Block Print", hindi: "जयपुर छपाई", craft: "Hand block print", equipment: "tables" },
  { id: "moradabad-brass", label: "Moradabad Brass", hindi: "मुरादाबाद पीतल", craft: "Brassware", equipment: "forges" },
  { id: "channapatna-toys", label: "Channapatna Toys", hindi: "चन्नपट्न खिलौने", craft: "Lacquered wood toys", equipment: "lathes" },
  { id: "kutch-embroidery", label: "Kutch Embroidery", hindi: "कच्छ कढ़ाई", craft: "Mirror & thread embroidery", equipment: "frames" },
];

export type Festival = "Diwali" | "Karwa Chauth" | "Wedding" | "Export-Holiday" | "Raksha Bandhan" | "Year-round";

export type Recommendation = {
  id: string;
  cluster: Cluster;
  product: string;
  hindi: string;
  thumb: string; // emoji placeholder
  baseBatch: number; // suggested at 30 units/week capacity
  unitMaterialCost: number;
  unitRevenue: number;
  leadDays: number;
  confidence: number; // 0..100
  festival: Festival;
  trend: number; // +/- percent
  rationale: string;
  materials: { name: string; perUnit: number; unit: string; mandi: string; pricePerUnit: number }[];
};

const r = (data: Recommendation): Recommendation => data;

export const RECOMMENDATIONS: Recommendation[] = [
  // Varanasi
  r({
    id: "vw-1", cluster: "varanasi-weave", product: "Banarasi wedding silk dupatta", hindi: "बनारसी दुपट्टा",
    thumb: "🧣", baseBatch: 12, unitMaterialCost: 1850, unitRevenue: 4200, leadDays: 9, confidence: 87,
    festival: "Wedding", trend: 38,
    rationale: "Wedding-silk queries on IndiaMart up 38% this fortnight. Surat raw silk down 4.2% — best buy window for 9 days.",
    materials: [
      { name: "Mulberry silk yarn", perUnit: 0.4, unit: "kg", mandi: "Surat", pricePerUnit: 3200 },
      { name: "Zari thread", perUnit: 0.05, unit: "kg", mandi: "Varanasi", pricePerUnit: 9800 },
    ],
  }),
  r({
    id: "vw-2", cluster: "varanasi-weave", product: "Hand-block printed dupatta", hindi: "हाथ छपाई दुपट्टा",
    thumb: "🪷", baseBatch: 18, unitMaterialCost: 420, unitRevenue: 1100, leadDays: 5, confidence: 81,
    festival: "Diwali", trend: 22,
    rationale: "Diwali gifting demand climbing in Delhi NCR. Festival proximity 24 days — ship by Oct 18.",
    materials: [
      { name: "Cotton base cloth", perUnit: 1.4, unit: "m", mandi: "Surat", pricePerUnit: 180 },
      { name: "Natural dyes", perUnit: 0.05, unit: "kg", mandi: "Bagru", pricePerUnit: 1400 },
    ],
  }),
  r({
    id: "vw-3", cluster: "varanasi-weave", product: "Festive stole · zari border", hindi: "ज़री स्टोल",
    thumb: "🎀", baseBatch: 22, unitMaterialCost: 380, unitRevenue: 980, leadDays: 4, confidence: 74,
    festival: "Karwa Chauth", trend: 14,
    rationale: "Karwa Chauth pre-orders typically peak T-21 days — that window opens this week.",
    materials: [
      { name: "Tussar silk", perUnit: 0.25, unit: "kg", mandi: "Bhagalpur", pricePerUnit: 2800 },
      { name: "Zari trim", perUnit: 1.6, unit: "m", mandi: "Varanasi", pricePerUnit: 95 },
    ],
  }),

  // Khurja
  r({
    id: "kh-1", cluster: "khurja-pottery", product: "Cobalt serving bowls (set of 4)", hindi: "नीली कटोरी",
    thumb: "🥣", baseBatch: 15, unitMaterialCost: 240, unitRevenue: 760, leadDays: 14, confidence: 82,
    festival: "Karwa Chauth", trend: 24,
    rationale: "Glazed cobalt + ivory moving fast in Delhi NCR. 14-day lead time fits the festival window.",
    materials: [
      { name: "Stoneware clay", perUnit: 1.8, unit: "kg", mandi: "Khurja", pricePerUnit: 28 },
      { name: "Cobalt oxide glaze", perUnit: 0.06, unit: "kg", mandi: "Delhi", pricePerUnit: 1900 },
    ],
  }),
  r({
    id: "kh-2", cluster: "khurja-pottery", product: "Diwali diya gift box (12-pc)", hindi: "दीया सेट",
    thumb: "🪔", baseBatch: 30, unitMaterialCost: 95, unitRevenue: 320, leadDays: 7, confidence: 91,
    festival: "Diwali", trend: 61,
    rationale: "Diya demand will lift +61% in 19 days. Pre-orders already 2.3× last year's pace.",
    materials: [
      { name: "Terracotta clay", perUnit: 1.2, unit: "kg", mandi: "Khurja", pricePerUnit: 18 },
      { name: "Gold-leaf paint", perUnit: 0.01, unit: "kg", mandi: "Moradabad", pricePerUnit: 4200 },
    ],
  }),
  r({
    id: "kh-3", cluster: "khurja-pottery", product: "Glazed planter · indoor", hindi: "गमला",
    thumb: "🪴", baseBatch: 10, unitMaterialCost: 180, unitRevenue: 520, leadDays: 12, confidence: 68,
    festival: "Year-round", trend: 8,
    rationale: "Steady year-round demand from urban interiors. Good filler between festival pushes.",
    materials: [
      { name: "Stoneware clay", perUnit: 2.4, unit: "kg", mandi: "Khurja", pricePerUnit: 28 },
      { name: "Matte glaze", perUnit: 0.08, unit: "kg", mandi: "Delhi", pricePerUnit: 1100 },
    ],
  }),

  // Jaipur
  r({
    id: "jp-1", cluster: "jaipur-block-print", product: "Indigo bedsheet set", hindi: "नीला बिछौना",
    thumb: "🛏️", baseBatch: 8, unitMaterialCost: 620, unitRevenue: 1850, leadDays: 6, confidence: 79,
    festival: "Diwali", trend: 19,
    rationale: "Festive home-textile gifting up 19% on Jaypore and Okhai this fortnight.",
    materials: [
      { name: "Cotton cloth", perUnit: 5.2, unit: "m", mandi: "Bagru", pricePerUnit: 110 },
      { name: "Indigo dye", perUnit: 0.08, unit: "kg", mandi: "Bagru", pricePerUnit: 1800 },
    ],
  }),
  r({
    id: "jp-2", cluster: "jaipur-block-print", product: "Block-print kurta panel", hindi: "कुर्ता पैनल",
    thumb: "👘", baseBatch: 20, unitMaterialCost: 280, unitRevenue: 720, leadDays: 4, confidence: 73,
    festival: "Wedding", trend: 12,
    rationale: "Wedding season kurta panels show steady B2B demand from Jaipur exporters.",
    materials: [
      { name: "Cotton cloth", perUnit: 2.4, unit: "m", mandi: "Bagru", pricePerUnit: 110 },
      { name: "Madder red dye", perUnit: 0.04, unit: "kg", mandi: "Bagru", pricePerUnit: 1600 },
    ],
  }),

  // Moradabad
  r({
    id: "mb-1", cluster: "moradabad-brass", product: "Engraved brass planter", hindi: "पीतल का गमला",
    thumb: "🏺", baseBatch: 6, unitMaterialCost: 940, unitRevenue: 2400, leadDays: 18, confidence: 84,
    festival: "Export-Holiday", trend: 32,
    rationale: "Strong export pull from Germany & Netherlands. Indigo-finish lines outperforming antique 1.6×.",
    materials: [
      { name: "Brass sheet", perUnit: 1.6, unit: "kg", mandi: "Moradabad", pricePerUnit: 580 },
      { name: "Indigo patina", perUnit: 0.05, unit: "kg", mandi: "Moradabad", pricePerUnit: 800 },
    ],
  }),
  r({
    id: "mb-2", cluster: "moradabad-brass", product: "Diya · brass with stand", hindi: "पीतल दीया",
    thumb: "🕯️", baseBatch: 25, unitMaterialCost: 180, unitRevenue: 540, leadDays: 8, confidence: 88,
    festival: "Diwali", trend: 44,
    rationale: "Brass diya queries climbing fast — Diwali T-19 days. Lock raw stock now.",
    materials: [
      { name: "Brass scrap", perUnit: 0.4, unit: "kg", mandi: "Moradabad", pricePerUnit: 520 },
    ],
  }),

  // Channapatna
  r({
    id: "cp-1", cluster: "channapatna-toys", product: "Wooden rattle · natural dye", hindi: "लकड़ी झुनझुना",
    thumb: "🪀", baseBatch: 30, unitMaterialCost: 60, unitRevenue: 220, leadDays: 5, confidence: 76,
    festival: "Year-round", trend: 11,
    rationale: "Eco-toy demand steady on FirstCry & Etsy. Natural-dye certification adds 28% margin.",
    materials: [
      { name: "Ivory wood", perUnit: 0.2, unit: "kg", mandi: "Channapatna", pricePerUnit: 240 },
      { name: "Natural lac", perUnit: 0.02, unit: "kg", mandi: "Channapatna", pricePerUnit: 800 },
    ],
  }),
  r({
    id: "cp-2", cluster: "channapatna-toys", product: "Stacking ring set", hindi: "रिंग सेट",
    thumb: "🧸", baseBatch: 18, unitMaterialCost: 140, unitRevenue: 480, leadDays: 7, confidence: 82,
    festival: "Diwali", trend: 26,
    rationale: "Diwali gifting + Montessori parent demand on Instagram converging this month.",
    materials: [
      { name: "Ivory wood", perUnit: 0.4, unit: "kg", mandi: "Channapatna", pricePerUnit: 240 },
      { name: "Natural lac", perUnit: 0.05, unit: "kg", mandi: "Channapatna", pricePerUnit: 800 },
    ],
  }),

  // Kutch
  r({
    id: "kt-1", cluster: "kutch-embroidery", product: "Mirror-work cushion cover", hindi: "कुशन कवर",
    thumb: "🪞", baseBatch: 12, unitMaterialCost: 320, unitRevenue: 980, leadDays: 10, confidence: 80,
    festival: "Diwali", trend: 21,
    rationale: "Home-décor gifting peaks T-15 days. Mirror-work cushions averaged ₹980 across Jaypore last quarter.",
    materials: [
      { name: "Cotton base", perUnit: 0.6, unit: "m", mandi: "Bhuj", pricePerUnit: 220 },
      { name: "Mirror discs", perUnit: 24, unit: "pcs", mandi: "Bhuj", pricePerUnit: 3 },
      { name: "Embroidery thread", perUnit: 0.04, unit: "kg", mandi: "Bhuj", pricePerUnit: 1800 },
    ],
  }),
  r({
    id: "kt-2", cluster: "kutch-embroidery", product: "Embroidered yoke · kurta", hindi: "कढ़ाई यॉक",
    thumb: "🧵", baseBatch: 14, unitMaterialCost: 220, unitRevenue: 680, leadDays: 6, confidence: 71,
    festival: "Wedding", trend: 9,
    rationale: "Wedding designers in Mumbai sourcing yoke pieces — steady B2B channel.",
    materials: [
      { name: "Cotton base", perUnit: 0.4, unit: "m", mandi: "Bhuj", pricePerUnit: 220 },
      { name: "Embroidery thread", perUnit: 0.06, unit: "kg", mandi: "Bhuj", pricePerUnit: 1800 },
    ],
  }),
];

export const CLUSTER_BENCHMARKS: Record<Cluster, { avgUnitsPerWeek: number; avgRevenue: number }> = {
  "varanasi-weave": { avgUnitsPerWeek: 18, avgRevenue: 42000 },
  "khurja-pottery": { avgUnitsPerWeek: 26, avgRevenue: 38000 },
  "jaipur-block-print": { avgUnitsPerWeek: 14, avgRevenue: 36000 },
  "moradabad-brass": { avgUnitsPerWeek: 12, avgRevenue: 48000 },
  "channapatna-toys": { avgUnitsPerWeek: 32, avgRevenue: 28000 },
  "kutch-embroidery": { avgUnitsPerWeek: 16, avgRevenue: 31000 },
};
