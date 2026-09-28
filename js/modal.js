/**
 * @module ModalManager
 * @description Builds and controls the movie detail modal (#modal-root).
 * Matches the markup expected by modal.css: .modal-overlay, .movie-modal,
 * .modal-banner, .modal-close, .modal-body, .modal-header, .modal-poster,
 * .modal-info, .modal-meta, .modal-description, .modal-actions, .modal-section,
 * .cast-list/.cast-chip, .genre-list/.genre-pill, .similar-grid.
 *
 * What changed in this revision:
 *  - Play button works (it had no handler - see data-action="play").
 *  - Keyboard focus is trapped inside the dialog while it's open.
 *  - Uses the shared scroll lock, so search + modal can't fight over it.
 *  - Closing a modal opened from a shared link goes Home instead of calling
 *    history.back(), which could navigate the visitor off the site.
 *  - Shows director, writers, awards and box office (already in the data).
 *  - "More Like This" ranks by genre overlap instead of catalog order.
 */
const ModalManager = (() => {
    const root = $('#modal-root');
    let lastFocusedElement = null;
    let releaseFocusTrap = () => {};

    /**
     * @private
     * @param {object} movie
     * @returns {DocumentFragment}
     */
    const _buildContent = (movie) => {
        const favorite = StorageManager.isFavorite(movie.id);
        const title = escapeHTML(movie.title);
        const id = escapeHTML(movie.id);
        const headingId = `modal-title-${id}`;

        const details = [
            ['Director', movie.director],
            ['Writers', (movie.writers || []).join(', ')],
            ['Awards', movie.awards],
            ['Box office', movie.boxOffice],
            ['Ratings', movie.imdbVotes ? `${movie.imdbVotes} votes` : ''],
        ].filter(([, value]) => value);

        const html = `
            <div class="modal-overlay"></div>
            <div class="movie-modal" role="dialog" aria-modal="true" aria-labelledby="${headingId}" data-movie-id="${id}">
                <div class="modal-banner">
                    <img src="${escapeHTML(movie.heroImage)}" alt="" width="1920" height="815" decoding="async" data-art-variant="hero">
                </div>
                <button class="modal-close" aria-label="Close">
                    <i class="bi bi-x-lg"></i>
                </button>
                <div class="modal-body">
                    <div class="modal-header">
                        <div class="modal-poster">
                            <img src="${escapeHTML(movie.poster)}" alt="${title} poster" width="500" height="750" decoding="async" data-art-variant="poster">
                        </div>
                        <div class="modal-info">
                            <h2 id="${headingId}">${title}</h2>
                            <div class="modal-meta">
                                <span><i class="bi bi-star-fill"></i> ${movie.imdbRating.toFixed(1)}</span>
                                <span>${movie.year}</span>
                                <span>${escapeHTML(movie.rated)}</span>
                                <span>${escapeHTML(formatRuntime(movie.runtime))}</span>
                            </div>
                            <p class="modal-description">${escapeHTML(movie.plot)}</p>
                            <div class="modal-actions">
                                <button class="btn btn-primary" data-action="play" data-movie-id="${id}">
                                    <i class="bi bi-play-fill"></i> Play
                                </button>
                                <button class="btn btn-secondary favorite-btn" data-action="favorite" data-movie-id="${id}" aria-pressed="${favorite}">
                                    <i class="bi ${favorite ? 'bi-check-circle-fill' : 'bi-plus-circle'}"></i> My List
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-section">
                        <h3>Cast</h3>
                        <div class="cast-list">
                            ${movie.actors.map((actor) => `<span class="cast-chip">${escapeHTML(actor)}</span>`).join('')}
                        </div>
                    </div>
                    <div class="modal-section">
                        <h3>Genres</h3>
                        <div class="genre-list">
                            ${movie.genres.map((genre) => `<a class="genre-pill" href="/browse/${encodeURIComponent(genre)}" data-navigo>${escapeHTML(genre)}</a>`).join('')}
                        </div>
                    </div>
                    ${details.length ? `
                    <div class="modal-section">
                        <h3>Details</h3>
                        <dl class="modal-details">
                            ${details.map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`).join('')}
                        </dl>
                    </div>` : ''}
                    <div class="modal-section">
                        <h3>More Like This</h3>
                        <div class="similar-grid" id="similar-grid"></div>
                    </div>
                </div>
            </div>
        `;

        return fragmentFromHTML(html);
    };

    /**
     * Fills "More Like This", ranked by how many genres each title shares
     * with the current one (then by rating). The old version just took the
     * first six matches in catalog order, so the same few titles showed up
     * under almost every movie.
     * @private
     * @param {object} movie
     */
    const _populateSimilar = (movie) => {
        const container = $('#similar-grid', root);
        if (!container) return;

        const target = new Set(movie.genres.map((g) => g.toLowerCase()));

        const ranked = MovieDB.getAllMovies()
            .filter((m) => m.id !== movie.id)
            .map((m) => ({
                movie: m,
                overlap: m.genres.filter((g) => target.has(g.toLowerCase())).length,
            }))
            .filter((entry) => entry.overlap > 0)
            .sort((a, b) => b.overlap - a.overlap || b.movie.imdbRating - a.movie.imdbRating)
            .slice(0, 6);

        ranked.forEach(({ movie: m }) => {
            const card = UIManager.createMovieCard(m);
            if (card) container.appendChild(card);
        });
    };

    /** @returns {boolean} */
    const isOpen = () => Boolean(root?.classList.contains('active'));

    /**
     * Opens the modal for a given movie ID.
     * @param {string} movieId
     * @param {object} [options]
     * @param {boolean} [options.updateUrl=true] - Push /movie/:id onto the URL so
     *   the detail view is shareable/bookmarkable. Pass false when the router
     *   is opening the modal *because* the URL already points here (deep link
     *   or a browser back/forward navigation), to avoid pushing a duplicate
     *   history entry.
     */
    const open = (movieId, { updateUrl = true } = {}) => {
        const movie = MovieDB.getMovieById(movieId);
        if (!movie || !root) return;

        const wasOpen = isOpen();
        StorageManager.addRecentlyViewed(movieId);

        // Switching movies from inside the modal ("More Like This") must not
        // overwrite the element that originally opened it - that element lives
        // outside the modal and is where focus should return on close.
        if (!wasOpen) lastFocusedElement = document.activeElement;

        releaseFocusTrap();
        root.innerHTML = '';
        root.appendChild(_buildContent(movie));
        _populateSimilar(movie);

        root.classList.add('active');
        if (!wasOpen) lockScroll();

        $('.movie-modal', root)?.scrollTo?.(0, 0);
        $('.modal-close', root)?.addEventListener('click', () => close());
        $('.modal-overlay', root)?.addEventListener('click', () => close());
        releaseFocusTrap = trapFocus($('.movie-modal', root));
        $('.modal-close', root)?.focus();

        // Bind the data-navigo links (genre pills, similar-card titles) we just injected.
        if (window.AppRouter && typeof AppRouter.refreshLinks === 'function') AppRouter.refreshLinks();

        if (updateUrl && window.AppRouter && typeof AppRouter.navigate === 'function') {
            const currentHash = window.location.hash.replace(/^#/, '') || '/';
            if (currentHash !== `/movie/${encodeURIComponent(movieId)}`) {
                AppRouter.navigate(`/movie/${encodeURIComponent(movieId)}`);
            }
        }
    };

    /**
     * Closes the modal and restores focus/scroll.
     * @param {object} [options]
     * @param {boolean} [options.goBack=true] - If the URL currently points at
     *   /movie/:id, step back in history so the address bar reflects the
     *   underlying page again. Pass false when close() is being called *as a
     *   reaction* to a route change (e.g. the router's after-hook), where the
     *   URL has already moved on and going back again would fight the user's
     *   own back/forward navigation.
     */
    const close = ({ goBack = true } = {}) => {
        if (!isOpen()) return;
        root.classList.remove('active');
        releaseFocusTrap();
        releaseFocusTrap = () => {};
        unlockScroll();
        setTimeout(() => { if (!isOpen()) root.innerHTML = ''; }, 250);

        // The opener may have been re-rendered away while the modal was open.
        if (lastFocusedElement && document.contains(lastFocusedElement)) {
            lastFocusedElement.focus({ preventScroll: true });
        }
        lastFocusedElement = null;

        const onMovieRoute = window.location.hash.replace(/^#/, '').startsWith('/movie/');
        if (goBack && onMovieRoute) {
            // BUG FIX: history.length > 1 is true for ANY tab with history,
            // including one where the visitor arrived from GitHub or LinkedIn.
            // Going back from a shared /movie/:id link would take them off the
            // site. AppRouter.canGoBack() knows whether the previous entry is ours.
            if (window.AppRouter?.canGoBack?.()) {
                window.history.back();
            } else if (window.AppRouter && typeof AppRouter.navigate === 'function') {
                AppRouter.navigate('/');
            }
        }
    };

    /**
     * Sets up global listeners (Escape to close).
     */
    const init = () => {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) {
                // The modal can sit on top of the search overlay. Stop here so
                // one Escape press closes only the top-most layer, not both.
                e.stopImmediatePropagation();
                close();
            }
        });
    };

    return { init, open, close, isOpen };
})();
window.ModalManager = ModalManager;
