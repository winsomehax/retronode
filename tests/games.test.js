const request = require('supertest');
const express = require('express');
const gamesRouter = require('../routes/games');
const path = require('path');
const fs = require('fs').promises;

// Mock the fileUtils module
jest.mock('../utils/fileUtils', () => ({
  readJsonFileAsync: jest.fn(),
  writeJsonFileAsync: jest.fn().mockResolvedValue(true)
}));

// Import the mocked module
const { readJsonFileAsync } = require('../utils/fileUtils');

// Create a test Express app
const app = express();
app.use(express.json());
app.use('/api/games', gamesRouter);

describe('Games API Tests', () => {
  test('GET /api/games returns 3 test games by default when test=true', async () => {
    const response = await request(app)
      .get('/api/games?test=true');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.totalItems).toBe(3);
  });

  test('GET /api/games returns 6 test games when test=true and count=6', async () => {
    const response = await request(app)
      .get('/api/games?test=true&count=6');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(6);
    expect(response.body.totalItems).toBe(6);
  });

  test('Test games have the correct structure', async () => {
    const response = await request(app)
      .get('/api/games?test=true');
    
    const firstGame = response.body.data[0];
    expect(firstGame).toHaveProperty('id');
    expect(firstGame).toHaveProperty('title');
    expect(firstGame).toHaveProperty('description');
    expect(firstGame).toHaveProperty('platforms');
    expect(firstGame.platforms).toHaveProperty('test-platform');
  });

  test('GET /api/games returns real games from the database with correct content', async () => {
    // Mock the games data that would be returned from the database
    const mockGames = {
      'game-1': {
        title: 'Super Mario Bros',
        description: 'Classic platformer game',
        platforms: { 'nes': { path: '/roms/nes/mario.rom' } }
      },
      'game-2': {
        title: 'The Legend of Zelda',
        description: 'Action-adventure game',
        platforms: { 'nes': { path: '/roms/nes/zelda.rom' } }
      },
      'game-3': {
        title: 'Sonic the Hedgehog',
        description: 'Fast-paced platformer',
        platforms: { 'genesis': { path: '/roms/genesis/sonic.rom' } }
      }
    };

    // Set up the mock to return our test data
    readJsonFileAsync.mockResolvedValue(mockGames);

    // Make the request
    const response = await request(app).get('/api/games');

    // Verify the response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.totalItems).toBe(3);

    // Verify the content of the games
    const games = response.body.data;
    expect(games).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'game-1',
        title: 'Super Mario Bros',
        description: 'Classic platformer game',
        platforms: { 'nes': { path: '/roms/nes/mario.rom' } }
      }),
      expect.objectContaining({
        id: 'game-2',
        title: 'The Legend of Zelda',
        description: 'Action-adventure game',
        platforms: { 'nes': { path: '/roms/nes/zelda.rom' } }
      }),
      expect.objectContaining({
        id: 'game-3',
        title: 'Sonic the Hedgehog',
        description: 'Fast-paced platformer',
        platforms: { 'genesis': { path: '/roms/genesis/sonic.rom' } }
      })
    ]));

    // Verify the mock was called with the correct path
    expect(readJsonFileAsync).toHaveBeenCalledWith(expect.stringContaining('games.json'));
  });

  test('GET /api/games with platform filter returns only games for that platform', async () => {
    // Mock the games data with multiple platforms
    const mockGames = {
      'game-1': {
        title: 'Super Mario Bros',
        description: 'Classic platformer game',
        platforms: { 'nes': { path: '/roms/nes/mario.rom' } }
      },
      'game-2': {
        title: 'The Legend of Zelda',
        description: 'Action-adventure game',
        platforms: { 'nes': { path: '/roms/nes/zelda.rom' } }
      },
      'game-3': {
        title: 'Sonic the Hedgehog',
        description: 'Fast-paced platformer',
        platforms: { 'genesis': { path: '/roms/genesis/sonic.rom' } }
      }
    };

    // Set up the mock
    readJsonFileAsync.mockResolvedValue(mockGames);

    // Make the request with platform filter
    const response = await request(app).get('/api/games?platform=nes');

    // Verify the response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2); // Only 2 NES games
    expect(response.body.totalItems).toBe(2);

    // Verify the content - should only have NES games
    const games = response.body.data;
    games.forEach(game => {
      expect(game.platforms).toHaveProperty('nes');
    });

    // Should not include the Genesis game
    expect(games.find(game => game.title === 'Sonic the Hedgehog')).toBeUndefined();
  });

  test('PUT /api/games/:id updates game details correctly', async () => {
    // Mock initial games data
    const mockGames = {
      'game-1': {
        title: 'Super Mario Bros',
        description: 'Classic platformer game',
        releaseDate: '1985',
        platform: 'NES',
        coverUrl: 'http://example.com/mario.jpg'
      }
    };

    // Set up the mock
    readJsonFileAsync.mockResolvedValue(mockGames);

    // Updated game details
    const updatedGame = {
      title: 'Super Mario Bros.',
      description: 'The classic platformer that defined a generation',
      releaseDate: '1985-09-13',
      platform: 'Nintendo Entertainment System',
      coverUrl: 'http://example.com/mario-updated.jpg'
    };

    // Make the update request
    const response = await request(app)
      .put('/api/games/game-1')
      .send(updatedGame);

    // Verify the response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify that writeJsonFileAsync was called with the correct updated data
    const { writeJsonFileAsync } = require('../utils/fileUtils');
    expect(writeJsonFileAsync).toHaveBeenCalledWith(
      expect.stringContaining('games.json'),
      expect.objectContaining({
        'game-1': updatedGame
      })
    );
  });
  test('GET /api/games/:id returns 404 with descriptive message for non-existent game', async () => {
    // Mock empty games data
    readJsonFileAsync.mockResolvedValue({});

    // Make request with non-existent game ID
    const nonExistentId = 'non-existent-game';
    const response = await request(app)
      .get(`/api/games/${nonExistentId}`);

    // Verify the response
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`Game with ID ${nonExistentId} not found`);
  });
});