import React from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const RecentTransactions = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-secondary py-8">
        <p>No recent transactions</p>
      </div>
    );
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd');
  };

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-tertiary transition"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                transaction.type === 'income'
                  ? 'bg-success-light text-success'
                  : 'bg-error-light text-error'
              }`}
            >
              {transaction.type === 'income' ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownLeft className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                {transaction.description || 'No description'}
              </p>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: transaction.category.color }}
                />
                <span>{transaction.category.name}</span>
                <span>•</span>
                <span>{formatDate(transaction.date)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-sm font-semibold ${
                transaction.type === 'income'
                  ? 'text-success'
                  : 'text-error'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatAmount(transaction.amount)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentTransactions;
