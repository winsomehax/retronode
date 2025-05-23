// Simple state management for RetroNode
export class RetroNodeState {
  constructor() {
    this.state = {
      games: [], // Should be an array of game objects
      platforms: [], // Should be an array of platform objects
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      isLoading: false,
      searchTerm: '',
      platformFilter: '',
      sortField: 'title',
      sortAsc: true,
      error: null
    };
    
    this.listeners = new Set();
  }

  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Update state and notify listeners
  setState(newState) {
    console.log("fsdfiu",newState);
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  // Notify all listeners of state change
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Getters for common state values
  get games() { return this.state.games; }
  get platforms() { return this.state.platforms; }
  get isLoading() { return this.state.isLoading; }
  get error() { return this.state.error; }

  // Actions
  async loadGames() {
    try {
      console.log('[RetroNodeState] loadGames: Initiating game load.');
      this.setState({ isLoading: true, error: null });
      
      console.log('[RetroNodeState] loadGames: Current state for params:', JSON.stringify(this.state));
      const params = new URLSearchParams({
        page: this.state.currentPage,
        limit: this.state.itemsPerPage,
        search: this.state.searchTerm,
        platform: this.state.platformFilter,
        sort: this.state.sortField,
        order: this.state.sortAsc ? 'asc' : 'desc'
      });

      const response = await fetch('/api/games?' + params);
      console.log('[RetroNodeState] loadGames: Fetch response status:', response.status);
      const data = await response.json();
      console.log('[RetroNodeState] loadGames: Data received from API:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to load games');
      }

      console.log('[RetroNodeState] loadGames: Calling setState with game data.');
      // Ensure each game object uses its primary key (e.g., _id from MongoDB) as its 'id' property.
      // This prioritizes `game._id`. If `_id` doesn't exist, it falls back to `game.id`.
      const gamesWithProperId = data.data.map(game => ({
        ...game,
        id: game._id || game.id 
      }));

      this.setState({
        games: gamesWithProperId,
        totalItems: data.pagination.total,
        isLoading: false
      });
    } catch (err) {
      console.error('[RetroNodeState] loadGames: Error loading games:', err);
      console.log('[RetroNodeState] loadGames: Calling setState with error.');
      this.setState({
        error: err.message,
        isLoading: false
      });
    }
  }

  async loadPlatforms() {
    try {
      console.log('[RetroNodeState] loadPlatforms: Initiating platform load.');
      const response = await fetch('/api/platforms');
      console.log('[RetroNodeState] loadPlatforms: Fetch response status:', response.status);
      const rawDataFromApi = await response.json(); // Renamed for clarity
      console.log('[RetroNodeState] loadPlatforms: Raw data received from API:', JSON.stringify(rawDataFromApi, null, 2));

      let platformsToSet = []; // Initialize as empty array
      const platformData = rawDataFromApi && rawDataFromApi.data ? rawDataFromApi.data : rawDataFromApi; // Get the relevant part (object or array)

      if (Array.isArray(platformData)) {
          // Case 1: API returned an array directly or under 'data'
          platformsToSet = platformData;
          console.log('[RetroNodeState] loadPlatforms: API returned an array:', JSON.stringify(platformsToSet, null, 2));
      } else if (platformData && typeof platformData === 'object') {
          // Case 2: API returned an object of platforms (keyed by ID)
          // Convert the object entries into an array, adding the key as the 'id' property
          platformsToSet = Object.entries(platformData).map(([id, platformObj]) => ({
            ...platformObj,
            id: id // Add the key (e.g., "c64") as the 'id' property
          }));
          console.log('[RetroNodeState] loadPlatforms: API returned an object, converted to array:', JSON.stringify(platformsToSet, null, 2));
      } else {
          // Case 3: Unexpected format
          console.warn('[RetroNodeState] loadPlatforms: API response for platforms is not in an expected array or object format. Setting platforms to empty array. Received:', rawDataFromApi);
        platformsToSet = []; // Default to empty array if structure is unexpected or error occurs
      }
      
      console.log('[RetroNodeState] loadPlatforms: Final platforms being set to state:', JSON.stringify(platformsToSet, null, 2));
      this.setState({ platforms: platformsToSet });

    } catch (err) {
      console.error('[RetroNodeState] loadPlatforms: Error loading platforms:', err);
      console.log('[RetroNodeState] loadPlatforms: Calling setState with error.');
      this.setState({ error: err.message, platforms: [] }); // Ensure platforms is an array on error
    }
  }

  setPage(page) {
    this.setState({ currentPage: page });
    this.loadGames();
    console.log('[RetroNodeState] setPage: Called, new page:', page);
  }

  setSearch(term) {
    this.setState({
      // Note: setState is called here, so your "fsdfiu" log *should* appear if setSearch is called.
      searchTerm: term,
      currentPage: 1
    });
    this.loadGames();
  }

  setPlatformFilter(platform) {
    this.setState({
      // Note: setState is called here.
      platformFilter: platform,
      currentPage: 1
    });
    this.loadGames();
  }

  setSort(field) {
    const sortAsc = field === this.state.sortField ? !this.state.sortAsc : true;
    this.setState({
      // Note: setState is called here.
      sortField: field,
      sortAsc,
      currentPage: 1
    });
    this.loadGames();
  }

  // Error handling
  clearError() {
    this.setState({ error: null });
  }
}

// Create a single instance for the application
const retroNodeState = new RetroNodeState();
export default retroNodeState;
