const request = require('supertest');
const express = require('express');
const platformsRouter = require('../routes/platforms'); // Adjust path as needed
const path = require('path');

// Path to the platforms.json file
const PLATFORMS_FILE_PATH = path.join(__dirname, '..', 'data', 'platforms.json'); // Adjust path as needed

// Mock fileUtils to prevent actual file system operations during tests
jest.mock('../utils/fileUtils', () => ({
  readJsonFileAsync: jest.fn(),
  writeJsonFileAsync: jest.fn().mockResolvedValue(true), // Mock successful write
  ensureDirectoryExists: jest.fn().mockResolvedValue(undefined), // Mock successful directory check/creation
}));

// Import the mocked functions to spy on them or set their behavior
const { readJsonFileAsync, writeJsonFileAsync } = require('../utils/fileUtils');

// Create a test Express app
const app = express();
app.use(express.json());
app.use('/api/platforms', platformsRouter);

// Helper function to reset mocks and initial data before each test
async function resetMocksAndData() {
  readJsonFileAsync.mockReset();
  writeJsonFileAsync.mockReset();
  writeJsonFileAsync.mockResolvedValue(true); // Default to successful write

  // Provide a default mock implementation for readJsonFileAsync for platforms
  readJsonFileAsync.mockImplementation(async (filePath) => {
    if (filePath.endsWith('platforms.json')) {
      return {
        "p1": { "name": "Platform One", "description": "Description for P1", "metadata": { "releaseYear": 2000 } },
        "p2": { "name": "Platform Two", "description": "Description for P2", "metadata": { "releaseYear": 2005 } }
      };
    }
    return {}; // Default empty object for other JSON files
  });
}

