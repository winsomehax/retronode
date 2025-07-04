import '../css/main.css'; // Import the main CSS file
// Main application script
import EmulatorModal from './emulator-modal.js';
import RomScanner from './rom-scanner.js';
import GamesDBPanel from './games-db-panel.js';
import RawgPanel from './rawg-panel.js';
import GeminiWindow from './gemini-window.js';
import { initializeSettings } from './settings.js';
// API functions are typically called directly, no need to import all if not re-exporting
// import * as api from './api.js';

// Main application script
let appInitialized = false;
console.log('app.js loaded, appInitialized:', appInitialized);

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired. appInitialized:', appInitialized);
  if (!appInitialized) {
    console.log('Initializing app...');
    initApp();
    appInitialized = true;
    console.log('App initialized state set to true.');
  }

  // Instantiate and make available globally if necessary (or pass as dependencies)
  // These are instantiated after initApp which might set up some DOM elements they depend on.
  window.emulatorModal = new EmulatorModal();
  window.romScanner = new RomScanner();
  window.gamesDBPanel = new GamesDBPanel();
  window.rawgPanel = new RawgPanel();
  window.geminiWindow = new GeminiWindow();
// Game form submission handler
const gameForm = document.getElementById('gameForm');
if (gameForm) {
  gameForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const gameId = document.getElementById('gameId').value;
    const title = document.getElementById('gameTitle').value;
    const description = document.getElementById('gameDescription').value;
    const cover_image_path = document.getElementById('gameCover').value;
    // Platforms: collect selected platforms and ROM path
    const platformSelect = document.getElementById('gamePlatforms');
    const romPath = document.getElementById('gameRomPath').value;
    let platforms = {};
    if (platformSelect && romPath) {
      Array.from(platformSelect.selectedOptions).forEach(option => {
        platforms[option.value] = { path: romPath };
      });
    }
    const payload = {
      title,
      description,
      cover_image_path,
      platforms
    };
    let url = '/api/games';
    let method = 'POST';
    if (gameId) {
      url = `/api/games/${gameId}`;
      method = 'PUT';
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('gameModal').classList.add('hidden');
      loadGames();
      updateStats();
    } else {
      alert(data.message || 'Failed to save game');
    }
  });
}
});

