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

// API endpoints for games
app.get('/api/games', (req, res) => {
  const games = readJsonFile(GAMES_FILE);
  res.json({
    success: true,
    data: games
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
    data: game
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

// API endpoints for platforms
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

// API endpoints for emulators
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

// Launch game endpoint
app.post('/api/launch-game', (req, res) => {
  const { gameId, emulatorId } = req.body;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      message: 'Game ID is required'
    });
  }
  
  try {
    // Get game details
    const games = readJsonFile(GAMES_FILE);
    const game = games[gameId];
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
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
    const platforms = readJsonFile(PLATFORMS_FILE);
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
    
    // Create the command by replacing %ROM% or %rom% with the actual ROM path
    const command = emulator.command.replace(/%ROM%/gi, romPath);
    
    // Execute the command
    const { exec } = require('child_process');
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: `Error launching game: ${error.message}`
        });
      }
      
      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
      }
      
      res.json({
        success: true,
        message: `Game launched successfully`,
        command: command
      });
    });
  } catch (error) {
    console.error('Error launching game:', error);
    res.status(500).json({
      success: false,
      message: `Error launching game: ${error.message}`
    });
  }
});

// Identify ROMs API with model selection
app.post('/api/identify-roms', async (req, res) => {
  const { platformName, romNames, model = 'github' } = req.body;
  
  if (!platformName || !romNames || !Array.isArray(romNames) || romNames.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Platform name and ROM names array are required'
    });
  }
  
  try {
    let gameData;
    
    // Choose the model based on the request
    if (model === 'gemini') {
      gameData = await identifyRomsWithGemini(platformName, romNames);
    } else {
      // Default to GitHub Models
      gameData = await identifyRomsWithGithub(platformName, romNames);
    }
    
    res.json({
      success: true,
      data: gameData
    });
  } catch (error) {
    console.error('Error identifying ROMs:', error);
    res.status(500).json({
      success: false,
      message: `Error identifying ROMs: ${error.message}`
    });
  }
});

// Helper function to identify ROMs with GitHub Models
async function identifyRomsWithGithub(platformName, romNames) {
  const token = process.env.GITHUB_PAT_TOKEN;
  
  if (!token) {
    throw new Error('GitHub PAT token is not configured');
  }
  
  // Build the prompt for GitHub Models
  let promptText = `You are the world's leading expert in identifying the name of a retro game from just the platform and rom name.
Below is a list of rom names. YOU MUST RETURN ONLY JSON.
The JSON should contain the full name of the game, a short description of the game, and a field called "success"
which is true or false denoting whether you succeeded in identifying that rom.
`;
  
  // Add each ROM to the prompt
  romNames.forEach(romName => {
    promptText += `PLATFORM: ${platformName}\nROM: ${romName}\n`;
  });
  
  // Call GitHub Models API
  const response = await fetch("https://models.github.ai/inference/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "openai/gpt-4.1",
      messages: [
        { role: "system", content: "You are an expert on retro games who can identify games from filenames." },
        { role: "user", content: promptText }
      ],
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error:`, errorText);
    throw new Error(`API returned ${response.status}`);
  }
  
  const data = await response.json();
  const responseText = data.choices[0].message.content;
  
  // Try to parse the JSON response
  try {
    // Extract JSON from the response (in case there's any extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in response");
    }
  } catch (parseError) {
    console.error("Error parsing JSON response:", parseError);
    console.log("Raw response:", responseText);
    
    // Fallback: create basic data for each ROM
    return romNames.map(romName => ({
      filename: romName,
      name: romName.replace(/\.\w+$/, '').replace(/[_\-\.]+/g, ' '),
      description: `A ${platformName} game.`,
      success: false
    }));
  }
}

// Helper function to identify ROMs with Gemini
async function identifyRomsWithGemini(platformName, romNames) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }
  
  // Process ROMs in batches since Gemini might have different batch size requirements
  const results = [];
  
  for (const romName of romNames) {
    try {
      // Build the prompt for Gemini
      const promptText = `You are the world's leading expert in identifying retro games.
I have a ROM file named "${romName}" for the ${platformName} platform.
Please identify this game and provide the following information in JSON format:
- The proper title of the game
- A short description (1-2 sentences)
- Whether you're confident in your identification (true/false)

Return ONLY valid JSON with the following structure:
{
  "name": "Game Title",
  "description": "Short description of the game",
  "success": true
}`;
      
      // Call Gemini API
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: promptText }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 400,
          }
        }
      );
      
      const responseText = response.data.candidates[0].content.parts[0].text;
      
      // Try to parse the JSON response
      try {
        // Extract JSON from the response (in case there's any extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const gameData = JSON.parse(jsonMatch[0]);
          results.push({
            filename: romName,
            ...gameData
          });
        } else {
          throw new Error("No JSON found in Gemini response");
        }
      } catch (parseError) {
        console.error("Error parsing Gemini JSON response:", parseError);
        
        // Fallback for this ROM
        results.push({
          filename: romName,
          name: romName.replace(/\.\w+$/, '').replace(/[_\-\.]+/g, ' '),
          description: `A ${platformName} game.`,
          success: false
        });
      }
    } catch (error) {
      console.error(`Error identifying ROM ${romName} with Gemini:`, error);
      
      // Fallback for this ROM
      results.push({
        filename: romName,
        name: romName.replace(/\.\w+$/, '').replace(/[_\-\.]+/g, ' '),
        description: `A ${platformName} game.`,
        success: false
      });
    }
  }
  
  return results;
}

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