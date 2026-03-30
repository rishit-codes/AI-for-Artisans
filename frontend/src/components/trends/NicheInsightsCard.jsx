import { useState, useEffect } from "react";
import api from "../../services/api";
import { motion } from "framer-motion";

const NicheInsightsCard = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("textile"); // Default

  useEffect(() => {
    // Try to get user's craft type from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.craft_type) {
          // Map backend craft_type to our new niche categories if needed
          const catMap = {
            "pottery": "pottery",
            "textile": "textile",
            "metal": "home_decor_brassware",
            "wood": "home_decor_brassware"
          };
          setCategory(catMap[user.craft_type] || "textile");
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/market/insights?category=${category}`);
        setInsights(response.data.insights || []);
      } catch (error) {
        console.error("Error fetching niche insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [category]);

  const getStatusColor = (status) => {
    switch (status) {
      case "capturing_market": return "#16A34A"; // green-600
      case "trending_up": return "#2563EB"; // blue-600
      case "stable": return "#4B5563"; // gray-600
      case "cooling_down": return "#D97706"; // amber-600
      default: return "#4B5563";
    }
  };

  return (
    <div className="intel-card material-fc-card niche-insights-card">
      <div className="fc-header">
        <h4 className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          {category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ")} Insights
        </h4>
        <span className="fc-view-all" style={{ fontSize: '10px', opacity: 0.7 }}>Live Trends</span>
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-gray-500">Analyzing market signals...</div>
      ) : (
        <div className="fc-list">
          {insights.map((item, idx) => (
            <motion.div 
              key={item.niche} 
              className="fc-item"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="fc-item-body">
                <div className="fc-item-row mb-1">
                  <span className="fc-item-name">{item.niche}</span>
                  <div className="flex flex-col items-end">
                    <span className="fc-item-price" style={{ color: getStatusColor(item.status) }}>
                      {item.confidence_score}%
                    </span>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#9CA3AF' }}>CONFIDENCE</span>
                  </div>
                </div>
                
                {/* Confidence Meter */}
                <div className="w-full bg-gray-100 h-1 rounded-full mb-2 overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: getStatusColor(item.status) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.confidence_score}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>

                <div className="fc-item-row" style={{ marginTop: '2px' }}>
                  <span className="fc-status-alert" style={{ color: getStatusColor(item.status), fontSize: '10px' }}>
                    {item.status.replace(/_/g, " ")}
                  </span>
                  <span className="fc-trend-up" style={{ fontSize: '10px', color: item.trend_momentum.startsWith('+') ? '#16A34A' : '#DC2626' }}>
                    {item.trend_momentum} {item.trend_momentum.startsWith('+') ? '↗' : '↘'}
                  </span>
                </div>
                
                {item.upcoming_season !== "None" && (
                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="3">
                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                         </svg>
                         <span style={{ fontSize: '9px', fontWeight: '600', color: '#D97706' }}>
                             SEASON: {item.upcoming_season.toUpperCase()}
                         </span>
                    </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-100">
         <p style={{ fontSize: '10px', color: '#6B7280', fontStyle: 'italic', lineHeight: '1.4' }}>
             Algorithm: (30d Trend Momentum × 0.6) + (Festival Proximity × 0.4)
         </p>
      </div>
    </div>
  );
};

export default NicheInsightsCard;
