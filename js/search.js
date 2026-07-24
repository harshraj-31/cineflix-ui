/**
 * @module SearchManager
 * @description Powers the search overlay (#search-overlay / #search-root).
 * Styling for this module lives in the "Search Overlay" section appended to navbar.css.
 */
const SearchManager = (() => {
    const overlay = $('#search-overlay');
    const container = $('#search-root');

    /**
     * @private
     * @param {string} [query='']
     */
    const _render = (query = '') => {
        const trimmed = query.trim();
        const results = trimmed
            ? MovieDB.getAllMovies().filter((m) => m.title.toLowerCase().includes(trimmed.toLowerCase()))
            : [];

        container.innerHTML = '';
        container.appendChild(fragmentFromHTML(`
            <div class="search-box">
                <i class="bi bi-search"></i>
                <input type="text" id="search-input" placeholder="Search for a movie..." autocomplete="off" value="${trimmed}">
                <button id="search-close-btn" aria-label="Close search">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div id="search-results"></div>
        `));

        const resultsEl = $('#search-results', container);

        if (trimmed && results.length === 0) {
            resultsEl.appendChild(createElement('p', { className: 'empty-list-message' }, `No movies found for "${trimmed}"`));
        } else if (results.length > 0) {
            const grid = createElement('div', { className: 'movie-grid' });
            results.forEach((movie) => {
                const card = UIManager.createMovieCard(movie);
                if (card) grid.appendChild(card);
            });
            resultsEl.appendChild(grid);
        }

        $('#search-input', container).addEventListener('input', debounce((e) => _render(e.target.value), 250));
        $('#search-close-btn', container).addEventListener('click', close);
    };

    /**
     * Opens the search overlay and focuses the input.
     */
    const open = () => {
        if (!overlay) return;
        overlay.hidden = false;
        _render();
        document.body.style.overflow = 'hidden';
        setTimeout(() => $('#search-input', container)?.focus(), 50);
    };

    /**
     * Closes the search overlay.
     */
    const close = () => {
        if (!overlay) return;
        overlay.hidden = true;
        document.body.style.overflow = '';
    };

    /**
     * Wires up the navbar search button and the Escape key.
     */
    const init = () => {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#search-btn')) open();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay && !overlay.hidden) close();
        });
    };

    return { init, open, close };
})();
window.SearchManager = SearchManager;
