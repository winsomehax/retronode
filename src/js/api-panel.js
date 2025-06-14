/**
 * Base class for API panels
 */
export default class ApiPanel {
  constructor(id, title) {
    this.id = id;
    this.title = title;
    this.gameData = null;
    this.createPanel();
  }
  
  createPanel() {
    // Create panel if it doesn't exist
    if (document.getElementById(this.id)) {
      return;
    }
    
    const panelHTML = `
      <div id="${this.id}" class="api-panel hidden">
        <div class="api-panel-header">
          <h3>${this.title}</h3>
          <button class="api-panel-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="api-panel-body">
          <div class="api-panel-search">
            <input type="text" id="${this.id}Search" placeholder="Search games..." class="api-panel-search-input">
            <button id="${this.id}SearchBtn" class="api-panel-search-button">
              <i class="fas fa-search"></i>
            </button>
          </div>
          <div id="${this.id}Loading" class="api-panel-loading hidden">
            <div class="spinner"></div>
            <p>Loading results...</p>
          </div>
          <div id="${this.id}Error" class="api-panel-error hidden"></div>
          <div id="${this.id}NoResults" class="api-panel-no-results hidden">
            <p>No results found. Try a different search term.</p>
          </div>
          <div id="${this.id}Results" class="api-panel-results"></div>
        </div>
      </div>
    `;
    
    // Add panel to the document
    const div = document.createElement('div');
    div.innerHTML = panelHTML;
    document.body.appendChild(div.firstElementChild);
    
    // Add event listeners
    document.querySelector(`#${this.id} .api-panel-close`).addEventListener('click', () => this.hide());
    document.getElementById(`${this.id}SearchBtn`).addEventListener('click', () => {
      const searchTerm = document.getElementById(`${this.id}Search`).value.trim();
      if (searchTerm) {
        this.search(searchTerm);
      }
    });
    
    document.getElementById(`${this.id}Search`).addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = e.target.value.trim();
        if (searchTerm) {
          this.search(searchTerm);
        }
      }
    });
  }
  
  show() {
    document.getElementById(this.id).classList.remove('hidden');
  }
  
  hide() {
    document.getElementById(this.id).classList.add('hidden');
  }
  
  showLoading() {
    document.getElementById(`${this.id}Results`).innerHTML = '';
    document.getElementById(`${this.id}Loading`).classList.remove('hidden');
    document.getElementById(`${this.id}Error`).classList.add('hidden');
    document.getElementById(`${this.id}NoResults`).classList.add('hidden');
  }
  
  hideLoading() {
    document.getElementById(`${this.id}Loading`).classList.add('hidden');
  }
  
  showError(message) {
    this.hideLoading();
    const errorElement = document.getElementById(`${this.id}Error`);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }
  
  clearError() {
    document.getElementById(`${this.id}Error`).classList.add('hidden');
  }
  
  showNoResults() {
    this.hideLoading();
    document.getElementById(`${this.id}NoResults`).classList.remove('hidden');
  }
  
  updateFormFields(gameData) {
    // Update form fields with game data
    if (document.getElementById('gameTitle')) {
      document.getElementById('gameTitle').value = gameData.name || '';
    }
    
    if (document.getElementById('gameDescription')) {
      document.getElementById('gameDescription').value = gameData.description || '';
    }
    
    if (document.getElementById('gameCover')) {
      document.getElementById('gameCover').value = gameData.cover_url || '';
    }
  }
  
  // This method should be overridden by child classes
  search(term) {
    console.warn('search() method not implemented');
  }
}