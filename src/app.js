require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

// Initialize app
const app = express();
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