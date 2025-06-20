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
      <div id="${this.id}" class="bg-card rounded-lg shadow-md flex flex-col overflow-hidden fixed top-0 right-0 bottom-0 w-full max-w-md transform transition-transform duration-300 ease-in-out translate-x-full">
        <div class="p-4 border-b border-border flex justify-between items-center">
          <h3 class="text-xl font-heading text-primary">${this.title}</h3>
          <button class="api-panel-close text-secondary hover:text-primary">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 space-y-4 flex-1 overflow-y-auto">
          <div class="flex space-x-2 mb-4">
            <input type="text" id="${this.id}Search" placeholder="Search games..." class="form-input flex-grow bg-dark border-border text-body focus:ring-primary focus:border-primary rounded-md">
            <button id="${this.id}SearchBtn" class="btn-primary flex-shrink-0">
              <i class="fas fa-search"></i>
            </button>
          </div>
          <div id="${this.id}Loading" class="hidden flex flex-col items-center justify-center p-6 space-y-2">
            <div class="spinner"></div>
            <p class="text-body-dim">Loading results...</p>
          </div>
          <div id="${this.id}Error" class="hidden p-4 rounded-md bg-red-500/10 border border-red-500/30 text-red-400"></div>
          <div id="${this.id}NoResults" class="hidden p-4 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-center">
            <p>No results found. Try a different search term.</p>
          </div>
          <div id="${this.id}Results" class="space-y-4"></div>
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
    document.getElementById(this.id).classList.remove('translate-x-full');
  }
  
  hide() {
    document.getElementById(this.id).classList.add('translate-x-full');
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
    document.getElementById(`${this.id}NoResults`).classList.add('hidden'); // Ensure no results is hidden
    document.getElementById(`${this.id}Results`).innerHTML = ''; // Clear results
  }
  
  clearError() {
    document.getElementById(`${this.id}Error`).classList.add('hidden');
  }
  
  showNoResults() {
    this.hideLoading();
    document.getElementById(`${this.id}NoResults`).classList.remove('hidden');
    document.getElementById(`${this.id}Error`).classList.add('hidden'); // Ensure error is hidden
    document.getElementById(`${this.id}Results`).innerHTML = ''; // Clear results
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