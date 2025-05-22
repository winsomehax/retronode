const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();
const { default: ModelClient, isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const igdb = require('./igdb');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games.html'));
});

app.get('/api/games', (req, res) => {
  const gamesPath = path.join(__dirname, 'data', 'games.json');
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');

  // Read both games and platforms data
  fs.readFile(gamesPath, 'utf8', (err, gamesData) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read games data.' });
    }
    fs.readFile(platformsPath, 'utf8', (err2, platformsData) => {
      if (err2) {
        return res.status(500).json({ error: 'Failed to read platforms data.' });
      }

      const gamesJson = JSON.parse(gamesData);
      const platformsJson = JSON.parse(platformsData);

      // gamesJson is an object with game IDs as keys
      const games = Object.values(gamesJson).map(game => {
        // Map platform IDs to names and details
        const platformDetails = {};
        Object.keys(game.platforms || {}).forEach(pid => {
          if (platformsJson[pid]) {
            platformDetails[pid] = {
              name: platformsJson[pid].name,
              release_year: platformsJson[pid].release_year
            };
          }
        });
        return {
          title: game.title,
          description: game.description || '',
          cover_image_path: game.cover_image_path || '',
          platforms: game.platforms,
          platformDetails
        };
      });

      res.json(games);
    });
  });
});

app.post('/api/games/update-cover', (req, res) => {
  const { title, imageUrl } = req.body;
  if (!title || !imageUrl) {
    return res.status(400).json({ success: false, error: 'Missing title or imageUrl' });
  }
  const gamesPath = path.join(__dirname, 'data', 'games.json');
  fs.readFile(gamesPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read games data.' });
    let gamesJson;
    try {
      gamesJson = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid games data.' });
    }
    // Find the game by title (case-insensitive)
    const gameKey = Object.keys(gamesJson).find(key => (gamesJson[key].title || '').toLowerCase() === title.toLowerCase());
    if (!gameKey) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }
    gamesJson[gameKey].cover_image_path = imageUrl;
    fs.writeFile(gamesPath, JSON.stringify(gamesJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write games data.' });
      res.json({ success: true });
    });
  });
});

// --- GAMES CRUD ---
// Add a new game
app.post('/api/games', (req, res) => {
  const gamesPath = path.join(__dirname, 'data', 'games.json');
  const game = req.body;
  if (!game || !game.title) {
    return res.status(400).json({ success: false, error: 'Missing game title.' });
  }
  fs.readFile(gamesPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read games data.' });
    let gamesJson;
    try { gamesJson = JSON.parse(data); } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid games data.' });
    }
    // Use a slugified key for the game
    const key = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (gamesJson[key]) {
      return res.status(400).json({ success: false, error: 'Game already exists.' });
    }
    gamesJson[key] = game;
    fs.writeFile(gamesPath, JSON.stringify(gamesJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write games data.' });
      res.json({ success: true });
    });
  });
});

// Update a game by title (case-insensitive)
app.put('/api/games/:title', (req, res) => {
  const gamesPath = path.join(__dirname, 'data', 'games.json');
  const updatedGame = req.body;
  const title = req.params.title;
  fs.readFile(gamesPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read games data.' });
    let gamesJson;
    try { gamesJson = JSON.parse(data); } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid games data.' });
    }
    const gameKey = Object.keys(gamesJson).find(key => (gamesJson[key].title || '').toLowerCase() === title.toLowerCase());
    if (!gameKey) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }
    gamesJson[gameKey] = updatedGame;
    fs.writeFile(gamesPath, JSON.stringify(gamesJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write games data.' });
      res.json({ success: true });
    });
  });
});

// Delete a game by title (case-insensitive)
app.delete('/api/games/:title', (req, res) => {
  const gamesPath = path.join(__dirname, 'data', 'games.json');
  const title = req.params.title;
  fs.readFile(gamesPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read games data.' });
    let gamesJson;
    try { gamesJson = JSON.parse(data); } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid games data.' });
    }
    const gameKey = Object.keys(gamesJson).find(key => (gamesJson[key].title || '').toLowerCase() === title.toLowerCase());
    if (!gameKey) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }
    delete gamesJson[gameKey];
    fs.writeFile(gamesPath, JSON.stringify(gamesJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write games data.' });
      res.json({ success: true });
    });
  });
});

app.get('/api/platforms', (req, res) => {
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');
  fs.readFile(platformsPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read platforms data.' });
    }
    res.json(JSON.parse(data));
  });
});

