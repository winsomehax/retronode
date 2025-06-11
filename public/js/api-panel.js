// Base API Panel class to reduce code duplication
class ApiPanel {
  constructor(id, title) {
    this.id = id;
    this.title = title;
    this.gameData = null;
    this.targetFields = {};
    this.createPanel();
    this.setupEventListeners();
  }
  
  createPanel() {
    // Create panel if it doesn't exist
    if (document.getElementById(this.id)) {
      return;
    }
    
    const panelHTML = `
      <div id="${this.id}" class="games-db-panel">
        <div class="games-db-panel-header">
          <div class="games-db-panel-title">${this.title}</div>
          <button class="games-db-panel-close" id="${this.id}Close">&times;</button>
        </div>
        <div class="games-db-panel-content">
          <div class="games-db-panel-search">
            <input type="text" id="${this.id}SearchInput" class="games-db-panel-search-input" placeholder="Search for games...">
            <button id="${this.id}SearchButton" class="games-db-panel-search-button">Search</button>
          </div>
          <div id="${this.id}Error" class="games-db-panel-error" style="display: none;"></div>
          <div id="${this.id}Results" class="games-db-panel-results">
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
    document.getElementById(`${this.id}Close`).addEventListener('click', () => this.hide());
    
    document.getElementById(`${this.id}SearchButton`).addEventListener('click', () => {
      const searchTerm = document.getElementById(`${this.id}SearchInput`).value.trim();
      if (searchTerm) {
        this.search(searchTerm);
      }
    });
    
    document.getElementById(`${this.id}SearchInput`).addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = e.target.value.trim();
        if (searchTerm) {
          this.search(searchTerm);
        }
      }
    });
  }
  
  async search(term) {
    // To be implemented by subclasses
    throw new Error('search method must be implemented by subclass');
  }
  
  renderResults(games) {
    // To be implemented by subclasses
    throw new Error('renderResults method must be implemented by subclass');
  }
  
  selectGame(gameId) {
    // To be implemented by subclasses
    throw new Error('selectGame method must be implemented by subclass');
  }
  
  show(targetFields = {}) {
    this.targetFields = targetFields;
    document.getElementById(this.id).classList.add('open');
    
    // Pre-fill search input if title is provided
    if (targetFields.title && targetFields.title.value) {
      document.getElementById(`${this.id}SearchInput`).value = targetFields.title.value;
    }
  }
  
  hide() {
    document.getElementById(this.id).classList.remove('open');
    this.targetFields = {};
  }
  
  // Helper method to display errors
  showError(message) {
    const errorContainer = document.getElementById(`${this.id}Error`);
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    document.getElementById(`${this.id}Results`).innerHTML = '';
  }
  
  // Helper method to clear errors
  clearError() {
    const errorContainer = document.getElementById(`${this.id}Error`);
    errorContainer.style.display = 'none';
  }
  
  // Helper method to show loading state
  showLoading() {
    document.getElementById(`${this.id}Results`).innerHTML = '<div class="games-db-panel-loading">Searching...</div>';
  }
  
  // Helper method to show no results
  showNoResults() {
    document.getElementById(`${this.id}Results`).innerHTML = '<div class="games-db-panel-no-results">No games found matching your search</div>';
  }
  
  // Helper method to update form fields
  updateFormFields(game) {
    if (this.targetFields.title) {
      this.targetFields.title.value = game.name || game.game_title || '';
    }
    
    if (this.targetFields.description) {
      this.targetFields.description.value = game.description || game.overview || '';
    }
    
    if (this.targetFields.cover) {
      this.targetFields.cover.value = game.cover_url || game.background_image || '';
    }
  }
}