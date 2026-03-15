import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

// --- Icons (Copied from Dashboard Layout / App as needed) ---

// Placeholder or precise SVG icons from design.
const VerifiedBadgeIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const LocationPinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const EditIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
);

const SkillsetIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#059669">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

const IdentityBadgeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#059669">
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <circle cx="8" cy="10" r="2"></circle>
        <path d="M4 18v-2a4 4 0 0 1 8 0v2"></path>
        <path d="M16 10h4"></path>
        <path d="M16 14h4"></path>
    </svg>
);


const TrendArrowIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);


export default function Profile() {
    const { user } = useAuth();
    
    return (
        <DashboardLayout>
            <div className="profile-page-content">
                <div className="profile-layout">

                    {/* ── Left Column ── */}
                    <div className="left-column">

                        {/* Main Profile Info Card */}
                        <div className="profile-card profile-header-card">
                            <div className="avatar-container">
                                <img src="/images/ramesh_kumar.png" alt={user?.full_name || 'Artisan'} className="avatar-image" />
                                <div className="verified-badge">
                                    <VerifiedBadgeIcon />
                                </div>
                            </div>
                            <h2 className="profile-name">{user?.full_name || 'Ramesh Kumar'}</h2>
                            <p className="profile-role">{user?.craft_type || 'Artisan'} • {user?.email}</p>

                            <div className="profile-info-list">
                                <div className="profile-info-item">
                                    <LocationPinIcon />
                                    <span>{user?.location || 'India'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <CalendarIcon />
                                    <span>Member Since {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}</span>
                                </div>
                            </div>

                            <button className="edit-profile-btn">
                                <EditIcon />
                                Edit Profile
                            </button>
                        </div>

                        {/* Skillset Card */}
                        <div className="profile-card skillset-card">
                            <div className="card-title">
                                <SkillsetIcon />
                                Craft Types
                            </div>
                            <div className="skills-container">
                                <span className="skill-pill">{user?.craft_type || 'Handloom'}</span>
                            </div>
                        </div>

                    </div>

                    {/* ── Right Column ── */}
                    <div className="right-column">

                        {/* Top Stats Grid */}
                        <div className="top-stats-grid">

                            {/* Stat Card 1 */}
                            <div className="profile-card stat-card green-border">
                                <span className="stat-label">LIFETIME EARNINGS</span>
                                <span className="stat-value">₹4.2L</span>
                                <span className="stat-subtext positive">
                                    <TrendArrowIcon />
                                    +12.5% this year
                                </span>
                            </div>

                            {/* Stat Card 2 */}
                            <div className="profile-card stat-card green-border">
                                <span className="stat-label">COMPLETED ORDERS</span>
                                <span className="stat-value">158</span>
                                <span className="stat-subtext positive">
                                    <CheckCircleIcon />
                                    99% fulfillment
                                </span>
                            </div>

                            {/* Stat Card 3 */}
                            <div className="profile-card stat-card green-border">
                                <span className="stat-label">MARKET ACCURACY</span>
                                <span className="stat-value">94%</span>
                                <div className="stat-bar-container">
                                    <div className="stat-bar-fill" style={{ width: '94%' }}></div>
                                </div>
                            </div>

                        </div>

                        {/* Personal Biography Card */}
                        <div className="profile-card bio-card">
                            <div className="card-title">
                                <IdentityBadgeIcon />
                                Biography
                            </div>

                            <div className="bio-content">
                                <p>
                                    {user?.bio || 'Biography not provided yet. Click "Edit Profile" to add more about yourself, your craft, and your journey as an artisan.'}
                                </p>
                            </div>

                            {/* Bottom Metrics inside Bio Card Box */}
                            <div className="bio-metrics-grid">

                                <div className="bio-metric-card">
                                    <span className="bio-metric-label">WORKSHOPS</span>
                                    <span className="bio-metric-value">24</span>
                                </div>

                                <div className="bio-metric-card">
                                    <span className="bio-metric-label">AWARDS</span>
                                    <span className="bio-metric-value">3</span>
                                </div>

                                <div className="bio-metric-card">
                                    <span className="bio-metric-label">COUNTRIES</span>
                                    <span className="bio-metric-value">8</span>
                                </div>

                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