function initApp() {
  // Load initial data
  loadGames('', '', false);
  loadPlatforms();
  updateStats();
  initializeSettings();
  
  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Search input handler
  const searchInput = document.getElementById('searchInput'); // For games page
  if (searchInput && document.getElementById('gamesGrid')) { // Only attach if on games page
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.trim();
      loadGames(searchTerm, document.getElementById('platformFilter')?.value, false);
    });
  }

  // Close platform modal button
  const closePlatformModalBtn = document.getElementById('closePlatformModal');
  if (closePlatformModalBtn) {
    closePlatformModalBtn.addEventListener('click', function() {
      document.getElementById('platformModal').classList.add('hidden');
      // Also clear any form errors when closing
      const errorDiv = document.getElementById('platformModalFormError');
      if (errorDiv) {
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
      }
    });
  }

  // Cancel platform button in modal
  const cancelPlatformBtn = document.getElementById('cancelPlatformBtn');
  if (cancelPlatformBtn) {
    cancelPlatformBtn.addEventListener('click', function() {
      document.getElementById('platformModal').classList.add('hidden');
      // Also clear any form errors when cancelling
      const errorDiv = document.getElementById('platformModalFormError');
      if (errorDiv) {
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
      }
    });
  }

  const platformSearchInput = document.getElementById('platformSearchInput'); // For platforms page
  if (platformSearchInput && document.getElementById('platformsContainer')) { // Only attach if on platforms page
    platformSearchInput.addEventListener('input', function() {
      const searchTerm = this.value.trim();
      const sortOrder = document.getElementById('platformSortOption')?.value || '';
      // Assuming renderPlatforms is globally available or passed correctly
      loadPlatforms(searchTerm, sortOrder, window.renderPlatformsFunction || renderPlatforms);
    });
  }
  
  // Platform filter handler
  const platformFilter = document.getElementById('platformFilter'); // For games page
  if (platformFilter && document.getElementById('gamesGrid')) { // Only attach if on games page
    platformFilter.addEventListener('change', function() {
      const platformId = this.value;
      const searchTerm = document.getElementById('searchInput')?.value.trim() || '';
      loadGames(searchTerm, platformId, false);
    });
  }
  
  // Sort option handler
  const sortOption = document.getElementById('sortOption'); // For games page
  if (sortOption && document.getElementById('gamesGrid')) { // Only attach if on games page
    sortOption.addEventListener('change', function() {
      const [field, direction] = this.value.split('_');
      sortGames(field, direction);
    });
  }

  const platformSortOption = document.getElementById('platformSortOption'); // For platforms page
  if (platformSortOption && document.getElementById('platformsContainer')) { // Only attach if on platforms page
    platformSortOption.addEventListener('change', function() {
      const sortOrder = this.value;
      const searchTerm = document.getElementById('platformSearchInput')?.value.trim() || '';
      // Assuming renderPlatforms is globally available or passed correctly
      loadPlatforms(searchTerm, sortOrder, window.renderPlatformsFunction || renderPlatforms);
    });
  }
  
  // Add game button
  const addGameBtn = document.getElementById('addGameBtn');
  if (addGameBtn) {
    addGameBtn.addEventListener('click', function() {
      openGameModal();
    });
  }
  
  // Add game button (floating)
  const addGameBtnFloat = document.getElementById('addGameBtnFloat');
  if (addGameBtnFloat) {
    addGameBtnFloat.addEventListener('click', function() {
      openGameModal();
    });
  }

  // Add platform button
  const addPlatformBtn = document.getElementById('addPlatformBtn');
  if (addPlatformBtn) {
    addPlatformBtn.addEventListener('click', function() {
      openPlatformModal();
    });
  }
  
  // Game grid click handler for edit/delete buttons
  const gamesGrid = document.getElementById('gamesGrid');
  if (gamesGrid) {
    gamesGrid.addEventListener('click', function(event) {
      // Check if the click was on the icon inside the button
      const editIcon = event.target.closest('.fa-edit');
      const deleteIcon = event.target.closest('.fa-trash-alt');
      
      if (editIcon) {
        const editBtn = editIcon.closest('.edit-game-btn');
        const gameId = editBtn.getAttribute('data-id');
        console.log("Edit button clicked for game ID:", gameId);
        editGame(gameId);
      } else if (deleteIcon) {
        const deleteBtn = deleteIcon.closest('.delete-game-btn');
        const gameId = deleteBtn.getAttribute('data-id');
        deleteGame(gameId);
      } else {
        // Check if the click was directly on the button
        const editBtn = event.target.closest('.edit-game-btn');
        const deleteBtn = event.target.closest('.delete-game-btn');
        const launchBtn = event.target.closest('.launch-game-btn');
        
        if (editBtn) {
          const gameId = editBtn.getAttribute('data-id');
          console.log("Edit button clicked for game ID:", gameId);
          editGame(gameId);
        } else if (deleteBtn) {
          const gameId = deleteBtn.getAttribute('data-id');
          deleteGame(gameId);
        } else if (launchBtn) {
          const gameId = launchBtn.getAttribute('data-id');
          launchGame(gameId);
        }
      }
    });
  }
  
  // Platform container click handler for edit/delete buttons
  const platformsContainer = document.getElementById('platformsContainer');
  if (platformsContainer) {
    platformsContainer.addEventListener('click', function(event) {
      const editBtn = event.target.closest('.edit-platform-btn');
      const deleteBtn = event.target.closest('.delete-platform-btn');
      
      if (editBtn) {
        const platformId = editBtn.getAttribute('data-id');
        editPlatform(platformId);
      } else if (deleteBtn) {
        const platformId = deleteBtn.getAttribute('data-id');
        deletePlatform(platformId);
      }
    });
  }
  
  // Emulator container click handler for edit/delete buttons
  const emulatorsContainer = document.getElementById('emulatorsContainer');
  if (emulatorsContainer) {
    emulatorsContainer.addEventListener('click', function(event) {
      const editBtn = event.target.closest('.edit-emulator-btn');
      const deleteBtn = event.target.closest('.delete-emulator-btn');
      const addBtn = event.target.closest('.add-emulator-btn');
      
      if (editBtn) {
        const platformId = editBtn.getAttribute('data-platform-id');
        const emulatorId = editBtn.getAttribute('data-emulator-id');
        editEmulator(platformId, emulatorId);
      } else if (deleteBtn) {
        const platformId = deleteBtn.getAttribute('data-platform-id');
        const emulatorId = deleteBtn.getAttribute('data-emulator-id');
        deleteEmulator(platformId, emulatorId);
      } else if (addBtn) {
        const platformId = addBtn.getAttribute('data-platform-id');
        openEmulatorModal(platformId);
      }
    });
  }

  // Close game modal buttons
  const closeGameModalBtn = document.getElementById('closeGameModal');
  if (closeGameModalBtn) {
    closeGameModalBtn.addEventListener('click', function() {
      document.getElementById('gameModal').classList.add('hidden');
    });
  }

  const cancelGameBtn = document.getElementById('cancelGameBtn');
  if (cancelGameBtn) {
    cancelGameBtn.addEventListener('click', function() {
      document.getElementById('gameModal').classList.add('hidden');
    });
  }

  // Search game database button in the modal
  const searchGameDbBtn = document.getElementById('searchGameDbBtn');
  if (searchGameDbBtn) {
    searchGameDbBtn.addEventListener('click', function() {
      const title = document.getElementById('gameTitle').value.trim();
      if (!title) {
        alert('Please enter a game title to search');
        return;
      }

      const resultsContainer = document.getElementById('gameDbResults');
      resultsContainer.classList.remove('hidden');
      resultsContainer.innerHTML = '<div class="p-4 text-center text-body">Searching...</div>';

      fetch(`/api/thegamesdb/games?name=${encodeURIComponent(title)}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.results && data.results.length > 0) {
            let html = '<div class="p-4">';
            data.results.forEach(game => {
              html += `
                <div class="bg-dark p-3 mb-3 rounded-md">
                  <div class="flex">
                    <div class="w-12 h-12 bg-card rounded-md flex items-center justify-center mr-3">
                      <i class="fas fa-gamepad text-primary text-xl"></i>
                    </div>
                    <div class="flex-1">
                      <h4 class="text-primary font-medium font-heading">${game.game_title}</h4>
                      <p class="text-secondary text-sm">Platform: ${game.platform_name || game.platform || 'Unknown'}</p>
                      <p class="text-body text-sm mt-2">${game.overview ? (game.overview.substring(0, 100) + '...') : 'No description available'}</p>
                    </div>
                  </div>
                  <div class="mt-3 flex justify-end">
                    <button class="btn-primary text-sm import-game-btn" data-game-id="${game.id}" data-title="${game.game_title}" data-overview="${game.overview || ''}" data-cover="${game.boxart_url || ''}">Import</button>
                  </div>
                </div>`;
            });
            html += '</div>';
            resultsContainer.innerHTML = html;

            resultsContainer.querySelectorAll('.import-game-btn').forEach(button => {
              button.addEventListener('click', function() {
                document.getElementById('gameTitle').value = this.dataset.title;
                document.getElementById('gameDescription').value = this.dataset.overview;
                document.getElementById('gameCover').value = this.dataset.cover;
                resultsContainer.classList.add('hidden');
              });
            });
          } else {
            resultsContainer.innerHTML = '<div class="p-4 text-center text-body">No results found</div>';
          }
        })
        .catch(error => {
          console.error('Error searching game database:', error);
          resultsContainer.innerHTML = '<div class="p-4 text-center text-accent">Error searching game database</div>';
        });
    });
  }

  // Search Platform Database button in Platform Modal
  const searchPlatformDbBtn = document.getElementById('searchPlatformDbBtn');
  if (searchPlatformDbBtn) {
    searchPlatformDbBtn.addEventListener('click', async function() {
      const platformNameInput = document.getElementById('platformName');
      const platformName = platformNameInput?.value.trim();
      const resultsContainer = document.getElementById('platformDbResults');

      if (!resultsContainer) {
        console.error('#platformDbResults container not found.');
        return;
      }

      if (!platformName) {
        resultsContainer.innerHTML = '<div class="p-3 text-body-dim text-center">Please enter a platform name to search.</div>'; // Refined
        resultsContainer.classList.remove('hidden');
        return;
      }

      resultsContainer.innerHTML = '<div class="p-4 text-center text-body"><i class="fas fa-spinner fa-spin mr-2"></i>Searching...</div>';
      resultsContainer.classList.remove('hidden');

      try {
        const response = await fetch(`/api/thegamesdb/platforms?name=${encodeURIComponent(platformName)}`);
        const data = await response.json();

        if (data.success && data.results && data.results.length > 0) {
          let html = '<div class="p-4 space-y-3">';
          data.results.forEach(platform => {
            // Prepare platform info for data attribute
            const platformInfo = {
              name: platform.name,
              manufacturer: platform.manufacturer || '',
              description: platform.overview || '',
              // Generate a simple ID from the name if not provided or not suitable
              platform_id: platform.id || platform.name.toLowerCase().replace(/[^a-z0-9]/g, '')
            };
            const platformInfoJson = JSON.stringify(platformInfo).replace(/"/g, '&quot;');

            html += `
              <div class="bg-dark p-3 rounded-md border border-border">
                <div class="flex">
                  <div class="w-10 h-10 bg-card rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                    <i class="fas fa-microchip text-primary text-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0"> {/* Added min-w-0 for proper truncation */}
                    <h4 class="text-primary font-medium font-heading truncate" title="${platform.name}">${platform.name}</h4>
                    <p class="text-secondary text-xs truncate" title="Manufacturer: ${platform.manufacturer || 'Unknown'}">Manufacturer: ${platform.manufacturer || 'Unknown'}</p>
                  </div>
                </div>
                <p class="text-body-dim text-xs mt-2 line-clamp-2">${platform.overview || 'No description available'}</p>
                <div class="mt-3 flex justify-end">
                  <button class="btn-primary btn-sm import-platform-btn" data-platform-info="${platformInfoJson}">Import</button>
                </div>
              </div>
            `;
          });
          html += '</div>';
          resultsContainer.innerHTML = html;

          // Add event listeners to import buttons
          resultsContainer.querySelectorAll('.import-platform-btn').forEach(button => {
            button.addEventListener('click', function() {
              try {
                const info = JSON.parse(this.getAttribute('data-platform-info').replace(/&quot;/g, '"'));
                document.getElementById('platformId').value = info.platform_id;
                document.getElementById('platformName').value = info.name;
                document.getElementById('platformManufacturer').value = info.manufacturer;
                document.getElementById('platformDescription').value = info.description;
                resultsContainer.classList.add('hidden');
              } catch (e) {
                console.error("Error parsing platform info from data attribute:", e);
                // Display error in a more user-friendly way if possible, for now, keeping alert for this specific error
                alert("Error importing platform data.");
              }
            });
          });

        } else if (data.success && (!data.results || data.results.length === 0)) {
          resultsContainer.innerHTML = '<div class="p-3 text-body-dim text-center">No results found.</div>'; // Refined
        } else {
          resultsContainer.innerHTML = `<div class="p-3 text-accent text-center">Error: ${data.message || 'Failed to search platform database.'}</div>`; // Refined
        }
      } catch (error) {
        console.error('Error searching platform database:', error);
        resultsContainer.innerHTML = '<div class="p-3 text-accent text-center">Error searching. Please try again.</div>'; // Refined
      }
    });
  }

  // Platform Form submission handler
  const platformForm = document.getElementById('platformForm');
  if (platformForm) {
    platformForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const errorDiv = document.getElementById('platformModalFormError');
      if(errorDiv) errorDiv.classList.add('hidden'); // Hide error on new submission

      const platformId = document.getElementById('platformId').value.trim();
      const name = document.getElementById('platformName').value.trim();
      const manufacturer = document.getElementById('platformManufacturer').value.trim();
      const releaseYear = document.getElementById('platformReleaseYear').value.trim();
      const description = document.getElementById('platformDescription').value.trim();

      if (!platformId || !name) {
        if(errorDiv) {
          errorDiv.textContent = 'Platform ID and Name are required.';
          errorDiv.classList.remove('hidden');
        } else {
          alert('Platform ID and Name are required');
        }
        return;
      }

      const platformData = {
        platform_id: platformId,
        name,
        manufacturer,
        release_year: releaseYear ? parseInt(releaseYear) : null,
        description
      };

      const modalTitle = document.getElementById('platformModalTitle')?.textContent || '';
      const isEdit = modalTitle === 'Edit Platform';
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/platforms/${platformId}` : '/api/platforms';

      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(platformData)
        });
        const data = await response.json();

        if (data.success) {
          document.getElementById('platformModal').classList.add('hidden');
          const searchTerm = document.getElementById('platformSearchInput')?.value.trim() || '';
          const sortOrder = document.getElementById('platformSortOption')?.value || '';
          loadPlatforms(searchTerm, sortOrder, window.renderPlatformsFunction || renderPlatforms);
          updateStats();
        } else {
          if(errorDiv) {
            errorDiv.textContent = data.message || 'Failed to save platform.';
            errorDiv.classList.remove('hidden');
          } else {
            alert(data.message || 'Failed to save platform');
          }
        }
      } catch (error) {
        console.error('Error saving platform:', error);
        if(errorDiv) {
          errorDiv.textContent = 'An unexpected error occurred. Please try again.';
          errorDiv.classList.remove('hidden');
        } else {
          alert('An unexpected error occurred. Please try again.');
        }
      }
    });
  }
}

