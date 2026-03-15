import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";
import DashboardLayout from "../components/DashboardLayout";
import "./Home.css";

// ── Icons ────────────────────────────────────────────────────────────────────

const LogoIcon = () => (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 30 C20 30 8 26 8 14 C8 14 14 16 18 24" fill="#22c55e" />
        <path d="M20 30 C20 30 32 26 32 14 C32 14 26 16 22 24" fill="#22c55e" />
        <path d="M20 30 C20 30 14 18 20 8 C26 18 20 30 20 30Z" fill="#16a34a" />
    </svg>
);

const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 4l9 8v8a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1v-8z"
            stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
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

const LogoutIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 16l4-4m0 0l-4-4m4 4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const PlayIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7L8 5z" />
    </svg>
);

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
    </svg>
);

const ChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MicIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M5 10a7 7 0 0014 0M12 19v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const WalletIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="13.5" r="1.5" fill="currentColor" />
    </svg>
);

const TruckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M1 3h13v13H1zM14 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="5.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const navItems = [
    { href: "/home", label: "Home", Icon: HomeIcon },
    { href: "/trends", label: "Trends", Icon: TrendIcon },
    { href: "/constraints", label: "Material Costs", Icon: MaterialIcon },
    { href: "/my-crafts", label: "My Crafts", Icon: CraftsIcon },
];

