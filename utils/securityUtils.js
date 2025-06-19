/**
 * Security utility functions for RetroNode
 */
const path = require('path');
const { spawn } = require('child_process');

/**
 * Sanitize a file path to prevent path traversal attacks
 * @param {string} basePath - Base directory path
 * @param {string} userPath - User-provided path
 * @returns {string|null} - Sanitized path or null if invalid
 */
function sanitizePath(basePath, userPath) {
  // Resolve both paths to absolute paths
  const resolvedBase = path.resolve(basePath);
  const resolvedUser = path.resolve(userPath);
  
  // Check if the user path is within the base path
  if (!resolvedUser.startsWith(resolvedBase)) {
    return null;
  }
  
  return resolvedUser;
}

/**
 * Safely execute a command with arguments to prevent command injection
 * @param {string} command - Command to execute
 * @param {Array<string>} args - Command arguments
 * @returns {Promise<Object>} - Result with stdout and stderr
 */
function safeExecuteCommand(command, args) {
  return new Promise((resolve, reject) => {
    // Use spawn instead of exec to avoid shell injection
    const process = spawn(command, args);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parse an emulator command into command and arguments
 * @param {string} emulatorCommand - Full emulator command with %ROM% placeholder
 * @param {string} romPath - Path to the ROM file
 * @returns {Object} - Object with command and args properties
 */
function parseEmulatorCommand(emulatorCommand, romPath) {
  // Replace %ROM% placeholder with the actual ROM path
  const fullCommand = emulatorCommand.replace(/%ROM%/gi, romPath);
  
  // Split the command into command and arguments
  const parts = fullCommand.split(' ');
  const command = parts[0];
  const args = parts.slice(1);
  
  return { command, args };
}

/**
 * Validate input object against a schema
 * @param {Object} input - Input object to validate
 * @param {Object} schema - Schema object with required fields and types
 * @returns {Object} - Object with isValid and errors properties
 */
function validateInput(input, schema) {
  const errors = [];
  
  for (const [field, requirements] of Object.entries(schema)) {
    // Check if field is required and missing
    if (requirements.required && (input[field] === undefined || input[field] === null)) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip further validation if field is not present and not required
    if (input[field] === undefined || input[field] === null) {
      continue;
    }

    // Check if array (priority if isArray is specified)
    if (requirements.isArray) {
      if (!Array.isArray(input[field])) {
        errors.push(`${field} must be an array`);
      }
      // If it's an array, then minLength check for arrays will apply later
    } else if (requirements.type && typeof input[field] !== requirements.type) {
      // Check type only if not an array requirement or if array check passed (implicitly)
      errors.push(`${field} must be a ${requirements.type}`);
    }
    
    // Check minimum length (this existing block can remain, but ensure it works correctly for arrays vs strings)
    // The current minLength check will apply to arrays (number of elements)
    // and strings (number of characters). This seems okay.
    if (requirements.minLength !== undefined && 
        (input[field].length === undefined || input[field].length < requirements.minLength)) {
      errors.push(`${field} must have a minimum length of ${requirements.minLength}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  sanitizePath,
  safeExecuteCommand,
  parseEmulatorCommand,
  validateInput
};