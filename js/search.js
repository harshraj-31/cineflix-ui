/**
 * @module SearchManager
 * @description Powers the search overlay (#search-overlay / #search-root).
 * Styling for this module lives in the "Search Overlay" section appended to navbar.css.
 *
 * NOTE: the search box (input + close button) is built ONCE per open() call and
 * never re-created while typing. Only #search-results is replaced on each
 * keystroke. Rebuilding the whole overlay (including the <input>) on every
 * debounced render was destroying and recreating the input element each time,
 * which silently stole focus after every pause - so results appeared but the
 * field itself stopped accepting further keystrokes without a re-click.
 */
const SearchManager = (() => {
    const overlay = $('#search-overlay');
    const container = $('#search-root');

    /**
     * @private
     * @param {string} query
     */
    const _renderResults = (query) => {
        const resultsEl = $('#search-results', container);
        if (!resultsEl) return;

        const trimmed = query.trim();
        const results = trimmed
            ? MovieDB.getAllMovies().filter((m) => m.title.toLowerCase().includes(trimmed.toLowerCase()))
            : [];

        resultsEl.innerHTML = '';

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
    };

    /**
     * Builds the static shell (input + close button + results container) once.
     * @private
     */
    const _renderShell = () => {
        container.innerHTML = '';
        container.appendChild(fragmentFromHTML(`
            <div class="search-box">
                <i class="bi bi-search"></i>
                <input type="text" id="search-input" placeholder="Search for a movie..." autocomplete="off">
                <button id="search-close-btn" aria-label="Close search">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div id="search-results"></div>
        `));

        $('#search-input', container).addEventListener('input', debounce((e) => _renderResults(e.target.value), 250));
        $('#search-close-btn', container).addEventListener('click', close);
    };

    /**
     * Opens the search overlay and focuses the input.
     */
    const open = () => {
        if (!overlay) return;
        overlay.hidden = false;
        _renderShell();
        _renderResults('');
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
