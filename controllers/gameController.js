const { readJsonFile, writeJsonFile, PATHS } = require('../utils/fileOps');
const { AppError } = require('../middleware/errorHandler');

class GameController {
  constructor() {
    this.getGames = this.getGames.bind(this);
    this.createGame = this.createGame.bind(this);
    this.updateGame = this.updateGame.bind(this);
    this.deleteGame = this.deleteGame.bind(this);
    this.updateCover = this.updateCover.bind(this);
  }

  async getGames(req, res, next) {
    try {
      const [gamesJson, platformsJson] = await Promise.all([
        readJsonFile(PATHS.GAMES),
        readJsonFile(PATHS.PLATFORMS)
      ]);

      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
      const search = (req.query.search || '').toLowerCase();
      const platformFilter = req.query.platform;
      
      let games = Object.entries(gamesJson).map(([id, game]) => {
        const platformDetails = {};
        Object.keys(game.platforms || {}).forEach(pid => {
          if (platformsJson[pid]) {
            platformDetails[pid] = {
              name: platformsJson[pid].name || '',
              release_year: platformsJson[pid].release_year || ''
            };
          }
        });

        // Ensure all required fields exist with defaults
        return {
          id,
          title: game.title || '',
          description: game.description || '',
          cover_image_path: game.cover_image_path || '',
          platforms: game.platforms || {},
          platformDetails,
          created_at: game.created_at || new Date().toISOString(),
          updated_at: game.updated_at || new Date().toISOString()
        };
      });

      // Apply filters
      if (search) {
        games = games.filter(game => 
          game.title.toLowerCase().includes(search) ||
          game.description.toLowerCase().includes(search)
        );
      }

      if (platformFilter) {
        games = games.filter(game => 
          game.platforms && game.platforms[platformFilter]
        );
      }

      // Sort by title by default
      games.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

      const total = games.length;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedGames = games.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedGames,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: endIndex < total
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async createGame(req, res, next) {
    try {
      const game = req.body;
      const gamesJson = await readJsonFile(PATHS.GAMES);
      
      const key = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (gamesJson[key]) {
        throw new AppError('Game already exists', 400);
      }

      gamesJson[key] = {
        ...game,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await writeJsonFile(PATHS.GAMES, gamesJson);
      res.status(201).json({
        success: true,
        data: gamesJson[key]
      });
    } catch (err) {
      next(err);
    }
  }

  async updateGame(req, res, next) {
    try {
      const { title } = req.params;
      const updatedGame = req.body;
      const gamesJson = await readJsonFile(PATHS.GAMES);

      const gameKey = Object.keys(gamesJson).find(
        key => (gamesJson[key].title || '').toLowerCase() === title.toLowerCase()
      );

      if (!gameKey) {
        throw new AppError('Game not found', 404);
      }

      gamesJson[gameKey] = {
        ...updatedGame,
        updated_at: new Date().toISOString(),
        created_at: gamesJson[gameKey].created_at
      };

      await writeJsonFile(PATHS.GAMES, gamesJson);
      res.json({
        success: true,
        data: gamesJson[gameKey]
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteGame(req, res, next) {
    try {
      const { title } = req.params;
      const gamesJson = await readJsonFile(PATHS.GAMES);

      const gameKey = Object.keys(gamesJson).find(
        key => (gamesJson[key].title || '').toLowerCase() === title.toLowerCase()
      );

      if (!gameKey) {
        throw new AppError('Game not found', 404);
      }

      delete gamesJson[gameKey];
      await writeJsonFile(PATHS.GAMES, gamesJson);
      res.json({
        success: true,
        message: 'Game deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCover(req, res, next) {
    try {
      const { title, imageUrl } = req.body;
      const gamesJson = await readJsonFile(PATHS.GAMES);

      const gameKey = Object.keys(gamesJson).find(
        key => (gamesJson[key].title || '').toLowerCase() === title.toLowerCase()
      );

      if (!gameKey) {
        throw new AppError('Game not found', 404);
      }

      gamesJson[gameKey].cover_image_path = imageUrl;
      gamesJson[gameKey].updated_at = new Date().toISOString();

      await writeJsonFile(PATHS.GAMES, gamesJson);
      res.json({
        success: true,
        data: gamesJson[gameKey]
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GameController();
