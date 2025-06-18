// tests/securityUtils.test.js
const {
  sanitizePath,
  parseEmulatorCommand,
  validateInput
  // safeExecuteCommand is intentionally not imported or tested
} = require('../utils/securityUtils');
const path = require('path'); // For constructing test paths

describe('securityUtils.js', () => {

  describe('sanitizePath', () => {
    // Define basePath relative to a hypothetical root to ensure consistency
    // For testing, we can assume a root like '/' on POSIX or 'C:\' on Windows.
    // path.resolve will handle this.
    const hypotheticalRoot = path.resolve('/');
    const basePath = path.join(hypotheticalRoot, 'user', 'app', 'data');

    it('should return the resolved path if it is within the base path', () => {
      const userPath = 'roms/nes';
      const fullUserPath = path.join(basePath, userPath)
      const expectedPath = path.resolve(fullUserPath);
      expect(sanitizePath(basePath, fullUserPath)).toBe(expectedPath);
    });

    it('should return the resolved path for a direct child', () => {
      const userPath = 'file.txt';
      const fullUserPath = path.join(basePath, userPath);
      const expectedPath = path.resolve(fullUserPath);
      expect(sanitizePath(basePath, fullUserPath)).toBe(expectedPath);
    });

    it('should return null for paths attempting traversal upwards', () => {
      // Construct paths that try to go above basePath
      const traversalPath1 = path.join(basePath, '..', '..', 'secrets'); // e.g. /user/secrets
      const traversalPath2 = path.join(basePath, '..'); // e.g. /user/app
      expect(sanitizePath(basePath, traversalPath1)).toBeNull();
      expect(sanitizePath(basePath, traversalPath2)).toBeNull();
    });

    it('should return null for completely different absolute paths', () => {
      const differentPath = path.join(hypotheticalRoot, 'etc', 'passwd');
      expect(sanitizePath(basePath, differentPath)).toBeNull();
    });

    it('should handle already resolved paths correctly', () => {
      const validUserPath = path.resolve(basePath, 'roms', 'snes', 'game.smc');
      expect(sanitizePath(basePath, validUserPath)).toBe(validUserPath);

      const invalidUserPath = path.resolve(hypotheticalRoot, 'elsewhere', 'data', 'file.txt');
      expect(sanitizePath(basePath, invalidUserPath)).toBeNull();
    });

    it('should allow path that is identical to basePath', () => {
        expect(sanitizePath(basePath, basePath)).toBe(path.resolve(basePath));
    });

    it('should allow paths that are deeper within the basePath', () => {
      const userPath = path.join('some', 'very', 'deep', 'path', 'to', 'a', 'file.zip');
      const fullUserPath = path.join(basePath, userPath);
      const expectedPath = path.resolve(fullUserPath);
      expect(sanitizePath(basePath, fullUserPath)).toBe(expectedPath);
    });
  });

  describe('parseEmulatorCommand', () => {
    it('should replace %ROM% and split command and args', () => {
      const emulatorCommand = '/usr/bin/retroarch -L core.so %ROM%';
      const romPath = '/path/to/game.nes';
      const result = parseEmulatorCommand(emulatorCommand, romPath);
      expect(result).toEqual({
        command: '/usr/bin/retroarch',
        args: ['-L', 'core.so', romPath],
      });
    });

    it('should handle commands with no arguments other than ROM path', () => {
      const emulatorCommand = 'mame %ROM%';
      const romPath = 'pacman.zip';
      const result = parseEmulatorCommand(emulatorCommand, romPath);
      expect(result).toEqual({
        command: 'mame',
        args: [romPath],
      });
    });

    it('should handle %ROM% placeholder with different casing', () => {
      const emulatorCommand = 'emulator %rom%';
      const romPath = 'game.gen';
      const result = parseEmulatorCommand(emulatorCommand, romPath);
      expect(result).toEqual({ command: 'emulator', args: [romPath] });
    });

    it('should handle paths with spaces in the ROM path (naive split)', () => {
      const emulatorCommand = 'retroarch %ROM%';
      const romPath = '/mnt/roms/Super Mario World.smc';
      const result = parseEmulatorCommand(emulatorCommand, romPath);
      // Current naive split behavior
      expect(result).toEqual({
        command: 'retroarch',
        args: ['/mnt/roms/Super', 'Mario', 'World.smc'],
      });
    });

    it('should handle emulator command where executable path has spaces (naive split)', () => {
        const emulatorCommand = '"/path with spaces/emulator" --fullscreen %ROM%';
        const romPath = "rom.iso";
        const result = parseEmulatorCommand(emulatorCommand, romPath);
        // Current naive split behavior
        expect(result).toEqual({
            command: '"/path',
            args: ['with', 'spaces/emulator"', '--fullscreen', romPath]
        });
    });
  });

  describe('validateInput', () => {
    const schema = {
      name: { required: true, type: 'string', minLength: 3 },
      age: { required: false, type: 'number' },
      hobbies: { required: true, type: 'object', isArray: true, minLength: 1 }, // 'object' for array type is typical in some validators
      address: { required: false, type: 'string' }
    };

    it('should return isValid: true for valid input', () => {
      const input = { name: 'John Doe', age: 30, hobbies: ['reading', 'hiking'] };
      const result = validateInput(input, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors for missing required fields', () => {
      const input = { age: 25 }; // name and hobbies are missing
      const result = validateInput(input, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name is required');
      expect(result.errors).toContain('hobbies is required');
    });

    it('should return errors for incorrect types', () => {
      const input = { name: 123, age: 'thirty', hobbies: ['coding'] };
      const result = validateInput(input, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name must be a string');
      expect(result.errors).toContain('age must be a number');
    });

    it('should return errors for minLength not met', () => {
      const input = { name: 'Jo', hobbies: [] }; // name too short, hobbies empty
      const result = validateInput(input, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name must have a minimum length of 3');
      expect(result.errors).toContain('hobbies must have a minimum length of 1');
    });

    it('should return error if isArray is true but field is not an array', () => {
      const input = { name: 'Valid Name', hobbies: 'not an array' };
      const result = validateInput(input, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('hobbies must be an array');
    });

    it('should handle optional fields being absent', () => {
      const input = { name: 'Jane Doe', hobbies: ['swimming'] }; // age and address are absent
      const result = validateInput(input, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle null or undefined values for non-required fields', () => {
        const input = { name: 'Test User', age: null, hobbies: ['testing'], address: undefined };
        const result = validateInput(input, schema);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('should correctly report multiple errors', () => {
      const input = { name: 'Al', age: 'twenty', hobbies: 'skiing' }; // Multiple issues
      const result = validateInput(input, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([
        'name must have a minimum length of 3',
        'age must be a number',
        'hobbies must be an array'
      ]));
      // Check length if all errors are expected
      expect(result.errors.length).toBe(3);
    });
  });
});
