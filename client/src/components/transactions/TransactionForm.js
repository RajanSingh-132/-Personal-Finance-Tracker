import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag } from 'lucide-react';

const TransactionForm = ({ transaction, categories, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'expense',
    category_id: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount?.toString() || '',
        description: transaction.description || '',
        type: transaction.type || 'expense',
        category_id: transaction.category?.id?.toString() || '',
        date: transaction.date || new Date().toISOString().split('T')[0]
      });
    }
  }, [transaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase() !== 'income' || formData.type === 'income'
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-primary">
          {transaction ? 'Edit Transaction' : 'Add New Transaction'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-muted hover:text-primary hover:bg-secondary rounded-md transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-primary mb-1">
              Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-muted" />
              </div>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition ${
                  errors.amount
                    ? 'border-error focus:ring-error focus:border-error'
                    : 'border-border-color'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-error">{errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-primary mb-1">
              Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-primary mb-1">
            Category *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-5 w-5 text-muted" />
            </div>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition ${
                errors.category_id
                  ? 'border-error focus:ring-error focus:border-error'
                  : 'border-border-color'
              }`}
            >
              <option value="">Select a category</option>
              {filteredCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {errors.category_id && (
            <p className="mt-1 text-sm text-error">{errors.category_id}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-primary mb-1">
            Date *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-muted" />
            </div>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition ${
                errors.date
                  ? 'border-error focus:ring-error focus:border-error'
                  : 'border-border-color'
              }`}
            />
          </div>
          {errors.date && (
            <p className="mt-1 text-sm text-error">{errors.date}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-primary mb-1">
            Description
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-muted" />
            </div>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition resize-none ${
                errors.description
                  ? 'border-error focus:ring-error focus:border-error'
                  : 'border-border-color'
              }`}
              placeholder="Enter a description (optional)"
            />
          </div>
          {errors.description && (
            <p className="mt-1 text-sm text-error">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-muted">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-border-color">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <div className="spinner w-4 h-4" />
            ) : (
              <DollarSign className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : (transaction ? 'Update Transaction' : 'Add Transaction')}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 border border-border-color text-secondary rounded-md hover:text-primary hover:bg-secondary transition"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
