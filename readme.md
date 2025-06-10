# retronode
Manage retro games and emulators. Done in NodeJS and HTML/JS/CSS and using Github code pilot/Gemini Code Assist/Amazon's Q. An experiment more than anything . It's been an afternoon's work. Happy to let other people get involved if they wish. 

Microsoft's Visual Studio Github Copilot is free/open source now - and it's an amazing experience. Sadly Microsoft put a 50 chat per month limit on it unless you pay for copilot pro. So I've switched to Gemini Code Assist - which is also impressive, but as yet lacks "agent" mode. Amazon Q is very impressive and functions in agent mode.


Stuff like EmulationStation is great, but it's written in C++ and very complex. I wanted to see if it was possible to knock something up in NodeJS that was simple to maintain.

There is some test data in there including a scan of a c64 rom folder in games.json. You can use the edit icon to fill out the data for each one. It will also pull data from TheGamesDB, Gemini and Github Models, but you need to get a token and store it in a .env file. As a test it will also query GitHub Models GPT4.1 model to get a description.

example .env file

GITHUB_PAT_TOKEN=

THEGAMESDB_API_KEY=

GEMINI_API_KEY=


You can get free API keys for these (they do have some limits, but they are entirely sensible). 

1. Get a GITHUB models API key (currently using GPT4.1) https://docs.github.com/en/github-models 
2. Get a Google Gemini API key for Gemini 2.0 flash (fast and free) https://ai.google.dev/gemini-api/docs
3. Get a key for TheGamesDB. You have to request one and give them some info. https://thegamesdb.net/

TheGamesDB is an actual database of games and retrogames. Gemini and Github Models are AI LLMs - not databases.