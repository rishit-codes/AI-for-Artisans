import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';

export default function DemandForecastChart({ forecastData, nextFestival }) {
  if (!forecastData || forecastData.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
        <p style={{ color: '#64748b' }}>No forecast data available.</p>
      </div>
    );
  }

  // Format data for Recharts, separating actual vs predicted lines smoothly
  const chartData = forecastData.map(item => ({
    date: item.date,
    actual: item.is_prediction ? null : item.value,
    predicted: item.is_prediction ? item.value : null,
    lower_bound: item.lower_bound,
    upper_bound: item.upper_bound,
    is_prediction: item.is_prediction
  }));

  // Find the handoff point to connect the actual line to the predicted line visually
  const lastActualIndex = chartData.findIndex((d, i) => d.actual !== null && (i === chartData.length - 1 || chartData[i + 1].predicted !== null));
  if (lastActualIndex !== -1 && lastActualIndex < chartData.length - 1) {
      chartData[lastActualIndex].predicted = chartData[lastActualIndex].actual;
  }

  return (
    <div className="forecast-chart-container" style={{ width: '100%', height: 350, marginTop: '24px' }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            tickMargin={10}
            minTickGap={30}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={false} 
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {nextFestival && (
            <ReferenceLine 
              x={nextFestival.date} 
              stroke="#f59e0b" 
              strokeDasharray="3 3" 
              label={{ position: 'top', value: `${nextFestival.name} Peak`, fill: '#f59e0b', fontSize: 12, fontWeight: 'bold' }} 
            />
          )}

          <Line 
            type="monotone" 
            dataKey="actual" 
            name="Historical Sales" 
            stroke="#0f172a" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            name="AI Forecast (30 Days)" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            strokeDasharray="5 5" 
            dot={false}
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