let isGamesLoading = false;

// Load games from API
export async function loadGames(search = '', platform = '', test = false) {
  console.log(`loadGames called. search: "${search}", platform: "${platform}", test: ${test}. isGamesLoading: ${isGamesLoading}`);
  const gamesGrid = document.getElementById('gamesGrid');
  if (!gamesGrid) return;

  if (isGamesLoading) {
    console.warn('loadGames: Already loading games. Skipping this call.');
    return;
  }
  isGamesLoading = true;
  
  // Show loading state
  gamesGrid.innerHTML = `
    <div class="col-span-full flex justify-center items-center py-8">
      <div class="text-primary">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <span class="ml-3">Loading games...</span>
      </div>
    </div>
  `;
  console.log('loadGames: Spinner shown, gamesGrid cleared (1st time).');
  
  try {
    console.log('loadGames: Starting game fetch.');
    // Make sure we're not using test data
    let url;
    if (test) {
      // If test is true, construct a URL for test data.
      // The API handles a 'count' parameter if 'test=true'.
      url = `/api/games?test=true`;
      // Example: if you want to control the number of test items, you could add:
      // url += `&count=5`; 
    } else {
      // Normal operation: fetch actual games
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (platform) queryParams.append('platform', platform);
      // The API defaults to a limit (e.g., 20). If you need to specify a different limit:
      // queryParams.append('limit', '50'); 
      url = `/api/games${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    }
    
    console.log(`loadGames: Fetching from URL: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      console.log('loadGames: Game fetch successful.', data);
      // Clear loading state
      gamesGrid.innerHTML = '';
      console.log('loadGames: gamesGrid cleared (2nd time).');
      
      // Convert array items to game objects and ensure uniqueness by ID
      const gamesArray = Array.isArray(data.data) ? data.data : [];
      const uniqueGames = gamesArray.reduce((acc, game) => {
        if (!acc.some(g => g.id === game.id)) {
          acc.push(game);
        }
        return acc;
      }, []);
      console.log('loadGames: Unique games processed:', uniqueGames.length, uniqueGames);
      
      // Directly render game cards without calling renderGames
      if (uniqueGames.length === 0) {
        gamesGrid.innerHTML = '<div class="col-span-full text-center text-body py-8">No games found matching your criteria.</div>';
        // No need to set isGamesLoading = false here; finally block will handle it.
        return; // Exits before platform fetch
      }
      
      // Fetch all platforms once to avoid multiple requests
      fetch('/api/platforms')
        .then(response => response.json())
        .then(platformData => {
          const platforms = platformData.success ? platformData.data : {};
          console.log('loadGames: Platform data fetched. Calling renderGameCards.', platforms);
          renderGameCards(uniqueGames, gamesGrid, platforms);
        })
        .catch(error => {
          console.error('Error fetching platforms:', error);
          // Render without platform names
          console.log('loadGames: Platform fetch failed. Calling renderGameCards with empty platforms.');
          renderGameCards(uniqueGames, gamesGrid, {});
        })
        // The isGamesLoading flag is now handled by the outer try/finally block
        // .finally(() => {
        //   isGamesLoading = false; 
        // });
    } else {
      console.error('Error loading games:', data.message);
      gamesGrid.innerHTML = `
        <div class="col-span-full text-center text-accent py-8">
          Error loading games: ${data.message || 'Unknown error'}
        </div>
      `;
      // No need to set isGamesLoading = false here; finally block will handle it.
    }
  } catch (error) {
    console.error('Error loading games:', error);
    gamesGrid.innerHTML = `
      <div class="col-span-full text-center text-accent py-8">
        Error loading games: ${error.message || 'Unknown error'}
      </div>
    `;
    // No need to set isGamesLoading = false here; finally block will handle it.
  } finally {
    isGamesLoading = false;
    console.log('loadGames: Execution finished. isGamesLoading set to false.');

    // Add new logging here
    setTimeout(() => {
      const finalGamesGrid = document.getElementById('gamesGrid');
      if (finalGamesGrid) {
        console.log(`DEBUG: Post-render, gamesGrid childElementCount: ${finalGamesGrid.childElementCount}`);
        console.log(`DEBUG: Post-render, gamesGrid className: '${finalGamesGrid.className}'`);
      } else {
        console.log("DEBUG: Post-render, gamesGrid element NOT FOUND!");
      }
    }, 200); // 200ms delay to allow potential DOM updates
  }
}

