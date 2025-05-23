const { readJsonFile, writeJsonFile, PATHS } = require('../utils/fileOps');
const { AppError } = require('../middleware/errorHandler');

class PlatformController {
  constructor() {
    // Bind all methods
    this.getPlatforms = this.getPlatforms.bind(this);
    this.createPlatform = this.createPlatform.bind(this);
    this.updatePlatform = this.updatePlatform.bind(this);
    this.deletePlatform = this.deletePlatform.bind(this);
    this.updatePlatformImage = this.updatePlatformImage.bind(this);
  }

  async getPlatforms(req, res, next) {
    try {
      const platformsJson = await readJsonFile(PATHS.PLATFORMS);
      res.json({
        success: true,
        data: platformsJson
      });
    } catch (err) {
      next(err);
    }
  }

  async createPlatform(req, res, next) {
    try {
      const platform = req.body;
      const platformsJson = await readJsonFile(PATHS.PLATFORMS);
      
      const key = platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (platformsJson[key]) {
        throw new AppError('Platform already exists', 400);
      }

      platformsJson[key] = {
        ...platform,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await writeJsonFile(PATHS.PLATFORMS, platformsJson);
      res.status(201).json({
        success: true,
        data: platformsJson[key]
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePlatform(req, res, next) {
    try {
      const { name } = req.params;
      const updatedPlatform = req.body;
      const platformsJson = await readJsonFile(PATHS.PLATFORMS);

      const platformKey = Object.keys(platformsJson).find(
        key => (platformsJson[key].name || '').toLowerCase() === name.toLowerCase()
      );

      if (!platformKey) {
        throw new AppError('Platform not found', 404);
      }

      platformsJson[platformKey] = {
        ...updatedPlatform,
        updated_at: new Date().toISOString(),
        created_at: platformsJson[platformKey].created_at
      };

      await writeJsonFile(PATHS.PLATFORMS, platformsJson);
      res.json({
        success: true,
        data: platformsJson[platformKey]
      });
    } catch (err) {
      next(err);
    }
  }

  async deletePlatform(req, res, next) {
    try {
      const { name } = req.params;
      const platformsJson = await readJsonFile(PATHS.PLATFORMS);

      const platformKey = Object.keys(platformsJson).find(
        key => (platformsJson[key].name || '').toLowerCase() === name.toLowerCase()
      );

      if (!platformKey) {
        throw new AppError('Platform not found', 404);
      }

      delete platformsJson[platformKey];
      await writeJsonFile(PATHS.PLATFORMS, platformsJson);
      res.json({
        success: true,
        message: 'Platform deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePlatformImage(req, res, next) {
    try {
      const { pid, imageUrl } = req.body;
      const platformsJson = await readJsonFile(PATHS.PLATFORMS);

      if (!platformsJson[pid]) {
        throw new AppError('Platform not found', 404);
      }

      platformsJson[pid].image_url = imageUrl;
      platformsJson[pid].updated_at = new Date().toISOString();

      await writeJsonFile(PATHS.PLATFORMS, platformsJson);
      res.json({
        success: true,
        data: platformsJson[pid]
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PlatformController();
