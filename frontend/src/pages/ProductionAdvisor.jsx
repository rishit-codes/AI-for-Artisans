import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../components/DashboardLayout";
import "./ProductionAdvisor.css";

// ── Icons ──────────────────────────────────────────────────────────────────────

const LogoIcon = () => (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
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

const navItems = [
    { href: "/home", label: "Home", Icon: HomeIcon },
    { href: "/trends", label: "Trends", Icon: TrendIcon },
    { href: "/constraints", label: "Material Costs", Icon: MaterialIcon },
    { href: "/my-crafts", label: "My Crafts", Icon: CraftsIcon },
];

// ── Feed Icons ──

const WaterDropIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 7.52 2 13c0 4.97 3.61 9.12 8.44 9.86C10.96 22.95 11.48 23 12 23c.52 0 1.04-.05 1.56-.14C18.39 22.12 22 17.97 22 13c0-5.48-4.48-11-10-11z" />
    </svg>
);

const WeaveIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
);

const PartyIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
);

const WandIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 6.2l1.4-1.4M17.8 11.8l1.4 1.4M12.2 6.2L10.8 4.8M12.2 11.8l-1.4 1.4" />
        <path d="M3 21l9-9" />
        <path d="M12.22 3.22a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5z" />
    </svg>
);

// ── Data ──

const TIMELINE_ITEMS = [
    {
        timeLabel: "TODAY",
        nodeColor: "icon-bg-blue",
        nodeIcon: <WaterDropIcon />,
        title: "Indigo Dyeing Phase",
        badge: { label: "Safe for Dyeing", variant: "green" },
        description: "Humidity is currently at 45% with clear skies. Perfect conditions for outdoor drying of the new indigo batch.",
        pills: [
            { label: "☀️ Full Sun, 32°C", variant: "outline" },
            { label: "💧 Low Humidity", variant: "outline" },
        ],
        cardBg: "card-bg-white",
    },
    {
        timeLabel: "TOMORROW",
        nodeColor: "icon-bg-green",
        nodeIcon: <WeaveIcon />,
        title: "Silk Weaving",
        badge: { label: "High Priority", variant: "amber" },
        description: "Begin weaving the red and gold silk sarees. AI predicts a 20% surge in demand in the next 3 weeks.",
        aiAdvice: "Keep silk yarns away from direct afternoon heat.",
        cardBg: "card-bg-green",
    },
    {
        timeLabel: "IN 3 WEEKS",
        nodeColor: "icon-bg-amber",
        nodeIcon: <PartyIcon />,
        title: "Diwali Festival Readiness",
        description: "All festive stock should be ready for dispatch to major mandis. Target completion for all red/gold patterns.",
        pills: [
            { label: "Target: 50 Sarees", variant: "solidAmber" },
            { label: "Current: 12 Ready", variant: "solidGreen" },
        ],
        image: "/images/diwali_sarees.jpg",
        cardBg: "card-bg-amber",
    },
    {
        timeLabel: "NEXT MONTH",
        nodeColor: "icon-bg-pink",
        nodeIcon: <WandIcon />,
        title: "Design Planning: Wedding Season",
        badge: { label: "Planning", variant: "pink" },
        description: "Start drafting new peacock and floral motifs. Review AI market trends for trending color palettes in urban markets.",
        footerLink: { label: "View Trend Report", href: "/trends" },
        cardBg: "card-bg-pink",
    },
];

const badgeStyles = {
    green: "badge-green",
    amber: "badge-amber",
    pink: "badge-pink",
    purple: "badge-purple",
    blue: "badge-blue",
};

const pillStyles = {
    outline: "pill-outline",
    solidGreen: "pill-solid-green",
    solidAmber: "pill-solid-amber",
};

// ── Components ──

