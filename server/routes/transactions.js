const express = require('express');
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/database');
const { transactionLimiter } = require('../middleware/rateLimiter');
const { authenticateToken, requireUserOrAdmin, requireAnyRole } = require('../middleware/auth');
const { cache, invalidateCache, CACHE_DURATIONS } = require('../middleware/cache');

const router = express.Router();

// Apply rate limiting to all transaction routes
router.use(transactionLimiter);

// Get all transactions for the authenticated user
router.get('/', authenticateToken, requireAnyRole, cache(CACHE_DURATIONS.TRANSACTIONS), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category_id, 
      start_date, 
      end_date,
      search,
      sort_by = 'date',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE t.user_id = $1';
    const queryParams = [req.user.id];
    let paramCount = 1;

    // Build WHERE clause based on filters
    if (type) {
      paramCount++;
      whereClause += ` AND t.transaction_type = $${paramCount}`;
      queryParams.push(type);
    }

    if (category_id) {
      paramCount++;
      whereClause += ` AND t.category_id = $${paramCount}`;
      queryParams.push(category_id);
    }

    if (start_date) {
      paramCount++;
      whereClause += ` AND t.date >= $${paramCount}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereClause += ` AND t.date <= $${paramCount}`;
      queryParams.push(end_date);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (t.description ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Validate sort parameters
    const validSortColumns = ['date', 'amount', 'description', 'created_at'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'date';
    const sortOrder = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order.toUpperCase() : 'DESC';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get transactions with pagination
    const transactionsQuery = `
      SELECT 
        t.id,
        t.amount,
        t.description,
        t.transaction_type,
        t.date,
        t.created_at,
        t.updated_at,
        c.id as category_id,
        c.name as category_name,
        c.color as category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.${sortColumn} ${sortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);
    const result = await pool.query(transactionsQuery, queryParams);

    const transactions = result.rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      description: row.description,
      type: row.transaction_type,
      date: row.date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      category: {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color
      }
    }));

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single transaction
router.get('/:id', authenticateToken, requireAnyRole, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        t.id,
        t.amount,
        t.description,
        t.transaction_type,
        t.date,
        t.created_at,
        t.updated_at,
        c.id as category_id,
        c.name as category_name,
        c.color as category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1 AND t.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];
    res.json({
      id: transaction.id,
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      type: transaction.transaction_type,
      date: transaction.date,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
      category: {
        id: transaction.category_id,
        name: transaction.category_name,
        color: transaction.category_color
      }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new transaction
router.post('/', authenticateToken, requireUserOrAdmin, [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { amount, description, type, category_id, date } = req.body;

    // Verify category exists
    const categoryResult = await pool.query(
      'SELECT id, name FROM categories WHERE id = $1',
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    // Create transaction
    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, amount, description, transaction_type, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, amount, description, transaction_type, date, created_at`,
      [req.user.id, category_id, amount, description, type, date]
    );

    const transaction = result.rows[0];

    // Invalidate cache
    await invalidateCache(`cache:*/transactions*:${req.user.id}`);

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: {
        id: transaction.id,
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        type: transaction.transaction_type,
        date: transaction.date,
        createdAt: transaction.created_at,
        category: {
          id: categoryResult.rows[0].id,
          name: categoryResult.rows[0].name
        }
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update transaction
router.put('/:id', authenticateToken, requireUserOrAdmin, [
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { amount, description, type, category_id, date } = req.body;

    // Check if transaction exists and belongs to user
    const existingTransaction = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verify category if provided
    if (category_id) {
      const categoryResult = await pool.query(
        'SELECT id, name FROM categories WHERE id = $1',
        [category_id]
      );

      if (categoryResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (amount !== undefined) {
      updates.push(`amount = $${paramCount++}`);
      values.push(amount);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (type !== undefined) {
      updates.push(`transaction_type = $${paramCount++}`);
      values.push(type);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }
    if (date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE transactions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    // Invalidate cache
    await invalidateCache(`cache:*/transactions*:${req.user.id}`);

    res.json({
      message: 'Transaction updated successfully',
      transaction: {
        id: result.rows[0].id,
        amount: parseFloat(result.rows[0].amount),
        description: result.rows[0].description,
        type: result.rows[0].transaction_type,
        date: result.rows[0].date,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, requireUserOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Invalidate cache
    await invalidateCache(`cache:*/transactions*:${req.user.id}`);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