// Load platforms from API
export async function loadPlatforms(search = '', sort = '', renderer) {
  const platformFilter = document.getElementById('platformFilter'); // For game filtering dropdown
  const platformsContainer = document.getElementById('platformsContainer'); // For displaying platform cards
  
  try {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (sort) queryParams.append('sort', sort);
    let url = `/api/platforms${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      // Update platform filter dropdown
      if (platformFilter) {
        platformFilter.innerHTML = '<option value="">All Platforms</option>';
        Object.entries(data.data).forEach(([id, platform]) => {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = platform.name;
          platformFilter.appendChild(option);
        });
      }
      
      // Update platforms container if on platforms page
      if (platformsContainer) {
        if (typeof renderer === 'function') {
          renderer(data.data); // Use provided renderer
        } else {
          renderPlatforms(data.data); // Use internal renderer as fallback
        }
      }
      
      // Update stats
      updateStats();
    } else {
      console.error('Error loading platforms:', data.message);
    }
  } catch (error) {
    console.error('Error loading platforms:', error);
  }
}

// Load emulators for a platform
export async function loadEmulatorsForPlatform(platformId) {
  if (!platformId) {
    console.error('No platformId provided to loadEmulatorsForPlatform');
    return;
  }
  const emulatorsList = document.querySelector(`.emulators-list[data-platform-id="${platformId}"]`);
  if (!emulatorsList) return;
  
  try {
    const response = await fetch(`/api/platforms/${platformId}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      const platform = data.data;
      
      if (!platform.emulators || Object.keys(platform.emulators).length === 0) {
        emulatorsList.innerHTML = '<p class="text-body-dim text-sm italic">No emulators configured</p>';
        return;
      }
      
      let html = '<ul class="space-y-2">';
      Object.entries(platform.emulators).forEach(([id, emulator]) => {
        html += `
          <li class="flex justify-between items-center">
            <span class="text-body text-sm">${emulator.name}</span>
            <button class="edit-emulator-btn text-secondary hover:text-primary" 
                    data-platform-id="${platformId}" 
                    data-emulator-id="${id}" 
                    title="Edit Emulator">
              <i class="fas fa-edit"></i>
            </button>
          </li>
        `;
      });
      html += '</ul>';
      
      emulatorsList.innerHTML = html;
      
      // Add event listeners to edit emulator buttons
      emulatorsList.querySelectorAll('.edit-emulator-btn').forEach(button => {
        button.addEventListener('click', function() {
          const platformId = this.getAttribute('data-platform-id');
          const emulatorId = this.getAttribute('data-emulator-id');
          emulatorModal.show(platformId, emulatorId);
        });
      });
    } else {
      emulatorsList.innerHTML = '<p class="text-accent text-sm">Error loading emulators</p>';
    }
  } catch (error) {
    console.error('Error loading emulators:', error);
    emulatorsList.innerHTML = '<p class="text-accent text-sm">Error loading emulators</p>';
  }
}

