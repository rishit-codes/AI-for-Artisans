import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ── Icons ────────────────────────────────────────────────────────────────────

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="6" />
    <path d="M12 2v4 M12 18v4 M2 12h4 M18 12h4" />
    <path d="M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M4.93 19.07l2.83-2.83" />
    <path d="M16 8l4.5-4.5 M16 3.5h4.5v4.5" strokeLinejoin="miter" />
    <polygon points="12,7 13.5,10.5 17,12 13.5,13.5 12,17 10.5,13.5 7,12 10.5,10.5" fill="none" />
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

const SunIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
);

const navItems = [
    { href: "/home", label: "Home", Icon: HomeIcon },
    { href: "/trends", label: "Trend Feed", Icon: TrendIcon },
    { href: "/constraints", label: "Material Costs", Icon: MaterialIcon },
    { href: "/my-crafts", label: "My Craft", Icon: CraftsIcon },
];

export default function DashboardLayout({ children, headerActions }) {
    const { pathname } = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [liveTemp, setLiveTemp] = useState("--°C");
    const [marketStatus, setMarketStatus] = useState("ANALYZING");

    useEffect(() => {
        const fetchNavData = async () => {
            // Fetch live weather for Vadodara
            try {
                const wUrl = "https://api.open-meteo.com/v1/forecast?latitude=22.3072&longitude=73.1812&current=temperature_2m";
                const wRes = await fetch(wUrl);
                const wData = await wRes.json();
                if (wData?.current?.temperature_2m) {
                    setLiveTemp(`${Math.round(wData.current.temperature_2m)}°C`);
                }
            } catch (e) {
                console.error("Dashboard weather fetch failed");
            }

            // Fetch live market sentiment from intelligence
            try {
                const mRes = await api.get('/trends/intelligence');
                if (mRes.data && mRes.data.material_forecast) {
                    const upTrends = mRes.data.material_forecast.filter(m => String(m.trend).includes("up") || String(m.trend).includes("↗"));
                    setMarketStatus(upTrends.length > 1 ? "STRONG" : "STABLE");
                }
            } catch (e) {
                 setMarketStatus("STABLE");
            }
        };
        fetchNavData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="dashboard-container">
            {/* ══ MOBILE OVERLAY ══ */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        className="sidebar-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ══ TOP NAVBAR ══ */}
            <header className="top-header">
                <div className="topbar-left">
                    <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

                    <Link to="/" className="topbar-logo">
                        <div className="logo-icon-container">
                            <LogoIcon />
                        </div>
                        <div className="logo-text-container">
                            <span className="logo-text-main">ArtisanGPS</span>
                        </div>
                    </Link>
                </div>

                <div className="topbar-right">
                    {headerActions}
                    <div className="header-indicators">
                        <div className={`market-indicator ${marketStatus === 'STRONG' ? 'market-strong' : 'market-stable'}`}>
                            <span className="market-dot"></span>
                            MARKET: {marketStatus}
                        </div>
                        <div className="weather-indicator">
                            <SunIcon />
                            {liveTemp}
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard-content-wrapper">
                {/* ══ SIDEBAR ══ */}
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header mobile-only-header">
                        <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <Link to="/profile" className={`sidebar-profile-section ${pathname === '/profile' ? 'active' : ''}`} style={{ display: pathname === '/home' || pathname === '/profile' ? 'flex' : 'none', textDecoration: 'none', color: 'inherit' }}>
                        <div className="sidebar-profile-img-box">
                            <img src="/images/ramesh_kumar.png" alt={user?.full_name || "Ramesh Kumar"} className="sidebar-profile-img" />
                        </div>
                        <div className="sidebar-profile-info">
                            <p className="sidebar-profile-name">{user?.full_name || "Ramesh Kumar"}</p>
                            <p className="sidebar-profile-role">Master Weaver</p>
                        </div>
                    </Link>

                    <nav className="sidebar-nav">
                        {navItems.map(({ href, label, Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    to={href}
                                    className={`sidebar-link ${active ? "active" : ""}`}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <Icon />
                                    <span>{label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="sidebar-bottom" style={{ visibility: pathname === '/home' ? 'visible' : 'hidden' }}>
                        <button className="logout-btn" onClick={handleLogout}>
                            <LogoutIcon />
                            Logout
                        </button>
                    </div>
                </aside>

                <div className="dashboard-body-wrapper">
                    {/* ══ MAIN CONTENT ══ */}
                    <main className="main-content">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
