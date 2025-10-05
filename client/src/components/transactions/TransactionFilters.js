import React from 'react';
import { X, Calendar, Tag, Search } from 'lucide-react';

const TransactionFilters = ({ filters, categories, onFilterChange, onClose }) => {
  const handleChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      type: '',
      category_id: '',
      start_date: '',
      end_date: '',
      sort_by: 'date',
      sort_order: 'desc'
    });
  };

  const hasActiveFilters = filters.search || filters.type || filters.category_id || 
                          filters.start_date || filters.end_date;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Filter Transactions</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-accent hover:text-accent-hover transition"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-primary hover:bg-secondary rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-primary mb-1">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted" />
            </div>
            <input
              id="search"
              type="text"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border-color rounded-md shadow-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
              placeholder="Search transactions..."
            />
          </div>
        </div>

        {/* Transaction Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-primary mb-1">
            Type
          </label>
          <select
            id="type"
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="block w-full px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-primary mb-1">
            Category
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-4 w-4 text-muted" />
            </div>
            <select
              id="category_id"
              value={filters.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-primary mb-1">
            Start Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-muted" />
            </div>
            <input
              id="start_date"
              type="date"
              value={filters.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-primary mb-1">
            End Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-muted" />
            </div>
            <input
              id="end_date"
              type="date"
              value={filters.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            />
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sort_by" className="block text-sm font-medium text-primary mb-1">
            Sort By
          </label>
          <select
            id="sort_by"
            value={filters.sort_by}
            onChange={(e) => handleChange('sort_by', e.target.value)}
            className="block w-full px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="description">Description</option>
            <option value="created_at">Created At</option>
          </select>
        </div>
      </div>

      {/* Sort Order */}
      <div className="flex items-center gap-4">
        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium text-primary mb-1">
            Sort Order
          </label>
          <select
            id="sort_order"
            value={filters.sort_order}
            onChange={(e) => handleChange('sort_order', e.target.value)}
            className="block px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Quick Date Filters */}
        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Quick Filters
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                handleChange('start_date', startOfMonth.toISOString().split('T')[0]);
                handleChange('end_date', today.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-xs border border-border-color rounded-md hover:bg-secondary transition"
            >
              This Month
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                handleChange('start_date', startOfYear.toISOString().split('T')[0]);
                handleChange('end_date', today.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-xs border border-border-color rounded-md hover:bg-secondary transition"
            >
              This Year
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                handleChange('start_date', last30Days.toISOString().split('T')[0]);
                handleChange('end_date', today.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-xs border border-border-color rounded-md hover:bg-secondary transition"
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
