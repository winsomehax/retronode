// TheGamesDB Panel Manager

class GamesDBPanel {
  constructor() {
    this.createPanel();
    this.setupEventListeners();
    this.gameData = null;
    this.targetFields = {};
  }
  
  createPanel() {
    // Create panel if it doesn't exist
    if (document.getElementById('gamesDBPanel')) {
      return;
    }
    
    const panelHTML = `
      <div id="gamesDBPanel" class="games-db-panel">
        <div class="games-db-panel-header">
          <div class="games-db-panel-title">TheGamesDB Search Results</div>
          <button class="games-db-panel-close" id="gamesDBPanelClose">&times;</button>
        </div>
        <div class="games-db-panel-content">
          <div class="games-db-panel-search">
            <input type="text" id="gamesDBSearchInput" class="games-db-panel-search-input" placeholder="Search for games...">
            <button id="gamesDBSearchButton" class="games-db-panel-search-button">Search</button>
          </div>
          <div id="gamesDBPanelError" class="games-db-panel-error" style="display: none;"></div>
          <div id="gamesDBPanelResults" class="games-db-panel-results">
            <div class="games-db-panel-no-results">Enter a search term to find games</div>
          </div>
        </div>
      </div>
    `;
    
    // Add panel to the document
    const div = document.createElement('div');
    div.innerHTML = panelHTML;
    document.body.appendChild(div.firstElementChild);
  }
  
  setupEventListeners() {
    document.getElementById('gamesDBPanelClose').addEventListener('click', () => this.hide());
    
    document.getElementById('gamesDBSearchButton').addEventListener('click', () => {
      const searchTerm = document.getElementById('gamesDBSearchInput').value.trim();
      if (searchTerm) {
        this.search(searchTerm);
      }
    });
    
    document.getElementById('gamesDBSearchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = e.target.value.trim();
        if (searchTerm) {
          this.search(searchTerm);
        }
      }
    });
  }
  
  async search(term) {
    const resultsContainer = document.getElementById('gamesDBPanelResults');
    const errorContainer = document.getElementById('gamesDBPanelError');
    
    errorContainer.style.display = 'none';
    resultsContainer.innerHTML = '<div class="games-db-panel-loading">Searching...</div>';
    
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
        resultsContainer.innerHTML = '<div class="games-db-panel-no-results">No games found matching your search</div>';
      }
    } catch (error) {
      console.error('Error searching TheGamesDB:', error);
      errorContainer.textContent = 'Error searching TheGamesDB. Please try again.';
      errorContainer.style.display = 'block';
      resultsContainer.innerHTML = '';
    }
  }
  
  renderResults(data) {
    const resultsContainer = document.getElementById('gamesDBPanelResults');
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
    
    // Get platform name if available
    let platformName = game.platform_name || '';
    if (this.gameData.include && this.gameData.include.platform && this.gameData.include.platform[platformId]) {
      platformName = this.gameData.include.platform[platformId].name;
    }
    
    // Update form fields
    if (this.targetFields.title) {
      this.targetFields.title.value = game.game_title || game.name || '';
    }
    
    if (this.targetFields.description) {
      this.targetFields.description.value = game.overview || '';
    }
    
    if (this.targetFields.cover) {
      this.targetFields.cover.value = boxartUrl || '';
    }
    
    // Hide panel
    this.hide();
  }
  
  show(targetFields = {}) {
    this.targetFields = targetFields;
    document.getElementById('gamesDBPanel').classList.add('open');
    
    // Pre-fill search input if title is provided
    if (targetFields.title && targetFields.title.value) {
      document.getElementById('gamesDBSearchInput').value = targetFields.title.value;
    }
  }
  
  hide() {
    document.getElementById('gamesDBPanel').classList.remove('open');
    this.targetFields = {};
  }
}

// Initialize the GamesDB panel
const gamesDBPanel = new GamesDBPanel();