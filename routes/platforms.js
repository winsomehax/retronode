/**
 * Platform routes for RetroNode
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises; // Import fs.promises
const { readJsonFileAsync, writeJsonFileAsync, ensureDirectoryExists } = require('../utils/fileUtils');
const { validateInput } = require('../utils/securityUtils');

// Data file path
const DATA_DIR = path.join(__dirname, '..', 'data');
const PLATFORMS_FILE = path.join(DATA_DIR, 'platforms.json');

// Ensure data directory and platforms file exist
async function ensurePlatformsFileExists() {
  try {
    await ensureDirectoryExists(DATA_DIR); // Assuming ensureDirectoryExists is in fileUtils
    try {
      await fs.access(PLATFORMS_FILE);
    } catch (err) {
      await writeJsonFileAsync(PLATFORMS_FILE, {}); // Initialize with empty object
    }
  } catch (error) {
    console.error('Error ensuring platforms.json exists:', error);
    throw error;
  }
}

// Get all platforms
router.get('/', async (req, res) => {
  try {
    await ensurePlatformsFileExists();
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    
    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while getting platforms.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }

    const errorResponse = {
      success: false,
      message: `Error getting platforms: ${errorMessage}`
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

// Get a single platform by ID
router.get('/:id', async (req, res) => {
  try {
    await ensurePlatformsFileExists();
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    const platform = platforms[req.params.id];
    
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    // Always include emulators property (Corrected line: assuming 'this.stack' was an error/typo)
    if (!platform.emulators) {
      platform.emulators = {};
    }
    res.json({
      success: true,
      data: platform
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while getting platform.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error getting platform: ${errorMessage}`
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

// Create a new platform
router.post('/', async (req, res) => {
  try {
    // Validate input
    const validation = validateInput(req.body, {
      platform_id: { required: true, type: 'string', minLength: 1 },
      name: { required: true, type: 'string', minLength: 1 },
      manufacturer: { type: 'string' },
      release_year: { type: 'number' },
      description: { type: 'string' }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.errors
      });
    }
    
    const { platform_id } = req.body;
    await ensurePlatformsFileExists();
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    
    if (platforms[platform_id]) {
      return res.status(409).json({
        success: false,
        message: 'Platform ID already exists'
      });
    }
    
    platforms[platform_id] = req.body;
    
    if (await writeJsonFileAsync(PLATFORMS_FILE, platforms)) {
      res.status(201).json({
        success: true,
        data: platforms[platform_id] // Return the created platform
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to save platform'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while creating platform.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error creating platform: ${errorMessage}`
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

// Update a platform
router.put('/:id', async (req, res) => {
  try {
    // Validate input
    const validation = validateInput(req.body, {
      name: { required: true, type: 'string', minLength: 1 },
      manufacturer: { type: 'string' },
      release_year: { type: 'number' },
      description: { type: 'string' }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.errors
      });
    }
    
    await ensurePlatformsFileExists();
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    
    if (!platforms[req.params.id]) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    
    // Preserve emulators if they exist
    const existingEmulators = platforms[req.params.id].emulators;
    
    platforms[req.params.id] = {
      ...req.body,
      // Keep the original platform_id
      platform_id: req.params.id,
      // Preserve emulators
      emulators: existingEmulators || {}
    };
    
    if (await writeJsonFileAsync(PLATFORMS_FILE, platforms)) {
      res.json({
        success: true,
        data: platforms[req.params.id] // Return the updated platform
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update platform'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while updating platform.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error updating platform: ${errorMessage}`
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

// Delete a platform
router.delete('/:id', async (req, res) => {
  try {
    await ensurePlatformsFileExists();
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    
    if (!platforms[req.params.id]) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    
    delete platforms[req.params.id];
    
    if (await writeJsonFileAsync(PLATFORMS_FILE, platforms)) {
      res.json({
        success: true,
        message: 'Platform deleted successfully' // Add a confirmation message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete platform'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while deleting platform.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error deleting platform: ${errorMessage}`
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