export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const { user } = useAuth();
    
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard/summary');
                setDashboardData(response.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Get today's date
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    const dateString = today.toLocaleDateString('en-IN', options);

    return (
        <DashboardLayout>
            <div className="home-content">
                {/* Scrollable Body */}
                <div className="dashboard-body">

                    {/* ── Greeting ── */}
                    <motion.div
                        className="greeting-section"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div>
                            <h2 className="greeting-title">Namaste, {user?.full_name?.split(' ')[0] || 'Artisan'} ji</h2>
                            <p className="greeting-subtitle">
                                Here is your plan for <span className="highlight-green">{dateString}</span>
                            </p>
                        </div>
                        <div className="greeting-right">
                            <p className="next-market-label">Total Products</p>
                            <p className="next-market-value">{loading ? '...' : dashboardData?.total_products || 0}</p>
                        </div>
                    </motion.div>

                    {/* ── Priority Action Card ── */}
                    <motion.div
                        className="priority-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        {/* Left: Hero image */}
                        <div className="priority-image-container">
                            <div className="priority-badge">
                                <span className="priority-badge-text">
                                    <span className="badge-icon">!</span> PRIORITY ACTION
                                </span>
                            </div>
                            <img
                                src="/images/loom_weaving.png"
                                alt="Festive sarees for Diwali stock"
                                className="priority-image"
                            />
                        </div>

                        {/* Right: Content */}
                        <div className="priority-content">
                            <h3 className="priority-title">
                                Start Weaving for Diwali Stock
                            </h3>
                            <p className="priority-hindi">
                                दिवाली स्टॉक के लिए बुनाई शुरू करें
                            </p>
                            <p className="priority-desc">
                                Market demand for festive red & gold sarees is peaking. If you start today, you will catch the prime selling window next week.
                            </p>
                            <div className="priority-actions">
                                <button className="btn-solid-green" onClick={() => navigate('/production-advisor')}>
                                    <PlayIcon />
                                    Hear Instructions
                                </button>
                                <button className="btn-light-green" onClick={() => navigate('/constraints')}>
                                    <CheckIcon />
                                    Check Materials
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Market Insights & Nudges ── */}
                    <motion.div
                        className="insights-section"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <div className="section-header">
                            <div className="section-dot"></div>
                            <h3 className="section-title">Market Insights & Nudges</h3>
                        </div>

                        <div className="insights-grid">
                            {/* Card 1: Cost Saving */}
                            <div className="insight-card">
                                <div className="insight-blob green-blob"></div>

                                <div className="insight-content">
                                    <div className="insight-icon-circle green-bg">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="#1A6B3C" strokeWidth="2" />
                                            <path d="M12 8v8M9 10.5C9 9.12 10.34 8 12 8s3 1.12 3 2.5c0 1.38-1.34 2.5-3 2.5s-3 1.12-3 2.5C9 16.88 10.34 18 12 18s3-1.12 3-2.5"
                                                stroke="#1A6B3C" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <p className="insight-label label-green">COST SAVING</p>
                                    <h4 className="insight-title">Cotton Yarn Price Drop</h4>
                                    <p className="insight-desc">Down 15% in Jaipur Mandi today.</p>

                                    <button className="insight-btn dark-btn" onClick={() => navigate('/constraints')}>
                                        <div className="insight-btn-left">
                                            <div className="insight-btn-icon bg-green">
                                                <img src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=100&h=100&fit=crop" alt="Yarn rolls" />
                                            </div>
                                            <div className="insight-btn-text">
                                                <p className="btn-text-main text-white">Buy Bulk Now</p>
                                                <p className="btn-text-sub text-gray">बड़ी खरीदारी करें</p>
                                            </div>
                                        </div>
                                        <div className="text-white"><ChevronRight /></div>
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Design Trend */}
                            <div className="insight-card">
                                <div className="insight-blob orange-blob"></div>

                                <div className="insight-content">
                                    <div className="insight-icon-circle orange-bg">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                stroke="#D97706" strokeWidth="2" fill="none" />
                                        </svg>
                                    </div>
                                    <p className="insight-label label-orange">DESIGN TREND</p>
                                    <h4 className="insight-title">Peacock Motifs</h4>
                                    <p className="insight-desc">High demand in upcoming wedding season.</p>

                                    <button className="insight-btn orange-btn" onClick={() => navigate('/trends')}>
                                        <div className="insight-btn-left">
                                            <div className="insight-btn-icon bg-orange">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                                </svg>
                                            </div>
                                            <div className="insight-btn-text">
                                                <p className="btn-text-main text-brown text-left">View 3 Patterns</p>
                                                <p className="btn-text-sub text-brown text-left">3 डिज़ाइन देखें</p>
                                            </div>
                                        </div>
                                        <div className="text-brown">
                                            <ChevronRight />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Operations */}
                            <div className="insight-card">
                                <div className="insight-blob blue-blob"></div>

                                <div className="insight-content">
                                    <div className="insight-icon-circle blue-bg">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="#2563EB" strokeWidth="2" fill="none" />
                                        </svg>
                                    </div>
                                    <p className="insight-label label-blue">OPERATIONS</p>
                                    <h4 className="insight-title">Humidity Alert</h4>
                                    <p className="insight-desc">High humidity may affect dyeing process.</p>

                                    <button className="insight-btn blue-btn" onClick={() => navigate('/production-advisor')}>
                                        <div className="insight-btn-left">
                                            <div className="insight-btn-icon bg-blue">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                                                    <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 9l-5-5-5 5M12 4v12" />
                                                </svg>
                                            </div>
                                            <div className="insight-btn-text text-left">
                                                <p className="btn-text-main text-dark-blue">Dry Indoors</p>
                                                <p className="btn-text-sub text-dark-blue">अंदर सुखाएं</p>
                                            </div>
                                        </div>
                                        <div className="text-dark-blue">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 18l6-6-6-6" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Quick Questions ── */}
                    <motion.div
                        className="quick-actions-section"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <h3 className="section-title mb-4">Quick Questions</h3>
                        <div className="quick-actions-flex">
                            <button className="quick-action-btn" onClick={() => navigate('/production-advisor')}>
                                <MicIcon />
                                Ask Assistant
                            </button>
                            <button className="quick-action-btn" onClick={() => navigate('/constraints')}>
                                <WalletIcon />
                                Check Payments
                            </button>
                            <button className="quick-action-btn" onClick={() => navigate('/my-crafts')}>
                                <TruckIcon />
                                Track Shipment
                            </button>
                        </div>
                    </motion.div>

                </div>
            </div>
        </DashboardLayout>
    );
}
