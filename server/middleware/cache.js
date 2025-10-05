const redisClient = require('../config/redis');

// Cache middleware for GET requests
const cache = (duration = 900) => { // Default 15 minutes
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const key = `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;
      
      // Try to get cached data
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        console.log(`Cache hit for key: ${key}`);
        return res.json(JSON.parse(cachedData));
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        // Cache the response
        redisClient.setEx(key, duration, JSON.stringify(data))
          .catch(err => console.error('Cache set error:', err));
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching if Redis fails
    }
  };
};

// Cache invalidation helper
const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Specific cache durations
const CACHE_DURATIONS = {
  ANALYTICS: 900, // 15 minutes
  CATEGORIES: 3600, // 1 hour
  TRANSACTIONS: 300, // 5 minutes
  USER_PROFILE: 1800 // 30 minutes
};

module.exports = {
  cache,
  invalidateCache,
  CACHE_DURATIONS
};
