const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const PLATFORMS_FILE = path.join(DATA_DIR, 'platforms.json');
const EMULATORS_FILE = path.join(DATA_DIR, 'emulators.json');
const ENV_FILE = path.join(__dirname, '.env');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(GAMES_FILE)) {
  fs.writeFileSync(GAMES_FILE, JSON.stringify({}));
}

if (!fs.existsSync(PLATFORMS_FILE)) {
  fs.writeFileSync(PLATFORMS_FILE, JSON.stringify({}));
}

if (!fs.existsSync(EMULATORS_FILE)) {
  fs.writeFileSync(EMULATORS_FILE, JSON.stringify({}));
}

// Helper function to read JSON file
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return {};
  }
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// API Routes

// Games
app.get('/api/games', (req, res) => {
  const games = readJsonFile(GAMES_FILE);
  const { search, platform, page = 1, limit = 20 } = req.query;
  
  let filteredGames = Object.entries(games).map(([id, game]) => ({ id, ...game }));
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredGames = filteredGames.filter(game => 
      game.title?.toLowerCase().includes(searchLower) || 
      game.description?.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply platform filter
  if (platform) {
    filteredGames = filteredGames.filter(game => 
      game.platforms && Object.keys(game.platforms).includes(platform)
    );
  }
  
  // Calculate pagination
  const totalItems = filteredGames.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedGames = filteredGames.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedGames,
    totalItems,
    currentPage: parseInt(page),
    totalPages
  });
});

app.get('/api/games/:id', (req, res) => {
  const games = readJsonFile(GAMES_FILE);
  const game = games[req.params.id];
  
  if (!game) {
    return res.status(404).json({
      success: false,
      message: 'Game not found'
    });
  }
  
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...game
    }
  });
});

app.post('/api/games', (req, res) => {
  const games = readJsonFile(GAMES_FILE);
  const id = uuidv4();
  
  games[id] = req.body;
  
  if (writeJsonFile(GAMES_FILE, games)) {
    res.json({
      success: true,
      id
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to save game'
    });
  }
});

app.put('/api/games/:id', (req, res) => {
  const games = readJsonFile(GAMES_FILE);
  
  if (!games[req.params.id]) {
    return res.status(404).json({
      success: false,
      message: 'Game not found'
    });
  }
  
  games[req.params.id] = req.body;
  
  if (writeJsonFile(GAMES_FILE, games)) {
    res.json({
      success: true
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to update game'
    });
  }
});

app.delete('/api/games/:id', (req, res) => {
  const games = readJsonFile(GAMES_FILE);
  
  if (!games[req.params.id]) {
    return res.status(404).json({
      success: false,
      message: 'Game not found'
    });
  }
  
  delete games[req.params.id];
  
  if (writeJsonFile(GAMES_FILE, games)) {
    res.json({
      success: true
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to delete game'
    });
  }
});

// Platforms
app.get('/api/platforms', (req, res) => {
  const platforms = readJsonFile(PLATFORMS_FILE);
  
  res.json({
    success: true,
    data: platforms
  });
});

app.get('/api/platforms/:id', (req, res) => {
  const platforms = readJsonFile(PLATFORMS_FILE);
  const platform = platforms[req.params.id];
  
  if (!platform) {
    return res.status(404).json({
      success: false,
      message: 'Platform not found'
    });
  }
  
  res.json({
    success: true,
    data: platform
  });
});

app.post('/api/platforms', (req, res) => {
  const platforms = readJsonFile(PLATFORMS_FILE);
  const { platform_id } = req.body;
  
  if (!platform_id) {
    return res.status(400).json({
      success: false,
      message: 'Platform ID is required'
    });
  }
  
  if (platforms[platform_id]) {
    return res.status(409).json({
      success: false,
      message: 'Platform ID already exists'
    });
  }
  
  platforms[platform_id] = req.body;
  
  if (writeJsonFile(PLATFORMS_FILE, platforms)) {
    res.json({
      success: true
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to save platform'
    });
  }
});

app.put('/api/platforms/:id', (req, res) => {
  const platforms = readJsonFile(PLATFORMS_FILE);
  
  if (!platforms[req.params.id]) {
    return res.status(404).json({
      success: false,
      message: 'Platform not found'
    });
  }
  
  platforms[req.params.id] = req.body;
  
  if (writeJsonFile(PLATFORMS_FILE, platforms)) {
    res.json({
      success: true
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to update platform'
    });
  }
});

