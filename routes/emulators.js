/**
 * Emulator routes for RetroNode
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readJsonFileAsync, writeJsonFileAsync } = require('../utils/fileUtils');
const { validateInput } = require('../utils/securityUtils');

// Data file path
const PLATFORMS_FILE = path.join(__dirname, '..', 'data', 'platforms.json');

// Get emulators for a platform
router.get('/:platformId', async (req, res) => {
  try {
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    const platform = platforms[req.params.platformId];
    
    // If platform doesn't exist or has no emulators property, return empty array
    if (!platform || !platform.emulators) {
      return res.json({
        success: true,
        data: [] // Frontend expects an array
      });
    }
    
    const emulatorsArray = [];
    
    // Extract emulators from the platform
    if (platform.emulators && typeof platform.emulators === 'object') {
      Object.entries(platform.emulators).forEach(([id, emulator]) => {
        emulatorsArray.push({
          emulator_id: id,
          ...emulator
        });
      });
    }

    res.json({
      success: true,
      data: emulatorsArray
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while getting emulators.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error getting emulators: ${errorMessage}`
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

// Add an emulator to a platform
router.post('/:platformId', async (req, res) => {
  try {
    // Validate input
    const validation = validateInput(req.body, {
      name: { required: true, type: 'string', minLength: 1 },
      command: { required: true, type: 'string', minLength: 1 },
      description: { type: 'string' }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.errors
      });
    }
    
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    const platformId = req.params.platformId;
    
    if (!platforms[platformId]) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    
    // Initialize emulators object if it doesn't exist
    if (!platforms[platformId].emulators) {
      platforms[platformId].emulators = {};
    }
    
    // Generate a unique ID for the emulator
    const emulatorId = req.body.emulator_id || uuidv4();
    
    // Add the emulator to the platform
    platforms[platformId].emulators[emulatorId] = {
      name: req.body.name,
      command: req.body.command,
      description: req.body.description || '',
      version: req.body.version || ''
    };
    
    if (await writeJsonFileAsync(PLATFORMS_FILE, platforms)) {
      res.status(201).json({
        success: true,
        emulator_id: emulatorId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to save emulator'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while adding emulator.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error adding emulator: ${errorMessage}`
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

// Update an emulator
router.put('/:platformId/:emulatorId', async (req, res) => {
  try {
    // Validate input
    const validation = validateInput(req.body, {
      name: { required: true, type: 'string', minLength: 1 },
      command: { required: true, type: 'string', minLength: 1 },
      description: { type: 'string' }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.errors
      });
    }
    
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    const { platformId, emulatorId } = req.params;
    
    if (!platforms[platformId]) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    
    if (!platforms[platformId].emulators || !platforms[platformId].emulators[emulatorId]) {
      return res.status(404).json({
        success: false,
        message: 'Emulator not found'
      });
    }
    
    // Update the emulator
    platforms[platformId].emulators[emulatorId] = {
      name: req.body.name,
      command: req.body.command,
      description: req.body.description || '',
      version: req.body.version || ''
    };
    
    if (await writeJsonFileAsync(PLATFORMS_FILE, platforms)) {
      res.json({
        success: true
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update emulator'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while updating emulator.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error updating emulator: ${errorMessage}`
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

// Delete an emulator
router.delete('/:platformId/:emulatorId', async (req, res) => {
  try {
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    const { platformId, emulatorId } = req.params;
    
    if (!platforms[platformId]) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    
    if (!platforms[platformId].emulators || !platforms[platformId].emulators[emulatorId]) {
      return res.status(404).json({
        success: false,
        message: 'Emulator not found'
      });
    }
    
    // Delete the emulator
    delete platforms[platformId].emulators[emulatorId];
    
    if (await writeJsonFileAsync(PLATFORMS_FILE, platforms)) {
      res.json({
        success: true
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete emulator'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while deleting emulator.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = {
      success: false,
      message: `Error deleting emulator: ${errorMessage}`
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