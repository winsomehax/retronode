// RAWG.io Panel Manager
import ApiPanel from './api-panel.js';
export default class RawgPanel extends ApiPanel {
  constructor() {
    super('rawgPanel', 'RAWG.io Search Results');
  }
  
  async search(term) {
    this.clearError();
    this.showLoading();
    
    try {
      const response = await fetch(`/api/rawg/games?name=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (data.success && data.results && data.results.length > 0) {
        this.gameData = data;
        this.renderResults(data.results);
      } else {
        this.showNoResults();
      }
    } catch (error) {
      console.error('Error searching RAWG.io:', error);
      this.showError('Error searching RAWG.io. Please try again.');
    }
  }
  
  renderResults(games) {
    const resultsContainer = document.getElementById(`${this.id}Results`);
    resultsContainer.innerHTML = '';
    
    games.forEach(game => {
      const card = document.createElement('div');
      // Card Container: Apply Tailwind classes
      card.className = 'bg-dark rounded-lg shadow-sm overflow-hidden border border-border';
      
      // Extract platform names, similar to how it might be done in games-db-panel if platforms is an array
      const platformNames = game.platforms && Array.isArray(game.platforms)
        ? game.platforms.map(p => p.platform.name).join(', ')
        : (game.platform_name || 'Unknown Platform');

      // For RAWG, description is often HTML. A simple text extraction or sanitization might be needed.
      // For now, let's assume it can be directly used or will be handled by browser's default stripping if innerHTML is used.
      // A safer approach would be to set textContent or use a sanitizer if description were to be put into arbitrary HTML.
      // However, since it's inside a div, standard line-clamp should work.
      const overviewText = game.description_raw || game.description || 'No description available';


      card.innerHTML = `
        <h3 class="p-3 border-b border-border text-primary font-heading text-lg">${game.name || 'Unknown Title'}</h3>
        <div class="flex p-3 space-x-3 items-start">
          <img src="${game.background_image || 'https://via.placeholder.com/80x120?text=No+Image'}" 
               alt="${game.name || 'Unknown Title'}" 
               class="w-20 h-[110px] object-cover rounded-sm bg-slate-700 flex-shrink-0"
               onerror="this.src='https://via.placeholder.com/80x120?text=No+Image'">
          <div class="flex-1 space-y-1">
            <div class="text-xs text-secondary uppercase tracking-wider">${platformNames}</div>
            <div class="text-sm text-body-dim">${game.released || 'Unknown release date'}</div>
            <div class="text-sm text-body line-clamp-3">${overviewText}</div>
          </div>
        </div>
        <button class="btn btn-primary w-full mt-3 text-sm py-2 games-db-card-select" data-game-id="${game.id}">Select This Game</button>
      `;
      
      // Add event listener to select button
      // Query by the specific class that is still present for the button
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
        
        // Create a game object with standardized properties
        const gameData = {
          name: game.name || '',
          description: game.description || '',
          cover_url: game.background_image || ''
        };
        
        // Update form fields
        this.updateFormFields(gameData);
        
        // Hide panel
        this.hide();
      }
    } catch (error) {
      console.error('Error fetching game details from RAWG.io:', error);
      this.showError('Error fetching game details. Please try again.');
    }
  }
}