app.delete('/api/platforms/:id', (req, res) => {
  const platforms = readJsonFile(PLATFORMS_FILE);
  
  if (!platforms[req.params.id]) {
    return res.status(404).json({
      success: false,
      message: 'Platform not found'
    });
  }
  
  delete platforms[req.params.id];
  
  if (writeJsonFile(PLATFORMS_FILE, platforms)) {
    res.json({
      success: true
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to delete platform'
    });
  }
});

// Emulators
app.get('/api/emulators', (req, res) => {
  // Get emulators from platforms instead of emulators.json
  const platforms = readJsonFile(PLATFORMS_FILE);
  const emulators = {};
  
  // Extract emulators from each platform
  Object.entries(platforms).forEach(([platformId, platform]) => {
    if (platform.emulators && typeof platform.emulators === 'object') {
      emulators[platformId] = Object.entries(platform.emulators).map(([id, emulator]) => ({
        emulator_id: id,
        ...emulator
      }));
    }
  });
  
  res.json({
    success: true,
    data: emulators
  });
});

app.get('/api/emulators/:platformId', (req, res) => {
  const platforms = readJsonFile(PLATFORMS_FILE);
  const platform = platforms[req.params.platformId];
  
  if (!platform) {
    return res.json({
      success: true,
      data: []
    });
  }
  
  const emulators = [];
  
  // Extract emulators from the platform
  if (platform.emulators && typeof platform.emulators === 'object') {
    Object.entries(platform.emulators).forEach(([id, emulator]) => {
      emulators.push({
        emulator_id: id,
        ...emulator
      });
    });
  }
  
  res.json({
    success: true,
    data: emulators
  });
});

app.post('/api/emulators', (req, res) => {
  const emulators = readJsonFile(EMULATORS_FILE);
  const { platformId, emulator } = req.body;
  
  if (!platformId || !emulator || !emulator.emulator_id) {
    return res.status(400).json({
      success: false,
      message: 'Platform ID and emulator details are required'
    });
  }
  
  if (!emulators[platformId]) {
    emulators[platformId] = [];
  }
  
  // Check if emulator ID already exists
  const existingIndex = emulators[platformId].findIndex(e => e.emulator_id === emulator.emulator_id);
  if (existingIndex !== -1) {
    return res.status(409).json({
      success: false,
      message: 'Emulator ID already exists for this platform'
    });
  }
  
  emulators[platformId].push(emulator);
  
  if (writeJsonFile(EMULATORS_FILE, emulators)) {
    res.json({
      success: true
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to save emulator'
    });
  }
});

app.put('/api/emulators/:platformId/:emulatorId', (req, res) => {
  const emulators = readJsonFile(EMULATORS_FILE);
  const { platformId, emulatorId } = req.params;
  const { emulator } = req.body;
  
  if (!emulators[platformId]) {
    return res.status(404).json({
      success: false,
      message: 'Platform not found'
    });
  }
  
  const emulatorIndex = emulators[platformId].findIndex(e => e.emulator_id === emulatorId);
  
  if (emulatorIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Emulator not found'
    });
  }
  
  emulators[platformId][emulatorIndex] = emulator;
  
  if (writeJsonFile(EMULATORS_FILE, emulators)) {
    res.json({
      success: true
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to update emulator'
    });
  }
});

app.delete('/api/emulators/:platformId/:emulatorId', (req, res) => {
  const emulators = readJsonFile(EMULATORS_FILE);
  const { platformId, emulatorId } = req.params;
  
  if (!emulators[platformId]) {
    return res.status(404).json({
      success: false,
      message: 'Platform not found'
    });
  }
  
  const emulatorIndex = emulators[platformId].findIndex(e => e.emulator_id === emulatorId);
  
  if (emulatorIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Emulator not found'
    });
  }
  
  emulators[platformId].splice(emulatorIndex, 1);
  
  if (writeJsonFile(EMULATORS_FILE, emulators)) {
    res.json({
      success: true
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to delete emulator'
    });
  }
});