app.get('/api/emulators', (req, res) => {
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');
  fs.readFile(platformsPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read platforms data.' });
    }
    const platforms = JSON.parse(data);
    // Build an object: { platformId: [ { emulator_id, ... }, ... ] }
    const emulators = {};
    Object.entries(platforms).forEach(([pid, platform]) => {
      if (Array.isArray(platform.emulators)) {
        emulators[pid] = platform.emulators.map(e => ({
          emulator_id: e.emulator_id,
          name: e.emulator_id, // You can enhance this if you have emulator names elsewhere
          ...e
        }));
      }
    });
    res.json(emulators);
  });
});

app.post('/api/platforms/update-image', (req, res) => {
  const { pid, imageUrl } = req.body;
  if (!pid || !imageUrl) {
    return res.status(400).json({ success: false, error: 'Missing pid or imageUrl' });
  }
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');
  fs.readFile(platformsPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read platforms data.' });
    let platformsJson;
    try {
      platformsJson = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid platforms data.' });
    }
    if (!platformsJson[pid]) {
      return res.status(404).json({ success: false, error: 'Platform not found.' });
    }
    platformsJson[pid].image_url = imageUrl;
    fs.writeFile(platformsPath, JSON.stringify(platformsJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write platforms data.' });
      res.json({ success: true });
    });
  });
});

// --- PLATFORMS CRUD ---
// Add a new platform
app.post('/api/platforms', (req, res) => {
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');
  const platform = req.body;
  if (!platform || !platform.name) {
    return res.status(400).json({ success: false, error: 'Missing platform name.' });
  }
  fs.readFile(platformsPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read platforms data.' });
    let platformsJson;
    try { platformsJson = JSON.parse(data); } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid platforms data.' });
    }
    // Use a slugified key for the platform
    const key = platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (platformsJson[key]) {
      return res.status(400).json({ success: false, error: 'Platform already exists.' });
    }
    platformsJson[key] = platform;
    fs.writeFile(platformsPath, JSON.stringify(platformsJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write platforms data.' });
      res.json({ success: true });
    });
  });
});

// Update a platform by name (case-insensitive)
app.put('/api/platforms/:name', (req, res) => {
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');
  const updatedPlatform = req.body;
  const name = req.params.name;
  fs.readFile(platformsPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read platforms data.' });
    let platformsJson;
    try { platformsJson = JSON.parse(data); } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid platforms data.' });
    }
    const platformKey = Object.keys(platformsJson).find(key => (platformsJson[key].name || '').toLowerCase() === name.toLowerCase());
    if (!platformKey) {
      return res.status(404).json({ success: false, error: 'Platform not found.' });
    }
    platformsJson[platformKey] = updatedPlatform;
    fs.writeFile(platformsPath, JSON.stringify(platformsJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write platforms data.' });
      res.json({ success: true });
    });
  });
});

// Delete a platform by name (case-insensitive)
app.delete('/api/platforms/:name', (req, res) => {
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');
  const name = req.params.name;
  fs.readFile(platformsPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read platforms data.' });
    let platformsJson;
    try { platformsJson = JSON.parse(data); } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid platforms data.' });
    }
    const platformKey = Object.keys(platformsJson).find(key => (platformsJson[key].name || '').toLowerCase() === name.toLowerCase());
    if (!platformKey) {
      return res.status(404).json({ success: false, error: 'Platform not found.' });
    }
    delete platformsJson[platformKey];
    fs.writeFile(platformsPath, JSON.stringify(platformsJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write platforms data.' });
      res.json({ success: true });
    });
  });
});

// --- EMULATORS CRUD ---
// Add a new emulator (by platform)
app.post('/api/emulators', (req, res) => {
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');
  const { platformId, emulator } = req.body;
  if (!platformId || !emulator || !emulator.emulator_id) {
    return res.status(400).json({ success: false, error: 'Missing platformId or emulator_id.' });
  }
  fs.readFile(platformsPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read platforms data.' });
    let platformsJson;
    try { platformsJson = JSON.parse(data); } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid platforms data.' });
    }
    if (!platformsJson[platformId]) {
      return res.status(404).json({ success: false, error: 'Platform not found.' });
    }
    if (!Array.isArray(platformsJson[platformId].emulators)) {
      platformsJson[platformId].emulators = [];
    }
    if (platformsJson[platformId].emulators.find(e => e.emulator_id === emulator.emulator_id)) {
      return res.status(400).json({ success: false, error: 'Emulator already exists for this platform.' });
    }
    platformsJson[platformId].emulators.push(emulator);
    fs.writeFile(platformsPath, JSON.stringify(platformsJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write platforms data.' });
      res.json({ success: true });
    });
  });
});

