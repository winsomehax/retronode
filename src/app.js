require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs'); // Added for file system operations
const mime = require('mime-types'); // Added for MIME type detection

// Initialize app
const app = express();

// --- Configuration for Media Covers ---
const MEDIA_COVERS_BASE_PATH = process.env.MEDIA_COVERS_BASE_PATH;

if (!MEDIA_COVERS_BASE_PATH) {
  console.error("FATAL ERROR: MEDIA_COVERS_BASE_PATH is not set in the environment variables.");
  process.exit(1); // Exit if the path is not configured
}

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const gamesRouter = require('../routes/games');
const thegamesdbRouter = require('../routes/thegamesdb');
const platformsRouter = require('../routes/platforms');
const emulatorsRouter = require('../routes/emulators'); // Import the emulators router
const scannerRouter = require('../routes/scanner');

// Simple in-memory data store
let platforms = {};
let emulators = {};
let games = [];

// Data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

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

// API Routes
// Use routers
app.use('/api/games', gamesRouter);
app.use('/api/platforms', platformsRouter);
app.use('/api/emulators', emulatorsRouter); // Use the emulators router for /api/emulators path
app.use('/api', scannerRouter);
app.use('/api', thegamesdbRouter);

// --- Route to serve game cover images ---
app.get('/api/game-media/covers', (req, res) => {
  const relativeImagePath = req.query.path;

  if (!relativeImagePath) {
    return res.status(400).send('Image path parameter is missing.');
  }

  // Sanitize the relative path to prevent directory traversal attacks.
  // path.normalize resolves '..' and '.' segments.
  const normalizedPath = path.normalize(relativeImagePath);

  // After normalization, ensure it doesn't try to go "up" from the base
  // and isn't an absolute path itself.
  if (normalizedPath.startsWith('..') || normalizedPath.startsWith('/') || path.isAbsolute(normalizedPath)) {
    console.warn(`Attempted traversal or absolute path in game media request: ${normalizedPath}`);
    return res.status(400).send('Invalid image path.');
  }

  const absoluteImagePath = path.join(MEDIA_COVERS_BASE_PATH, normalizedPath);

  // Check if the file exists and is readable
  fs.access(absoluteImagePath, fs.constants.R_OK, (err) => {
    if (err) {
      // File doesn't exist or isn't readable
      console.warn(`Cover image not found or not readable: ${absoluteImagePath}`);
      // Optionally, you could send a default placeholder image from your server here
      // For now, let the client-side onerror handle it by falling back to via.placeholder.com
      return res.status(404).send('Image not found.');
    }

    const contentType = mime.lookup(absoluteImagePath);
    if (!contentType) {
      console.error(`Could not determine MIME type for: ${absoluteImagePath}`);
      return res.status(500).send('Could not determine file type.');
    }

    res.setHeader('Content-Type', contentType);
    const fileStream = fs.createReadStream(absoluteImagePath);
    fileStream.pipe(res);

    fileStream.on('error', (streamErr) => {
      console.error(`Error streaming file ${absoluteImagePath}:`, streamErr);
      if (!res.headersSent) { // Avoid sending headers twice if error occurs mid-stream
        res.status(500).send('Error serving image.');
      }
    });
  });
});

// Emulators
// These routes handle global emulator operations if not covered by emulatorsRouter
app.get('/api/emulators', (req, res) => {
  res.json({ success: true, data: emulators });
});

app.post('/api/emulators', (req, res) => {
  const { platformId, emulator } = req.body;
  
  if (!platformId || !emulator || !emulator.name) {
    return res.status(400).json({ success: false, message: 'Platform ID and emulator name are required' });
  }
  
  if (!platforms[platformId]) {
    return res.status(404).json({ success: false, message: 'Platform not found' });
  }
  
  if (!emulators[platformId]) {
    emulators[platformId] = [];
  }
  
  emulators[platformId].push(emulator);
  saveData();
  
  res.status(201).json({ success: true, data: emulator });
});

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

// Serve frontend for all other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export the app for testing
// (Catch-all route must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;