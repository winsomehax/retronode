const https = require('https');

const apiKey = process.env.THEGAMESDB_API_KEY;
const baseUrl = 'https://api.thegamesdb.net/v1';

/**
 * @param {string} gameName - The name of the game to search for.
 * @returns {Promise<Array>} - A promise that resolves to an array of games.
 */
async function searchGames(gameName) {
  try {
    if (!apiKey) {
      throw new Error('THEGAMESDB_API_KEY is not set in environment variables.');
    }
    const params = new URLSearchParams({
      apikey: apiKey,
      name: gameName,
      fields: 'platform,players,genres,publishers,developers,overview,rating,release_date',
      include: 'boxart' // Request boxart images
    });
    const url = `${baseUrl}/Games/ByGameName?${params.toString()}`;

    return new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              const gamesFromApi = parsedData.data.games || [];
              const includeBoxartData = parsedData.include?.boxart?.data;
              const boxartBaseUrls = parsedData.include?.boxart?.base_url; // e.g., { original, small, thumb, large, ... }

              const processedGames = gamesFromApi.map(game => {
                // Ensure game.id is a string for object key lookup if necessary, though numbers usually work.
                const gameSpecificBoxartArray = includeBoxartData ? includeBoxartData[String(game.id)] : null;
                let largeBoxartUrl = null;
                let thumbBoxartUrl = null;

                if (gameSpecificBoxartArray && Array.isArray(gameSpecificBoxartArray) && boxartBaseUrls) {
                  // Prefer front boxart of type 'boxart'
                  let chosenBoxart = gameSpecificBoxartArray.find(art => art.type === 'boxart' && art.side === 'front');
                  
                  // Fallback to any 'boxart' type if front is not found
                  if (!chosenBoxart) {
                    chosenBoxart = gameSpecificBoxartArray.find(art => art.type === 'boxart');
                  }
                  // Fallback to the first image if no 'boxart' type is found
                  if (!chosenBoxart && gameSpecificBoxartArray.length > 0) {
                    chosenBoxart = gameSpecificBoxartArray[0];
                  }

                  if (chosenBoxart && chosenBoxart.filename) {
                    if (boxartBaseUrls.large) {
                      largeBoxartUrl = boxartBaseUrls.large + chosenBoxart.filename;
                    }
                    if (boxartBaseUrls.thumb) { 
                      thumbBoxartUrl = boxartBaseUrls.thumb + chosenBoxart.filename;
                    }
                  }
                }
                return {
                  ...game,
                  boxart_large_url: largeBoxartUrl,
                  boxart_thumb_url: thumbBoxartUrl,
                  boxart: gameSpecificBoxartArray || [], // Keep original boxart array for potential other uses
                };
              });

              resolve({
                games: processedGames,
                // The legacy imageBaseUrl is less relevant now for boxart, but kept for potential other uses or backward compatibility.
                imageBaseUrl: parsedData.include?.boxart?.base_url_legacy || 'https://legacy.thegamesdb.net/banners/'
              });
            } catch (e) {
              reject(new Error(`Failed to parse TheGamesDB response: ${e.message}`));
            }
          } else {
            reject(new Error(`TheGamesDB request failed with status code ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Error searching games on TheGamesDB:', error);
        reject(error);
      });

      req.end();
    });
  } catch (error) {
    console.error('Error searching games on TheGamesDB:', error);
    throw error;
  }
}
/**
 * @param {number} gameId - The ID of the game to retrieve.
 * @returns {Promise<Object>} - A promise that resolves to the game details.
 */
async function getGameDetails(gameId) {
  try {
    if (!apiKey) {
      throw new Error('THEGAMESDB_API_KEY is not set in environment variables.');
    }
    const params = new URLSearchParams({
      apikey: apiKey,
      id: gameId,
    });
    const url = `${baseUrl}/Games/ByGameID?${params.toString()}`;

    return new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData.data.game);
            } catch (e) {
              reject(new Error(`Failed to parse TheGamesDB response: ${e.message}`));
            }
          } else {
            reject(new Error(`TheGamesDB request failed with status code ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error(`Error retrieving game details for ID ${gameId} from TheGamesDB:`, error);
        reject(error);
      });
      req.end();
    });
  } catch (error) {
    console.error(`Error retrieving game details for ID ${gameId} from TheGamesDB:`, error);
    throw error;
  }
}
module.exports = { searchGames, getGameDetails };