function TaskCard({ item }) {
    const {
        timeLabel,
        nodeColor,
        nodeIcon,
        title,
        badge,
        description,
        pills,
        aiAdvice,
        image,
        footerLink,
        cardBg = "card-bg-white",
    } = item;

    return (
        <motion.div
            className="task-card-container"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1, margin: "-50px" }}
            transition={{ duration: 0.8 }}
        >
            {/* Timeline node */}
            <div className="timeline-node-col">
                <div className={`timeline-node ${nodeColor}`}>
                    {nodeIcon}
                </div>
            </div>

            {/* Content */}
            <div className="task-content-col">
                <p className="task-time-label">{timeLabel}</p>
                <div className={`task-card-box ${cardBg}`}>
                    <div className="task-card-header">
                        <h3 className="task-title">{title}</h3>
                        {badge && (
                            <span className={`task-badge ${badgeStyles[badge.variant]}`}>
                                {badge.variant === "green" && (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                                {badge.variant === "amber" && (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                )}
                                {badge.label}
                            </span>
                        )}
                    </div>

                    {/* Optional image + description row for Diwali-style card */}
                    {image ? (
                        <div className="task-img-row">
                            <div className="task-img-box">
                                <img src={image} alt={title} className="task-img" />
                            </div>
                            <div>
                                <p className="task-desc">{description}</p>
                                {pills && (
                                    <div className="task-pills">
                                        {pills.map((pill, i) => (
                                            <span key={i} className={`task-pill ${pillStyles[pill.variant]}`}>
                                                {pill.label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="task-desc">{description}</p>

                            {/* Weather / condition pills */}
                            {pills && (
                                <div className="task-pills">
                                    {pills.map((pill, i) => (
                                        <span key={i} className={`task-pill ${pillStyles[pill.variant]}`}>
                                            {pill.label}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* AI Advice chip */}
                            {aiAdvice && (
                                <div className="ai-advice-chip">
                                    <span className="ai-advice-icon">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                                        </svg>
                                    </span>
                                    <p className="ai-advice-text">{aiAdvice}</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Footer link */}
                    {footerLink && (
                        <div className="task-footer-link">
                            <Link to={footerLink.href} className="task-link">
                                {footerLink.label}
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function ProductionAdvisorPage() {
    const location = useLocation();
    const pathname = location.pathname;

    const topNavTabs = (
        <div className="topbar-nav-links">
            <Link to="/trends" className={`nav-link ${pathname === '/trends' ? 'active-link' : ''}`}>Trends</Link>
            <Link to="/production-advisor" className={`nav-link ${pathname === '/production-advisor' ? 'active-link' : ''}`}>Production Advisor</Link>
            <Link to="/constraints" className={`nav-link ${pathname === '/constraints' ? 'active-link' : ''}`}>Material Costs</Link>
        </div>
    );

    return (
        <DashboardLayout headerActions={topNavTabs}>
            <div className="production-content-wrapper">

                {/* Scrollable Content */}
                <div className="production-body">
                    <motion.div
                        className="production-feed-container"
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="feed-wrapper">
                            {/* Header */}
                            <div className="feed-header">
                                <div>
                                    <h1 className="feed-title">Production Advisor</h1>
                                    <p className="feed-subtitle">
                                        AI-optimized schedule based on weather, market demand, and upcoming cultural festivals.
                                    </p>
                                </div>
                                <div className="feed-actions">
                                    {/* Filter button */}
                                    <button className="btn-filter">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="4" y1="6" x2="20" y2="6" />
                                            <line x1="8" y1="12" x2="16" y2="12" />
                                            <line x1="11" y1="18" x2="13" y2="18" />
                                        </svg>
                                        Filter
                                    </button>
                                    {/* New Task button */}
                                    <button className="btn-new-task">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        New Task
                                    </button>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="timeline-container">
                                {/* Vertical line */}
                                <div className="timeline-line" />

                                {/* Task cards */}
                                <div className="timeline-cards">
                                    {TIMELINE_ITEMS.map((item, i) => (
                                        <TaskCard key={i} item={item} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