describe('Platforms API', () => {
  beforeEach(async () => {
    await resetMocksAndData();
  });

  // Test GET all platforms
  describe('GET /api/platforms', () => {
    it('should return a list of all platforms', async () => {
      const mockPlatforms = {
        "p1": { "name": "Platform One", "description": "Description for P1" },
        "p2": { "name": "Platform Two", "description": "Description for P2" }
      };
      // Override default mock for this specific test case if needed for clarity
      // or rely on the beforeEach mock if its structure matches this expectation.
      // For this test, let's ensure the mock returns exactly what we expect.
      readJsonFileAsync.mockResolvedValue(mockPlatforms);

      const response = await request(app).get('/api/platforms');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPlatforms);
      expect(readJsonFileAsync).toHaveBeenCalledWith(PLATFORMS_FILE_PATH);
    });

    it('should return 500 if there is an error reading platforms file', async () => {
      readJsonFileAsync.mockRejectedValue(new Error('File read error'));
      const response = await request(app).get('/api/platforms');
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error getting platforms: File read error');
    });
  });

  // Test GET platform by ID
  describe('GET /api/platforms/:id', () => {
    it('should return a single platform by its ID', async () => {
      // Relies on the mock from beforeEach, p1 should exist
      const expectedPlatform = {
        "name": "Platform One",
        "description": "Description for P1",
        "metadata": { "releaseYear": 2000 },
        "emulators": {} // Router adds this if not present
      };
      const response = await request(app).get('/api/platforms/p1');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expectedPlatform);
      expect(readJsonFileAsync).toHaveBeenCalledWith(PLATFORMS_FILE_PATH);
    });

    it('should return 404 if platform ID is not found', async () => {
      // Relies on mock from beforeEach, 'nonexistent' is not a key
      const response = await request(app).get('/api/platforms/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform not found');
    });

    it('should return 500 if there is an error reading platforms file', async () => {
      readJsonFileAsync.mockRejectedValue(new Error('File read error'));
      const response = await request(app).get('/api/platforms/p1');
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error getting platform: File read error');
    });
  });

  // Test POST to create a new platform
  describe('POST /api/platforms', () => {
    it('should create a new platform and return it', async () => {
      const newPlatformData = {
        platform_id: "p3", // Corrected: id to platform_id
        name: "Platform Three",
        description: "A new platform",
        metadata: { "releaseYear": 2023 }
      };
      const existingPlatforms = await readJsonFileAsync(PLATFORMS_FILE_PATH);

      const response = await request(app)
        .post('/api/platforms')
        .send(newPlatformData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Check returned data based on corrected router
      expect(response.body.data.platform_id).toBe("p3");
      expect(response.body.data.name).toBe(newPlatformData.name);
      expect(response.body.data.description).toBe(newPlatformData.description);
      expect(response.body.data.metadata).toEqual(newPlatformData.metadata);

      const expectedPlatformInFile = {
          // platform_id is part of the body and used as key, also stored in the object by the route
          platform_id: newPlatformData.platform_id,
          name: newPlatformData.name,
          description: newPlatformData.description,
          metadata: newPlatformData.metadata,
          // The route might also add an empty 'emulators' object by default or other fields
      };

      const writtenData = writeJsonFileAsync.mock.calls[0][1];
      // The route stores the whole newPlatformData as the value for the key newPlatformData.platform_id
      expect(writtenData[newPlatformData.platform_id]).toEqual(expect.objectContaining(expectedPlatformInFile));
      expect(writeJsonFileAsync).toHaveBeenCalledWith(PLATFORMS_FILE_PATH, expect.any(Object));
    });

    it('should return 400 if platform ID is missing', async () => {
      const newPlatformData = { name: "Test Platform", description: "Test Desc" }; // platform_id missing
      const response = await request(app)
        .post('/api/platforms')
        .send(newPlatformData);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors).toEqual(expect.arrayContaining(["platform_id is required"]));
    });

    it('should return 400 if platform data is incomplete (e.g. missing name)', async () => {
        const newPlatformData = { platform_id: "incompleteP", description: "Incomplete" }; // name missing
        const response = await request(app)
            .post('/api/platforms')
            .send(newPlatformData);
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid input');
        expect(response.body.errors).toEqual(expect.arrayContaining(["name is required"]));
    });

    it('should return 409 if platform ID already exists', async () => {
      const newPlatformData = { platform_id: "p1", name: "Another P1", description: "Duplicate ID test" }; // p1 exists
      const response = await request(app)
        .post('/api/platforms')
        .send(newPlatformData);
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform ID already exists');
    });

    it('should return 500 if there is an error writing to platforms file', async () => {
        writeJsonFileAsync.mockRejectedValue(new Error('File write error'));
        const newPlatformData = { platform_id: "pfail", name: "Fail Platform", description: "Will fail" };
        const response = await request(app)
            .post('/api/platforms')
            .send(newPlatformData);
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Error creating platform: File write error');
    });
  });

  // Test PUT to update an existing platform
  describe('PUT /api/platforms/:id', () => {
    it('should update an existing platform and return it', async () => {
      const existingPlatforms = await readJsonFileAsync(PLATFORMS_FILE_PATH); // From beforeEach

      const updatedPlatformData = {
        name: "Platform One Updated",
        description: "New Description",
        metadata: { "releaseYear": 2001, "developer": "NewDev" }
      };
      const response = await request(app)
        .put('/api/platforms/p1')
        .send(updatedPlatformData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Expect router to return the updated platform data
      expect(response.body.data).toEqual(expect.objectContaining({
        platform_id: "p1", // Original ID should be preserved by the route
        ...updatedPlatformData
      }));

      const expectedDataToWrite = { ...existingPlatforms };
      expectedDataToWrite.p1 = {
        ...existingPlatforms.p1,
        ...updatedPlatformData,
        platform_id: "p1" // Ensure platform_id is part of the written object
      };
      // Check that the written data for p1 matches the expected structure
      const writtenCall = writeJsonFileAsync.mock.calls[0][1];
      expect(writtenCall.p1).toEqual(expect.objectContaining(expectedDataToWrite.p1));
      expect(writeJsonFileAsync).toHaveBeenCalledWith(PLATFORMS_FILE_PATH, expect.any(Object));
    });

    it('should return 404 if platform to update is not found', async () => {
      const updatedData = { name: "Non Existent Updated", description: "test" };
      const response = await request(app)
        .put('/api/platforms/nonexistent')
        .send(updatedData);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform not found');
    });

    it('should return 400 if update data is incomplete (e.g. missing name)', async () => {
        const updatedPlatformData = { description: "Only description", metadata: {} }; // name missing
        const response = await request(app)
            .put('/api/platforms/p1')
            .send(updatedPlatformData);
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid input');
        expect(response.body.errors).toEqual(expect.arrayContaining(["name is required"]));
    });

    it('should return 500 if there is an error writing to platforms file during update', async () => {
        // readJsonFileAsync uses default mock from beforeEach
        writeJsonFileAsync.mockRejectedValue(new Error('File write error'));
        const updatedData = { name: "Update Fail Platform", description: "This update will fail" };
        const response = await request(app)
            .put('/api/platforms/p1')
            .send(updatedData);
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Error updating platform: File write error');
    });
  });

  // Test DELETE to remove a platform
  describe('DELETE /api/platforms/:id', () => {
    it('should delete a platform and return a success message', async () => {
      const existingPlatforms = await readJsonFileAsync(PLATFORMS_FILE_PATH); // From beforeEach

      const response = await request(app).delete('/api/platforms/p1');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Platform deleted successfully'); // Router now sends this

      const expectedDataToWrite = { ...existingPlatforms };
      delete expectedDataToWrite.p1; // p1 should be removed
      expect(writeJsonFileAsync).toHaveBeenCalledWith(PLATFORMS_FILE_PATH, expectedDataToWrite);
    });

    it('should return 404 if platform to delete is not found', async () => {
      // Relies on beforeEach mock where 'nonexistent' is not a key
      const response = await request(app).delete('/api/platforms/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform not found');
    });

    it('should return 500 if there is an error writing to platforms file during delete', async () => {
        // readJsonFileAsync uses default mock from beforeEach
        writeJsonFileAsync.mockRejectedValue(new Error('File write error'));
        const response = await request(app).delete('/api/platforms/p1');
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Error deleting platform: File write error');
    });
  });
});
