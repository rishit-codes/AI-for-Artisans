import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import DashboardLayout from "../components/DashboardLayout";
import "./Trends.css";

// ── Icons ────────────────────────────────────────────────────────────────────

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

const HeartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

const CommentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

const ShareIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.6)" />
        <path d="M10 8l6 4-6 4V8z" fill="white" />
    </svg>
);

const navItems = [
    { href: "/home", label: "Home", Icon: HomeIcon },
    { href: "/trends", label: "Trends", Icon: TrendIcon },
    { href: "/constraints", label: "Material Costs", Icon: MaterialIcon },
    { href: "/my-crafts", label: "My Crafts", Icon: CraftsIcon },
];

const trendTabs = ["All Trends", "Wedding Season", "Cotton", "Sustainable Dyes"];

export default function TrendsPage() {
    const [activeTab, setActiveTab] = useState("All Trends");
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const pathname = location.pathname;

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const response = await api.get('/mocks/trends');
                setTrends(response.data);
            } catch (error) {
                console.error("Error fetching trends:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, []);

    const topNavTabs = (
        <div className="topbar-nav-links">
            <Link to="/trends" className={`nav-link ${pathname === '/trends' ? 'active-link' : ''}`}>Trends</Link>
            <Link to="/production-advisor" className={`nav-link ${pathname === '/production-advisor' ? 'active-link' : ''}`}>Production Advisor</Link>
            <Link to="/constraints" className={`nav-link ${pathname === '/constraints' ? 'active-link' : ''}`}>Material Costs</Link>
        </div>
    );

    // Filter logic
    const filteredTrends = activeTab === "All Trends" 
        ? trends 
        : trends.filter(t => t.tags.includes(activeTab.replace(' ', '')) || t.title.includes(activeTab) || t.content.includes(activeTab));

    return (
        <DashboardLayout headerActions={topNavTabs}>
            <div className="trends-content-wrapper">

                <div className="trends-body-wrapper">
                    <div className="trends-content">

                        {/* ══ TREND FEED ══ */}
                        <motion.div
                            className="feed-column"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                        >

                            {/* Filter Tabs Bar */}
                            <div className="filter-bar">
                                <button className="filter-icon-btn ml-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>

                                <div className="filter-tabs">
                                    {trendTabs.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`tab-btn ${activeTab === tab ? "active" : "inactive"}`}
                                        >
                                            <span className="tab-text">{tab.replace(' ', '\n')}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="filter-right pr-3">
                                    <div className="divider mx-4"></div>
                                    <button className="settings-btn">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                                            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading trends...</div>
                            ) : (
                                filteredTrends.map((trend) => (
                                    <div key={trend.id} className="trend-card">
                                        <div className="trend-card-header">
                                            <div className="header-info">
                                                <div className="avatar bg-amber-100 text-amber-700">
                                                    {trend.author.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="author-name">{trend.author}</h3>
                                                    <p className="post-meta">{trend.timestamp}</p>
                                                </div>
                                            </div>
                                            <button className="menu-btn">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                                    <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                                                    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                                                </svg>
                                            </button>
                                        </div>

                                        {trend.image_url && (
                                            <div className="media-container bg-gray-200">
                                                <img src={trend.image_url} alt="Trend" className="media-img" />
                                            </div>
                                        )}

                                        <div className="post-content">
                                            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{trend.title}</h4>
                                            <p className="post-text mb-4">
                                                {trend.content}
                                            </p>

                                            <div className="tags-container-alt">
                                                {trend.tags.map(tag => (
                                                    <span key={tag} className="post-tag-alt text-teal-600">#{tag}</span>
                                                ))}
                                            </div>

                                            <div className="engagement-bar" style={{ marginTop: '1rem' }}>
                                                <button className="action-btn hover-red">
                                                    <HeartIcon />
                                                    <span>{trend.likes}</span>
                                                </button>
                                                <button className="action-btn hover-green">
                                                    <CommentIcon />
                                                    <span>{trend.comments}</span>
                                                </button>
                                                <button className="action-btn hover-blue">
                                                    <ShareIcon />
                                                    <span>Share</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>

                         {/* End of Feed Column */}

                        {/* ══ RIGHT SIDEBAR - Market Intelligence ══ */}
                        <motion.aside
                            className="intelligence-column"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >

                            {/* Market Intelligence Header */}
                            <div className="intel-header">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 17l5-5 4 4 6-7 3 3" stroke="#1A6B3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <h3>Market Intelligence</h3>
                            </div>

                            {/* Artisan AI Suggestion Card */}
                            <div className="intel-card ai-suggestion-card">
                                <div className="ai-suggestion-header">
                                    <div className="ai-icon-box">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                fill="white" />
                                        </svg>
                                    </div>
                                    <div className="ai-suggestion-titles">
                                        <h4>Artisan AI Suggestion</h4>
                                        <p>Based on your browsing history</p>
                                    </div>
                                </div>

                                <p className="ai-suggestion-text">
                                    The magenta lotus design shown in the feed has a <span className="ai-highlight">20% higher profit margin</span> if produced using the locally sourced raw silk currently on sale.
                                </p>

                                <button className="ai-btn">
                                    Calculate Potential Profit
                                </button>
                            </div>

                            {/* Material Forecast Card */}
                            <div className="intel-card material-fc-card">
                                <div className="fc-header">
                                    <h4>Raw Material Forecast</h4>
                                    <button className="fc-view-all">
                                        View All
                                    </button>
                                </div>

                                <div className="fc-list">
                                    {/* Mulberry Silk */}
                                    <div className="fc-item">
                                        <div className="fc-item-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                    stroke="#6B7280" strokeWidth="2" fill="none" />
                                            </svg>
                                        </div>
                                        <div className="fc-item-body">
                                            <div className="fc-item-row mb-1">
                                                <span className="fc-item-name">Mulberry Silk</span>
                                                <span className="fc-item-price">₹4,200</span>
                                            </div>
                                            <div className="fc-item-row">
                                                <span className="fc-status-alert">Low Stock Alert</span>
                                                <span className="fc-trend-up">+8.3% ↗</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cotton Yarn */}
                                    <div className="fc-item">
                                        <div className="fc-item-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="8" stroke="#6B7280" strokeWidth="2" />
                                            </svg>
                                        </div>
                                        <div className="fc-item-body">
                                            <div className="fc-item-row mb-1">
                                                <span className="fc-item-name">Cotton Yarn</span>
                                                <span className="fc-item-price">₹850</span>
                                            </div>
                                            <div className="fc-item-row">
                                                <span className="fc-status-good">Stable Demand</span>
                                                <span className="fc-trend-up">+1.1% ↗</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Natural Indigo */}
                                    <div className="fc-item">
                                        <div className="fc-item-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="#6B7280" strokeWidth="2" fill="none" />
                                            </svg>
                                        </div>
                                        <div className="fc-item-body">
                                            <div className="fc-item-row mb-1">
                                                <span className="fc-item-name">Natural Indigo</span>
                                                <span className="fc-item-price">₹1,800</span>
                                            </div>
                                            <div className="fc-item-row">
                                                <span className="fc-status-alert">Price Drop</span>
                                                <span className="fc-trend-down">-3.4% ↘</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </motion.aside>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
