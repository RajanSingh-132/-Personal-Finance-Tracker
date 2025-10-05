const express = require('express');
const { query, validationResult } = require('express-validator');
const pool = require('../config/database');
const { analyticsLimiter } = require('../middleware/rateLimiter');
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const { cache, invalidateCache, CACHE_DURATIONS } = require('../middleware/cache');

const router = express.Router();

// Apply rate limiting to all analytics routes
router.use(analyticsLimiter);

// Get spending overview for a specific period
router.get('/overview', authenticateToken, requireAnyRole, cache(CACHE_DURATIONS.ANALYTICS), async (req, res) => {
  try {
    const { 
      start_date = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end_date = new Date().toISOString().split('T')[0],
      period = 'month' // month, year, custom
    } = req.query;

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (startDate > endDate) {
      return res.status(400).json({ error: 'Start date cannot be after end date' });
    }

    // Get total income and expenses
    const overviewQuery = `
      SELECT 
        transaction_type,
        COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE user_id = $1 
        AND date >= $2 
        AND date <= $3
      GROUP BY transaction_type
    `;

    const overviewResult = await pool.query(overviewQuery, [req.user.id, start_date, end_date]);

    let totalIncome = 0;
    let totalExpenses = 0;

    overviewResult.rows.forEach(row => {
      if (row.transaction_type === 'income') {
        totalIncome = parseFloat(row.total);
      } else if (row.transaction_type === 'expense') {
        totalExpenses = parseFloat(row.total);
      }
    });

    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    res.json({
      period: {
        startDate,
        endDate,
        type: period
      },
      overview: {
        totalIncome,
        totalExpenses,
        netIncome,
        savingsRate: Math.round(savingsRate * 100) / 100
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category-wise expense breakdown
router.get('/expenses-by-category', authenticateToken, requireAnyRole, cache(CACHE_DURATIONS.ANALYTICS), async (req, res) => {
  try {
    const { 
      start_date = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end_date = new Date().toISOString().split('T')[0]
    } = req.query;

    const categoryBreakdownQuery = `
      SELECT 
        c.id,
        c.name,
        c.color,
        COALESCE(SUM(t.amount), 0) as total,
        COUNT(t.id) as transaction_count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id 
        AND t.user_id = $1 
        AND t.transaction_type = 'expense'
        AND t.date >= $2 
        AND t.date <= $3
      GROUP BY c.id, c.name, c.color
      HAVING COALESCE(SUM(t.amount), 0) > 0
      ORDER BY total DESC
    `;

    const result = await pool.query(categoryBreakdownQuery, [req.user.id, start_date, end_date]);

    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      amount: parseFloat(row.total),
      transactionCount: parseInt(row.transaction_count)
    }));

    const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);

    // Calculate percentages
    const categoriesWithPercentage = categories.map(cat => ({
      ...cat,
      percentage: totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100 * 100) / 100 : 0
    }));

    res.json({
      period: {
        startDate,
        endDate
      },
      categories: categoriesWithPercentage,
      totalExpenses
    });
  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get monthly trends
router.get('/monthly-trends', authenticateToken, requireAnyRole, cache(CACHE_DURATIONS.ANALYTICS), async (req, res) => {
  try {
    const { 
      months = 12,
      year = new Date().getFullYear()
    } = req.query;

    const monthlyTrendsQuery = `
      SELECT 
        DATE_TRUNC('month', date) as month,
        transaction_type,
        COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE user_id = $1 
        AND EXTRACT(YEAR FROM date) = $2
        AND date >= $3
      GROUP BY DATE_TRUNC('month', date), transaction_type
      ORDER BY month
    `;

    const startOfYear = `${year}-01-01`;
    const result = await pool.query(monthlyTrendsQuery, [req.user.id, year, startOfYear]);

    // Initialize months array
    const monthsData = [];
    for (let i = 0; i < parseInt(months); i++) {
      const date = new Date(year, i, 1);
      monthsData.push({
        month: date.toISOString().substring(0, 7), // YYYY-MM format
        monthName: date.toLocaleString('default', { month: 'short' }),
        income: 0,
        expenses: 0,
        net: 0
      });
    }

    // Populate with actual data
    result.rows.forEach(row => {
      const monthIndex = new Date(row.month).getMonth();
      if (monthIndex < monthsData.length) {
        if (row.transaction_type === 'income') {
          monthsData[monthIndex].income = parseFloat(row.total);
        } else if (row.transaction_type === 'expense') {
          monthsData[monthIndex].expenses = parseFloat(row.total);
        }
      }
    });

    // Calculate net income for each month
    monthsData.forEach(month => {
      month.net = month.income - month.expenses;
    });

    res.json({
      year: parseInt(year),
      months: monthsData
    });
  } catch (error) {
    console.error('Monthly trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent transactions summary
router.get('/recent-transactions', authenticateToken, requireAnyRole, cache(CACHE_DURATIONS.TRANSACTIONS), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentTransactionsQuery = `
      SELECT 
        t.id,
        t.amount,
        t.description,
        t.transaction_type,
        t.date,
        t.created_at,
        c.name as category_name,
        c.color as category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(recentTransactionsQuery, [req.user.id, limit]);

    const transactions = result.rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      description: row.description,
      type: row.transaction_type,
      date: row.date,
      createdAt: row.created_at,
      category: {
        name: row.category_name,
        color: row.category_color
      }
    }));

    res.json({ transactions });
  } catch (error) {
    console.error('Recent transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get spending patterns (daily averages)
router.get('/spending-patterns', authenticateToken, requireAnyRole, cache(CACHE_DURATIONS.ANALYTICS), async (req, res) => {
  try {
    const { 
      start_date = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end_date = new Date().toISOString().split('T')[0]
    } = req.query;

    const patternsQuery = `
      SELECT 
        EXTRACT(DOW FROM date) as day_of_week,
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        transaction_type,
        AVG(amount) as avg_amount,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE user_id = $1 
        AND date >= $2 
        AND date <= $3
      GROUP BY EXTRACT(DOW FROM date), EXTRACT(HOUR FROM created_at), transaction_type
      ORDER BY day_of_week, hour_of_day
    `;

    const result = await pool.query(patternsQuery, [req.user.id, start_date, end_date]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const patterns = result.rows.map(row => ({
      dayOfWeek: parseInt(row.day_of_week),
      dayName: dayNames[parseInt(row.day_of_week)],
      hourOfDay: parseInt(row.hour_of_day),
      type: row.transaction_type,
      avgAmount: parseFloat(row.avg_amount),
      transactionCount: parseInt(row.transaction_count)
    }));

    res.json({
      period: {
        startDate,
        endDate
      },
      patterns
    });
  } catch (error) {
    console.error('Spending patterns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get financial goals progress (placeholder for future feature)
router.get('/goals', authenticateToken, requireAnyRole, async (req, res) => {
  try {
    // This is a placeholder for future financial goals feature
    res.json({
      message: 'Financial goals feature coming soon',
      goals: []
    });
  } catch (error) {
    console.error('Goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
