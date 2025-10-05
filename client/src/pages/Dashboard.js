import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Calendar,
  Filter
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OverviewCard from '../components/dashboard/OverviewCard';
import ExpenseChart from '../components/dashboard/ExpenseChart';
import MonthlyTrendsChart from '../components/dashboard/MonthlyTrendsChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    categoryBreakdown: null,
    monthlyTrends: null,
    recentTransactions: null
  });
  const [dateRange, setDateRange] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Memoized date calculations
  const dateRangeConfig = useMemo(() => {
    const now = new Date();
    // const currentYear = now.getFullYear();
    
    switch (dateRange) {
      case 'month':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      case 'year':
        return {
          startDate: new Date(selectedYear, 0, 1).toISOString().split('T')[0],
          endDate: new Date(selectedYear, 11, 31).toISOString().split('T')[0]
        };
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          startDate: new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), quarter * 3 + 2, 31).toISOString().split('T')[0]
        };
      default:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
    }
  }, [dateRange, selectedYear]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = dateRangeConfig;

      const [overviewRes, categoryRes, monthlyRes, recentRes] = await Promise.all([
        axios.get(`/analytics/overview?start_date=${startDate}&end_date=${endDate}&period=${dateRange}`),
        axios.get(`/analytics/expenses-by-category?start_date=${startDate}&end_date=${endDate}`),
        axios.get(`/analytics/monthly-trends?year=${selectedYear}`),
        axios.get('/analytics/recent-transactions?limit=5')
      ]);

      setData({
        overview: overviewRes.data,
        categoryBreakdown: categoryRes.data,
        monthlyTrends: monthlyRes.data,
        recentTransactions: recentRes.data
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRangeConfig, dateRange, selectedYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized overview cards data
  const overviewCards = useMemo(() => {
    if (!data.overview) return [];

    const { totalIncome, totalExpenses, netIncome, savingsRate } = data.overview.overview;

    return [
      {
        title: 'Total Income',
        value: totalIncome,
        icon: TrendingUp,
        color: 'text-success',
        bgColor: 'bg-success-light',
        format: 'currency'
      },
      {
        title: 'Total Expenses',
        value: totalExpenses,
        icon: TrendingDown,
        color: 'text-error',
        bgColor: 'bg-error-light',
        format: 'currency'
      },
      {
        title: 'Net Income',
        value: netIncome,
        icon: DollarSign,
        color: netIncome >= 0 ? 'text-success' : 'text-error',
        bgColor: netIncome >= 0 ? 'bg-success-light' : 'bg-error-light',
        format: 'currency'
      },
      {
        title: 'Savings Rate',
        value: savingsRate,
        icon: CreditCard,
        color: 'text-accent',
        bgColor: 'bg-accent-light',
        format: 'percentage'
      }
    ];
  }, [data.overview]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Welcome back, {user?.firstName || user?.username}!
          </h1>
          <p className="text-secondary mt-1">
            Here's your financial overview for the {dateRange}.
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-border-color rounded-md bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          {dateRange === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-border-color rounded-md bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
          <OverviewCard key={index} {...card} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <div className="bg-primary rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Trends
          </h3>
          {data.monthlyTrends ? (
            <MonthlyTrendsChart data={data.monthlyTrends} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner text="Loading trends..." />
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-primary rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Expense Categories
          </h3>
          {data.categoryBreakdown ? (
            <CategoryBreakdown data={data.categoryBreakdown} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner text="Loading categories..." />
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions and Expense Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-1">
          <div className="bg-primary rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Recent Transactions
            </h3>
            {data.recentTransactions ? (
              <RecentTransactions transactions={data.recentTransactions.transactions} />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <LoadingSpinner text="Loading transactions..." />
              </div>
            )}
          </div>
        </div>

        {/* Expense Chart */}
        <div className="lg:col-span-2">
          <div className="bg-primary rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Expense Distribution
            </h3>
            {data.categoryBreakdown ? (
              <ExpenseChart data={data.categoryBreakdown} />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <LoadingSpinner text="Loading chart..." />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
