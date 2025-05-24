const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('./errorHandler');

/**
 * Read and parse a JSON file
 * @param {string} filePath - Absolute path to the JSON file
 * @returns {Promise<Object>} Parsed JSON data
 * @throws {AppError} If file not found or invalid JSON
 */
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new AppError(`File not found: ${path.basename(filePath)}`, 404);
    }
    if (err instanceof SyntaxError) {
      throw new AppError(`Invalid JSON in ${path.basename(filePath)}`, 500);
    }
    throw new AppError('Error reading file', 500);
  }
};

/**
 * Write data to a JSON file
 * @param {string} filePath - Absolute path to the JSON file
 * @param {Object} data - Data to write
 * @throws {AppError} If write operation fails
 */
const writeJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 4));
  } catch (err) {
    throw new AppError(`Error writing to ${path.basename(filePath)}`, 500);
  }
};

/**
 * Path constants for data files
 */
const PATHS = {
  GAMES: path.join(__dirname, '../data/games.json'),
  PLATFORMS: path.join(__dirname, '../data/platforms.json'),
  EMULATORS: path.join(__dirname, '../data/emulators.json')
};

module.exports = {
  readJsonFile,
  writeJsonFile,
  PATHS
};
