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