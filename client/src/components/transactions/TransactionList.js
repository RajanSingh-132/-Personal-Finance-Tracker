import React from 'react';
import { format } from 'date-fns';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const TransactionList = ({ 
  transactions, 
  loading, 
  pagination, 
  onEdit, 
  onDelete, 
  onPageChange,
  canEdit 
}) => {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'h:mm a');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tertiary rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-tertiary rounded w-32"></div>
                    <div className="h-3 bg-tertiary rounded w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-tertiary rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-muted mb-4">
          <ArrowDownLeft className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-medium">No transactions found</p>
          <p className="text-sm">Start by adding your first transaction</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Transaction List */}
      <div className="divide-y divide-border-color">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="p-4 hover:bg-secondary transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Transaction Icon */}
                <div
                  className={`p-2 rounded-full ${
                    transaction.type === 'income'
                      ? 'bg-success-light text-success'
                      : 'bg-error-light text-error'
                  }`}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownLeft className="w-5 h-5" />
                  )}
                </div>

                {/* Transaction Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-primary">
                      {transaction.description || 'No description'}
                    </h3>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: transaction.category.color + '20',
                        color: transaction.category.color
                      }}
                    >
                      {transaction.category.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-secondary">
                    <span>{formatDate(transaction.date)}</span>
                    <span>•</span>
                    <span>{formatTime(transaction.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Amount and Actions */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className={`text-lg font-semibold ${
                      transaction.type === 'income'
                        ? 'text-success'
                        : 'text-error'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatAmount(transaction.amount)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {canEdit ? (
                    <>
                      <button
                        onClick={() => onEdit(transaction)}
                        className="p-2 text-muted hover:text-accent hover:bg-accent-light rounded-md transition"
                        title="Edit transaction"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="p-2 text-muted hover:text-error hover:bg-error-light rounded-md transition"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onEdit(transaction)}
                      className="p-2 text-muted hover:text-accent hover:bg-accent-light rounded-md transition"
                      title="View transaction"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-border-color">
          <div className="flex items-center justify-between">
            <div className="text-sm text-secondary">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} transactions
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-border-color rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.page;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-2 text-sm border rounded-md transition ${
                        isActive
                          ? 'border-accent bg-accent text-white'
                          : 'border-border-color hover:bg-secondary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-border-color rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
