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
    } catch (fsError) {
      console.error('Error reading directory:', fsError);
      res.status(500).json({
        success: false,
        message: `Error scanning folder: ${fsError.message}`
      });
    }
  } catch (error) {
    console.error('Error scanning folder:', error);
    res.status(500).json({
      success: false,
      message: `Error scanning folder: ${error.message}`
    });
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
    } catch (apiError) {
      console.error('Error identifying ROMs:', apiError);
      res.status(500).json({
        success: false,
        message: `Error identifying ROMs: ${apiError.message}`
      });
    }
  } catch (error) {
    console.error('Error in identify-roms endpoint:', error);
    res.status(500).json({
      success: false,
      message: `Error processing request: ${error.message}`
    });
  }
});

module.exports = router;