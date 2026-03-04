import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../components/DashboardLayout";
import "./MyCrafts.css";

// ── Icons ──────────────────────────────────────────────────────────────────────

const LogoLeaf = () => (
    <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
        <path d="M20 30 C20 30 8 26 8 14 C8 14 14 16 18 24" fill="#22c55e" />
        <path d="M20 30 C20 30 32 26 32 14 C32 14 26 16 22 24" fill="#22c55e" />
        <path d="M20 30 C20 30 14 18 20 8 C26 18 20 30 20 30Z" fill="#16a34a" />
    </svg>
);

const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 4l9 8v8a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1v-8z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
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

const MaterialIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const TrendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 17l5-5 4 4 6-7 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 16l4-4m0 0l-4-4m4 4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const FilterIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="18" x2="14" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ── Nav items ──────────────────────────────────────────────────────────────────

const navItems = [
    { href: "/home", label: "Home", Icon: HomeIcon },
    { href: "/trends", label: "Trends", Icon: TrendIcon },
    { href: "/constraints", label: "Material Costs", Icon: MaterialIcon },
    { href: "/my-crafts", label: "My Crafts", Icon: CraftsIcon },
];

// ── Product data ───────────────────────────────────────────────────────────────

const badgeStyles = {
    "High Demand": { dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
    "Stable": { dot: "bg-green-400", text: "text-green-600", bg: "bg-green-50" },
    "Growing": { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    "Trending": { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
};

const products = [
    { id: 1, name: "Banarasi Silk Saree", material: "Hand-woven traditional silk", stock: 12, price: "₹18,500", badge: "High Demand", image: "/images/banarasi_saree.jpg" },
    { id: 2, name: "Hand-painted Pot", material: "Organic clay terracotta", stock: 45, price: "₹850", badge: "Stable", image: "/images/terracotta_pot.jpg" },
    { id: 3, name: "Brass Dhokra Art", material: "Lost-wax metal casting", stock: 8, price: "₹4,200", badge: "Growing", image: "/images/brass_dhokra.jpg" },
    { id: 4, name: "Pashmina Shawl", material: "Premium hand-spun wool", stock: 5, price: "₹25,000", badge: "High Demand", image: "/images/pashmina_shawl.jpg" },
    { id: 5, name: "Channapatna Toys", material: "Lacquered wood craft", stock: 32, price: "₹1,250", badge: "Trending", image: "/images/channapatna_toy.jpg" },
    { id: 6, name: "Jaipur Blue Pottery", material: "Quartz-based ceramic vase", stock: 18, price: "₹3,400", badge: "High Demand", image: "/images/ceramic_vase.jpg" },
];

// ── Product Card ───────────────────────────────────────────────────────────────

function ProductCard({ product }) {
    const badge = badgeStyles[product.badge];
    return (
        <div className="product-card">
            {/* Image */}
            <div className="product-image-container">
                <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                />
                {/* Badge */}
                <div className={`product-badge ${badge.bg} ${badge.text}`}>
                    <span className={`badge-dot ${badge.dot}`} />
                    {product.badge}
                </div>
            </div>

            {/* Info */}
            <div className="product-info">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-material">{product.material}</p>

                {/* Stock + Price */}
                <div className="product-stats">
                    <div>
                        <p className="stat-label">Stock</p>
                        <p className="stat-value">{product.stock} Units</p>
                    </div>
                    <div>
                        <p className="stat-label">Price</p>
                        <p className="stat-value-price">{product.price}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MyCraftsPage() {
    const location = useLocation();
    const pathname = location.pathname;
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All Categories");

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.material.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="mycrafts-content-wrapper">

                <div className="mycrafts-body">
                    {/* Page Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">My Crafts Inventory</h1>
                            <p className="page-subtitle">Manage your craft products and track market performance.</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-drafts">
                                View Drafts
                            </button>
                            <Link to="/add-product" className="btn-add-craft">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add New Craft
                            </Link>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <motion.div 
                        className="filter-controls"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        {/* Search */}
                        <div className="filter-search">
                            <div className="filter-search-icon">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search crafts..."
                                className="filter-search-input"
                            />
                        </div>

                        {/* Category dropdown */}
                        <div className="filter-select-wrapper">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="filter-select"
                            >
                                {["All Categories", "Textiles", "Pottery", "Metal Art", "Wood Craft", "Jewellery"].map((c) => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                            <div className="filter-select-icon">
                                <ChevronDownIcon />
                            </div>
                        </div>

                        {/* Filter button */}
                        <button className="btn-filter-icon">
                            <FilterIcon />
                        </button>
                    </motion.div>

                    {/* Product Grid */}
                    <motion.div 
                        className="product-grid"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        {filtered.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </motion.div>

                    {filtered.length === 0 && (
                        <div className="empty-state">
                            <p className="empty-state-text">No crafts found for "{search}"</p>
                        </div>
                    )}
            </div>
        </div>
    </DashboardLayout>
    );
}
