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
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while searching TheGamesDB.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error searching TheGamesDB: ${errorMessage}`
    };
    console.log(`[${new Date().toISOString()}] Attempting to send 500 error response for ${req.method} ${req.originalUrl}:`, JSON.stringify(errorResponse));

    try {
      if (!res.headersSent) {
        res.status(500).json(errorResponse);
      } else {
        console.error(`[${new Date().toISOString()}] Headers already sent for ${req.method} ${req.originalUrl}, cannot send JSON error response.`);
      }
    } catch (sendError) {
      console.error(`[${new Date().toISOString()}] CRITICAL: Failed to send JSON error response for ${req.method} ${req.originalUrl}:`, sendError);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error - Response generation failed');
      }
    }
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
    } catch (apiCallError) { // Catch errors specifically from searchPlatformsByName
      console.error(`[${new Date().toISOString()}] API call error in ${req.method} ${req.originalUrl}:`, apiCallError);
      let statusCode = 500;
      let responseMessage = 'Invalid response from TheGamesDB API';

      if (apiCallError.message.includes('TheGamesDB request failed')) {
        statusCode = 502;
        responseMessage = 'TheGamesDB API service error';
      } else if (apiCallError.message.includes('Network error')) {
        // Assuming 'Network error' is a specific message you might get
        statusCode = 503; // Service Unavailable for network issues to external API
        responseMessage = 'Error searching TheGamesDB platforms due to a network issue.';
      } else if (apiCallError.message) {
        responseMessage = apiCallError.message;
      }

      const errorResponse = { success: false, message: responseMessage };
      console.log(`[${new Date().toISOString()}] Attempting to send ${statusCode} error response for ${req.method} ${req.originalUrl}:`, JSON.stringify(errorResponse));
      try {
        if (!res.headersSent) {
          res.status(statusCode).json(errorResponse);
        } else {
          console.error(`[${new Date().toISOString()}] Headers already sent for ${req.method} ${req.originalUrl}, cannot send JSON error response.`);
        }
      } catch (sendError) {
        console.error(`[${new Date().toISOString()}] CRITICAL: Failed to send JSON error response for ${req.method} ${req.originalUrl}:`, sendError);
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error - Response generation failed');
        }
      }
    }
  } catch (error) { // General catch for unexpected errors in the route handler itself
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while searching TheGamesDB platforms.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error searching TheGamesDB platforms: ${errorMessage}`
    };
    console.log(`[${new Date().toISOString()}] Attempting to send 500 error response for ${req.method} ${req.originalUrl}:`, JSON.stringify(errorResponse));
    try {
      if (!res.headersSent) { res.status(500).json(errorResponse); } else { console.error(`[${new Date().toISOString()}] Headers already sent for ${req.method} ${req.originalUrl}, cannot send JSON error response.`); }
    } catch (sendError) {
      console.error(`[${new Date().toISOString()}] CRITICAL: Failed to send JSON error response for ${req.method} ${req.originalUrl}:`, sendError);
      if (error.message.includes('TheGamesDB request failed')) {
        if (!res.headersSent) { res.status(500).send('Internal Server Error - Response generation failed'); }
      }
    }
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
    } catch (apiCallError) { // Catch errors specifically from searchPlatformsByName
      console.error(`[${new Date().toISOString()}] API call error in ${req.method} ${req.originalUrl}:`, apiCallError);
      let statusCode = 500;
      let responseMessage = 'Invalid response from TheGamesDB API';

      if (apiCallError.message.includes('TheGamesDB request failed')) {
        statusCode = 502;
        responseMessage = 'TheGamesDB API service error';
      } else if (apiCallError.message.includes('Network error')) {
        statusCode = 503;
        responseMessage = 'Error searching TheGamesDB platforms due to a network issue.';
      } else if (apiCallError.message) {
        responseMessage = apiCallError.message;
      }

      const errorResponse = { success: false, message: responseMessage };
      console.log(`[${new Date().toISOString()}] Attempting to send ${statusCode} error response for ${req.method} ${req.originalUrl}:`, JSON.stringify(errorResponse));
      try {
        if (!res.headersSent) { res.status(statusCode).json(errorResponse); } else { console.error(`[${new Date().toISOString()}] Headers already sent for ${req.method} ${req.originalUrl}, cannot send JSON error response.`); }
      } catch (sendError) {
        console.error(`[${new Date().toISOString()}] CRITICAL: Failed to send JSON error response for ${req.method} ${req.originalUrl}:`, sendError);
        if (!res.headersSent) { res.status(500).send('Internal Server Error - Response generation failed'); }
      }
    }
  } catch (error) { // General catch for unexpected errors
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while searching TheGamesDB platforms.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error searching TheGamesDB platforms: ${errorMessage}`
    };
    console.log(`[${new Date().toISOString()}] Attempting to send 500 error response for ${req.method} ${req.originalUrl}:`, JSON.stringify(errorResponse));
    try {
      if (!res.headersSent) { res.status(500).json(errorResponse); } else { console.error(`[${new Date().toISOString()}] Headers already sent for ${req.method} ${req.originalUrl}, cannot send JSON error response.`); }
    } catch (sendError) {
      console.error(`[${new Date().toISOString()}] CRITICAL: Failed to send JSON error response for ${req.method} ${req.originalUrl}:`, sendError);
      if (!res.headersSent) { res.status(500).send('Internal Server Error - Response generation failed'); }
    }
  }
});

module.exports = router;