// Render games to the grid - DEPRECATED, use loadGames directly
// This function is kept for backward compatibility but should not be used
function renderGames(games) {
  console.warn('renderGames is deprecated, use loadGames directly');
  const gamesGrid = document.getElementById('gamesGrid');
  if (!gamesGrid) return;
  
  // This function is no longer used directly
  // It was causing duplicate rendering of games
}

// Helper function to render game cards
function renderGameCards(games, gamesGrid, platforms) {
  console.log(`renderGameCards: Rendering ${games.length} game(s).`);
  games.forEach((game, index) => { // Add index here
    const card = document.createElement('div');
    card.className = 'game-card';
    
    // Get platform names
    let platformNames = 'No platform';
    let platformIds = [];
    if (game.platforms && Object.keys(game.platforms).length > 0) {
      platformIds = Object.keys(game.platforms);
    } else if (game.platform) {
      platformIds = [game.platform];
    }
    if (platformIds.length > 0) {
      platformNames = platformIds.map(platformId =>
        platforms[platformId] && platforms[platformId].name ? platforms[platformId].name : platformId
      ).join(', ');
    }

    const placeholderUrl = `/api/game-media/covers?path=${encodeURIComponent("placeholder.webp")}`;
    let imageUrl = placeholderUrl; // Default to placeholder

    // Check for problematic numeric-only cover_image_path
    if (game.cover_image_path && typeof game.cover_image_path === 'string' && /^\d+$/.test(game.cover_image_path)) {
      console.warn(`Invalid cover image path '${game.cover_image_path}' for game '${game.title || game.id}'. Defaulting to placeholder.`);
      game.cover_image_path = ""; // Force it to empty to use placeholder logic
    }

    console.log(`DEBUG: Game: '${game.title || game.id}', cover_image_path IS: `, game.cover_image_path, `TYPEOF: ${typeof game.cover_image_path}`);
    if (typeof game.cover_image_path === 'string' && game.cover_image_path.trim() !== '') {
      if (game.cover_image_path.startsWith('http://') || game.cover_image_path.startsWith('https://')) {
        // It's already a full URL, use it directly
        imageUrl = game.cover_image_path;
      } else {
        // Assume it's a local path identifier that the server can serve via a specific endpoint
        imageUrl = `/api/game-media/covers?path=${encodeURIComponent(game.cover_image_path)}`;
      }
    } else {
      imageUrl = placeholderUrl;
    }
    
    card.innerHTML = `
      <h3 class="game-card-title font-heading text-sm truncate" title="${game.title || 'No title'}">${game.title || 'No title'}</h3>
      <div class="game-card-image">
        <img src="${imageUrl}" 
             alt="${game.title || 'No title'}" 
             class="absolute inset-0 w-full h-full object-cover"
             onerror="this.onerror=null; this.src='${placeholderUrl}';">
      </div>
      <div class="p-1 min-h-0" style="flex-grow: 1; overflow-y: auto;">
        <p class="text-xs text-body-dim truncate mb-1 game-card-platform" title="${platformNames}">${platformNames}</p>
        <p class="text-xs text-body-dim line-clamp-2 mb-1" title="${game.description || ''}">${game.description || 'No description available.'}</p>
      </div>
      <div class="game-card-actions">
        <button class="launch-game-btn text-xs py-1 px-2 bg-primary text-white rounded hover:bg-primary/80" data-id="${game.id}">Launch</button>
        <button class="edit-game-btn text-secondary hover:text-primary text-xs" data-id="${game.id}" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-game-btn text-accent hover:text-accent/80 text-xs" data-id="${game.id}" title="Delete">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
    
    gamesGrid.appendChild(card);
    console.log(`renderGameCards: Appended card ${index + 1} for game "${game.title || game.id}"`);
  });
}

// Sort games
function sortGames(field, direction) {
  const gamesGrid = document.getElementById('gamesGrid');
  if (!gamesGrid) return;
  
  const cards = Array.from(gamesGrid.children);
  
  cards.sort((a, b) => {
    let valueA, valueB;
    
    if (field === 'title') {
      valueA = a.querySelector('.game-card-title').textContent;
      valueB = b.querySelector('.game-card-title').textContent;
    } else if (field === 'platform') {
      valueA = a.querySelector('.game-card-platform').textContent;
      valueB = b.querySelector('.game-card-platform').textContent;
    }
    
    if (direction === 'asc') {
      return valueA.localeCompare(valueB);
    } else {
      return valueB.localeCompare(valueA);
    }
  });
  
  // Clear and re-append sorted cards
  gamesGrid.innerHTML = '';
  cards.forEach(card => gamesGrid.appendChild(card));
}

// Render platforms to the container
function renderPlatforms(platforms) {
  const platformsContainer = document.getElementById('platformsContainer');
  if (!platformsContainer) return;
  
  platformsContainer.innerHTML = '';
  
  if (Object.keys(platforms).length === 0) {
    platformsContainer.innerHTML = '<div class="col-span-full text-center text-body py-8">No platforms found. Add your first platform!</div>';
    return;
  }
  
  Object.entries(platforms).forEach(([id, platform]) => {
    const div = document.createElement('div');
    div.className = 'game-card';
    
    div.innerHTML = `
      <h3 class="game-card-title font-heading">${platform.name}</h3>
      <div class="p-4">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 bg-dark rounded-md flex items-center justify-center mr-4">
            <i class="fas fa-microchip text-primary text-xl"></i>
          </div>
          <div>
            <p class="text-body text-sm">Manufacturer: ${platform.manufacturer || 'Unknown'}</p>
            <p class="text-body text-sm">Released: ${platform.release_year || 'Unknown'}</p>
          </div>
        </div>
        <p class="text-body text-sm line-clamp-3">${platform.description || 'No description available'}</p>
        
        <div class="mt-4 border-t border-border pt-3">
          <div class="flex justify-between items-center mb-2">
            <h4 class="text-secondary font-heading text-sm">Emulators</h4>
            <button class="add-emulator-btn text-primary hover:text-secondary" data-platform-id="${id}" title="Add Emulator">
              <i class="fas fa-plus-circle"></i>
            </button>
          </div>
          <div class="emulators-list" data-platform-id="${id}">
            <p class="text-body-dim text-sm italic">Loading emulators...</p>
          </div>
        </div>
      </div>
      <div class="game-card-actions">
        <button class="edit-platform-btn p-1 text-secondary hover:text-primary" data-id="${id}" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-platform-btn p-1 text-accent hover:text-red-500" data-id="${id}" title="Delete">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
    
    platformsContainer.appendChild(div);
  });
  
  // Add event listeners to edit and delete buttons
  document.querySelectorAll('.edit-platform-btn').forEach(button => {
    button.addEventListener('click', function() {
      const platformId = this.getAttribute('data-id');
      openPlatformModal(platformId);
    });
  });
  
  document.querySelectorAll('.delete-platform-btn').forEach(button => {
    button.addEventListener('click', function() {
      const platformId = this.getAttribute('data-id');
      deletePlatform(platformId);
    });
  });
  
  // Add event listeners to add emulator buttons
  document.querySelectorAll('.add-emulator-btn').forEach(button => {
    button.addEventListener('click', function() {
      const platformId = this.getAttribute('data-platform-id');
      emulatorModal.show(platformId);
    });
  });
  
  // Load emulators for each platform
  Object.keys(platforms).forEach(platformId => {
    setTimeout(() => loadEmulatorsForPlatform(platformId), 100);
  });
}

