# RetroNode

A retro game launcher and management system built with Node.js and Express.

## Features

- Manage your retro game collection
- Configure multiple emulators for each platform
- Launch games with your preferred emulator
- Scan folders for ROM files
- Identify ROMs using AI (GitHub Models or Google Gemini)
- Clean and responsive UI

## Security Improvements

- Secure command execution to prevent command injection
- Path validation to prevent path traversal attacks
- Input validation for all API endpoints
- Server-side API key handling
- Asynchronous file operations

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/retronode.git
   cd retronode
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the example environment file and edit it with your settings:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your API keys and configuration.

5. Start the server:
   ```
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Environment Variables

- `PORT`: The port to run the server on (default: 3000)
- `ROMS_BASE_PATH`: Base path for ROM files (for security validation)
- `GITHUB_PAT_TOKEN`: GitHub Personal Access Token for GitHub Models API
- `GEMINI_API_KEY`: Google Gemini API Key for ROM identification
- `THEGAMESDB_API_KEY`: TheGamesDB API Key for game metadata

## API Endpoints

### Games

- `GET /api/games`: Get all games
- `GET /api/games/:id`: Get a specific game
- `POST /api/games`: Create a new game
- `PUT /api/games/:id`: Update a game
- `DELETE /api/games/:id`: Delete a game

### Platforms

- `GET /api/platforms`: Get all platforms
- `GET /api/platforms/:id`: Get a specific platform
- `POST /api/platforms`: Create a new platform
- `PUT /api/platforms/:id`: Update a platform
- `DELETE /api/platforms/:id`: Delete a platform

### Emulators

- `GET /api/emulators/:platformId`: Get emulators for a platform
- `POST /api/emulators/:platformId`: Add an emulator to a platform
- `PUT /api/emulators/:platformId/:emulatorId`: Update an emulator
- `DELETE /api/emulators/:platformId/:emulatorId`: Delete an emulator

### Launcher

- `POST /api/launch-game`: Launch a game with an emulator

### Scanner

- `POST /api/scan-folder`: Scan a folder for ROM files
- `POST /api/identify-roms`: Identify ROMs using AI

## License

MIT