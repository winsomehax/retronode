/**
 * API utility functions for RetroNode
 * Handles all external API calls with proper error handling
 */
const axios = require('axios');

/**
 * Call the GitHub Models API for ROM identification
 * @param {string} platformName - Platform name
 * @param {Array<string>} romNames - Array of ROM filenames
 * @returns {Promise<Object>} - Identified ROM data
 */
async function callGithubModelsApi(platformName, romNames) {
  const token = process.env.GITHUB_PAT_TOKEN;
  
  if (!token) {
    throw new Error('GitHub PAT token is not configured');
  }
  
  // Build the prompt
  let promptText = `You are the world's leading expert in identifying the name of a retro game from just the platform and rom name.
Below is a list of rom names. YOU MUST RETURN ONLY JSON.
The JSON should contain the full name of the game, a short description of the game, and a field called "success"
which is true or false denoting whether you succeeded in identifying that rom.
`;
  
  // Add each ROM to the prompt
  romNames.forEach(romName => {
    promptText += `PLATFORM: ${platformName}\nROM: ${romName}\n`;
  });
  
  try {
    // Call GitHub Models API
    const response = await fetch("https://models.github.ai/inference/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1",
        messages: [
          { role: "system", content: "You are an expert on retro games who can identify games from filenames." },
          { role: "user", content: promptText }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API Error:`, errorText);
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const responseText = data.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      // Extract JSON from the response (in case there's any extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      console.log("Raw response:", responseText);
      
      // Fallback: create basic data for each ROM
      return createFallbackRomData(platformName, romNames);
    }
  } catch (error) {
    console.error("Error calling GitHub Models API:", error);
    // Fallback: create basic data for each ROM
    return createFallbackRomData(platformName, romNames);
  }
}

/**
 * Call the Gemini API for ROM identification
 * @param {string} platformName - Platform name
 * @param {Array<string>} romNames - Array of ROM filenames
 * @returns {Promise<Array>} - Array of identified ROM data
 */
async function callGeminiApi(platformName, romNames) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }
  
  // Process ROMs in batches since Gemini might have different batch size requirements
  const results = [];
  
  for (const romName of romNames) {
    try {
      // Build the prompt for Gemini
      const promptText = `You are the world's leading expert in identifying retro games.
I have a file named "${romName}" for the ${platformName} platform.
Please identify this game and provide the following information in JSON format:
- The proper title of the game
- A short description (1-2 sentences)
- Whether you're confident in your identification (true/false)

Return ONLY valid JSON with the following structure:
{
  "name": "Game Title",
  "description": "Short description of the game",
  "success": true
}`;
      
      // Call Gemini API
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: promptText }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 400,
          }
        }
      );
      
      const responseText = response.data.candidates[0].content.parts[0].text;
      
      // Try to parse the JSON response
      try {
        // Extract JSON from the response (in case there's any extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const gameData = JSON.parse(jsonMatch[0]);
          results.push({
            filename: romName,
            ...gameData
          });
        } else {
          throw new Error("No JSON found in Gemini response");
        }
      } catch (parseError) {
        console.error("Error parsing Gemini JSON response:", parseError);
        
        // Fallback for this ROM
        results.push(createFallbackRomItem(platformName, romName));
      }
    } catch (error) {
      console.error(`Error identifying ROM ${romName} with Gemini:`, error);
      
      // Fallback for this ROM
      results.push(createFallbackRomItem(platformName, romName));
    }
  }
  
  return results;
}

/**
 * Create fallback data for a single ROM
 * @param {string} platformName - Platform name
 * @param {string} romName - ROM filename
 * @returns {Object} - Basic ROM data
 */
function createFallbackRomItem(platformName, romName) {
  return {
    filename: romName,
    name: romName.replace(/\.\w+$/, '').replace(/[_\-\.]+/g, ' '),
    description: `A ${platformName} game.`,
    success: false
  };
}

/**
 * Create fallback data for multiple ROMs
 * @param {string} platformName - Platform name
 * @param {Array<string>} romNames - Array of ROM filenames
 * @returns {Array<Object>} - Array of basic ROM data
 */
function createFallbackRomData(platformName, romNames) {
  return romNames.map(romName => createFallbackRomItem(platformName, romName));
}

module.exports = {
  callGithubModelsApi,
  callGeminiApi,
  createFallbackRomData,
  createFallbackRomItem
};