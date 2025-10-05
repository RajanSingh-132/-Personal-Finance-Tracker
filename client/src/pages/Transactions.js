import React, { useState, useEffect,  useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionList from '../components/transactions/TransactionList';
import TransactionFilters from '../components/transactions/TransactionFilters';

const Transactions = () => {
  const { canEdit } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category_id: '',
    start_date: '',
    end_date: '',
    sort_by: 'date',
    sort_order: 'desc'
  });
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await axios.get(`/transactions?${params}`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle transaction form submission
  const handleTransactionSubmit = async (transactionData) => {
    try {
      if (editingTransaction) {
        await axios.put(`/transactions/${editingTransaction.id}`, transactionData);
      } else {
        await axios.post('/transactions', transactionData);
      }
      
      setShowForm(false);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  };

  // Handle transaction edit
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  // Handle transaction delete
  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await axios.delete(`/transactions/${transactionId}`);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Handle form close
  const handleFormClose = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  // Memoized filtered transactions count
  // const filteredCount = useMemo(() => {
  //   return transactions.length;
  // }, [transactions]);

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading transactions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Transactions</h1>
          <p className="text-secondary mt-1">
            Manage your income and expenses
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="pl-10 pr-4 py-2 border border-border-color rounded-md bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition w-64"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md transition ${
              showFilters
                ? 'border-accent bg-accent-light text-accent'
                : 'border-border-color text-secondary hover:text-primary hover:bg-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {/* Add transaction button */}
          {canEdit() && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover transition"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-primary rounded-lg shadow p-6">
          <TransactionFilters
            filters={filters}
            categories={categories}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      {/* Transaction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-primary rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <TransactionForm
              transaction={editingTransaction}
              categories={categories}
              onSubmit={handleTransactionSubmit}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-primary rounded-lg shadow">
        <TransactionList
          transactions={transactions}
          loading={loading}
          pagination={pagination}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPageChange={handlePageChange}
          canEdit={canEdit()}
        />
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <div className="bg-primary rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-secondary">Total Transactions</p>
              <p className="text-2xl font-bold text-primary">{pagination.total}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-secondary">Showing</p>
              <p className="text-2xl font-bold text-primary">
                {transactions.length} of {pagination.total}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-secondary">Page</p>
              <p className="text-2xl font-bold text-primary">
                {pagination.page} of {pagination.pages}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
