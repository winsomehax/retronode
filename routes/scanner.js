/**
 * ROM scanner routes for RetroNode
 */
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { validateInput, sanitizePath } = require('../utils/securityUtils');
const { callGithubModelsApi, callGeminiApi } = require('../utils/apiUtils');

// Scan a folder for ROMs
router.post('/scan-folder', async (req, res) => {
  try {
    // Validate input
    const validation = validateInput(req.body, {
      folderPath: { required: true, type: 'string', minLength: 1 },
      extensions: { isArray: true }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.errors
      });
    }
    
    const { folderPath, extensions } = req.body;
    
    // Sanitize the folder path to prevent path traversal
    const basePath = process.env.ROMS_BASE_PATH || '/';
    const sanitizedPath = sanitizePath(basePath, folderPath);
    
    if (!sanitizedPath) {
      return res.status(403).json({
        success: false,
        message: 'Access to the specified folder is not allowed'
      });
    }
    
    try {
      // Read the directory contents
      const files = await fs.readdir(sanitizedPath);
      
      // Filter files by extension if provided
      const filteredFiles = extensions && extensions.length > 0
        ? files.filter(file => {
            const ext = path.extname(file).toLowerCase().substring(1);
            return extensions.includes(ext);
          })
        : files;
      
      res.json({
        success: true,
        files: filteredFiles
      });
    } catch (fsError) { // Catch errors from fs.readdir
      console.error(`[${new Date().toISOString()}] File system error in ${req.method} ${req.originalUrl}:`, fsError);
      // Let the outer catch handle sending the response for consistency
      throw fsError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) { // Outer catch for general errors in the route
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while scanning folder.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = { success: false, message: `Error scanning folder: ${errorMessage}` };
    console.log(`[${new Date().toISOString()}] Attempting to send 500 error response for ${req.method} ${req.originalUrl}:`, JSON.stringify(errorResponse));
    try {
      if (!res.headersSent) { res.status(500).json(errorResponse); } else { console.error(`[${new Date().toISOString()}] Headers already sent for ${req.method} ${req.originalUrl}, cannot send JSON error response.`); }
    } catch (sendError) {
      console.error(`[${new Date().toISOString()}] CRITICAL: Failed to send JSON error response for ${req.method} ${req.originalUrl}:`, sendError);
      if (!res.headersSent) { res.status(500).send('Internal Server Error - Response generation failed'); }
    }
  }
});

// Identify ROMs using AI models
router.post('/identify-roms', async (req, res) => {
  try {
    // Validate input
    const validation = validateInput(req.body, {
      platformName: { required: true, type: 'string', minLength: 1 },
      romNames: { required: true, isArray: true, minLength: 1 },
      model: { type: 'string' }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.errors
      });
    }
    
    const { platformName, romNames, model = 'github' } = req.body;
    
    try {
      let gameData;
      
      // Choose the model based on the request
      if (model === 'gemini') {
        gameData = await callGeminiApi(platformName, romNames);
      } else {
        // Default to GitHub Models
        gameData = await callGithubModelsApi(platformName, romNames);
      }
      
      res.json({
        success: true,
        data: gameData
      });
    } catch (apiError) { // Catch errors from API calls
      console.error(`[${new Date().toISOString()}] API error in ${req.method} ${req.originalUrl}:`, apiError);
      // Let the outer catch handle sending the response
      throw apiError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) { // Outer catch for general errors
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, error);
    let errorMessage = 'An unexpected error occurred while identifying ROMs.';
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      errorMessage = error.message;
    } else if (typeof error === 'string' && error.trim() !== '') {
      errorMessage = error;
    }
    const errorResponse = { success: false, message: `Error identifying ROMs: ${errorMessage}` };
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