/**
 * Game launcher routes for RetroNode
 */
const express = require('express');
const fs = require('fs').promises; // Import fs.promises
const router = express.Router();
const path = require('path');
const { readJsonFileAsync, ensureDirectoryExists } = require('../utils/fileUtils');
const { validateInput, safeExecuteCommand, parseEmulatorCommand } = require('../utils/securityUtils');

// Data file paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const PLATFORMS_FILE = path.join(DATA_DIR, 'platforms.json');

// Ensure data files exist
async function ensureDataFilesExist() {
  try {
    await ensureDirectoryExists(DATA_DIR);
    try {
      await fs.access(GAMES_FILE);
      await fs.access(PLATFORMS_FILE);
    } catch (err) {
      throw new Error('Required data files are missing. Please ensure both games.json and platforms.json exist in the data directory.');
    }
  } catch (error) {
    console.error('Error ensuring data files exist:', error);
    throw error;
  }
}

// Launch a game
router.post('/', async (req, res) => {
  try {
    await ensureDataFilesExist();
    // Validate input
    const validation = validateInput(req.body, {
      gameId: { required: true, type: 'string', minLength: 1 },
      emulatorId: { type: 'string' }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.errors
      });
    }
    
    const { gameId, emulatorId } = req.body;
    
    // Get game details
    const games = await readJsonFileAsync(GAMES_FILE);
    const game = games[gameId];
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: `Game with ID ${gameId} not found`
      });
    }
    
    // Check if the game has platforms
    if (!game.platforms || Object.keys(game.platforms).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Game has no ROM path configured'
      });
    }
    
    // Get the first platform and ROM path (or the specified one if multiple)
    const platformId = Object.keys(game.platforms)[0];
    const romPath = game.platforms[platformId];
    
    // Get platform details
    const platforms = await readJsonFileAsync(PLATFORMS_FILE);
    const platform = platforms[platformId];
    
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    
    // Check if the platform has emulators
    if (!platform.emulators || Object.keys(platform.emulators).length === 0) {
      return res.status(400).json({
        success: false,
        message: `No emulators configured for ${platform.name}`
      });
    }
    
    // Get the emulator (specified or first one)
    let emulator;
    if (emulatorId && platform.emulators[emulatorId]) {
      emulator = platform.emulators[emulatorId];
    } else {
      // If no specific emulator is requested, use the first one
      const firstEmulatorId = Object.keys(platform.emulators)[0];
      emulator = platform.emulators[firstEmulatorId];
    }
    
    // Parse the emulator command into command and arguments
    const { command, args } = parseEmulatorCommand(emulator.command, romPath);
    
    // DEBUG: Temporarily bypass actual command execution
    console.log(`[DEBUG] Would execute: ${command} ${args.join(' ')}`);
    res.json({
      success: true,
      message: `Game launched successfully (DEBUG - execution bypassed)`,
      command: `${command} ${args.join(' ')}`
    });
    // try {
    //   // Execute the command safely
    //   const result = await safeExecuteCommand(command, args);
      
    //   res.json({
    //     success: true,
    //     message: `Game launched successfully`,
    //     command: `${command} ${args.join(' ')}`
    //   });
    // } catch (execError) {
    //   console.error(`[${new Date().toISOString()}] Error executing command in ${req.method} ${req.originalUrl}:`, execError);
    //   if (!res.headersSent) {
    //     return res.status(500).json({
    //       success: false,
    //       message: `Error launching game (execution failed): ${execError.message}`
    //     });
    //   }
    // }
  } catch (error) { // Outer catch for general errors in the route
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while launching game.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = { success: false, message: `Error launching game: ${errorMessage}` };
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