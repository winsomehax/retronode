// tests/native_mocks.test.js

// Attempt to mock 'fs' and specifically 'fs.promises.access'
jest.mock('fs', () => ({
    ...jest.requireActual('fs'), // Import and retain default behavior for other fs functions
    promises: {
        ...jest.requireActual('fs').promises,
        access: jest.fn().mockResolvedValue(undefined), // Mock fs.promises.access
    }
}));

// Attempt to mock 'child_process' and specifically 'spawn'
const mockSpawnInstance = {
  on: jest.fn().mockReturnThis(),
  stdout: { on: jest.fn().mockReturnThis(), pipe: jest.fn() },
  stderr: { on: jest.fn().mockReturnThis(), pipe: jest.fn() },
  unref: jest.fn(),
  kill: jest.fn()
};
const mockSpawn = jest.fn(() => mockSpawnInstance);
jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'), // Retain other child_process functions
  spawn: mockSpawn,
}));

// Import the mocked modules or their specific functions to ensure they are accessible
const fsPromises = require('fs').promises;
const { spawn } = require('child_process');

describe('Native Module Mocking Test', () => {
  beforeEach(() => {
    // Reset mocks before each test
    // fsPromises.access might be undefined if the mock setup for fs failed in a way that promises isn't properly assigned
    if (fsPromises && fsPromises.access && jest.isMockFunction(fsPromises.access)) {
        fsPromises.access.mockClear();
        fsPromises.access.mockResolvedValue(undefined); // Default to file exists / accessible
    } else {
        // This case indicates a problem with the fs mock itself, log for debugging
        // console.warn("fs.promises.access is not a mock function or fsPromises is undefined. Check fs mock setup.");
        // If fsPromises or fsPromises.access is undefined, we might need to re-initialize it here,
        // but ideally the top-level mock should handle this.
        // For now, we'll assume the mock structure holds.
    }

    mockSpawn.mockClear();
    // Clear calls for spawn instance methods
    mockSpawnInstance.on.mockClear();
    mockSpawnInstance.stdout.on.mockClear(); // Clear sub-mocks if they are jest.fn()
    mockSpawnInstance.stdout.pipe.mockClear();
    mockSpawnInstance.stderr.on.mockClear();
    mockSpawnInstance.stderr.pipe.mockClear();
    mockSpawnInstance.unref.mockClear();
    mockSpawnInstance.kill.mockClear();

  });

  test('should allow fs.promises.access to be called', async () => {
    expect.assertions(1); // Ensure the async test runs
    await fsPromises.access('/fake/path');
    expect(fsPromises.access).toHaveBeenCalledWith('/fake/path');
  });

  test('should allow child_process.spawn to be called', () => {
    spawn('ls', ['-lh']);
    expect(mockSpawn).toHaveBeenCalledWith('ls', ['-lh']);
  });

  test('should allow mocked spawn instance methods to be called', () => {
    const process = spawn('cat', ['file.txt']);
    process.on('exit', () => {});
    process.stdout.on('data', () => {});
    expect(mockSpawnInstance.on).toHaveBeenCalledWith('exit', expect.any(Function));
    expect(mockSpawnInstance.stdout.on).toHaveBeenCalledWith('data', expect.any(Function));
  });

  test('trivial test to ensure Jest runs the file', () => {
    expect(true).toBe(true);
  });
});
