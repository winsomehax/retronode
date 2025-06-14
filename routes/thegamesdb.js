/**
 * TheGamesDB API routes for RetroNode
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { searchPlatformsByName } = require('../middleware/TheGamesDB');

// TheGamesDB API endpoint
const TGDB_API_URL = 'https://api.thegamesdb.net/v1';

// Get games from TheGamesDB
router.get('/thegamesdb/games', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name parameter is required'
      });
    }
    
    // Get API key from environment variables
    const apiKey = process.env.THEGAMESDB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'TheGamesDB API key is not configured'
      });
    }
    
    // Call TheGamesDB API
    const response = await axios.get(`${TGDB_API_URL}/Games/ByGameName`, {
      params: {
        apikey: apiKey,
        name: name,
        fields: 'players,publishers,genres,overview,last_updated,rating,platform,coop,youtube,os,processor,ram,hdd,video,sound,alternates',
        include: 'boxart,platform'
      }
    });
    
    // Return the results
    res.json({
      success: true,
      results: response.data.data.games || [],
      include: response.data.include || {}
    });
  } catch (error) {
    console.error('Error searching TheGamesDB:', error);
    res.status(500).json({
      success: false,
      message: `Error searching TheGamesDB: ${error.message}`
    });
  }
});

// New endpoints for TheGamesDB platform search
router.get('/thegamesdb/platforms/search', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Platform name is required'
      });
    }
    
    if (!process.env.THEGAMESDB_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'TheGamesDB API key not configured'
      });
    }
    
    try {
      const result = await searchPlatformsByName(name);
      
      res.json({
        success: true,
        data: result.platforms,
        include: result.include
      });
    } catch (error) {
      if (error.message.includes('TheGamesDB request failed')) {
        return res.status(502).json({
          success: false,
          message: 'TheGamesDB API service error'
        });
      }
      
      if (error.message.includes('Network error')) {
        return res.status(500).json({
          success: false,
          message: 'Error searching TheGamesDB platforms'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Invalid response from TheGamesDB API'
      });
    }
  } catch (error) {
    console.error('Error searching platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching TheGamesDB platforms'
    });
  }
});

// Direct platforms endpoint
router.get('/thegamesdb/platforms', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Platform name is required'
      });
    }
    
    if (!process.env.THEGAMESDB_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'TheGamesDB API key not configured'
      });
    }
    
    try {
      const result = await searchPlatformsByName(name);
      
      res.json({
        success: true,
        data: result.platforms,
        include: result.include
      });
    } catch (error) {
      if (error.message.includes('TheGamesDB request failed')) {
        return res.status(502).json({
          success: false,
          message: 'TheGamesDB API service error'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Invalid response from TheGamesDB API'
      });
    }
  } catch (error) {
    console.error('Error searching platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching TheGamesDB platforms'
    });
  }
});

module.exports = router;