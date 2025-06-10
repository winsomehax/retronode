// API functions for RetroNode

/**
 * Load games from the API
 * @param {string} search - Search term
 * @param {string} platform - Platform ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} - Promise with games data
 */
async function loadGamesApi(search = '', platform = '', page = 1, limit = 20) {
  let url = `/api/games?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (platform) url += `&platform=${encodeURIComponent(platform)}`;
  
  const response = await fetch(url);
  return response.json();
}

/**
 * Load platforms from the API
 * @returns {Promise} - Promise with platforms data
 */
async function loadPlatformsApi() {
  const response = await fetch('/api/platforms');
  return response.json();
}

/**
 * Load emulators for a platform from the API
 * @param {string} platformId - Platform ID
 * @returns {Promise} - Promise with emulators data
 */
async function loadEmulatorsApi(platformId) {
  const response = await fetch(`/api/emulators/${platformId}`);
  return response.json();
}

/**
 * Search games in TheGamesDB
 * @param {string} name - Game name
 * @returns {Promise} - Promise with search results
 */
async function searchGamesDbApi(name) {
  const response = await fetch(`/api/thegamesdb/games?name=${encodeURIComponent(name)}`);
  return response.json();
}

/**
 * Search platforms in TheGamesDB
 * @param {string} name - Platform name
 * @returns {Promise} - Promise with search results
 */
async function searchPlatformsDbApi(name) {
  const response = await fetch(`/api/thegamesdb/platforms?name=${encodeURIComponent(name)}`);
  return response.json();
}

/**
 * Generate game description using Gemini API
 * @param {string} title - Game title
 * @returns {Promise} - Promise with generated description
 */
async function generateGameDescription(title) {
  try {
    const response = await fetch('/api/gemini/game-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating description:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Generate game overview using Gemini API
 * @param {string} title - Game title
 * @returns {Promise} - Promise with generated overview
 */
async function generateGameOverview(title) {
  try {
    const response = await fetch('/api/gemini/game-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating description:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadGamesApi,
    loadPlatformsApi,
    loadEmulatorsApi,
    searchGamesDbApi,
    searchPlatformsDbApi,
    generateGameDescription,
    generateGameOverview
  };
}