// TheGamesDB API
app.get('/api/thegamesdb/games', async (req, res) => {
  const { name } = req.query;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Game name is required'
    });
  }
  
  const apiKey = process.env.THEGAMESDB_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'TheGamesDB API key is not configured'
    });
  }
  
  try {
    const response = await axios.get(`https://api.thegamesdb.net/v1/Games/ByGameName`, {
      params: {
        apikey: apiKey,
        name,
        fields: 'players,publishers,genres,overview,last_updated,rating,platform,coop,youtube,os,processor,ram,hdd,video,sound,alternates',
        include: 'boxart,platform'
      }
    });
    
    const games = response.data.data.games || [];
    
    // Process games to add platform names and boxart URLs
    const processedGames = games.map(game => {
      const platformId = game.platform?.toString();
      let platformName = 'Unknown Platform';
      let boxartUrl = null;
      
      // Get platform name
      if (response.data.include?.platform && platformId && response.data.include.platform[platformId]) {
        platformName = response.data.include.platform[platformId].name;
      }
      
      // Get boxart
      if (response.data.include?.boxart?.data && game.id) {
        const gameId = game.id.toString();
        const boxartData = response.data.include.boxart.data[gameId];
        
        if (boxartData && boxartData.length > 0) {
          // Find front boxart
          const frontBoxart = boxartData.find(art => art.side === 'front');
          if (frontBoxart) {
            boxartUrl = response.data.include.boxart.base_url.medium + frontBoxart.filename;
          }
        }
      }
      
      return {
        ...game,
        platform_name: platformName,
        boxart_image: boxartUrl
      };
    });
    
    res.json({
      success: true,
      results: processedGames,
      include: response.data.include
    });
  } catch (error) {
    console.error('Error fetching from TheGamesDB:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game data from TheGamesDB'
    });
  }
});

app.get('/api/thegamesdb/platforms', async (req, res) => {
  const { name } = req.query;
  
  const apiKey = process.env.THEGAMESDB_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'TheGamesDB API key is not configured'
    });
  }
  
  try {
    const response = await axios.get(`https://api.thegamesdb.net/v1/Platforms`, {
      params: {
        apikey: apiKey,
        fields: 'name,manufacturer,overview,developer,cpu,memory,graphics,sound,display,media,max_controllers'
      }
    });
    
    let platforms = Object.values(response.data.data.platforms || {});
    
    if (name) {
      const nameLower = name.toLowerCase();
      platforms = platforms.filter(platform => 
        platform.name.toLowerCase().includes(nameLower)
      );
    }
    
    res.json({
      success: true,
      results: platforms
    });
  } catch (error) {
    console.error('Error fetching from TheGamesDB:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform data from TheGamesDB'
    });
  }
});

// RAWG.io API
app.get('/api/rawg/games', async (req, res) => {
  const { name } = req.query;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Game name is required'
    });
  }
  
  const apiKey = process.env.RAWG_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'RAWG API key is not configured'
    });
  }
  
  try {
    const response = await axios.get(`https://api.rawg.io/api/games`, {
      params: {
        key: apiKey,
        search: name,
        page_size: 20
      }
    });
    
    const games = response.data.results || [];
    
    // Process games to format them for our app
    const processedGames = games.map(game => {
      // Get platform names
      const platforms = game.platforms?.map(p => p.platform.name).join(', ') || 'Unknown Platform';
      
      return {
        id: game.id,
        name: game.name,
        slug: game.slug,
        released: game.released,
        background_image: game.background_image,
        rating: game.rating,
        platform_name: platforms,
        description: game.description_raw || '',
        genres: game.genres?.map(g => g.name).join(', ') || ''
      };
    });
    
    res.json({
      success: true,
      results: processedGames,
      count: response.data.count,
      next: response.data.next
    });
  } catch (error) {
    console.error('Error fetching from RAWG API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game data from RAWG'
    });
  }
});

app.get('/api/rawg/games/:id', async (req, res) => {
  const { id } = req.params;
  
  const apiKey = process.env.RAWG_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'RAWG API key is not configured'
    });
  }
  
  try {
    const response = await axios.get(`https://api.rawg.io/api/games/${id}`, {
      params: {
        key: apiKey
      }
    });
    
    const game = response.data;
    
    // Format game data
    const formattedGame = {
      id: game.id,
      name: game.name,
      slug: game.slug,
      released: game.released,
      background_image: game.background_image,
      rating: game.rating,
      platforms: game.platforms?.map(p => p.platform.name).join(', ') || 'Unknown Platform',
      description: game.description_raw || '',
      genres: game.genres?.map(g => g.name).join(', ') || '',
      developers: game.developers?.map(d => d.name).join(', ') || '',
      publishers: game.publishers?.map(p => p.name).join(', ') || '',
      screenshots: game.screenshots?.results?.map(s => s.image) || []
    };
    
    res.json({
      success: true,
      data: formattedGame
    });
  } catch (error) {
    console.error('Error fetching game details from RAWG API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game details from RAWG'
    });
  }
});

