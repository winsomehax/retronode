document.addEventListener('DOMContentLoaded', () => {
    const gameTitleInput = document.getElementById('gameTitle');
    const searchGeminiBtn = document.getElementById('searchGeminiBtn');
    const gameDescriptionTextarea = document.getElementById('gameDescription');
    const gameCoverUrlInput = document.getElementById('gameCoverUrl'); // Added for cover URL
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    const searchTheGamesDBBtn = document.getElementById('searchTheGamesDBBtn');
    const theGamesDbResultsContainer = document.getElementById('theGamesDbResultsContainer');
    const theGamesDbResultsDiv = document.getElementById('theGamesDbResults');

    if (searchGeminiBtn) {
        searchGeminiBtn.addEventListener('click', async () => {
            const title = gameTitleInput.value.trim();
            if (!title) {
                alert('Please enter a game title first.');
                return;
            }

            loadingMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            gameDescriptionTextarea.value = ''; // Clear previous description
            // gameCoverUrlInput.value = ''; // Optionally clear cover URL if Gemini might affect it

            try {
                const response = await fetch('/api/search-game-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: title }),
                });

                loadingMessage.style.display = 'none';

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                gameDescriptionTextarea.value = data.description;

            } catch (error) {
                console.error('Error fetching game info:', error);
                loadingMessage.style.display = 'none';
                errorMessage.textContent = `Error: ${error.message}`;
                errorMessage.style.display = 'block';
            }
        });
    }

    if (searchTheGamesDBBtn) {
        searchTheGamesDBBtn.addEventListener('click', async () => {
            const title = gameTitleInput.value.trim();
            if (!title) {
                alert('Please enter a game title to search TheGamesDB.');
                return;
            }

            loadingMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            theGamesDbResultsContainer.style.display = 'none';
            theGamesDbResultsDiv.innerHTML = '';

            try {
                const response = await fetch(`/api/thegamesdb/search?name=${encodeURIComponent(title)}`);
                loadingMessage.style.display = 'none';

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success && data.results && data.results.length > 0) {
                    theGamesDbResultsContainer.style.display = 'block';
                    data.results.forEach((game, index) => {
                        const gameDiv = document.createElement('div');
                        gameDiv.style.borderBottom = '1px solid #eee';
                        gameDiv.style.padding = '10px 0';
                        gameDiv.innerHTML = `
                            <p><strong>Title:</strong> ${game.game_title}</p>
                            <p><strong>Platform:</strong> ${game.platform_name || game.platform || 'N/A'}</p>
                            <p><strong>Release Date:</strong> ${game.release_date || 'N/A'}</p>
                            <p><strong>Overview:</strong> ${game.overview ? (game.overview.substring(0, 150) + '...') : 'No overview.'}</p>
                            ${game.boxart_thumb_url ? `<img src="${game.boxart_thumb_url}" alt="Cover for ${game.game_title}" style="max-width: 100px; margin-top: 5px;">` : ''}
                            <button data-index="${index}" class="import-tgdb-btn" style="margin-top: 5px;">Import this</button>
                        `;
                        theGamesDbResultsDiv.appendChild(gameDiv);
                    });

                    document.querySelectorAll('.import-tgdb-btn').forEach(button => {
                        button.addEventListener('click', function() {
                            const index = parseInt(this.getAttribute('data-index'));
                            const selectedGame = data.results[index];

                            gameTitleInput.value = selectedGame.game_title || '';
                            gameDescriptionTextarea.value = selectedGame.overview || '';
                            if (gameCoverUrlInput) { // Check if the element exists
                                gameCoverUrlInput.value = selectedGame.boxart_large_url || selectedGame.boxart_thumb_url || '';
                            }

                            theGamesDbResultsContainer.style.display = 'none'; // Hide results after import
                            theGamesDbResultsDiv.innerHTML = '';
                        });
                    });

                } else {
                    theGamesDbResultsContainer.style.display = 'block';
                    theGamesDbResultsDiv.innerHTML = '<p>No results found on TheGamesDB.</p>';
                }

            } catch (error) {
                console.error('Error fetching from TheGamesDB:', error);
                loadingMessage.style.display = 'none';
                errorMessage.textContent = `Error: ${error.message}`;
                errorMessage.style.display = 'block';
                theGamesDbResultsContainer.style.display = 'none';
            }
        });
    }

});