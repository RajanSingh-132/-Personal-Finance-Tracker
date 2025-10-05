import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Calendar, 
  Download,
  TrendingUp,
  PieChart
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MonthlyTrendsChart from '../components/dashboard/MonthlyTrendsChart';
import ExpenseChart from '../components/dashboard/ExpenseChart';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown';
import SpendingPatternsChart from '../components/analytics/SpendingPatternsChart';

const Analytics = () => {
  // const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    categoryBreakdown: null,
    monthlyTrends: null,
    spendingPatterns: null
  });
  const [dateRange, setDateRange] = useState('year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  // const [showFilters, setShowFilters] = useState(false);

  // Memoized date calculations
  const dateRangeConfig = useMemo(() => {
    const now = new Date();
    
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
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
    }
  }, [dateRange, selectedYear]);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = dateRangeConfig;

      const [overviewRes, categoryRes, monthlyRes, patternsRes] = await Promise.all([
        axios.get(`/analytics/overview?start_date=${startDate}&end_date=${endDate}&period=${dateRange}`),
        axios.get(`/analytics/expenses-by-category?start_date=${startDate}&end_date=${endDate}`),
        axios.get(`/analytics/monthly-trends?year=${selectedYear}`),
        axios.get(`/analytics/spending-patterns?start_date=${startDate}&end_date=${endDate}`)
      ]);

      setData({
        overview: overviewRes.data,
        categoryBreakdown: categoryRes.data,
        monthlyTrends: monthlyRes.data,
        spendingPatterns: patternsRes.data
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRangeConfig, dateRange, selectedYear]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Memoized summary stats
  const summaryStats = useMemo(() => {
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
        icon: BarChart3,
        color: 'text-error',
        bgColor: 'bg-error-light',
        format: 'currency'
      },
      {
        title: 'Net Income',
        value: netIncome,
        color: netIncome >= 0 ? 'text-success' : 'text-error',
        bgColor: netIncome >= 0 ? 'bg-success-light' : 'bg-error-light',
        format: 'currency'
      },
      {
        title: 'Savings Rate',
        value: savingsRate,
        icon: PieChart,
        color: 'text-accent',
        bgColor: 'bg-accent-light',
        format: 'percentage'
      }
    ];
  }, [data.overview]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Analytics</h1>
          <p className="text-secondary mt-1">
            Detailed insights into your financial patterns
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted" />
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

          {/* Export button */}
          <button
            onClick={() => {
              // TODO: Implement export functionality
              console.log('Export analytics data');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-border-color text-secondary rounded-md hover:text-primary hover:bg-secondary transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => (
          <div key={index} className="bg-primary rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.format === 'currency' 
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(stat.value)
                    : stat.format === 'percentage'
                    ? `${stat.value.toFixed(1)}%`
                    : stat.value
                  }
                </p>
              </div>
              {stat.icon && (
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-primary rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Trends - {selectedYear}
          </h3>
          {data.monthlyTrends ? (
            <MonthlyTrendsChart data={data.monthlyTrends} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner text="Loading trends..." />
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-primary rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Expense Distribution
          </h3>
          {data.categoryBreakdown ? (
            <ExpenseChart data={data.categoryBreakdown} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner text="Loading distribution..." />
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown and Spending Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-primary rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Category Breakdown
          </h3>
          {data.categoryBreakdown ? (
            <CategoryBreakdown data={data.categoryBreakdown} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner text="Loading breakdown..." />
            </div>
          )}
        </div>

        {/* Spending Patterns */}
        <div className="bg-primary rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Spending Patterns
          </h3>
          {data.spendingPatterns ? (
            <SpendingPatternsChart data={data.spendingPatterns} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner text="Loading patterns..." />
            </div>
          )}
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="bg-primary rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Financial Health Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-secondary rounded-lg">
            <h4 className="font-medium text-primary mb-2">Average Monthly Income</h4>
            <p className="text-2xl font-bold text-success">
              {data.overview ? 
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(data.overview.overview.totalIncome / 12) : 
                '$0'
              }
            </p>
          </div>
          
          <div className="text-center p-4 bg-secondary rounded-lg">
            <h4 className="font-medium text-primary mb-2">Average Monthly Expenses</h4>
            <p className="text-2xl font-bold text-error">
              {data.overview ? 
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(data.overview.overview.totalExpenses / 12) : 
                '$0'
              }
            </p>
          </div>
          
          <div className="text-center p-4 bg-secondary rounded-lg">
            <h4 className="font-medium text-primary mb-2">Financial Health Score</h4>
            <p className="text-2xl font-bold text-accent">
              {data.overview ? 
                Math.max(0, Math.min(100, data.overview.overview.savingsRate + 50)) : 
                0
              }/100
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