// Render emulators for a platform
function renderEmulators(platformId, emulators, platformName) {
  const emulatorsContainer = document.getElementById('emulatorsContainer');
  if (!emulatorsContainer) return;
  
  emulatorsContainer.innerHTML = `
    <div class="game-card">
      <div class="bg-dark px-4 py-3 flex justify-between items-center">
        <h3 class="font-medium text-lg text-primary font-heading">${platformName || platformId}</h3>
        <button class="btn-primary flex items-center add-emulator-btn" data-platform-id="${platformId}">
          <i class="fas fa-plus mr-1"></i> Add Emulator
        </button>
      </div>
      <div class="p-4">
        <table class="w-full">
          <thead class="text-left">
            <tr class="border-b border-border">
              <th class="pb-2 text-secondary font-medium">Name</th>
              <th class="pb-2 text-secondary font-medium">Command</th>
              <th class="pb-2 text-secondary font-medium">Description</th>
              <th class="pb-2 text-secondary font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="emulatorsTableBody">
            ${emulators.length === 0 ? 
              '<tr><td colspan="4" class="py-4 text-center text-body">No emulators found for this platform</td></tr>' : 
              ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  if (emulators.length > 0) {
    const tbody = document.getElementById('emulatorsTableBody');
    emulators.forEach(emulator => {
      const row = document.createElement('tr');
      row.className = 'border-b border-border';
      
      row.innerHTML = `
        <td class="py-3 text-primary">${emulator.name}</td>
        <td class="py-3 text-body font-mono text-sm">${emulator.command || 'N/A'}</td>
        <td class="py-3 text-body">${emulator.description || 'N/A'}</td>
        <td class="py-3 text-right">
          <button class="text-secondary hover:text-primary mr-2 edit-emulator-btn" data-platform-id="${platformId}" data-emulator-id="${emulator.emulator_id}" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="text-accent hover:text-accent/80 delete-emulator-btn" data-platform-id="${platformId}" data-emulator-id="${emulator.emulator_id}" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(row);
    });
  }
}