app.get('/api/rawg/platforms', async (req, res) => {
  const apiKey = process.env.RAWG_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'RAWG API key is not configured'
    });
  }
  
  try {
    const response = await axios.get(`https://api.rawg.io/api/platforms`, {
      params: {
        key: apiKey
      }
    });
    
    const platforms = response.data.results || [];
    
    res.json({
      success: true,
      results: platforms
    });
  } catch (error) {
    console.error('Error fetching platforms from RAWG API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform data from RAWG'
    });
  }
});

// Gemini API for game descriptions
app.post('/api/gemini/game-description', async (req, res) => {
  const { title } = req.body;
  
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Game title is required'
    });
  }
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'Gemini API key is not configured'
    });
  }
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are an expert on video games who writes engaging and informative descriptions. Return information on "${title}" including a short 1-2 sentence description, first release date and platforms.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 400,
        }
      }
    );
    
    const description = response.data.candidates[0].content.parts[0].text;
    
    res.json({
      success: true,
      description
    });
  } catch (error) {
    console.error('Error fetching from Gemini API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate game description'
    });
  }
});

// Add the missing endpoint
app.post('/api/gemini/generate-overview', async (req, res) => {
  const { title } = req.body;
  
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Game title is required'
    });
  }
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'Gemini API key is not configured'
    });
  }
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Write a concise but detailed description of the video game "${title}". Include information about gameplay, story, and reception. Keep it under 200 words.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 400,
        }
      }
    );
    
    const description = response.data.candidates[0].content.parts[0].text;
    
    res.json({
      success: true,
      description
    });
  } catch (error) {
    console.error('Error fetching from Gemini API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate game overview'
    });
  }
});

// GitHub GPT41 API for game descriptions
app.post('/api/github/deepseek', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is required'
    });
  }
  
  const token = process.env.GITHUB_PAT_TOKEN;
  
  if (!token) {
    return res.status(500).json({
      success: false,
      message: 'GitHub PAT token is not configured'
    });
  }
  
  try {
    console.log("Using token:", token.substring(0, 15) + "...");
    
    const response = await fetch("https://models.github.ai/inference/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1",
        messages: [
          { role: "system", content: "You are an expert on video games who writes engaging and informative descriptions. Return information including a short 1-2 sentence description, first release date and platforms." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500
      })
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error:`, errorText);
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Response data structure:", Object.keys(data));
    const description = data.choices[0].message.content;
    
    res.json({
      success: true,
      description
    });
  } catch (error) {
    console.error('Error fetching from GitHub GPT41 API:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate game description with GPT41: ' + error.message
    });
  }
});

// API Keys settings
app.get('/api/settings/api-keys', (req, res) => {
  try {
    // Read .env file
    const envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
    
    // Parse .env content
    const envVars = dotenv.parse(envContent);
    
    res.json({
      success: true,
      thegamesdbApiKey: envVars.THEGAMESDB_API_KEY || '',
      geminiApiKey: envVars.GEMINI_API_KEY || '',
      githubPatToken: envVars.GITHUB_PAT_TOKEN || '',
      rawgApiKey: envVars.RAWG_API_KEY || ''
    });
  } catch (error) {
    console.error('Error reading API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to read API keys'
    });
  }
});

app.post('/api/settings/api-keys', (req, res) => {
  const { thegamesdbApiKey, geminiApiKey, githubPatToken, rawgApiKey } = req.body;
  
  try {
    // Read existing .env file
    let envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
    
    // Parse existing content
    const envVars = dotenv.parse(envContent);
    
    // Update API keys
    envVars.THEGAMESDB_API_KEY = thegamesdbApiKey;
    envVars.GEMINI_API_KEY = geminiApiKey;
    envVars.GITHUB_PAT_TOKEN = githubPatToken;
    envVars.RAWG_API_KEY = rawgApiKey;
    
    // Convert back to .env format
    envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Write back to .env file
    fs.writeFileSync(ENV_FILE, envContent);
    
    // Reload environment variables
    Object.assign(process.env, envVars);
    
    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error saving API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save API keys'
    });
  }
});

// ROM Scanner API
app.post('/api/scan-folder', (req, res) => {
  const { folderPath, extensions } = req.body;
  
  if (!folderPath) {
    return res.status(400).json({
      success: false,
      message: 'Folder path is required'
    });
  }
  
  try {
    // Read the directory contents
    const files = fs.readdirSync(folderPath);
    
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
  } catch (error) {
    console.error('Error scanning folder:', error);
    res.status(500).json({
      success: false,
      message: `Error scanning folder: ${error.message}`
    });
  }
});

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});