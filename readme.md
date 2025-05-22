# retronode
Manage retro games and emulators. Done in NodeJS and HTML/JS/CSS and using Github code pilot. An experiement really, but happy to let other people get involved if they wish. 

Microsoft's Visual Studio Github Copilot is free/open source now - and it's an amazing experience.

There is some test data in there including a scan of a c64 rom folder. You can use the edit icon to fill out the data for each one. It will also pull data from igdb, but you need to get a token and store it in a .env file. As test it will also query GitHub Models GPT4.1 model to get a description.

example .env file

GITHUB_PAT_TOKEN=""

TWITCH_CLIENT_ID=""

TWITCH_SECRET=""

Stuff like EmulationStation is great, but it's written in C++ and very complex. I wanted to see if it was possible to knock something up in NodeJS that was simple to maintain.