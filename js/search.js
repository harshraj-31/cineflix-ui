/**
 * @module SearchManager
 * @description Powers the search overlay (#search-overlay / #search-root).
 * Styling for this module lives in the "Search Overlay" section of navbar.css.
 *
 * NOTE: the search box (input + close button) is built ONCE per open() call and
 * never re-created while typing. Only #search-results is replaced on each
 * keystroke. Rebuilding the whole overlay (including the <input>) on every
 * debounced render was destroying and recreating the input element each time,
 * which silently stole focus after every pause.
 *
 * What changed in this revision:
 *  - Searches cast, director, genre and year, not just titles (MovieDB.searchMovies).
 *  - Shows a live result count, announced to screen readers.
 *  - Non-title matches say why they matched ("cast: Eva Sterling").
 *  - Enter opens the top result.
 *  - Empty state offers genre shortcuts instead of a blank screen.
 *  - Uses the shared scroll lock so it can't unlock the page behind an open modal.
 */
const SearchManager = (() => {
    const overlay = $('#search-overlay');
    const container = $('#search-root');
    let lastFocusedElement = null;
    let releaseFocusTrap = () => {};
    let currentResults = [];

    /**
     * Renders the "nothing typed yet" state: quick genre shortcuts.
     * @private
     * @param {HTMLElement} resultsEl
     */
    const _renderSuggestions = (resultsEl) => {
        const genres = MovieDB.getAllGenres();
        resultsEl.appendChild(fragmentFromHTML(`
            <div class="search-suggestions">
                <p class="search-hint">Try a title, an actor, a director, or a genre.</p>
                <div class="genre-filter" role="group" aria-label="Search by genre">
                    ${genres.map((g) => `<button type="button" class="genre-chip" data-search-term="${escapeHTML(g)}">${escapeHTML(g)}</button>`).join('')}
                </div>
            </div>
        `));
    };

    /**
     * @private
     * @param {string} query
     */
    const _renderResults = (query) => {
        const resultsEl = $('#search-results', container);
        const statusEl = $('#search-status', container);
        if (!resultsEl) return;

        const trimmed = query.trim();
        currentResults = trimmed ? MovieDB.searchMovies(trimmed) : [];

        resultsEl.innerHTML = '';

        if (!trimmed) {
            if (statusEl) statusEl.textContent = '';
            _renderSuggestions(resultsEl);
            return;
        }

        if (currentResults.length === 0) {
            if (statusEl) statusEl.textContent = `No results for “${trimmed}”`;
            resultsEl.appendChild(UIManager.createEmptyState(
                'search',
                `No matches for “${trimmed}”`,
                'Check the spelling, or try an actor, director, or genre instead.',
            ));
            return;
        }

        if (statusEl) {
            statusEl.textContent = `${currentResults.length} ${currentResults.length === 1 ? 'result' : 'results'} for “${trimmed}” — press Enter to open the top one`;
        }

        const grid = createElement('div', { className: 'movie-grid' });
        currentResults.forEach(({ movie, matchedOn }) => {
            const card = UIManager.createMovieCard(movie);
            if (!card) return;

            if (matchedOn && matchedOn !== 'title') {
                const content = $('.movie-content', card);
                content?.appendChild(createElement('p', { className: 'match-reason' }, matchedOn));
            }
            grid.appendChild(card);
        });
        resultsEl.appendChild(grid);
    };

    /**
     * Builds the static shell (input + close button + results container) once.
     * @private
     */
    const _renderShell = () => {
        container.innerHTML = '';
        container.appendChild(fragmentFromHTML(`
            <div class="search-box" role="search">
                <i class="bi bi-search" aria-hidden="true"></i>
                <label for="search-input" class="sr-only">Search movies</label>
                <input type="search" id="search-input" placeholder="Titles, people, genres..."
                       autocomplete="off" spellcheck="false" enterkeyhint="search"
                       aria-describedby="search-status" aria-controls="search-results">
                <button type="button" id="search-close-btn" aria-label="Close search">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <p id="search-status" class="result-count" aria-live="polite"></p>
            <div id="search-results"></div>
        `));

        const input = $('#search-input', container);
        input.addEventListener('input', debounce((e) => _renderResults(e.target.value), 200));

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Run the search immediately rather than waiting on the debounce,
                // so a fast "type + Enter" still opens the right movie.
                _renderResults(input.value);
                const top = currentResults[0];
                if (top && window.ModalManager) ModalManager.open(top.movie.id);
            }
        });

        $('#search-close-btn', container).addEventListener('click', close);

        // Genre shortcut chips fill the box and search immediately. Bound to
        // #search-results (re-created with the shell) rather than the
        // persistent container, so repeated opens don't stack listeners.
        $('#search-results', container).addEventListener('click', (e) => {
            const chip = e.target.closest('[data-search-term]');
            if (!chip) return;
            input.value = chip.dataset.searchTerm;
            _renderResults(input.value);
            input.focus();
        });
    };

    /**
     * @returns {boolean} Whether the overlay is currently showing.
     */
    const isOpen = () => Boolean(overlay && !overlay.hidden);

    /**
     * Opens the search overlay and focuses the input.
     */
    const open = () => {
        if (!overlay || isOpen()) return;
        lastFocusedElement = document.activeElement;
        overlay.hidden = false;
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Search');
        _renderShell();
        _renderResults('');
        lockScroll();
        releaseFocusTrap = trapFocus(overlay);
        setTimeout(() => $('#search-input', container)?.focus(), 50);
    };

    /**
     * Closes the search overlay.
     */
    const close = () => {
        if (!isOpen()) return;
        overlay.hidden = true;
        releaseFocusTrap();
        unlockScroll();
        lastFocusedElement?.focus?.();
    };

    /**
     * Wires up the navbar search button and keyboard shortcuts.
     */
    const init = () => {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#search-btn')) open();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) {
                close();
                return;
            }

            // "/" opens search from anywhere (a common streaming-site shortcut),
            // unless the user is already typing in a field.
            const typing = e.target.closest?.('input, textarea, select, [contenteditable="true"]');
            if (e.key === '/' && !typing && !isOpen() && !$('#modal-root.active')) {
                e.preventDefault();
                open();
            }
        });
    };

    return { init, open, close, isOpen };
})();
window.SearchManager = SearchManager;