// Open game modal for adding/editing
export function openGameModal(gameId = null) {
  const gameModal = document.getElementById('gameModal');
  const gameForm = document.getElementById('gameForm');
  const modalTitle = document.getElementById('gameModalTitle');
  
  if (!gameModal || !gameForm) return;
  
  // Reset form
  gameForm.reset();
  
  if (gameId) {
    // Edit mode
    modalTitle.textContent = 'Edit Game';
    
    // Load game data
    fetch(`/api/games/${gameId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const game = data.data;
          console.log("Game data:", game);
          
          // Set the hidden gameId field to the ID from the URL
          document.getElementById('gameId').value = gameId;
          document.getElementById('gameTitle').value = game.title || '';
          document.getElementById('gameDescription').value = game.description || '';
          document.getElementById('gameCover').value = game.cover_image_path || '';
          
          // Set ROM path from the first platform (if any)
          if (game.platforms && Object.keys(game.platforms).length > 0) {
            const firstPlatformId = Object.keys(game.platforms)[0];
            document.getElementById('gameRomPath').value = game.platforms[firstPlatformId] || '';
          }
          
          // Load platforms for the select
          fetch('/api/platforms')
            .then(response => response.json())
            .then(platformData => {
              if (platformData.success) {
                const platformSelect = document.getElementById('gamePlatforms');
                platformSelect.innerHTML = '';
                
                Object.entries(platformData.data).forEach(([id, platform]) => {
                  const option = document.createElement('option');
                  option.value = id;
                  option.textContent = platform.name;
                  option.selected = game.platforms && game.platforms[id];
                  platformSelect.appendChild(option);
                });
              }
            });
        }
      });
  } else {
    // Add mode
    modalTitle.textContent = 'Add Game';
    document.getElementById('gameId').value = '';
    
    // Load platforms for the select
    fetch('/api/platforms')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const platformSelect = document.getElementById('gamePlatforms');
          platformSelect.innerHTML = '';
          
          Object.entries(data.data).forEach(([id, platform]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = platform.name;
            platformSelect.appendChild(option);
          });
        }
      });
  }
  
  // Show modal
  gameModal.classList.remove('hidden');
}

// Edit game
export function editGame(gameId) {
  openGameModal(gameId);
}

// Delete game
export function deleteGame(gameId) {
  if (confirm('Are you sure you want to delete this game?')) {
    fetch(`/api/games/${gameId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Reload games
        const searchTerm = document.getElementById('searchInput')?.value.trim() || '';
        const platformId = document.getElementById('platformFilter')?.value || '';
        loadGames(searchTerm, platformId, false);
        updateStats();
      } else {
        alert(data.message || 'Failed to delete game');
      }
    })
    .catch(error => {
      console.error('Error deleting game:', error);
      alert('Error deleting game');
    });
  }
}

