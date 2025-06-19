const request = require('supertest');
const app = require('../app');
const { searchPlatformsByName } = require('../middleware/TheGamesDB');

// Mock the TheGamesDB module
jest.mock('../middleware/TheGamesDB');

describe('TheGamesDB Platform Search Tests', () => {
  // Store original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Setup test environment
    process.env = { ...originalEnv, THEGAMESDB_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('Search platforms with valid name returns results', async () => {
    const mockPlatforms = {
      platforms: [
        {
          id: 1,
          name: 'Nintendo Entertainment System',
          alias: 'nes',
          icon: 'nes-icon.png',
          boxart: 'nes-boxart.png'
        }
      ],
      include: {
        platform_logo: {
          base_url: 'https://example.com/icons/'
        },
        platform_boxart: {
          base_url: 'https://example.com/boxart/'
        }
      }
    };

    searchPlatformsByName.mockResolvedValue(mockPlatforms);

    const response = await request(app)
      .get('/api/thegamesdb/platforms/search')
      .query({ name: 'Nintendo' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockPlatforms.platforms);
    expect(response.body.include).toEqual(mockPlatforms.include);
    expect(searchPlatformsByName).toHaveBeenCalledWith('Nintendo');
  });

  test('Search platforms without name returns 400', async () => {
    const response = await request(app)
      .get('/api/thegamesdb/platforms/search')
      .query({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Platform name is required');
  });

  test('Search platforms with missing API key returns 500', async () => {
    // Save current API key
    const originalApiKey = process.env.THEGAMESDB_API_KEY;
    // Remove API key
    delete process.env.THEGAMESDB_API_KEY;
    
    const response = await request(app)
      .get('/api/thegamesdb/platforms/search')
      .query({ name: 'Nintendo' });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('TheGamesDB API key not configured');

    // Restore API key
    process.env.THEGAMESDB_API_KEY = originalApiKey;
  });

  test('Search platforms handles invalid API response', async () => {
    searchPlatformsByName.mockRejectedValue(new Error('Failed to parse TheGamesDB response: Invalid JSON'));

    const response = await request(app)
      .get('/api/thegamesdb/platforms/search')
      .query({ name: 'Nintendo' });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Failed to parse TheGamesDB response: Invalid JSON');
  });

  test('Search platforms handles API service errors', async () => {
    searchPlatformsByName.mockRejectedValue(new Error('TheGamesDB request failed with status code 503'));

    const response = await request(app)
      .get('/api/thegamesdb/platforms/search')
      .query({ name: 'Nintendo' });

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('TheGamesDB API service error');
  });

  test('Search platforms handles empty results', async () => {
    searchPlatformsByName.mockResolvedValue({
      platforms: [],
      include: {}
    });

    const response = await request(app)
      .get('/api/thegamesdb/platforms/search')
      .query({ name: 'NonExistentPlatform' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
    expect(response.body.include).toEqual({});
  });

  test('Search platforms handles network errors', async () => {
    searchPlatformsByName.mockRejectedValue(new Error('Network error while searching platforms: ECONNREFUSED'));

    const response = await request(app)
      .get('/api/thegamesdb/platforms/search')
      .query({ name: 'Nintendo' });

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Error searching TheGamesDB platforms due to a network issue.');
  });

  // Tests for the new /api/thegamesdb/platforms endpoint
  test('Direct platforms endpoint returns results with valid name', async () => {
    const mockPlatforms = {
      platforms: [
        {
          id: 1,
          name: 'Nintendo Entertainment System',
          alias: 'nes',
          icon: 'nes-icon.png',
          boxart: 'nes-boxart.png'
        }
      ],
      include: {
        platform_logo: {
          base_url: 'https://example.com/icons/'
        },
        platform_boxart: {
          base_url: 'https://example.com/boxart/'
        }
      }
    };

    searchPlatformsByName.mockResolvedValue(mockPlatforms);

    const response = await request(app)
      .get('/api/thegamesdb/platforms')
      .query({ name: 'Nintendo' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockPlatforms.platforms);
    expect(response.body.include).toEqual(mockPlatforms.include);
    expect(searchPlatformsByName).toHaveBeenCalledWith('Nintendo');
  });

  test('Direct platforms endpoint returns 400 without name', async () => {
    const response = await request(app)
      .get('/api/thegamesdb/platforms')
      .query({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Platform name is required');
  });

  test('Direct platforms endpoint handles API errors correctly', async () => {
    searchPlatformsByName.mockRejectedValue(new Error('TheGamesDB request failed with status code 503'));

    const response = await request(app)
      .get('/api/thegamesdb/platforms')
      .query({ name: 'Nintendo' });

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('TheGamesDB API service error');
  });
});