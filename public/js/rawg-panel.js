// RAWG.io Panel Manager

class RawgPanel {
  constructor() {
    this.createPanel();
    this.setupEventListeners();
    this.gameData = null;
    this.targetFields = {};
  }
  
  createPanel() {
    // Create panel if it doesn't exist
    if (document.getElementById('rawgPanel')) {
      return;
    }
    
    const panelHTML = `
      <div id="rawgPanel" class="games-db-panel">
        <div class="games-db-panel-header">
          <div class="games-db-panel-title">RAWG.io Search Results</div>
          <button class="games-db-panel-close" id="rawgPanelClose">&times;</button>
        </div>
        <div class="games-db-panel-content">
          <div class="games-db-panel-search">
            <input type="text" id="rawgSearchInput" class="games-db-panel-search-input" placeholder="Search for games...">
            <button id="rawgSearchButton" class="games-db-panel-search-button">Search</button>
          </div>
          <div id="rawgPanelError" class="games-db-panel-error" style="display: none;"></div>
          <div id="rawgPanelResults" class="games-db-panel-results">
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
    document.getElementById('rawgPanelClose').addEventListener('click', () => this.hide());
    
    document.getElementById('rawgSearchButton').addEventListener('click', () => {
      const searchTerm = document.getElementById('rawgSearchInput').value.trim();
      if (searchTerm) {
        this.search(searchTerm);
      }
    });
    
    document.getElementById('rawgSearchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = e.target.value.trim();
        if (searchTerm) {
          this.search(searchTerm);
        }
      }
    });
  }
  
  async search(term) {
    const resultsContainer = document.getElementById('rawgPanelResults');
    const errorContainer = document.getElementById('rawgPanelError');
    
    errorContainer.style.display = 'none';
    resultsContainer.innerHTML = '<div class="games-db-panel-loading">Searching...</div>';
    
    try {
      const response = await fetch(`/api/rawg/games?name=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (data.success && data.results && data.results.length > 0) {
        this.gameData = data;
        this.renderResults(data.results);
      } else {
        resultsContainer.innerHTML = '<div class="games-db-panel-no-results">No games found matching your search</div>';
      }
    } catch (error) {
      console.error('Error searching RAWG.io:', error);
      errorContainer.textContent = 'Error searching RAWG.io. Please try again.';
      errorContainer.style.display = 'block';
      resultsContainer.innerHTML = '';
    }
  }
  
  renderResults(games) {
    const resultsContainer = document.getElementById('rawgPanelResults');
    resultsContainer.innerHTML = '';
    
    games.forEach(game => {
      const card = document.createElement('div');
      card.className = 'games-db-card';
      
      card.innerHTML = `
        <h3 class="games-db-card-title">${game.name || 'Unknown Title'}</h3>
        <div class="games-db-card-content">
          <img src="${game.background_image || 'https://via.placeholder.com/80x120?text=No+Image'}" 
               alt="${game.name || 'Unknown Title'}" 
               class="games-db-card-image" 
               onerror="this.src='https://via.placeholder.com/80x120?text=No+Image'">
          <div class="games-db-card-details">
            <div class="games-db-card-platform">${game.platform_name || 'Unknown Platform'}</div>
            <div class="games-db-card-release">${game.released || 'Unknown release date'}</div>
            <div class="games-db-card-overview">${game.description || 'No description available'}</div>
          </div>
        </div>
        <button class="games-db-card-select" data-game-id="${game.id}">Select This Game</button>
      `;
      
      // Add event listener to select button
      card.querySelector('.games-db-card-select').addEventListener('click', () => {
        this.selectGame(game.id);
      });
      
      resultsContainer.appendChild(card);
    });
  }
  
  async selectGame(gameId) {
    try {
      const response = await fetch(`/api/rawg/games/${gameId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const game = data.data;
        
        // Update form fields
        if (this.targetFields.title) {
          this.targetFields.title.value = game.name || '';
        }
        
        if (this.targetFields.description) {
          this.targetFields.description.value = game.description || '';
        }
        
        if (this.targetFields.cover) {
          this.targetFields.cover.value = game.background_image || '';
        }
        
        // Hide panel
        this.hide();
      }
    } catch (error) {
      console.error('Error fetching game details from RAWG.io:', error);
      const errorContainer = document.getElementById('rawgPanelError');
      errorContainer.textContent = 'Error fetching game details. Please try again.';
      errorContainer.style.display = 'block';
    }
  }
  
  show(targetFields = {}) {
    this.targetFields = targetFields;
    document.getElementById('rawgPanel').classList.add('open');
    
    // Pre-fill search input if title is provided
    if (targetFields.title && targetFields.title.value) {
      document.getElementById('rawgSearchInput').value = targetFields.title.value;
    }
  }
  
  hide() {
    document.getElementById('rawgPanel').classList.remove('open');
    this.targetFields = {};
  }
}

// Initialize the RAWG panel
const rawgPanel = new RawgPanel();