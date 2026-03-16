import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Landing.css";

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const footerSections = [
        {
            title: "Platform",
            links: [
                { label: "How it Works", href: "#steps" },
                { label: "Pricing Data", href: "#features" },
                { label: "Success Stories", href: "#cta" },
            ],
        },
        {
            title: "Connect",
            links: [
                { label: "For NGOs", href: "#cta" },
                { label: "For Government", href: "#cta" },
                { label: "Retail Partners", href: "#cta" },
            ],
        },
        {
            title: "Resources",
            links: [
                { label: "Blog", to: "/login" },
                { label: "Report", to: "/signup" },
                { label: "Terms", href: "#footer" },
            ],
        },
    ];

    return (
        <div className="landing-container">
            {/* ══════════════════════════════════════════
                HERO — 100vh, navbar floated on top
            ══════════════════════════════════════════ */}
            <section className="hero-section">
                {/* Background image — full cover */}
                <img
                    src="/images/artisan_hero_clean.png"
                    alt="Indian artisan craftsman in workshop"
                    className="hero-bg-img"
                />

                {/* Subtle left-to-right gradient */}
                <div className="hero-gradient" />

                {/* ── NAVBAR — transparent, floated over hero ── */}
                <header className="hero-header">
                    {/* Logo */}
                    <Link to="/" className="hero-logo">
                        <img src="/images/logo.png" alt="ArtisanGPS" style={{ height: '40px', width: 'auto' }} />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hero-nav desktop-only">
                        <a href="#features" className="hero-nav-link">Platform</a>
                        <a href="#steps" className="hero-nav-link">Our Impact</a>
                        <a href="#cta" className="hero-nav-link">Partnerships</a>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="mobile-menu-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                            <span />
                            <span />
                            <span />
                        </div>
                    </button>

                    {/* CTA */}
                    <Link to="/login" className="hero-cta-btn desktop-only">
                        Log in
                    </Link>
                </header>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div 
                            className="mobile-menu-overlay"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <nav className="mobile-nav-links">
                                <a href="#features" onClick={() => setMobileMenuOpen(false)}>Platform</a>
                                <a href="#steps" onClick={() => setMobileMenuOpen(false)}>Our Impact</a>
                                <a href="#cta" onClick={() => setMobileMenuOpen(false)}>Partnerships</a>
                                <Link to="/login" className="mobile-cta-btn" onClick={() => setMobileMenuOpen(false)}>
                                    Log in
                                </Link>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── HERO TEXT — left side, vertically centered ── */}
                <motion.div 
                    className="hero-text-container"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    <p className="hero-eyebrow">
                        Preserving Indian Heritage
                    </p>

                    <h1 className="hero-headline">
                        Empowering Indian<br />
                        Craft with{" "}
                        <span style={{ color: "#F5A623" }}>AI</span>
                        <br />
                        Intelligence
                    </h1>

                    <p className="hero-subtext">
                        Bridge the gap between traditional heritage and global
                        markets. AI-driven insights designed for the Indian rural
                        artisan ecosystem.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/signup" className="hero-btn-primary">
                            Get Started →
                        </Link>
                        <a href="#features" className="hero-btn-secondary">
                            Learn More
                        </a>
                    </div>
                </motion.div>
            </section>


            {/* ══════════════════════════════════════════
                FEATURES SECTION
            ══════════════════════════════════════════ */}
            <section id="features" className="features-section">
                <motion.div 
                    className="features-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1, margin: "-100px" }}
                    transition={{ duration: 1.0 }}
                >
                    <h2>Precision Intelligence for Every Loom</h2>
                    <p>Combining auspicious traditions with cutting-edge data to help artisans thrive in a digital first economy.</p>
                </motion.div>

                <div className="features-grid">
                    {/* Market Intelligence */}
                    <motion.div 
                        className="feature-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    >
                        <div className="feature-icon-wrapper">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="8" r="4" fill="#F5A623" />
                                <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Market Intelligence</h3>
                        <p>Understand global demand shifts. Our AI translates complex market signals into actionable local advice.</p>
                    </motion.div>

                    {/* Trend Forecasting */}
                    <motion.div 
                        className="feature-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="feature-icon-wrapper">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                <polyline points="3,16 7,11 11,14 16,7 21,10" stroke="#F5A623" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                        </div>
                        <h3>Trend Forecasting</h3>
                        <p>Predict colors, motifs, and textures for upcoming seasons based on real-time fashion week data.</p>
                    </motion.div>

                    {/* Smart Pricing */}
                    <motion.div 
                        className="feature-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="feature-icon-wrapper">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                <path d="M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7M12 3v18" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3>Smart Pricing</h3>
                        <p>Optimize margins with transparent cost-benefit analysis and dynamic raw material tracking.</p>
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                OUR IMPACT / STEPS SECTION
            ══════════════════════════════════════════ */}
            <section id="steps" className="steps-section">
                <div className="steps-container">
                    <motion.div
                        className="steps-left"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.1, margin: "-80px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2>
                            Our Impact Journey<br />for Every Artisan
                        </h2>

                        <div className="steps-list">
                            <motion.div
                                className="step-item"
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.1 }}
                                transition={{ duration: 0.6, delay: 0.05 }}
                            >
                                <div className="step-number">1</div>
                                <div>
                                    <h4>Understand Local + Global Demand</h4>
                                    <p>
                                        We decode market movement into simple guidance, so artisans can decide what to make and when.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                className="step-item"
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.1 }}
                                transition={{ duration: 0.6, delay: 0.12 }}
                            >
                                <div className="step-number">2</div>
                                <div>
                                    <h4>Plan Production with Confidence</h4>
                                    <p>
                                        From material windows to seasonal motifs, artisans receive practical prompts before demand peaks.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                className="step-item"
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="step-number">3</div>
                                <div>
                                    <h4>Grow Income, Preserve Heritage</h4>
                                    <p>
                                        Better pricing and timing help rural craft communities scale sustainably without losing traditional identity.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="steps-right"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.2, margin: "-80px" }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    >
                        <div className="loom-image-wrapper">
                            <img
                                src="/images/loom_weaving.png"
                                alt="Traditional loom weaving"
                                className="loom-image"
                            />
                        </div>

                        <div className="loom-badge">
                            <div className="step-number" style={{ width: 36, height: 36 }}>AI</div>
                            <div>
                                <p className="badge-title">Community Reach</p>
                                <p className="badge-value">+2.5x Better Demand Visibility</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* ══════════════════════════════════════════
                CTA BANNER
            ══════════════════════════════════════════ */}
            <section id="cta" className="cta-banner-section">
                <motion.div 
                    className="cta-banner-box"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1, margin: "-100px" }}
                    transition={{ duration: 1.0 }}
                >
                    <h2>Join the Revolution of<br />Digital Craftsmanship</h2>
                    <p>
                        Be part of the platform that is preserving Indian heritage through modern
                        intelligence. We are looking for partners and visionaries.
                    </p>
                    <div className="cta-banner-actions">
                        <Link to="/home" className="cta-btn-primary">Become a Partner</Link>
                        <a href="#footer" className="cta-btn-secondary">Contact Us</a>
                    </div>
                </motion.div>
            </section>

            {/* ══════════════════════════════════════════
                FOOTER
            ══════════════════════════════════════════ */}
            <footer id="footer" className="footer-section">
                <div className="footer-container">
                    {/* Top row */}
                    <div className="footer-top">
                        {/* Brand */}
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <img src="/images/logo.png" alt="ArtisanGPS" style={{ height: '64px' }} />
                            </div>
                            <p className="footer-desc">
                                An AI-first market intelligence platform designed to empower rural Indian artisans with global insights.
                            </p>
                        </div>

                        {/* Nav columns */}
                        <div className="footer-links">
                            {footerSections.map(({ title, links }) => (
                                <div key={title} className="footer-link-col">
                                    <h5>{title}</h5>
                                    <ul>
                                        {links.map((item) => (
                                            <li key={item.label}>
                                                {item.to ? (
                                                    <Link to={item.to}>{item.label}</Link>
                                                ) : (
                                                    <a href={item.href}>{item.label}</a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Partners row */}
                    <div className="footer-partners">
                        <p>Our Ecosystem Partners</p>
                        <div className="partner-logos">
                            <div className="partner-logo-item">
                                <svg width="100" height="40" viewBox="0 0 100 40" fill="none">
                                    <path d="M10 20h80M20 10l-10 10 10 10M80 10l10 10-10 10" stroke="#ccc" strokeWidth="2" strokeLinecap="round" />
                                    <text x="50%" y="25" textAnchor="middle" fill="#999" fontSize="10" fontStyle="italic">CRAFT MARK</text>
                                </svg>
                            </div>
                            <div className="partner-logo-item">
                                <svg width="100" height="40" viewBox="0 0 100 40" fill="none">
                                    <circle cx="20" cy="20" r="12" stroke="#ccc" strokeWidth="2" />
                                    <path d="M20 12v16M12 20h16" stroke="#ccc" strokeWidth="2" />
                                    <text x="65" y="25" fill="#999" fontSize="10" fontWeight="bold">HANDLOOM</text>
                                </svg>
                            </div>
                            <div className="partner-logo-item">
                                <svg width="100" height="40" viewBox="0 0 100 40" fill="none">
                                    <rect x="10" y="10" width="80" height="20" rx="4" stroke="#ccc" strokeWidth="2" />
                                    <text x="50%" y="25" textAnchor="middle" fill="#999" fontSize="10">NABARD PARTNER</text>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="footer-copyright">
                        <p>© 2024 ArtisanGPS Market Intelligence. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
