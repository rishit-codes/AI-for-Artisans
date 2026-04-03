import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import "./Constraints.css";

// ── Icons ──────────────────────────────────────────────────────────────────────

const LogoLeaf = () => (
    <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
        <path d="M20 30 C20 30 8 26 8 14 C8 14 14 16 18 24" fill="#22c55e" />
        <path d="M20 30 C20 30 32 26 32 14 C32 14 26 16 22 24" fill="#22c55e" />
        <path d="M20 30 C20 30 14 18 20 8 C26 18 20 30 20 30Z" fill="#16a34a" />
    </svg>
);

const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 4l9 8v8a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1v-8z" fill="none" />
    </svg>
);

const TrendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

const MaterialIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
);

const CraftsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

const CartIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.98-1.69L23 6H6" />
    </svg>
);

const navItems = [
    { href: "/home", label: "Home", Icon: HomeIcon },
    { href: "/trends", label: "Trends", Icon: TrendIcon },
    { href: "/constraints", label: "Material Costs", Icon: MaterialIcon },
    { href: "/my-crafts", label: "My Crafts", Icon: CraftsIcon },
];

// ── Sparkline SVG (inline mini chart) ─────────────────────────────────────────

function Sparkline({ points, color, fill }) {
    return (
        <svg viewBox="0 0 120 40" className="sparkline-chart" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${fill} Z`} fill={`url(#grad-${color.replace('#', '')})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── Commodity price cards ──────────────────────────────────────────────────────

// static constants moved to dynamic component state

// ── Skeleton Loaders ────────────────────────────────────────────────────────────

const SkeletonPriceCard = () => (
    <div className="price-card animate-pulse opacity-70">
        <div className="card-top">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                <div className="w-20 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="price-display mt-4">
            <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
        </div>
        <div className="w-full h-10 mt-6 bg-gradient-to-r from-gray-100 to-gray-50 rounded"></div>
    </div>
);

const SkeletonMandiRow = () => (
    <tr className="animate-pulse opacity-60">
        <td>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-16"></div>
        </td>
        <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    </tr>
);

export default function MaterialCostsPage() {
    const location = useLocation();
    const pathname = location.pathname;
    const [activeTab, setActiveTab] = useState("Textiles");
    const [commodities, setCommodities] = useState([]);
    const [mandiData, setMandiData] = useState({ Textiles: [], Metals: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [commRes, mandiTexts, mandiMetals] = await Promise.all([
                    api.get('/materials/commodities'),
                    api.get('/materials/mandi?category=Textiles'),
                    api.get('/materials/mandi?category=Metals')
                ]);

                const mappedComm = commRes.data.map(item => {
                    let icon;
                    if (item.name.includes("Cotton")) {
                        icon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>;
                    } else if (item.name.includes("Silk")) {
                        icon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M12 7V5m0 14v-2" /></svg>;
                    } else if (item.name.includes("Brass")) {
                        icon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8"><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2" /></svg>;
                    } else {
                        icon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8"><path d="M12 3v18M5 7l7-4 7 4M5 17l7 4 7-4" /></svg>;
                    }

                    return {
                        name: item.name.replace(" ", "\n"),
                        price: item.price,
                        unit: item.unit,
                        change: item.change_pct,
                        trend: item.trend,
                        color: item.color,
                        points: item.sparkline_points,
                        fill: `M${item.sparkline_points} L120,40 L0,40`,
                        icon
                    };
                });
                setCommodities(mappedComm);

                const mapMandi = (rows) => rows.map(r => ({
                    commodity: r.commodity,
                    sub: r.sub,
                    local: { value: r.local_price, best: r.local_best },
                    surat: { value: r.surat_price, best: r.surat_best },
                    delhi: { value: r.delhi_price, best: r.delhi_best },
                    action: r.action
                }));

                setMandiData({
                    Textiles: mapMandi(mandiTexts.data),
                    Metals: mapMandi(mandiMetals.data)
                });

            } catch (error) {
                console.error("Error fetching material data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const topNavTabs = (
        <div className="topbar-nav-links">
            <Link to="/trends" className={`nav-link ${pathname === '/trends' ? 'active-link' : ''}`}>Trends</Link>
            <Link to="/production-advisor" className={`nav-link ${pathname === '/production-advisor' ? 'active-link' : ''}`}>Production Advisor</Link>
            <Link to="/constraints" className={`nav-link ${pathname === '/constraints' ? 'active-link' : ''}`}>Material Costs</Link>
        </div>
    );

    return (
        <DashboardLayout headerActions={topNavTabs}>
            <div className="constraints-content-wrapper">

                {/* Scrollable Content */}
                <div className="constraints-body">

                    {/* ── Page Header ── */}
                    <motion.div
                        className="page-header"
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    >
                        <div>
                            <h1 className="page-title">Material Costs & Alerts</h1>
                            <p className="page-subtitle">Live tracking and AI predictions for your key commodities.</p>
                        </div>
                        <div className="header-actions">
                            <div className="market-status-pill">
                                <span className="pulse-dot" />
                                Live Market Open
                            </div>
                            <button className="icon-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M4 6h16M4 12h16M4 18h10" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>

                    {/* ── AI Prediction Banner ── */}
                    <motion.div
                        className="ai-banner"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {/* Sparkle icon */}
                        <div className="sparkle-icon-box">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2l1.2 5.8L19 9l-5.8 1.2L12 16l-1.2-5.8L5 9l5.8-1.2L12 2z" fill="#22c55e" />
                                <path d="M5 3l.6 2.4L8 6l-2.4.6L5 9l-.6-2.4L2 6l2.4-.6L5 3z" fill="#86efac" />
                            </svg>
                        </div>
                        <div className="ai-banner-content">
                            <p className="ai-banner-label">AI Market Prediction</p>
                            <h2 className="ai-banner-title">Buy Cotton Yarn Now</h2>
                            <p className="ai-banner-desc">
                                Prices for 40s count cotton yarn are expected to rise by 8–12% next week due to reduced supply from Gujarat mills. Stocking up today will optimize your margins for the upcoming festive season.
                            </p>
                        </div>
                        <button className="find-suppliers-btn">
                            <CartIcon />
                            Find Suppliers
                        </button>
                    </motion.div>

                    {/* ── Price Cards Grid ── */}
                    {loading ? (
                        <div className="cards-grid">
                            <SkeletonPriceCard />
                            <SkeletonPriceCard />
                            <SkeletonPriceCard />
                            <SkeletonPriceCard />
                        </div>
                    ) : (
                        <motion.div
                            className="cards-grid"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            {commodities.map((item) => {
                            const isUp = item.trend === "up";
                            const isDown = item.trend === "down";
                            let trendClass = "trend-flat";
                            if (isUp) trendClass = "trend-up";
                            if (isDown) trendClass = "trend-down";

                            return (
                                <div key={item.name} className="price-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                                    <div className="card-top">
                                        <div className="card-title-group">
                                            <div className="card-icon">
                                                {item.icon}
                                            </div>
                                            <p className="card-name">{item.name}</p>
                                        </div>
                                        <span className={`change-badge ${trendClass}`}>
                                            {isUp && "↑ "}
                                            {isDown && "↓ "}
                                            {item.change}
                                        </span>
                                    </div>

                                    <div className="price-display">
                                        <span className="price-value">{item.price}</span>
                                        <span className="price-unit">{item.unit}</span>
                                    </div>

                                    {/* Mini sparkline */}
                                    <Sparkline points={item.points} color={item.color} fill={item.fill} />
                                </div>
                            );
                        })}
                        </motion.div>
                    )}

                    {/* ── Local Mandi Comparison ── */}
                    <motion.div
                        className="mandi-comparison-box"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        {/* Header */}
                        <div className="mandi-header">
                            <div>
                                <h2 className="mandi-title">Local Mandi Comparison</h2>
                                <p className="mandi-subtitle">Prices updated 2 hours ago</p>
                            </div>
                            <div className="mandi-tabs">
                                {["Textiles", "Metals"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`mandi-tab-btn ${activeTab === tab ? "active" : ""}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="table-responsive">
                            <table className="mandi-table">
                                <thead>
                                    <tr>
                                        <th>Commodity</th>
                                        <th>Your Local (Varanasi)</th>
                                        <th>Surat Mandi</th>
                                        <th>Delhi Hub</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <>
                                            <SkeletonMandiRow />
                                            <SkeletonMandiRow />
                                            <SkeletonMandiRow />
                                            <SkeletonMandiRow />
                                        </>
                                    ) : (
                                        mandiData[activeTab] && mandiData[activeTab].map((row, i) => (
                                            <tr key={i}>
                                            <td>
                                                <p className="cell-title">{row.commodity}</p>
                                                <p className="cell-sub">{row.sub}</p>
                                            </td>
                                            <td>
                                                <span className={`cell-val ${row.local.best ? "val-best" : ""}`}>
                                                    {row.local.value}
                                                </span>
                                                {row.local.best && <span className="best-badge">Best</span>}
                                            </td>
                                            <td>
                                                <span className={`cell-val ${row.surat.best ? "val-best" : ""}`}>
                                                    {row.surat.value}
                                                </span>
                                                {row.surat.best && <span className="best-badge">Best</span>}
                                            </td>
                                            <td>
                                                <span className={`cell-val ${row.delhi.best ? "val-best" : ""}`}>
                                                    {row.delhi.value}
                                                </span>
                                                {row.delhi.best && <span className="best-badge">Best</span>}
                                            </td>
                                            <td>
                                                <button className="action-link">
                                                    {row.action}
                                                </button>
                                            </td>
                                        </tr>
                                    )))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Bottom padding */}
                    <div style={{ height: "1rem" }} />
                </div>
            </div>
        </DashboardLayout>
    );
}
