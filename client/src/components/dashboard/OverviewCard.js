import React from 'react';

const OverviewCard = ({ title, value, icon: Icon, color, bgColor, format }) => {
  const formatValue = (val, formatType) => {
    if (val === null || val === undefined) return '0';
    
    switch (formatType) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(val);
      default:
        return val.toString();
    }
  };

  return (
    <div className="bg-primary rounded-lg shadow p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {formatValue(value, format)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
};

export default OverviewCard;
