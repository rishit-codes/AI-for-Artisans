import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../components/DashboardLayout";
import "./AddProduct.css";

// ── Icons ──────────────────────────────────────────────────────────────────────

const LeafIcon = () => (
    <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#E8F5EE" />
        <path d="M20 30 C20 30 8 26 8 14 C8 14 14 16 18 24" fill="#22c55e" />
        <path d="M20 30 C20 30 32 26 32 14 C32 14 26 16 22 24" fill="#22c55e" />
        <path d="M20 30 C20 30 14 18 20 8 C26 18 20 30 20 30Z" fill="#16a34a" />
    </svg>
);

const SparkleIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill="currentColor" />
        <path d="M5 3l.8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8L5 3z" fill="currentColor" opacity="0.6" />
    </svg>
);

const CameraAddIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
        <line x1="12" y1="11" x2="12" y2="15" />
        <line x1="10" y1="13" x2="14" y2="13" />
    </svg>
);

const RocketIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
        <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
);

const DollarCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="#1A6B3C" />
        <path d="M12 6v12M9 9.5c0-1.1.9-2 2-2h2a2 2 0 010 4h-2a2 2 0 000 4h2a2 2 0 002-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
);

const TrendUpIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A6B3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const InfoIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 4l9 8v8a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1v-8z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
    </svg>
);

const TrendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 17l5-5 4 4 6-7 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MaterialIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const CraftsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const navItems = [
    { href: "/home", label: "Home", Icon: HomeIcon },
    { href: "/trends", label: "Trends", Icon: TrendIcon },
    { href: "/constraints", label: "Material Costs", Icon: MaterialIcon },
    { href: "/my-crafts", label: "My Crafts", Icon: CraftsIcon },
];

// ── Trend bar chart (30-day) ───────────────────────────────────────────────────
const barHeights = [30, 35, 28, 40, 45, 38, 50, 55, 48, 62, 70, 80];

function TrendBars() {
    return (
        <div className="trend-bars-container">
            {barHeights.map((h, i) => (
                <div
                    key={i}
                    className="trend-bar-item"
                    style={{
                        height: `${h}%`,
                        backgroundColor: i >= 8 ? "#1A6B3C" : i >= 5 ? "#4ade80" : "#bbf7d0",
                    }}
                />
            ))}
        </div>
    );
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ value, color = "#1A6B3C" }) {
    return (
        <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
    );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className={`toggle-btn ${on ? "active" : "inactive"}`}
        >
            <span
                className={`toggle-knob ${on ? "moved" : ""}`}
            />
        </button>
    );
}

