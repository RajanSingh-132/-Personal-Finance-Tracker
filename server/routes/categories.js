const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin, requireAnyRole } = require('../middleware/auth');
const { cache, invalidateCache, CACHE_DURATIONS } = require('../middleware/cache');

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, requireAnyRole, cache(CACHE_DURATIONS.CATEGORIES), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, color, created_at FROM categories ORDER BY name'
    );

    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      createdAt: row.created_at
    }));

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single category
router.get('/:id', authenticateToken, requireAnyRole, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, name, description, color, created_at FROM categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = result.rows[0];
    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      createdAt: category.created_at
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new category (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s&]+$/)
    .withMessage('Name can only contain letters, numbers, spaces, and &'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { name, description, color = '#3B82F6' } = req.body;

    // Check if category name already exists
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, description, color) VALUES ($1, $2, $3) RETURNING *',
      [name, description, color]
    );

    const category = result.rows[0];

    // Invalidate cache
    await invalidateCache('cache:*/categories*');

    res.status(201).json({
      message: 'Category created successfully',
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        createdAt: category.created_at
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s&]+$/)
    .withMessage('Name can only contain letters, numbers, spaces, and &'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code')
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
    const { name, description, color } = req.body;

    // Check if category exists
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name conflicts with existing category
    if (name) {
      const nameConflict = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND id != $2',
        [name, id]
      );

      if (nameConflict.rows.length > 0) {
        return res.status(409).json({ error: 'Category with this name already exists' });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    // Invalidate cache
    await invalidateCache('cache:*/categories*');

    res.json({
      message: 'Category updated successfully',
      category: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        color: result.rows[0].color,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category is being used by any transactions
    const transactionCount = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = $1',
      [id]
    );

    if (parseInt(transactionCount.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category that is being used by transactions' 
      });
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Invalidate cache
    await invalidateCache('cache:*/categories*');

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
