import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SpendingPatternsChart = ({ data }) => {
  if (!data || !data.patterns || data.patterns.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-secondary">
        No spending pattern data available
      </div>
    );
  }

  // Group patterns by day of week
  const dayPatterns = data.patterns.reduce((acc, pattern) => {
    const day = pattern.dayName;
    if (!acc[day]) {
      acc[day] = { day, totalAmount: 0, transactionCount: 0 };
    }
    acc[day].totalAmount += pattern.avgAmount * pattern.transactionCount;
    acc[day].transactionCount += pattern.transactionCount;
    return acc;
  }, {});

  const chartData = Object.values(dayPatterns).map(day => ({
    day: day.day.substring(0, 3), // Short day name
    amount: day.totalAmount,
    count: day.transactionCount
  }));

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary border border-border-color rounded-lg shadow-lg p-3">
          <p className="font-medium text-primary mb-2">{label}</p>
          <p className="text-sm text-secondary">
            Total: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(payload[0].value)}
          </p>
          <p className="text-sm text-muted">
            {payload[0].payload.count} transactions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis 
            dataKey="day" 
            stroke="var(--text-secondary)"
            fontSize={12}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            fontSize={12}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingPatternsChart;
