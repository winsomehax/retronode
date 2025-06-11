// TheGamesDB Panel Manager
class GamesDBPanel extends ApiPanel {
  constructor() {
    super('gamesDBPanel', 'TheGamesDB Search Results');
  }
  
  async search(term) {
    this.clearError();
    this.showLoading();
    
    try {
      const response = await fetch(`/api/thegamesdb/games?name=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (data.success && data.results && data.results.length > 0) {
        this.gameData = {
          data: { games: data.results },
          include: data.include || {}
        };
        this.renderResults(this.gameData);
      } else {
        this.showNoResults();
      }
    } catch (error) {
      console.error('Error searching TheGamesDB:', error);
      this.showError('Error searching TheGamesDB. Please try again.');
    }
  }
  
  renderResults(data) {
    const resultsContainer = document.getElementById(`${this.id}Results`);
    resultsContainer.innerHTML = '';
    
    data.data.games.forEach(game => {
      const gameId = game.id ? game.id.toString() : '';
      const platformId = game.platform ? game.platform.toString() : '';
      
      // Get boxart if available
      let boxartUrl = 'https://via.placeholder.com/80x120?text=No+Image';
      if (game.boxart_image) {
        boxartUrl = game.boxart_image;
      } else if (data.include && data.include.boxart) {
        const baseUrl = data.include.boxart.base_url;
        const boxartData = data.include.boxart.data[gameId];
        
        if (boxartData && boxartData.length > 0) {
          // Find front boxart
          const frontBoxart = boxartData.find(art => art.side === 'front');
          if (frontBoxart) {
            boxartUrl = baseUrl.thumb + frontBoxart.filename;
          }
        }
      }
      
      // Get platform name if available
      let platformName = game.platform_name || 'Unknown Platform';
      if (data.include && data.include.platform && data.include.platform[platformId]) {
        platformName = data.include.platform[platformId].name;
      }
      
      const card = document.createElement('div');
      card.className = 'games-db-card';
      
      card.innerHTML = `
        <h3 class="games-db-card-title">${game.game_title || game.name || 'Unknown Title'}</h3>
        <div class="games-db-card-content">
          <img src="${boxartUrl}" alt="${game.game_title || game.name || 'Unknown Title'}" class="games-db-card-image" onerror="this.src='https://via.placeholder.com/80x120?text=No+Image'">
          <div class="games-db-card-details">
            <div class="games-db-card-platform">${platformName}</div>
            <div class="games-db-card-release">${game.release_date || 'Unknown release date'}</div>
            <div class="games-db-card-overview">${game.overview || 'No description available'}</div>
          </div>
        </div>
        <button class="games-db-card-select" data-game-id="${gameId}">Select This Game</button>
      `;
      
      // Add event listener to select button
      card.querySelector('.games-db-card-select').addEventListener('click', () => {
        this.selectGame(gameId);
      });
      
      resultsContainer.appendChild(card);
    });
  }
  
  selectGame(gameId) {
    if (!this.gameData) return;
    
    const game = this.gameData.data.games.find(g => g.id && g.id.toString() === gameId);
    if (!game) return;
    
    const platformId = game.platform ? game.platform.toString() : '';
    
    // Get boxart if available
    let boxartUrl = '';
    if (game.boxart_image) {
      boxartUrl = game.boxart_image;
    } else if (this.gameData.include && this.gameData.include.boxart) {
      const baseUrl = this.gameData.include.boxart.base_url;
      const boxartData = this.gameData.include.boxart.data[gameId];
      
      if (boxartData && boxartData.length > 0) {
        // Find front boxart
        const frontBoxart = boxartData.find(art => art.side === 'front');
        if (frontBoxart) {
          boxartUrl = baseUrl.medium + frontBoxart.filename;
        }
      }
    }
    
    // Create a game object with standardized properties
    const gameData = {
      name: game.game_title || game.name || '',
      description: game.overview || '',
      cover_url: boxartUrl || ''
    };
    
    // Update form fields
    this.updateFormFields(gameData);
    
    // Hide panel
    this.hide();
  }
}

// Initialize the GamesDB panel
const gamesDBPanel = new GamesDBPanel();