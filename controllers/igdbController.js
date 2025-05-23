const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');
const igdb = require('../igdb');
const rateLimit = require('express-rate-limit');
const { AppError } = require('../middleware/errorHandler');

// Cache IGDB responses for 24 hours
const cache = new NodeCache({ 
  stdTTL: 86400,
  checkperiod: 3600,
  useClones: false
});

// Create rate limiter for IGDB requests
const igdbLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 4, // 4 requests per minute
  handler: (req, res) => {
    throw new AppError('Too many IGDB requests, please try again later', 429);
  }
});

class IgdbController {
  constructor() {
    this.searchGame = this.searchGame.bind(this);
    this.initializeCache();
  }

  async initializeCache() {
    try {
      const stats = cache.getStats();
      console.log('IGDB Cache initialized:', stats);
    } catch (err) {
      console.error('Failed to initialize IGDB cache:', err);
    }
  }

  processGameImages(game) {
    if (game.cover && game.cover.url) {
      game.cover.url = game.cover.url.replace('t_thumb', 't_cover_big');
      game.cover.url = game.cover.url.replace('http:', 'https:');
    }
    
    if (game.screenshots) {
      game.screenshots = game.screenshots.map(screenshot => ({
        ...screenshot,
        url: screenshot.url
          .replace('t_thumb', 't_screenshot_big')
          .replace('http:', 'https:')
      }));
    }
    
    return game;
  }

  async searchGame(req, res, next) {
    try {
      const { title } = req.body;
      if (!title) {
        throw new AppError('Game title is required', 400);
      }

      // Check cache first
      const cacheKey = `igdb:${title.toLowerCase()}`;
      const cachedResults = cache.get(cacheKey);
      
      if (cachedResults) {
        return res.json({
          success: true,
          results: cachedResults,
          source: 'cache'
        });
      }

      // If not in cache, fetch from IGDB
      try {
        const results = await igdb.searchGame(title);
        
        if (!Array.isArray(results)) {
          throw new AppError('Invalid response from IGDB', 502);
        }

        // Process each game's images
        const processedResults = results.map(this.processGameImages);

        // Cache the processed results
        cache.set(cacheKey, processedResults);
        
        res.json({
          success: true,
          results: processedResults,
          source: 'igdb'
        });
      } catch (igdbError) {
        console.error('IGDB API error:', igdbError);
        
        // Try to get local game info as fallback
        try {
          const gamesData = await fs.readFile(path.join(__dirname, '../data/games.json'), 'utf8');
          const gamesJson = JSON.parse(gamesData);
          
          const localResults = Object.values(gamesJson)
            .filter(g => g.title.toLowerCase().includes(title.toLowerCase()))
            .map(g => ({
              name: g.title,
              summary: g.description,
              cover: g.cover_image_path ? { url: g.cover_image_path } : null
            }));

          // Cache local results with shorter TTL
          cache.set(cacheKey, localResults, 3600); // 1 hour TTL for local results

          res.json({ 
            success: true, 
            results: localResults,
            source: 'local',
            note: 'Results from local database (IGDB unavailable)'
          });
        } catch (localError) {
          throw new AppError('Failed to fetch game information', 502);
        }
      }
    } catch (err) {
      next(err);
    }
  }

  // Helper method to clear cache (useful for testing/maintenance)
  async clearCache(req, res, next) {
    try {
      const stats = cache.getStats();
      cache.flushAll();
      res.json({
        success: true,
        message: 'Cache cleared successfully',
        previousStats: stats
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = {
  igdbController: new IgdbController(),
  igdbLimiter
};
