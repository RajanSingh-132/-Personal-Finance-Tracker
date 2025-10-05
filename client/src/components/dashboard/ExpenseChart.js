import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ExpenseChart = ({ data }) => {
  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-secondary">
        No expense data available
      </div>
    );
  }

  const chartData = data.categories.map(category => ({
    name: category.name,
    value: category.amount,
    color: category.color,
    percentage: category.percentage
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-primary border border-border-color rounded-lg shadow-lg p-3">
          <p className="font-medium text-primary">{data.name}</p>
          <p className="text-sm text-secondary">
            Amount: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(data.value)}
          </p>
          <p className="text-sm text-muted">
            {data.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-secondary">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseChart;
