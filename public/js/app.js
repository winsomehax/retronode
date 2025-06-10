// Main application script
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  initApp();
});

function initApp() {
  // Load initial data
  loadGames();
  loadPlatforms();
  updateStats();
  
  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Search input handler
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.trim();
      loadGames(searchTerm, document.getElementById('platformFilter')?.value);
    });
  }
  
  // Platform filter handler
  const platformFilter = document.getElementById('platformFilter');
  if (platformFilter) {
    platformFilter.addEventListener('change', function() {
      const platformId = this.value;
      const searchTerm = document.getElementById('searchInput')?.value.trim() || '';
      loadGames(searchTerm, platformId);
    });
  }
  
  // Sort option handler
  const sortOption = document.getElementById('sortOption');
  if (sortOption) {
    sortOption.addEventListener('change', function() {
      const [field, direction] = this.value.split('_');
      sortGames(field, direction);
    });
  }
  
  // Add game button
  const addGameBtn = document.getElementById('addGameBtn');
  if (addGameBtn) {
    addGameBtn.addEventListener('click', function() {
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
        
        if (editBtn) {
          const gameId = editBtn.getAttribute('data-id');
          console.log("Edit button clicked for game ID:", gameId);
          editGame(gameId);
        } else if (deleteBtn) {
          const gameId = deleteBtn.getAttribute('data-id');
          deleteGame(gameId);
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
}

// Load games from API
async function loadGames(search = '', platform = '') {
  const gamesGrid = document.getElementById('gamesGrid');
  if (!gamesGrid) return;
  
  try {
    let url = `/api/games?limit=100`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (platform) url += `&platform=${encodeURIComponent(platform)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      renderGames(data.data);
    } else {
      console.error('Error loading games:', data.message);
    }
  } catch (error) {
    console.error('Error loading games:', error);
  }
}

// Load platforms from API
async function loadPlatforms() {
  const platformFilter = document.getElementById('platformFilter');
  const platformsContainer = document.getElementById('platformsContainer');
  
  try {
    const response = await fetch('/api/platforms');
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
        renderPlatforms(data.data);
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
async function loadEmulators(platformId) {
  const emulatorsContainer = document.getElementById('emulatorsContainer');
  if (!emulatorsContainer) return;
  
  try {
    const response = await fetch(`/api/emulators/${platformId}`);
    const data = await response.json();
    
    if (data.success) {
      renderEmulators(platformId, data.data);
    } else {
      console.error('Error loading emulators:', data.message);
    }
  } catch (error) {
    console.error('Error loading emulators:', error);
  }
}

// Render games to the grid
function renderGames(games) {
  const gamesGrid = document.getElementById('gamesGrid');
  if (!gamesGrid) return;
  
  gamesGrid.innerHTML = '';
  
  if (games.length === 0) {
    gamesGrid.innerHTML = '<div class="col-span-full text-center text-body py-8">No games found matching your criteria.</div>';
    return;
  }
  
  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    card.innerHTML = `
      <div class="game-card-image">
        <img src="${game.cover_image_path || 'https://via.placeholder.com/300x450'}" 
             alt="${game.title || 'No title'}" 
             class="w-full h-auto"
             onerror="if (this.src !== 'https://via.placeholder.com/300x450') { this.src='https://via.placeholder.com/300x450'; }">
      </div>
      <div class="p-3">
        <h3 class="game-card-title font-heading text-left mt-0 p-0">${game.title || 'No title'}</h3>
        <div class="game-card-platform text-sm text-secondary text-left mb-2">${Object.keys(game.platforms || {}).join(', ') || 'No platforms'}</div>
        <div class="game-card-content p-0">
          <p class="text-body text-sm line-clamp-3 text-left">${game.description || 'No description'}</p>
        </div>
        <div class="game-card-actions justify-end mt-2 p-0 border-0">
          <button class="edit-game-btn" data-id="${game.id}" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-game-btn" data-id="${game.id}" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
    
    gamesGrid.appendChild(card);
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
      </div>
      <div class="game-card-actions">
        <button class="edit-platform-btn" data-id="${id}" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-platform-btn" data-id="${id}" title="Delete">
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
}

// Render emulators for a platform
function renderEmulators(platformId, emulators) {
  const emulatorsContainer = document.getElementById('emulatorsContainer');
  if (!emulatorsContainer) return;
  
  // Get platform name
  fetch('/api/platforms')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const platformName = data.data[platformId]?.name || platformId;
        
        emulatorsContainer.innerHTML = `
          <div class="game-card">
            <div class="bg-dark px-4 py-3 flex justify-between items-center">
              <h3 class="font-medium text-lg text-primary font-heading">${platformName}</h3>
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
    })
    .catch(error => console.error('Error loading platform details:', error));
}

// Open game modal for adding/editing
function openGameModal(gameId = null) {
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
          
          document.getElementById('gameId').value = game.id;
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
function editGame(gameId) {
  openGameModal(gameId);
}

// Delete game
function deleteGame(gameId) {
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
        loadGames(searchTerm, platformId);
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

// Update stats
function updateStats() {
  fetch('/api/games')
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
        if (totalPlatformsCount) {
          totalPlatformsCount.textContent = Object.keys(data.data).length || 0;
        }
      }
    });
  
  fetch('/api/emulators')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const totalEmulatorsCount = document.getElementById('totalEmulatorsCount');
        if (totalEmulatorsCount) {
          let emulatorCount = 0;
          Object.values(data.data).forEach(emulatorArray => {
            emulatorCount += emulatorArray.length;
          });
          totalEmulatorsCount.textContent = emulatorCount;
        }
      }
    });
}