// Update an emulator (by platform and emulator_id)
app.put('/api/emulators/:platformId/:emulatorId', (req, res) => {
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');
  const { platformId, emulatorId } = req.params;
  const updatedEmulator = req.body;
  fs.readFile(platformsPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read platforms data.' });
    let platformsJson;
    try { platformsJson = JSON.parse(data); } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid platforms data.' });
    }
    if (!platformsJson[platformId] || !Array.isArray(platformsJson[platformId].emulators)) {
      return res.status(404).json({ success: false, error: 'Platform or emulator not found.' });
    }
    const idx = platformsJson[platformId].emulators.findIndex(e => e.emulator_id === emulatorId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Emulator not found.' });
    }
    platformsJson[platformId].emulators[idx] = updatedEmulator;
    fs.writeFile(platformsPath, JSON.stringify(platformsJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write platforms data.' });
      res.json({ success: true });
    });
  });
});

// Delete an emulator (by platform and emulator_id)
app.delete('/api/emulators/:platformId/:emulatorId', (req, res) => {
  const platformsPath = path.join(__dirname, 'data', 'platforms.json');
  const { platformId, emulatorId } = req.params;
  fs.readFile(platformsPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to read platforms data.' });
    let platformsJson;
    try { platformsJson = JSON.parse(data); } catch (e) {
      return res.status(500).json({ success: false, error: 'Invalid platforms data.' });
    }
    if (!platformsJson[platformId] || !Array.isArray(platformsJson[platformId].emulators)) {
      return res.status(404).json({ success: false, error: 'Platform or emulator not found.' });
    }
    const idx = platformsJson[platformId].emulators.findIndex(e => e.emulator_id === emulatorId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Emulator not found.' });
    }
    platformsJson[platformId].emulators.splice(idx, 1);
    fs.writeFile(platformsPath, JSON.stringify(platformsJson, null, 4), err2 => {
      if (err2) return res.status(500).json({ success: false, error: 'Failed to write platforms data.' });
      res.json({ success: true });
    });
  });
});

// --- LAUNCH EMULATOR ENDPOINT ---
app.post('/api/launch', async (req, res) => {
  const { emulatorId, platformId, gameTitle, romPath } = req.body;
  if (!emulatorId || !platformId || !gameTitle || !romPath) {
    return res.status(400).json({ success: false, error: 'Missing emulatorId, platformId, gameTitle, or romPath' });
  }
  // For now, just log the launch and return success
  console.log(`Would launch emulator '${emulatorId}' for platform '${platformId}' with ROM '${romPath}' (game: '${gameTitle}')`);
  // Example: spawn emulator process here
  // const { spawn } = require('child_process');
  // spawn(emulatorId, [romPath], { detached: true });
  res.json({ success: true });
});

// AI endpoint for game info
app.get('/api/ai/game-info', async (req, res) => {
  const title = req.query.title;
  if (!title) return res.status(400).json({ error: 'Missing title' });
  const token = process.env.GITHUB_PAT_TOKEN || process.env.GITHUB_TOKEN;
  const endpoint = "https://models.github.ai/inference";
  const model = "openai/gpt-4.1";
  if (!token) {
    console.error('Missing GitHub AI token');
    return res.status(500).json({ error: 'Missing GitHub AI token' });
  }
  const prompt = `You are a retro video game database assistant. Given the game title, provide a concise, one-sentence description suitable for a game database.\n\nGame title: ${title}\nDescription:`;
  try {
    const client = ModelClient(endpoint, new AzureKeyCredential(token));
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are a helpful assistant for retro video game metadata." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        top_p: 1.0,
        model: model
      }
    });
    if (isUnexpected(response)) {
      console.error('GitHub AI error:', response.body);
      return res.status(500).json({ error: 'GitHub AI error', details: response.body });
    }
    const description = response.body.choices?.[0]?.message?.content?.trim() || '';
    res.json({ description });
  } catch (e) {
    console.error('AI request failed:', e);
    res.status(500).json({ error: 'AI request failed', details: e.message });
  }
});

app.post('/api/igdb/game', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing title' });

  try {
    const results = await igdb.searchGame(title);
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error fetching game from IGDB:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/log', (req, res) => {
  const logMsg = req.body && req.body.log ? req.body.log : '';
  if (!logMsg) return res.status(400).json({ success: false, error: 'No log message provided' });
  const logPath = path.join(__dirname, 'nohup.out');
  fs.appendFile(logPath, logMsg, err => {
    if (err) {
      console.error('Failed to write log:', err);
      return res.status(500).json({ success: false, error: 'Failed to write log' });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

