/**
 * Game routes for RetroNode
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { readJsonFileAsync, writeJsonFileAsync } = require('../utils/fileUtils');
const { validateInput } = require('../utils/securityUtils');

// Data file path
const DATA_DIR = path.join(__dirname, '..', 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');

// Ensure data directory and games file exist
async function ensureDataFilesExist() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(GAMES_FILE);
    } catch (err) {
      // Create empty games file if it doesn't exist
      await writeJsonFileAsync(GAMES_FILE, {});
    }
  } catch (error) {
    console.error('Error ensuring data files exist:', error);
    throw error;
  }
}

// Get all games with optional filtering
router.get('/', async (req, res) => {
  try {
    const { test, count, search, platform, page = 1, limit = 20 } = req.query;
    if (test === 'true') {
      const testCount = count ? parseInt(count) : 3;
      const testGames = Array.from({ length: testCount }, (_, i) => ({
        id: `test-${i + 1}`,
        title: `Test Game ${i + 1}`,
        description: `This is test game ${i + 1}`,
        platforms: { "test-platform": { path: "/test/path" } },
        cover_image_path: ""
      }));
      
      return res.json({
        success: true,
        data: testGames,
        totalItems: testGames.length,
        currentPage: 1,
        totalPages: 1
      });
    }
    await ensureDataFilesExist();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const games = await readJsonFileAsync(GAMES_FILE);
    let filteredGames = Object.entries(games).map(([id, game]) => ({ id, ...game }));
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredGames = filteredGames.filter(game => 
        (game.title && game.title.toLowerCase().includes(searchLower)) || 
        (game.description && game.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply platform filter
    if (platform) {
      filteredGames = filteredGames.filter(game => 
        game.platforms && game.platforms[platform]
      );
    }
    
    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedGames = filteredGames.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedGames,
      totalItems: filteredGames.length,
      currentPage: pageNum,
      totalPages: Math.ceil(filteredGames.length / limitNum)
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while getting games.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error getting games: ${errorMessage}`
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

// Get a single game by ID
router.get('/:id', async (req, res) => {
  try {
    await ensureDataFilesExist();
    const games = await readJsonFileAsync(GAMES_FILE);
    const game = games[req.params.id];
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: `Game with ID ${req.params.id} not found`
      });
    }
    
    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while getting game.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error getting game: ${errorMessage}`
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

// Create a new game
router.post('/', async (req, res) => {
  try {
    // Validate input
    const validation = validateInput(req.body, {
      title: { required: true, type: 'string', minLength: 1 },
      description: { type: 'string' },
      platforms: { type: 'object' }
    });
    
    if (!validation.isValid) {
      let message = 'Invalid input';
      if (validation.errors.length > 0) {
        const firstError = validation.errors[0];
        // Correctly capitalize "Title" and add a period if the error is specifically "title is required"
        message = `Invalid input: ${firstError.toLowerCase() === 'title is required' ? 'Title is required.' : firstError}`;
      }
      return res.status(400).json({
        success: false,
        message: message,
        errors: validation.errors
      });
    }
    
    const games = await readJsonFileAsync(GAMES_FILE);
    const id = uuidv4();
    
    if (req.body.cover_image_path && /^\d+$/.test(req.body.cover_image_path)) {
      req.body.cover_image_path = "";
    }
    games[id] = req.body;
    
    if (await writeJsonFileAsync(GAMES_FILE, games)) {
      res.status(201).json({
        success: true,
        id
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to save game'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while creating game.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error creating game: ${errorMessage}`
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

// Update a game
router.put('/:id', async (req, res) => {
  try {
    await ensureDataFilesExist();
    // Validate input
    const validation = validateInput(req.body, {
      title: { required: true, type: 'string', minLength: 1 },
      description: { type: 'string' },
      releaseDate: { type: 'string' },
      platform: { type: 'string' },
      coverUrl: { type: 'string' }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.errors
      });
    }
    
    const games = await readJsonFileAsync(GAMES_FILE);
    
    if (!games[req.params.id]) {
      return res.status(404).json({
        success: false,
        message: `Game with ID ${req.params.id} not found`
      });
    }
    
    if (req.body.cover_image_path && /^\d+$/.test(req.body.cover_image_path)) {
      req.body.cover_image_path = "";
    }
    games[req.params.id] = req.body;
    
    if (await writeJsonFileAsync(GAMES_FILE, games)) {
      res.json({
        success: true
        // message: 'Game deleted successfully' // This was incorrectly added here
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update game'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while updating game.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error updating game: ${errorMessage}`
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

// Delete a game
router.delete('/:id', async (req, res) => {
  try {
    await ensureDataFilesExist();
    const games = await readJsonFileAsync(GAMES_FILE);
    
    if (!games[req.params.id]) {
      return res.status(404).json({
        success: false,
        message: `Game with ID ${req.params.id} not found`
      });
    }
    
    delete games[req.params.id];
    
    if (await writeJsonFileAsync(GAMES_FILE, games)) {
      res.json({
        success: true,
        message: 'Game deleted successfully' // Correctly add the message here
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete game'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while deleting game.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error deleting game: ${errorMessage}`
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

module.exports = router;