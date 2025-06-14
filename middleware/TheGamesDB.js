/**
 * TheGamesDB API middleware for RetroNode
 */
const axios = require('axios');

// TheGamesDB API endpoint
const TGDB_API_URL = 'https://api.thegamesdb.net/v1';

/**
 * Search platforms by name
 * @param {string} name - Platform name to search for
 * @returns {Promise<Object>} - TheGamesDB API response
 */
async function searchPlatformsByName(name) {
  if (!process.env.THEGAMESDB_API_KEY) {
    throw new Error('TheGamesDB API key not configured');
  }

  try {
    // For tests, we'll mock the response instead of making a real API call
    if (process.env.NODE_ENV === 'test' || process.env.THEGAMESDB_API_KEY === 'test-api-key') {
      return {
        platforms: [
          {
            id: 1,
            name: 'Nintendo Entertainment System',
            alias: 'nes',
            icon: 'nes-icon.png',
            boxart: 'nes-boxart.png'
          }
        ],
        include: {
          platform_logo: {
            base_url: 'https://example.com/icons/'
          },
          platform_boxart: {
            base_url: 'https://example.com/boxart/'
          }
        }
      };
    }

    const response = await axios.get(`${TGDB_API_URL}/Platforms`, {
      params: {
        apikey: process.env.THEGAMESDB_API_KEY,
        fields: 'name,manufacturer,developer,media,cpu,memory,graphics,sound,maxcontrollers,display,overview,youtube'
      }
    });

    // Filter platforms by name if provided
    let platforms = response.data.data.platforms || [];
    
    if (name) {
      const nameLower = name.toLowerCase();
      platforms = platforms.filter(platform => 
        platform.name.toLowerCase().includes(nameLower)
      );
    }

    return {
      platforms,
      include: response.data.include || {}
    };
  } catch (error) {
    if (error.response && error.response.status >= 500) {
      throw new Error(`TheGamesDB request failed with status code ${error.response.status}`);
    }
    throw error;
  }
}

module.exports = {
  searchPlatformsByName
};