// Simple state management for RetroNode
export class RetroNodeState {
  constructor() {
    this.state = {
      games: [],
      platforms: {},
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
      this.setState({ isLoading: true, error: null });
      
      const params = new URLSearchParams({
        page: this.state.currentPage,
        limit: this.state.itemsPerPage,
        search: this.state.searchTerm,
        platform: this.state.platformFilter,
        sort: this.state.sortField,
        order: this.state.sortAsc ? 'asc' : 'desc'
      });

      const response = await fetch('/api/games?' + params);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load games');
      }

      this.setState({
        games: data.data,
        totalItems: data.pagination.total,
        isLoading: false
      });
    } catch (err) {
      this.setState({
        error: err.message,
        isLoading: false
      });
    }
  }

  async loadPlatforms() {
    try {
      const response = await fetch('/api/platforms');
      const data = await response.json();
      this.setState({ platforms: data });
    } catch (err) {
      this.setState({ error: err.message });
    }
  }

  setPage(page) {
    this.setState({ currentPage: page });
    this.loadGames();
  }

  setSearch(term) {
    this.setState({
      searchTerm: term,
      currentPage: 1
    });
    this.loadGames();
  }

  setPlatformFilter(platform) {
    this.setState({
      platformFilter: platform,
      currentPage: 1
    });
    this.loadGames();
  }

  setSort(field) {
    const sortAsc = field === this.state.sortField ? !this.state.sortAsc : true;
    this.setState({
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