// ── Page component ─────────────────────────────────────────────────────────────
export default function AddProductPage() {
    const { pathname } = useLocation();
    const [bgRemoval, setBgRemoval] = useState(true);
    const [keywords, setKeywords] = useState("");
    const [price, setPrice] = useState("1250");
    const [stockQty, setStockQty] = useState("1");
    const [category, setCategory] = useState("Textiles");
    const [generated, setGenerated] = useState(true); // show sample output by default

    const saveButton = (
        <button className="btn-upload" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: '#1A6B3C',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer'
        }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Save Product
        </button>
    );

    return (
        <DashboardLayout headerActions={saveButton}>
            <div className="add-product-body">
                <div className="ap-scroll-area">
                    {/* ══ BODY ══ */}
                    <div className="ap-main-container">

                {/* Page Header */}
                <motion.div 
                    className="ap-header"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                >
                    <div>
                        <h1 className="ap-title">Add New Product</h1>
                        <p className="ap-subtitle">Let AI assist you in creating a professional listing for the global market.</p>
                    </div>
                    <div className="ai-status-pill">
                        <SparkleIcon size={13} />
                        AI ASSISTANT ACTIVE
                    </div>
                </motion.div>

                {/* ── Two-column layout ── */}
                <div className="ap-content-grid">

                    {/* ══ LEFT: IMAGE PANEL ══ */}
                    <motion.div 
                        className="ap-left-col"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >

                        {/* Split preview card */}
                        <div className="image-preview-card">
                            {/* Left half — Original */}
                            <div className="preview-original">
                                <img
                                    src="/images/ceramic_vase.jpg"
                                    alt="Original"
                                    className="preview-img original-img"
                                />
                            </div>
                            {/* Right half — AI Enhanced */}
                            <div className="preview-enhanced">
                                <div className="enhanced-wrapper-outer">
                                    <div className="enhanced-wrapper-inner">
                                        <img
                                            src="/images/ceramic_vase.jpg"
                                            alt="AI Enhanced"
                                            className="preview-img"
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Divider line */}
                            <div className="preview-divider" />
                            {/* Icon on divider */}
                            <div className="preview-divider-icon">
                                <SparkleIcon size={14} />
                            </div>
                            {/* Badges */}
                            <div className="badge-original">
                                <span>Original</span>
                            </div>
                            <div className="badge-enhanced">
                                <span>AI Enhanced</span>
                            </div>
                        </div>

                        {/* AI Background Removal toggle */}
                        <div className="bg-removal-toggle">
                            <div className="toggle-info">
                                <div className="toggle-icon">
                                    <SparkleIcon size={16} />
                                </div>
                                <div>
                                    <p className="toggle-title">AI Background Removal</p>
                                    <p className="toggle-desc">Automatically remove clutter from your photo</p>
                                </div>
                            </div>
                            <Toggle on={bgRemoval} onToggle={() => setBgRemoval(!bgRemoval)} />
                        </div>

                        {/* Photo grid */}
                        <div className="photo-grid">
                            {/* First slot — filled */}
                            <div className="photo-slot photo-slot-active">
                                <img src="/images/ceramic_vase.jpg" alt="Photo 1" className="photo-slot-img" />
                            </div>
                            {/* Empty slots */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="photo-slot photo-slot-empty">
                                    <CameraAddIcon />
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ══ RIGHT: DETAILS PANEL ══ */}
                    <motion.div 
                        className="ap-right-col"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >

                        {/* Title + Material row */}
                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">Product Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Blue Silk Scarf"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Base Material</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Pure Mulberry Silk"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        {/* AI Description Generator */}
                        <div className="ai-desc-box">
                            <div className="ai-desc-header">
                                <div className="ai-desc-icon">
                                    <SparkleIcon size={13} />
                                </div>
                                <h3 className="ai-desc-title">AI Description Generator</h3>
                            </div>
                            <p className="ai-desc-subtitle">Enter keywords (e.g., 'blue silk, floral pattern, hand-woven')</p>
                            <div className="ai-desc-input-row">
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="Type keywords here..."
                                    className="ai-desc-input"
                                />
                                <button
                                    onClick={() => setGenerated(true)}
                                    className="btn-generate"
                                >
                                    Generate
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                </button>
                            </div>

                            {/* Bilingual output */}
                            {generated && (
                                <div className="ai-output-grid">
                                    <div className="ai-output-box">
                                        <p className="ai-output-lang lang-en">English</p>
                                        <p className="ai-output-text">
                                            Exquisite hand-woven scarf crafted from pure mulberry silk. Featuring a vibrant floral pattern in deep ocean blues, this piece embodies traditional craftsmanship with a modern touch.
                                        </p>
                                    </div>
                                    <div className="ai-output-box">
                                        <p className="ai-output-lang lang-hi">Hindi (हिंदी)</p>
                                        <p className="ai-output-text">
                                            शुद्ध शहतूत रेशम से तैयार किया गया उत्तम हाथ से बुना हुआ दुपट्टा। गहरे समुद्री नीले रंग में एक जीवंत पुष्प पैटर्न की विशेषता...
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Price + Stock + Category */}
                        <div className="form-row-2 gap-4">
                            {/* Left: price + trend chart */}
                            <div className="price-trends-col">
                                <div>
                                    <div className="form-label-group">
                                        <label className="form-label mb-0">Price (₹)</label>
                                        <span className="info-icon"><InfoIcon /></span>
                                    </div>
                                    <div className="price-input-row">
                                        <input
                                            type="text"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="price-input"
                                        />
                                        {/* Market reference bars */}
                                        <div className="market-ref-bars">
                                            <div className="market-ref-item">
                                                <div className="market-ref-bar bar-avg" style={{ width: "62%" }} />
                                                <span className="market-ref-label">Market Avg (₹950)</span>
                                            </div>
                                            <div className="market-ref-item">
                                                <div className="market-ref-bar bar-top" style={{ width: "85%" }} />
                                                <span className="market-ref-label">Top Comp (₹1400)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 30-day chart */}
                                <div className="trend-chart-box">
                                    <div className="trend-chart-header">
                                        <span className="trend-chart-title">30-Day Market Price Trend</span>
                                        <span className="trend-chart-badge">+4.2% demand increase</span>
                                    </div>
                                    <TrendBars />
                                </div>
                            </div>

                            {/* Right: Stock + Category */}
                            <div className="stock-cat-col">
                                <div className="form-group">
                                    <label className="form-label">Stock Qty</label>
                                    <input
                                        type="number"
                                        value={stockQty}
                                        onChange={(e) => setStockQty(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <div className="select-wrapper">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="form-select"
                                        >
                                            {["Textiles", "Pottery", "Jewellery", "Woodwork", "Metalwork"].map((c) => (
                                                <option key={c}>{c}</option>
                                            ))}
                                        </select>
                                        <div className="select-icon">
                                            <ChevronDownIcon />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Pricing Insight */}
                        <div className="pricing-insight-box">
                            <div className="insight-icon">
                                <DollarCircleIcon />
                            </div>
                            <div>
                                <h4 className="insight-title">AI Pricing Insight: High Profitability Potential</h4>
                                <p className="insight-desc">
                                    Your price is 30% above the average market rate, but aligned with the "Artisanal Premium" segment. High demand for hand-woven silk is expected due to the upcoming festive season.{" "}
                                    <span className="insight-highlight">Estimated Margin: 65%</span> based on your ₹450 raw material cost estimate.
                                </p>
                            </div>
                        </div>

                        {/* Market Compatibility Check */}
                        <div className="mkt-compat-box">
                            <div className="mkt-compat-inner">
                                <div className="mkt-compat-content">
                                    <h4 className="mkt-compat-title">Market Compatibility Check</h4>
                                    <p className="mkt-compat-subtitle">Based on current trends in "Handmade Silk Textiles"</p>

                                    <div className="prog-bars">
                                        <div className="prog-item">
                                            <div className="prog-header">
                                                <span className="prog-label">Color Trend Match</span>
                                                <span className="prog-val">92%</span>
                                            </div>
                                            <ProgressBar value={92} />
                                        </div>
                                        <div className="prog-item">
                                            <div className="prog-header">
                                                <span className="prog-label">Pricing Sweet Spot</span>
                                                <span className="prog-val">Excellent</span>
                                            </div>
                                            <ProgressBar value={82} />
                                        </div>
                                    </div>
                                </div>

                                {/* HIGH DEMAND badge */}
                                <div className="mkt-compat-badge">
                                    <TrendUpIcon />
                                    <span className="badge-text">High Demand</span>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </div>
        </div>

            {/* ══ FOOTER ACTION BAR ══ */}
            <motion.div 
                className="ap-footer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
            >
                <button className="btn-save-draft">
                    Save Draft
                </button>
                <button className="btn-publish">
                    Save & Publish
                    <RocketIcon />
                </button>
            </motion.div>
            </div>
        </DashboardLayout>
    );
}
