# RetroNode

A comprehensive management system for retro gaming, allowing users to organize their game collections across multiple platforms and emulators.

## Setup

### API Keys

RetroNode uses external APIs that require API keys:

1. **TheGamesDB API Key**:
   - Sign up at https://thegamesdb.net/
   - Get your API key from your account page

2. **Gemini API Key**:
   - Sign up for Google AI Studio at https://makersuite.google.com/
   - Create an API key

### Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your API keys:
   ```
   THEGAMESDB_API_KEY=your_thegamesdb_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Running the Application

Start the server:
```bash
node server.js
```

Then open http://localhost:3000 in your browser.

## Features

- **Game Management**: Catalog games with cover images, descriptions, and platform associations
- **Platform Management**: Organize gaming platforms with manufacturer and release information
- **Emulator Configuration**: Configure emulators for each platform with command-line arguments
- **External API Integration**: Import game data from TheGamesDB and generate descriptions with Gemini AI
- **Responsive UI**: Clean, dark-themed interface that works on various screen sizes

## Technology Stack

- **Backend**: Node.js with native HTTP module
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Data Storage**: JSON files for persistence
- **External APIs**: TheGamesDB for game metadata, Gemini AI for content generation