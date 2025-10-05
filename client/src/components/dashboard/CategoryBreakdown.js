import React from 'react';

const CategoryBreakdown = ({ data }) => {
  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-secondary">
        No category data available
      </div>
    );
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalExpenses = data.totalExpenses;

  return (
    <div className="space-y-3">
      {data.categories.map((category, index) => (
        <div key={category.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm font-medium text-primary">
                {category.name}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">
                {formatAmount(category.amount)}
              </p>
              <p className="text-xs text-muted">
                {category.percentage}%
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-tertiary rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${category.percentage}%`,
                backgroundColor: category.color
              }}
            />
          </div>
          
          {/* Transaction count */}
          <p className="text-xs text-muted">
            {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
          </p>
        </div>
      ))}
      
      {/* Total */}
      <div className="pt-3 border-t border-border-color">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-primary">Total Expenses</span>
          <span className="font-bold text-primary text-lg">
            {formatAmount(totalExpenses)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdown;
