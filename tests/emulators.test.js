const request = require('supertest');
const express = require('express');
const emulatorsRouter = require('../routes/emulators'); // Adjust path as needed
const fs = require('fs').promises;
const path = require('path');

// Path to the platforms.json file (as the router uses this)
const PLATFORMS_FILE_PATH = path.join(__dirname, '..', 'data', 'platforms.json'); // Adjust path as needed

// Mock fileUtils to prevent actual file system operations during tests
jest.mock('../utils/fileUtils', () => ({
  readJsonFileAsync: jest.fn(),
  writeJsonFileAsync: jest.fn().mockResolvedValue(true), // Mock successful write
}));

// Import the mocked functions to spy on them or set their behavior
const { readJsonFileAsync, writeJsonFileAsync } = require('../utils/fileUtils');

// Create a test Express app
const app = express();
app.use(express.json());
app.use('/api/emulators', emulatorsRouter);

// Helper function to reset mocks and initial data before each test
async function resetMocksAndData() {
  readJsonFileAsync.mockReset();
  writeJsonFileAsync.mockReset();
  writeJsonFileAsync.mockResolvedValue(true); // Default to successful write

  // Provide a default mock implementation for readJsonFileAsync
  // This mock should reflect the structure of platforms.json
  readJsonFileAsync.mockImplementation(async (filePath) => {
    if (filePath.endsWith('platforms.json')) {
      return {
        "platform1": {
          "name": "Platform One",
          "emulators": {
            "emu1": { "name": "Emulator One", "command": "emu1 %ROM%", "description": "Desc1", "version": "1.0" },
            "emu2": { "name": "Emulator Two", "command": "emu2 %ROM%", "description": "Desc2", "version": "1.1" }
          }
        },
        "platform2": {
          "name": "Platform Two",
          "emulators": {
            "emu3": { "name": "Emulator Three", "command": "emu3 %ROM%", "description": "Desc3", "version": "2.0" }
          }
        }
      };
    }
    return {}; // Default empty object for other JSON files
  });
}

