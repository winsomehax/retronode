const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { default: ModelClient, isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");

const { errorHandler } = require('./middleware/errorHandler');
const validate = require('./middleware/validate');
const { gameValidation, platformValidation, emulatorValidation, launchValidation } = require('./middleware/validationSchemas');
const gameController = require('./controllers/gameController');
const platformController = require('./controllers/platformController');
const emulatorController = require('./controllers/emulatorController');
const { igdbController, igdbLimiter } = require('./controllers/igdbController');
const theGamesDB = require('./middleware/TheGamesDB.js'); // Import TheGamesDB functions

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(compression());
app.use(express.json());
app.use(express.static('public', {
  maxAge: '1d',
  etag: true,
  immutable: true // Add immutable for cached files that won't change
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later' }
});
app.use('/api/', apiLimiter);

// Removed general request body debugging middleware
// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games.html'));
});

// Games routes
app.get('/api/games', gameController.getGames);
app.post('/api/games', gameValidation.create, validate, gameController.createGame);
app.put('/api/games/:gameId', gameValidation.update, validate, gameController.updateGame);
app.delete('/api/games/:gameId', gameValidation.delete, validate, gameController.deleteGame);
app.put('/api/games/:gameId/cover', gameValidation.updateCover, validate, gameController.updateCover);

// Platform routes
app.get('/api/platforms', platformController.getPlatforms);
app.post('/api/platforms', platformValidation.create, validate, platformController.createPlatform);
app.put('/api/platforms/:name', platformValidation.update, validate, platformController.updatePlatform);
app.delete('/api/platforms/:name', platformValidation.delete, validate, platformController.deletePlatform);
app.post('/api/platforms/update-image', platformValidation.updateImage, validate, platformController.updatePlatformImage);

// Emulator routes
app.get('/api/emulators', emulatorController.getEmulators);
app.post('/api/emulators', emulatorValidation.create, validate, emulatorController.createEmulator);
app.put('/api/emulators/:platformId/:emulatorId', emulatorValidation.update, validate, emulatorController.updateEmulator);
app.delete('/api/emulators/:platformId/:emulatorId', emulatorController.deleteEmulator);

// Emulator launch endpoint
app.post('/api/launch', launchValidation.create, validate, emulatorController.launchEmulator);

// IGDB integration
app.post('/api/igdb/game', igdbLimiter, igdbController.searchGame);

// TheGamesDB integration
app.get('/api/thegamesdb/search', async (req, res, next) => {
  try {
    const gameName = req.query.name;
    if (!gameName) {
      // Use AppError for consistent error handling
      return next(new AppError('Game name query parameter is required.', 400));
    }
    // Directly use the imported searchGames function
    const searchData = await theGamesDB.searchGames(gameName); // searchData is now { games: [], imageBaseUrl: "..." }
    res.json({
      success: true,
      source: 'TheGamesDB',
      results: searchData.games, // Array of game objects
      imageBaseUrl: searchData.imageBaseUrl // Base URL for constructing image paths
    });
  } catch (error) {
    next(error); // Pass to the global error handler
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}` 
  });
});

// Error handler must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