// Launch game
export function launchGame(gameId) {
  // Get game details
  fetch(`/api/games/${gameId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const game = data.data;
        
        // Check if the game has platforms
        if (!game.platforms || Object.keys(game.platforms).length === 0) {
          alert('This game has no ROM path configured');
          return;
        }
        
        // Get the first platform and ROM path
        const platformId = Object.keys(game.platforms)[0];
        const romPath = game.platforms[platformId];
        
        // Get the platform details to find an emulator
        fetch(`/api/platforms/${platformId}`)
          .then(response => response.json())
          .then(platformData => {
            if (platformData.success) {
              const platform = platformData.data;
              
              // Check if the platform has emulators
              if (!platform.emulators || Object.keys(platform.emulators).length === 0) {
                alert(`No emulators configured for ${platform.name}`);
                return;
              }
              
              // If there are multiple emulators, ask the user which one to use
              let emulatorId;
              if (Object.keys(platform.emulators).length > 1) {
                const emulatorOptions = Object.entries(platform.emulators)
                  .map(([id, emulator]) => `${id}: ${emulator.name}`)
                  .join('\n');
                
                const selectedEmulator = prompt(
                  `Select an emulator to launch ${game.title}:\n${emulatorOptions}`,
                  Object.keys(platform.emulators)[0]
                );
                
                if (!selectedEmulator || !platform.emulators[selectedEmulator]) {
                  alert('Invalid emulator selected');
                  return;
                }
                
                emulatorId = selectedEmulator;
              } else {
                // Use the first emulator if there's only one
                emulatorId = Object.keys(platform.emulators)[0];
              }
              
              // Launch the game using the server endpoint
              fetch('/api/launch-game', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  gameId,
                  emulatorId
                })
              })
              .then(response => response.json())
              .then(launchData => {
                if (launchData.success) {
                  console.log(`Game launched: ${game.title}`);
                  console.log(`Command: ${launchData.command}`);
                } else {
                  alert(`Failed to launch game: ${launchData.message}`);
                }
              })
              .catch(error => {
                console.error('Error launching game:', error);
                alert('Error launching game');
              });
            } else {
              alert('Failed to get platform details');
            }
          })
          .catch(error => {
            console.error('Error getting platform details:', error);
            alert('Error launching game');
          });
      } else {
        alert('Failed to get game details');
      }
    })
    .catch(error => {
      console.error('Error getting game details:', error);
      alert('Error launching game');
    });
}

// Update stats
export function updateStats() {
  fetch('/api/games?test=false')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const totalGamesCount = document.getElementById('totalGamesCount');
        if (totalGamesCount) {
          totalGamesCount.textContent = data.totalItems || 0;
        }
      }
    });
  
  fetch('/api/platforms')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const totalPlatformsCount = document.getElementById('totalPlatformsCount');
        const totalEmulatorsCount = document.getElementById('totalEmulatorsCount');
        
        if (totalPlatformsCount) {
          totalPlatformsCount.textContent = Object.keys(data.data).length || 0;
        }
        
        if (totalEmulatorsCount) {
          let emulatorCount = 0;
          
          // Count emulators from the platforms data
          Object.values(data.data).forEach(platform => {
            if (platform.emulators && typeof platform.emulators === 'object') {
              emulatorCount += Object.keys(platform.emulators).length;
            }
          });
          
          totalEmulatorsCount.textContent = emulatorCount;
        }
      }
    })
    .catch(error => {
      console.error('Error fetching platforms data:', error);
      const totalPlatformsCount = document.getElementById('totalPlatformsCount');
      const totalEmulatorsCount = document.getElementById('totalEmulatorsCount');
      
      if (totalPlatformsCount) {
        totalPlatformsCount.textContent = '0';
      }
      
      if (totalEmulatorsCount) {
        totalEmulatorsCount.textContent = '0';
      }
    });
}
// Helper function to open emulator modal (used in setupEventListeners)
export function openEmulatorModal(platformId, emulatorId = null) {
  if (window.emulatorModal) {
    window.emulatorModal.show(platformId, emulatorId);
  }
}

// Open platform modal for adding/editing
export function openPlatformModal(platformId = null) {
  const platformModal = document.getElementById('platformModal');
  const platformForm = document.getElementById('platformForm');
  const modalTitle = document.getElementById('platformModalTitle');
  const platformIdInput = document.getElementById('platformId');
  const platformDbResults = document.getElementById('platformDbResults');
  const errorDiv = document.getElementById('platformModalFormError');

  if (!platformModal || !platformForm || !modalTitle || !platformIdInput) {
    console.error('Platform modal elements not found');
    return;
  }

  // Reset form and clear previous errors/results
  platformForm.reset();
  if (platformDbResults) {
    platformDbResults.classList.add('hidden');
    platformDbResults.innerHTML = '';
  }
  if (errorDiv) {
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
  }

  if (platformId) {
    // Edit mode
    modalTitle.textContent = 'Edit Platform';

    // Load platform data
    fetch(`/api/platforms/${platformId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const platform = data.data;
          platformIdInput.value = platformId;
          platformIdInput.readOnly = true; // Can't change ID in edit mode
          document.getElementById('platformName').value = platform.name || '';
          document.getElementById('platformManufacturer').value = platform.manufacturer || '';
          document.getElementById('platformReleaseYear').value = platform.release_year || '';
          document.getElementById('platformDescription').value = platform.description || '';
        } else {
          if (errorDiv) {
            errorDiv.textContent = `Error loading platform: ${data.message}`;
            errorDiv.classList.remove('hidden');
          } else {
            alert(`Error loading platform: ${data.message}`);
          }
        }
      })
      .catch(err => {
        console.error('Error fetching platform data:', err);
        if (errorDiv) {
            errorDiv.textContent = 'Failed to fetch platform data for editing.';
            errorDiv.classList.remove('hidden');
          } else {
            alert('Failed to fetch platform data for editing.');
          }
      });
  } else {
    // Add mode
    modalTitle.textContent = 'Add Platform';
    platformIdInput.value = '';
    platformIdInput.readOnly = false;
  }

  // Show modal
  platformModal.classList.remove('hidden');
}

// Edit platform
export function editPlatform(platformId) {
  openPlatformModal(platformId);
}

// Delete platform
export function deletePlatform(platformId) {
  if (confirm('Are you sure you want to delete this platform? This will also delete associated emulators and update games.')) {
    fetch(`/api/platforms/${platformId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Reload platforms
        const searchTerm = document.getElementById('platformSearchInput')?.value.trim() || '';
        const sortOrder = document.getElementById('platformSortOption')?.value || '';
        loadPlatforms(searchTerm, sortOrder, window.renderPlatformsFunction || renderPlatforms);
        updateStats(); // Also update stats as platform count changes
      } else {
        const errorDiv = document.getElementById('platformModalFormError'); // Attempt to show in modal if open
        if (errorDiv && !errorDiv.classList.contains('hidden')) {
            errorDiv.textContent = data.message || 'Failed to delete platform.';
            errorDiv.classList.remove('hidden');
        } else {
            alert(data.message || 'Failed to delete platform'); // Fallback if modal context is lost
        }
      }
    })
    .catch(error => {
      console.error('Error deleting platform:', error);
      const errorDiv = document.getElementById('platformModalFormError');
       if (errorDiv && !errorDiv.classList.contains('hidden')) {
            errorDiv.textContent = 'An unexpected error occurred during deletion.';
            errorDiv.classList.remove('hidden');
        } else {
            alert('An unexpected error occurred during deletion.');
        }
    });
  }
}