describe('Emulators API (within Platforms)', () => {
  beforeEach(async () => {
    await resetMocksAndData();
  });

  // Test GET emulators for a specific platform
  describe('GET /api/emulators/:platformId', () => {
    it('should return a list of emulators for a given platformId', async () => {
      // Mock data is set by resetMocksAndData
      // We expect emulators for "platform1"
      const expectedEmulators = [
        { emulator_id: "emu1", name: "Emulator One", command: "emu1 %ROM%", description: "Desc1", version: "1.0" },
        { emulator_id: "emu2", name: "Emulator Two", command: "emu2 %ROM%", description: "Desc2", version: "1.1" }
      ];

      const response = await request(app).get('/api/emulators/platform1');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expectedEmulators);
      expect(readJsonFileAsync).toHaveBeenCalledWith(PLATFORMS_FILE_PATH);
    });

    it('should return an empty array if platformId is not found', async () => {
      const response = await request(app).get('/api/emulators/nonexistentplatform');
      expect(response.status).toBe(200); // Router returns 200 with empty data
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return an empty array if platform has no emulators property', async () => {
      // Override mock for this specific test
      readJsonFileAsync.mockResolvedValue({
        "platform_no_emus": { "name": "Platform No Emulators" }
      });
      const response = await request(app).get('/api/emulators/platform_no_emus');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return 500 if there is an error reading the platforms file', async () => {
      let originalConsoleError;
      let originalConsoleLog;
      try {
        originalConsoleError = console.error;
        originalConsoleLog = console.log;
        console.error = jest.fn();
        console.log = jest.fn();

        readJsonFileAsync.mockRejectedValue(new Error('File read error'));
        const response = await request(app).get('/api/emulators/platform1');
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        // Updated to match the actual error message format from the router
        expect(response.body.message).toBe('Error getting emulators: File read error');
      } finally {
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
      }
    });
  });

  // Test GET emulator by ID (This route doesn't exist directly, emulators are per platform)
  // So, these tests will be removed or adapted for POST, PUT, DELETE which use /:platformId/:emulatorId

  // Test POST to create a new emulator for a platform
  describe('POST /api/emulators/:platformId', () => {
    it('should create a new emulator for a platform and return its ID', async () => {
      const newEmulatorData = {
        // emulator_id can be optionally provided, or router generates one
        name: "Emulator Four",
        command: "emu4 %ROM%",
        description: "A new emulator",
        version: "1.0"
      };
      // Mock read to return existing platforms (platform1 exists from resetMocksAndData)
      // writeJsonFileAsync is mocked to resolve true by default

      const response = await request(app)
        .post('/api/emulators/platform1')
        .send(newEmulatorData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.emulator_id).toBeDefined(); // Router generates UUID if not provided

      // Verify writeJsonFileAsync was called correctly
      const currentPlatforms = await readJsonFileAsync(PLATFORMS_FILE_PATH); // Get the mocked current state
      const expectedDataToWrite = JSON.parse(JSON.stringify(currentPlatforms)); // Deep copy

      // Add the new emulator to the expected data, using the generated ID
      // Since we don't know the generated ID, we check that an emulator with the new name was added
      let foundNewEmulator = false;
      const writtenData = writeJsonFileAsync.mock.calls[0][1]; // Get the data passed to writeJsonFileAsync
      const emulatorsInPlatform1 = writtenData.platform1.emulators;
      for (const emuId in emulatorsInPlatform1) {
        if (emulatorsInPlatform1[emuId].name === newEmulatorData.name &&
            emulatorsInPlatform1[emuId].command === newEmulatorData.command) {
          foundNewEmulator = true;
          break;
        }
      }
      expect(foundNewEmulator).toBe(true);
      expect(writeJsonFileAsync).toHaveBeenCalledWith(PLATFORMS_FILE_PATH, expect.any(Object));
    });

    it('should return 400 if required fields are missing (e.g., name)', async () => {
      const incompleteEmulatorData = { command: "test %ROM%" }; // name is missing
      const response = await request(app)
        .post('/api/emulators/platform1')
        .send(incompleteEmulatorData);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input');
      // Adjusted to expect an array of strings, based on validateInput implementation
      expect(response.body.errors).toEqual(expect.arrayContaining(["name is required"]));
    });

    it('should return 404 if platform ID does not exist', async () => {
      const newEmulatorData = { name: "TestEmu", command: "test %ROM%" };
      const response = await request(app)
        .post('/api/emulators/nonexistentplatform')
        .send(newEmulatorData);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform not found');
    });

    it('should return 500 if there is an error writing to platforms file', async () => {
        let originalConsoleError;
        let originalConsoleLog;
        try {
          originalConsoleError = console.error;
          originalConsoleLog = console.log;
          console.error = jest.fn();
          console.log = jest.fn();

          // readJsonFileAsync will use default mock from resetMocksAndData
          writeJsonFileAsync.mockRejectedValue(new Error('File write error'));

          const newEmulatorData = { name: "FailEmu", command: "fail %ROM%" };
          const response = await request(app)
              .post('/api/emulators/platform1')
              .send(newEmulatorData);
          expect(response.status).toBe(500);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe('Error adding emulator: File write error');
        } finally {
          console.error = originalConsoleError;
          console.log = originalConsoleLog;
        }
    });
  });

  // Test PUT to update an existing emulator
  describe('PUT /api/emulators/:platformId/:emulatorId', () => {
    it('should update an existing emulator and return success', async () => {
      // platform1 and emu1 exist from resetMocksAndData
      const updatedEmulatorData = {
        name: "Emulator One Updated",
        command: "emu1_updated %ROM%",
        description: "Updated description",
        version: "1.1-updated"
      };
      const response = await request(app)
        .put('/api/emulators/platform1/emu1')
        .send(updatedEmulatorData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify writeJsonFileAsync was called with correctly updated data
      const currentPlatforms = await readJsonFileAsync(PLATFORMS_FILE_PATH); // Get the mocked current state
      const expectedDataToWrite = JSON.parse(JSON.stringify(currentPlatforms)); // Deep copy
      expectedDataToWrite.platform1.emulators.emu1 = updatedEmulatorData; // Apply update
      expect(writeJsonFileAsync).toHaveBeenCalledWith(PLATFORMS_FILE_PATH, expectedDataToWrite);
    });

    it('should return 404 if platform to update is not found', async () => {
      const updatedData = { name: "Non Existent Updated", command: "cmd" };
      const response = await request(app)
        .put('/api/emulators/nonexistentplatform/emu1')
        .send(updatedData);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform not found');
    });

    it('should return 404 if emulator to update is not found', async () => {
      const updatedData = { name: "Non Existent Updated", command: "cmd" };
      const response = await request(app)
        .put('/api/emulators/platform1/nonexistentemu')
        .send(updatedData);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Emulator not found');
    });

    it('should return 400 if update data is incomplete (e.g. missing name)', async () => {
        const incompleteData = { command: "updated_cmd" }; // name is missing
        const response = await request(app)
            .put('/api/emulators/platform1/emu1')
            .send(incompleteData);
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid input');
        // Adjusted to expect an array of strings
        expect(response.body.errors).toEqual(expect.arrayContaining(["name is required"]));
    });

    it('should return 500 if there is an error writing to platforms file during update', async () => {
        let originalConsoleError;
        let originalConsoleLog;
        try {
          originalConsoleError = console.error;
          originalConsoleLog = console.log;
          console.error = jest.fn();
          console.log = jest.fn();

          // readJsonFileAsync will use default mock from resetMocksAndData
          writeJsonFileAsync.mockRejectedValue(new Error('File write error'));

          const updatedData = { name: "Update Fail Emu", command: "fail_update %ROM%" };
          const response = await request(app)
              .put('/api/emulators/platform1/emu1')
              .send(updatedData);
          expect(response.status).toBe(500);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe('Error updating emulator: File write error');
        } finally {
          console.error = originalConsoleError;
          console.log = originalConsoleLog;
        }
    });
  });

  // Test DELETE to remove an emulator
  describe('DELETE /api/emulators/:platformId/:emulatorId', () => {
    it('should delete an emulator and return a success message', async () => {
      // platform1 and emu1 exist from resetMocksAndData
      const response = await request(app).delete('/api/emulators/platform1/emu1');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeUndefined(); // Router sends { success: true }

      // Verify writeJsonFileAsync was called with emu1 removed
      const currentPlatforms = await readJsonFileAsync(PLATFORMS_FILE_PATH);
      const expectedDataToWrite = JSON.parse(JSON.stringify(currentPlatforms));
      delete expectedDataToWrite.platform1.emulators.emu1; // emu1 should be removed
      expect(writeJsonFileAsync).toHaveBeenCalledWith(PLATFORMS_FILE_PATH, expectedDataToWrite);
    });

    it('should return 404 if platform to delete from is not found', async () => {
      const response = await request(app).delete('/api/emulators/nonexistentplatform/emu1');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform not found');
    });

    it('should return 404 if emulator to delete is not found', async () => {
      const response = await request(app).delete('/api/emulators/platform1/nonexistentemu');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Emulator not found');
    });

    it('should return 500 if there is an error writing to platforms file during delete', async () => {
        let originalConsoleError;
        let originalConsoleLog;
        try {
          originalConsoleError = console.error;
          originalConsoleLog = console.log;
          console.error = jest.fn();
          console.log = jest.fn();

          // readJsonFileAsync will use default mock from resetMocksAndData
          writeJsonFileAsync.mockRejectedValue(new Error('File write error'));

          const response = await request(app).delete('/api/emulators/platform1/emu1');
          expect(response.status).toBe(500);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe('Error deleting emulator: File write error');
        } finally {
          console.error = originalConsoleError;
          console.log = originalConsoleLog;
        }
    });
  });
});
