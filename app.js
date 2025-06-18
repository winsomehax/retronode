require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Import routes
const gamesRouter = require('./routes/games');
const thegamesdbRouter = require('./routes/thegamesdb');
const platformsRouter = require('./routes/platforms');
const emulatorsRouter = require('./routes/emulators'); // Import the emulators router
const scannerRouter = require('./routes/scanner');

// Simple in-memory data store
let platforms = {};
let emulators = {};
let games = [];

// Data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
const API_KEYS_FILE_PATH = path.join(dataDir, 'api_keys.json');

// Load data if exists
try {
  if (fs.existsSync(path.join(dataDir, 'platforms.json'))) {
    platforms = JSON.parse(fs.readFileSync(path.join(dataDir, 'platforms.json')));
  }
  if (fs.existsSync(path.join(dataDir, 'emulators.json'))) {
    emulators = JSON.parse(fs.readFileSync(path.join(dataDir, 'emulators.json')));
  }
  if (fs.existsSync(path.join(dataDir, 'games.json'))) {
    games = JSON.parse(fs.readFileSync(path.join(dataDir, 'games.json')));
  }
} catch (err) {
  console.log('Error loading data:', err.message);
}

// Save data function
function saveData() {
  try {
    fs.writeFileSync(path.join(dataDir, 'platforms.json'), JSON.stringify(platforms, null, 2));
    fs.writeFileSync(path.join(dataDir, 'emulators.json'), JSON.stringify(emulators, null, 2));
    fs.writeFileSync(path.join(dataDir, 'games.json'), JSON.stringify(games, null, 2));
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

// Helper function to read API keys
function readApiKeys() {
  try {
    if (fs.existsSync(API_KEYS_FILE_PATH)) {
      const data = fs.readFileSync(API_KEYS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading API keys file:', error);
  }
  // Return default empty keys if file doesn't exist or error occurs
  return {
    thegamesdbApiKey: '',
    geminiApiKey: '',
    githubPatToken: '',
    rawgApiKey: ''
  };
}

// Helper function to write API keys
function writeApiKeys(keys) {
  try {
    fs.writeFileSync(API_KEYS_FILE_PATH, JSON.stringify(keys, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing API keys file:', error);
    return false;
  }
}

// API Routes
// Use routers
app.use('/api/games', gamesRouter);
app.use('/api/platforms', platformsRouter);
app.use('/api/emulators', emulatorsRouter); // Use the emulators router for /api/emulators path
app.use('/api', scannerRouter);
app.use('/api', thegamesdbRouter);

// API Route for getting API keys
app.get('/api/settings/api-keys', (req, res) => {
  const apiKeys = readApiKeys();
  res.json({
    success: true,
    ...apiKeys // Spread the keys into the response
  });
});

// API Route for saving API keys
app.post('/api/settings/api-keys', (req, res) => {
  const {
    thegamesdbApiKey,
    geminiApiKey,
    githubPatToken,
    rawgApiKey
  } = req.body;

  // Basic validation: check if all expected keys are at least present (even if empty strings)
  if (typeof thegamesdbApiKey === 'undefined' ||
      typeof geminiApiKey === 'undefined' ||
      typeof githubPatToken === 'undefined' ||
      typeof rawgApiKey === 'undefined') {
    return res.status(400).json({ success: false, message: 'Missing one or more API key fields in request body.' });
  }

  const newKeys = {
    thegamesdbApiKey: req.body.thegamesdbApiKey,
    geminiApiKey: req.body.geminiApiKey,
    githubPatToken: req.body.githubPatToken,
    rawgApiKey: req.body.rawgApiKey,
  };

  if (writeApiKeys(newKeys)) {
    res.json({ success: true, message: 'API keys saved successfully.' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to save API keys to file.' });
  }
});

// Serve static files from Vite's build output in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));

  // Specific routes for your HTML pages if they are not handled by client-side routing
  // and you want direct URL access in production.
  // These might not be strictly necessary if express.static serves them correctly
  // or if you rely on client-side routing from index.html.
  // ['/platforms.html', '/emulators.html', '/settings.html'].forEach(pagePath => {
  //   app.get(pagePath, (req, res) => {
  //     res.sendFile(path.join(__dirname, 'dist', pagePath));
  //   });
  // });
}
// The /api/emulators GET and POST routes defined directly in app.js might conflict
// with routes defined in ./routes/emulators.js. Review and consolidate if necessary.
// For this migration, they are left as is.
// External DB mock
app.get('/api/thegamesdb/search', (req, res) => {
  const { name } = req.query;
  
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name parameter is required' });
  }
  
  // Mock response
  res.json({
    success: true,
    results: [
      {
        id: '1',
        game_title: name,
        platform: '1',
        release_date: '1990-01-01',
        overview: 'This is a mock game description for ' + name,
        boxart_thumb_url: 'https://via.placeholder.com/100x150',
        boxart_large_url: 'https://via.placeholder.com/300x450'
      }
    ]
  });
});

// Catch-all for SPA: Serve index.html for any non-API GET requests
app.get('*', (req, res) => {
  // In development, Vite handles serving index.html.
  // In production, try to serve the requested file if it exists in dist, otherwise serve index.html for SPA fallback.
  const filePath = path.join(__dirname, 'dist', req.path);
  if (process.env.NODE_ENV === 'production' && fs.existsSync(filePath) && path.extname(req.path) !== '') {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(__dirname, process.env.NODE_ENV === 'production' ? 'dist/index.html' : 'index.html'));
  }
});

// Global error handlers - Add these at the end, before module.exports

// Catch 404s for API routes not found and forward to error handler
// This should come after all your API routes but before the general '*' SPA handler
app.use('/api', (req, res, next) => {
  const err = new Error('API Route Not Found');
  err.status = 404;
  next(err);
});

// General error handler for API errors
// This should be the last middleware for /api paths or a general one if no specific SPA handling is needed before it.
app.use('/api', (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] GLOBAL API ERROR HANDLER CAUGHT for ${req.method} ${req.originalUrl}:`);
  console.error('Error Status:', err.status || 500);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack || 'No stack available');

  if (res.headersSent) {
    console.error(`[${new Date().toISOString()}] Headers already sent. Cannot send global API error response.`);
    return next(err); // Pass to Express default error handler
  }

  const statusCode = err.status || 500;
  const responseJson = {
    success: false,
    message: err.message || 'An unexpected server error occurred.',
  };

  // Optionally include stack trace in development
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    responseJson.stack = err.stack;
  }

  console.log(`[${new Date().toISOString()}] Attempting to send ${statusCode} global API error response:`, JSON.stringify(responseJson));
  try {
    res.status(statusCode).json(responseJson);
  } catch (sendError) {
    console.error(`[${new Date().toISOString()}] CRITICAL: FAILED TO SEND JSON FROM GLOBAL API ERROR HANDLER:`, sendError);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error - Global API handler response generation failed');
    }
  }
});


module.exports = app;