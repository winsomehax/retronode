/**
 * API functions for RetroNode
 * Client-side API wrapper
 */

/**
 * Load games from the API
 * @param {string} search - Search term
 * @param {string} platform - Platform ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} - Promise with games data
 */
async function loadGamesApi(search = '', platform = '', page = 1, limit = 20) {
  try {
    // Make sure we're not using test data
    let url = `/api/games?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (platform) url += `&platform=${encodeURIComponent(platform)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error loading games:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Load platforms from the API
 * @returns {Promise} - Promise with platforms data
 */
async function loadPlatformsApi() {
  try {
    const response = await fetch('/api/platforms');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error loading platforms:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Load emulators for a platform from the API
 * @param {string} platformId - Platform ID
 * @returns {Promise} - Promise with emulators data
 */
async function loadEmulatorsApi(platformId) {
  try {
    const response = await fetch(`/api/emulators/${platformId}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error loading emulators:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Launch a game
 * @param {string} gameId - Game ID
 * @param {string} emulatorId - Emulator ID (optional)
 * @returns {Promise} - Promise with launch result
 */
async function launchGameApi(gameId, emulatorId = null) {
  try {
    const payload = { gameId };
    if (emulatorId) {
      payload.emulatorId = emulatorId;
    }
    
    const response = await fetch('/api/launch-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error launching game:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Scan a folder for ROMs
 * @param {string} folderPath - Path to the folder
 * @param {Array<string>} extensions - Array of file extensions to filter
 * @returns {Promise} - Promise with scan results
 */
async function scanFolderApi(folderPath, extensions = []) {
  try {
    const response = await fetch('/api/scan-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderPath, extensions })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error scanning folder:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Identify ROMs using AI
 * @param {string} platformName - Platform name
 * @param {Array<string>} romNames - Array of ROM filenames
 * @returns {Promise} - Promise with identification results
 */
async function identifyRomsApi(platformName, romNames) {
  try {
    // Get the preferred model from settings or default to GitHub
    const modelPreference = localStorage.getItem('romIdentificationModel') || 'github';
    
    // If mock model is selected, return mock data
    if (modelPreference === 'mock') {
      console.log(`[API MOCK] identifyRomsApi called for ${platformName} with ROMs:`, romNames);
      // Simulate an async operation
      await new Promise(resolve => setTimeout(resolve, 100)); // Short delay
      return {
        success: true,
        data: romNames.map(romName => ({
          name: `Mocked: ${romName.replace(/\.\w+$/, '')}`,
          description: `This is a mock AI description for ${romName} on the ${platformName} platform.`,
          success: Math.random() > 0.1 // Simulate 90% success rate for individual ROMs
        }))
      };
    }
    
    const response = await fetch('/api/identify-roms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platformName,
        romNames,
        model: modelPreference
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error identifying ROMs:', error);
    return { success: false, message: error.message };
  }
}

// Export functions
export {
  loadGamesApi,
  loadPlatformsApi,
  loadEmulatorsApi,
  launchGameApi,
  scanFolderApi,
  identifyRomsApi
};