/**
 * @module ModalManager
 * @description Builds and controls the movie detail modal (#modal-root).
 * Matches the markup expected by modal.css: .modal-overlay, .movie-modal,
 * .modal-banner, .modal-close, .modal-body, .modal-header, .modal-poster,
 * .modal-info, .modal-meta, .modal-description, .modal-actions, .modal-section,
 * .cast-list/.cast-chip, .genre-list/.genre-pill, .similar-grid.
 */
const ModalManager = (() => {
    const root = $('#modal-root');
    let lastFocusedElement = null;

    /**
     * @private
     * @param {object} movie
     * @returns {DocumentFragment}
     */
    const _buildContent = (movie) => {
        const favorite = StorageManager.isFavorite(movie.id);
        const title = escapeHTML(movie.title);

        const html = `
            <div class="modal-overlay"></div>
            <div class="movie-modal" role="dialog" aria-modal="true" aria-label="${title} details">
                <div class="modal-banner">
                    <img src="${escapeHTML(movie.heroImage)}" alt="${title}" onerror="this.onerror=null;this.src='assets/placeholder-hero.svg';">
                </div>
                <button class="modal-close" aria-label="Close">
                    <i class="bi bi-x-lg"></i>
                </button>
                <div class="modal-body">
                    <div class="modal-header">
                        <div class="modal-poster">
                            <img src="${escapeHTML(movie.poster)}" alt="${title}" onerror="this.onerror=null;this.src='assets/placeholder-poster.svg';">
                        </div>
                        <div class="modal-info">
                            <h2>${title}</h2>
                            <div class="modal-meta">
                                <span><i class="bi bi-star-fill"></i> ${movie.imdbRating.toFixed(1)}</span>
                                <span>${movie.year}</span>
                                <span>${escapeHTML(movie.rated)}</span>
                                <span>${movie.runtime} min</span>
                            </div>
                            <p class="modal-description">${escapeHTML(movie.plot)}</p>
                            <div class="modal-actions">
                                <button class="btn btn-primary" data-movie-id="${movie.id}">
                                    <i class="bi bi-play-fill"></i> Play
                                </button>
                                <button class="btn btn-secondary favorite-btn" data-movie-id="${movie.id}" aria-label="Toggle My List">
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
                            ${movie.genres.map((genre) => `<span class="genre-pill">${escapeHTML(genre)}</span>`).join('')}
                        </div>
                    </div>
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
     * @private
     * @param {object} movie
     */
    const _populateSimilar = (movie) => {
        const container = $('#similar-grid', root);
        if (!container) return;

        const similar = movie.genres
            .flatMap((genre) => MovieDB.getMoviesByGenre(genre))
            .filter((m) => m.id !== movie.id);

        const unique = [...new Map(similar.map((m) => [m.id, m])).values()].slice(0, 6);
        unique.forEach((m) => {
            const card = UIManager.createMovieCard(m);
            if (card) container.appendChild(card);
        });
    };

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

        StorageManager.addRecentlyViewed(movieId);
        lastFocusedElement = document.activeElement;

        root.innerHTML = '';
        root.appendChild(_buildContent(movie));
        _populateSimilar(movie);

        root.classList.add('active');
        document.body.style.overflow = 'hidden';

        $('.modal-close', root)?.addEventListener('click', () => close());
        $('.modal-overlay', root)?.addEventListener('click', () => close());
        $('.modal-close', root)?.focus();

        if (updateUrl && window.AppRouter && typeof AppRouter.navigate === 'function') {
            const currentHash = window.location.hash.replace(/^#/, '') || '/';
            if (currentHash !== `/movie/${movieId}`) {
                AppRouter.navigate(`/movie/${movieId}`);
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
        if (!root || !root.classList.contains('active')) return;
        root.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { root.innerHTML = ''; }, 250);
        if (lastFocusedElement) lastFocusedElement.focus();

        const onMovieRoute = window.location.hash.replace(/^#/, '').startsWith('/movie/');
        if (goBack && onMovieRoute) {
            if (window.history.length > 1) {
                window.history.back();
            } else if (window.AppRouter && typeof AppRouter.navigate === 'function') {
                AppRouter.navigate('/');
            }
        }
    };

    /**
     * Sets up global listeners (Escape to close, favorite toggling inside the modal).
     */
    const init = () => {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && root?.classList.contains('active')) close();
        });
    };

    return { init, open, close };
})();
window.ModalManager = ModalManager;
