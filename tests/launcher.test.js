const request = require('supertest');
const express = require('express');
// const launcherRouter = require('../routes/launcher'); // DEBUG: Still commented out for now
const path = require('path');

jest.setTimeout(10000);

// --- Mocks ---
jest.mock('fs');
// jest.mock('child_process'); // DEBUG: STEP 2 - Commented out child_process mock

// If child_process is not mocked, these are not available:
// const { spawn: mockedChildProcessSpawn } = require('child_process');
// let mockSpawnInstanceOnErrorCb;
// const mockSpawnInstance = { /* ... */ };


jest.mock('../utils/fileUtils', () => ({
  readJsonFileAsync: jest.fn(),
  ensureDirectoryExists: jest.fn().mockResolvedValue(undefined),
}));
const { readJsonFileAsync, ensureDirectoryExists: mockEnsureDir } = require('../utils/fileUtils');
const { promises: fsPromisesMod } = require('fs');
const mockedFsAccess = fsPromisesMod.access;
const mockedFsMkdir = fsPromisesMod.mkdir;


// --- Config ---
const GAMES_DB_PATH = path.join(__dirname, '..', 'data', 'games.json');
const PLATFORMS_DB_PATH = path.join(__dirname, '..', 'data', 'platforms.json');

const app = express();
app.use(express.json());
// app.use('/api/launcher', launcherRouter); // DEBUG: Still commented out

// --- Helper: Reset Mocks and Data ---
function resetMocksAndData() {
  if (jest.isMockFunction(mockedFsAccess)) {
    mockedFsAccess.mockClear().mockResolvedValue(undefined);
  }
  if (jest.isMockFunction(mockedFsMkdir)) {
    mockedFsMkdir.mockClear().mockResolvedValue(undefined);
  }

  // Can't clear/reset child_process mocks if not mocking child_process
  // if (mockedChildProcessSpawn && jest.isMockFunction(mockedChildProcessSpawn)) {
  //   mockedChildProcessSpawn.mockClear();
  // }
  // mockSpawnInstanceOnErrorCb = null;
  // if (mockSpawnInstance && mockSpawnInstance.on && jest.isMockFunction(mockSpawnInstance.on)) {
  //   mockSpawnInstance.on.mockClear().mockImplementation(/*...*/);
  //   mockSpawnInstance.stderr.on.mockClear();
  //   mockSpawnInstance.stdout.on.mockClear();
  //   mockSpawnInstance.unref.mockClear();
  // }
  // if (mockedChildProcessSpawn && jest.isMockFunction(mockedChildProcessSpawn)) {
  //   mockedChildProcessSpawn.mockImplementation(() => mockSpawnInstance);
  // }

  readJsonFileAsync.mockReset();
  mockEnsureDir.mockClear().mockResolvedValue(undefined);

  readJsonFileAsync.mockImplementation(async (filePath) => {
    if (filePath === GAMES_DB_PATH) {
      return {
        "game1": { "title": "Test Game 1", "platforms": { "platform1": "/roms/testgame1.rom" }, "emulator_id": "emu1" },
        "game2": { "title": "Test Game 2", "platforms": { "platform1": "/roms/testgame2.zip" }},
        "game_no_rom_path": { "title": "Game No ROM Path", "platforms": {} }
      };
    }
    if (filePath === PLATFORMS_DB_PATH) {
      return {
        "platform1": {
          "name": "Test Platform 1",
          "emulators": {
            "emu1": { "name": "Test Emulator 1", "path": "/emulators/test-emu/emu.exe", "command": "%EMULATOR_PATH% -rom %ROM_PATH%" },
            "emu2": { "name": "Test Emulator 2", "path": "/emulators/another-emu/run.sh", "command": "%EMULATOR_PATH% %ROM_PATH%" }
          }
        },
        "platform_no_emus": { "name": "Platform No Emulators", "emulators": {} },
        "platform_bad_emu_config": { "name": "Platform Bad Emu Config", "emulators": { "bad_emu": { "name": "Bad Config Emu" } }}
      };
    }
    return {};
  });
}

// --- Tests ---
// Most tests will fail because launcherRouter is not used and child_process is not mocked.
// The goal is to see if the TIMEOUT stops.
describe('Launcher API - POST /api/launcher/', () => {
  beforeEach(() => {
    resetMocksAndData();
  });

  it('should not timeout (even if it fails)', async () => {
    // This test is just to see if we get a response without timing out
    // Since launcherRouter is not used, this will be a 404 from the base app.
    const response = await request(app)
      .post('/api/launcher/')
      .send({ gameId: 'game1', emulatorId: 'emu1' });
    expect(response.status).toBe(404); // Expecting 404 since the router is not mounted
  });

  // Commenting out tests that rely heavily on mockedChildProcessSpawn for now
  // to ensure the test suite can run without those specific mocks.

  // it('should launch a game with a specific emulator successfully', async () => { /* ... */ });
  // it('should launch a game using the first available platform emulator if emulatorId is not provided', async () => { /* ... */ });

  it('should return 404 for missing gameId (route not mounted)', async () => {
    const response = await request(app)
      .post('/api/launcher/')
      .send({ emulatorId: 'emu1' });
    expect(response.status).toBe(404);
  });

  it('should return 404 for game not found (route not mounted)', async () => {
    const response = await request(app)
      .post('/api/launcher/')
      .send({ gameId: 'unknown_game' });
    expect(response.status).toBe(404);
  });

  // ... other tests will also result in 404 or errors if they depend on the unmocked parts
});
