const express = require('express');
const path = require('path');
const fs = require('fs');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Initialize with sample data if empty
if (Object.keys(platforms).length === 0) {
  platforms = {
    'nes': {
      name: 'Nintendo Entertainment System',
      manufacturer: 'Nintendo',
      release_year: 1985,
      description: 'The 8-bit Nintendo Entertainment System (NES) is one of the most iconic video game consoles ever released.'
    },
    'snes': {
      name: 'Super Nintendo Entertainment System',
      manufacturer: 'Nintendo',
      release_year: 1990,
      description: 'The 16-bit successor to the NES featuring enhanced graphics and sound capabilities.'
    }
  };
  
  emulators = {
    'nes': [
      {
        emulator_id: 'fceux',
        name: 'FCEUX',
        command: 'fceux',
        args: ['--fullscreen'],
        description: 'FCEUX is a cross platform, NTSC and PAL NES emulator.',
        version: '2.6.4'
      }
    ],
    'snes': [
      {
        emulator_id: 'snes9x',
        name: 'Snes9x',
        command: 'snes9x',
        args: ['--fullscreen'],
        description: 'Snes9x is a portable, freeware Super Nintendo Entertainment System emulator.',
        version: '1.60'
      }
    ]
  };
  
  games = [
    {
      id: '1',
      title: 'Super Mario Bros.',
      description: 'The classic platformer that defined a generation of games.',
      cover_image_path: 'https://via.placeholder.com/300x450?text=Super+Mario+Bros',
      platforms: { 'nes': 'roms/nes/super_mario_bros.nes' }
    },
    {
      id: '2',
      title: 'The Legend of Zelda',
      description: 'An action-adventure game set in the fantasy land of Hyrule.',
      cover_image_path: 'https://via.placeholder.com/300x450?text=Legend+of+Zelda',
      platforms: { 'nes': 'roms/nes/legend_of_zelda.nes' }
    },
    {
      id: '3',
      title: 'Super Mario World',
      description: 'Mario\'s 16-bit debut on the SNES featuring Yoshi.',
      cover_image_path: 'https://via.placeholder.com/300x450?text=Super+Mario+World',
      platforms: { 'snes': 'roms/snes/super_mario_world.sfc' }
    }
  ];
  
  saveData();
}

// API Routes
// Platforms
app.get('/api/platforms', (req, res) => {
  res.json({ success: true, data: platforms });
});

app.post('/api/platforms', (req, res) => {
  const { platform_id, name, manufacturer, release_year, description } = req.body;
  
  if (!platform_id || !name) {
    return res.status(400).json({ success: false, message: 'Platform ID and name are required' });
  }
  
  platforms[platform_id] = { name, manufacturer, release_year, description };
  saveData();
  
  res.status(201).json({ success: true, data: platforms[platform_id] });
});

// Emulators
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

// Games
app.get('/api/games', (req, res) => {
  const { search, platform, page = 1, limit = 20 } = req.query;
  
  let filteredGames = [...games];
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredGames = filteredGames.filter(game => 
      game.title.toLowerCase().includes(searchLower) || 
      (game.description && game.description.toLowerCase().includes(searchLower))
    );
  }
  
  if (platform) {
    filteredGames = filteredGames.filter(game => 
      game.platforms && game.platforms[platform]
    );
  }
  
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedGames = filteredGames.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedGames,
    totalItems: filteredGames.length,
    currentPage: parseInt(page),
    totalPages: Math.ceil(filteredGames.length / parseInt(limit))
  });
});

app.post('/api/games', (req, res) => {
  const { title, description, cover_image_path, platforms } = req.body;
  
  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  
  const newGame = {
    id: Date.now().toString(),
    title,
    description: description || '',
    cover_image_path: cover_image_path || '',
    platforms: platforms || {}
  };
  
  games.push(newGame);
  saveData();
  
  res.status(201).json({ success: true, data: newGame });
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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`RetroNode server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});