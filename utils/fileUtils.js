/**
 * File utility functions for RetroNode
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

/**
 * Read a JSON file synchronously (for initialization only)
 * @param {string} filePath - Path to the JSON file
 * @returns {Object} - Parsed JSON object or an empty object on error
 */
function readJsonFileSync(filePath) {
  try {
    const data = fsSync.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return {};
  }
}

/**
 * Write a JSON file synchronously (for initialization only)
 * @param {string} filePath - Path to the JSON file
 * @param {Object} data - Data to write
 * @returns {boolean} - Success status
 */
function writeJsonFileSync(filePath, data) {
  try {
    fsSync.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

/**
 * Validate if a path is safe (no path traversal)
 * @param {string} basePath - Base directory path
 * @param {string} userPath - User-provided path
 * @returns {boolean} - True if path is safe
 */
function isPathSafe(basePath, userPath) {
  const resolvedPath = path.resolve(userPath);
  return resolvedPath.startsWith(path.resolve(basePath));
}

// Function to read a JSON file asynchronously
async function readJsonFileAsync(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist or is not valid JSON, return an empty object or rethrow
    if (error.code === 'ENOENT') {
      return {}; // Or handle as per your application's logic, e.g., throw new Error('File not found');
    }
    console.error(`Error reading JSON file ${filePath}:`, error);
    throw error;
  }
}

// Function to write data to a JSON file asynchronously
async function writeJsonFileAsync(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error);
    return false; // Or throw error
  }
}

// Function to ensure a directory exists, creating it if necessary
async function ensureDirectoryExists(directoryPath) {
  try {
    await fs.mkdir(directoryPath, { recursive: true });
    // The { recursive: true } option creates parent directories if they don't exist
    // and doesn't throw an error if the directory already exists.
  } catch (error) {
    // Handle other potential errors (e.g., permission issues)
    console.error(`Error ensuring directory exists ${directoryPath}:`, error);
    throw error; // Re-throw to allow calling function to handle it
  }
}

module.exports = {
  readJsonFileAsync,
  writeJsonFileAsync,
  readJsonFileSync,
  writeJsonFileSync,
  ensureDirectoryExists,
  isPathSafe
};