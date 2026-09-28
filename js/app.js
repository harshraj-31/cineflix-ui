/**
 * @module App (entry point)
 * @description Boots every module and owns the app-wide event delegation.
 *
 * Boot order matters:
 *  1. StorageManager.init()    - load favorites/continue-watching from localStorage
 *  2. UIManager.renderLayout() - inject the navbar + footer into the DOM
 *  3. AppRouter.init()         - resolve the current route and render the first view
 *  4. ModalManager / SearchManager / AnimationManager .init()
 *     (ModalManager BEFORE SearchManager: its Escape handler must run first so
 *      one press closes only the modal when it's stacked on top of search)
 *  5. Wire up global (delegated) click / keyboard / image-error handlers
 *  6. Hide the loading screen
 */
(() => {
    const initModules = () => {
        StorageManager.init();
        document.documentElement.setAttribute('data-theme', StorageManager.getTheme());
        UIManager.renderLayout();
        AppRouter.init();

        if (window.ModalManager) ModalManager.init();
        if (window.SearchManager) SearchManager.init();
        if (window.AnimationManager) AnimationManager.init();
    };

    const initBackToTop = () => {
        const btn = $('#backToTop');
        if (!btn) return;

        window.addEventListener('scroll', debounce(() => {
            btn.classList.toggle('show', window.scrollY > 400);
        }, 100), { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };

    const initNavbarScrollEffect = () => {
        const nav = $('.navbar');
        if (!nav) return;

        const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
        window.addEventListener('scroll', debounce(onScroll, 50), { passive: true });
        onScroll();
    };

    /**
     * Swaps in generated artwork when a poster/banner file is missing.
     *
     * Only 10 of 36 movies have real image files. Image `error` events don't
     * bubble, but they DO go through the capture phase, so one listener on
     * document covers every <img data-art-variant> the app ever renders -
     * cards, hero, modal, search results - without an inline onerror= on each.
     */
    const initArtworkFallback = () => {
        document.addEventListener('error', (e) => {
            const img = e.target;
            if (!(img instanceof HTMLImageElement)) return;
            const variant = img.dataset.artVariant;
            if (!variant || img.dataset.artFallback) return;

            img.dataset.artFallback = 'generated';
            const host = img.closest('[data-movie-id]');
            const movie = host ? MovieDB.getMovieById(host.dataset.movieId) : null;
            img.src = generateArtwork(movie || { title: img.alt || 'CineFlix' }, variant);
        }, true);
    };

    /**
     * Resolves the movie id for a clicked control: the nearest card/hero/modal
     * wrapper's data-movie-id, or the control's own.
     * @param {Element} el
     * @returns {string|undefined}
     */
    const movieIdFor = (el) => el.dataset.movieId || el.closest('[data-movie-id]')?.dataset.movieId;

    /**
     * Records a demo "play" so Continue Watching has real data to show.
     * @param {string} movieId
     */
    const handlePlay = (movieId) => {
        if (movieId) {
            const existing = StorageManager.getContinueWatching().find((e) => e.id === movieId);
            // Advance an existing entry rather than re-rolling it, so pressing
            // Play again looks like progress instead of a random jump backwards.
            const progress = existing
                ? Math.min(95, existing.progress + Math.floor(Math.random() * 15) + 5)
                : Math.floor(Math.random() * 51) + 10; // demo: 10-60%
            StorageManager.updateContinueWatching(movieId, progress);
        }
        Toast?.show('This is a UI demo — playback isn’t wired to real video. Added to Continue Watching.', 'info');
    };

    /**
     * Toggles My List for a movie and keeps every copy of its button in sync.
     * On the My List page, un-favoriting also removes the card.
     * @param {string} movieId
     */
    const handleFavorite = (movieId) => {
        if (!movieId) return;
        const isFavorite = StorageManager.toggleFavorite(movieId);
        UIManager.updateFavoriteButton(movieId, isFavorite);
        Toast?.show(isFavorite ? 'Added to My List' : 'Removed from My List', 'success');

        if (!isFavorite && AppRouter.currentSection() === '/my-list') {
            const grid = $('#view-root .movie-grid');
            $(`.movie-card[data-movie-id="${CSS.escape(movieId)}"]`, grid || document)?.remove();
            const remaining = grid ? grid.children.length : 0;
            const count = $('#view-root .result-count');

            if (grid && remaining === 0) {
                grid.replaceWith(UIManager.createEmptyState(
                    'bookmark-plus',
                    'Your list is empty',
                    'Tap the + on any movie to save it here for later.',
                    { label: 'Browse movies', href: '/browse' },
                ));
                count?.remove();
                AppRouter.refreshLinks();
            } else if (count) {
                count.textContent = `${remaining} ${remaining === 1 ? 'title' : 'titles'} saved`;
            }
        }
    };

    /**
     * Removes a card from Continue Watching (storage + DOM).
     * @param {string} movieId
     */
    const handleRemoveContinue = (movieId) => {
        if (!movieId) return;
        StorageManager.removeFromContinueWatching(movieId);

        const row = $('#row-continue-watching');
        $(`.movie-card[data-movie-id="${CSS.escape(movieId)}"]`, row || document)?.remove();
        if (row && row.children.length === 0) row.closest('.movie-section')?.remove();

        Toast?.show('Removed from Continue Watching', 'success');
    };

    const closeMobileMenu = () => {
        $('.mobile-menu')?.classList.remove('open');
        $('.menu-toggle')?.setAttribute('aria-expanded', 'false');
    };

    const closeProfileMenu = () => {
        $('.profile-menu.show')?.classList.remove('show');
        $('.profile-btn')?.setAttribute('aria-expanded', 'false');
    };

    /**
     * A single delegated listener handles every dynamically-created button
     * (movie cards are re-created on every route change, so binding listeners
     * per-card would leak and miss future cards).
     *
     * Buttons declare what they do with data-action="play|info|favorite|
     * remove-continue". Previously the handler matched styling classes
     * (.play-btn), so the hero and modal Play buttons - which are styled as
     * .btn-primary - did nothing when clicked.
     */
    const initGlobalClickHandlers = () => {
        document.addEventListener('click', (e) => {
            // Skip link. Under hash routing, following href="#view-root" would
            // be read as a route called "view-root" and show the 404 page.
            if (e.target.closest('.skip-link')) {
                e.preventDefault();
                $('#view-root')?.focus();
                return;
            }

            // Placeholder links (footer, profile menu). A bare href="#" empties
            // the hash, which the router treats as "/" - so clicking "Help
            // Center" on the Browse page used to bounce you back to Home.
            const demoLink = e.target.closest('[data-demo-link]');
            if (demoLink) {
                e.preventDefault();
                closeProfileMenu();
                Toast?.show(`“${demoLink.textContent.trim() || demoLink.getAttribute('aria-label')}” is a placeholder in this demo.`, 'info');
                return;
            }

            const actionEl = e.target.closest('[data-action]');
            if (actionEl) {
                const movieId = movieIdFor(actionEl);
                switch (actionEl.dataset.action) {
                    case 'play': handlePlay(movieId); break;
                    case 'info': if (movieId) ModalManager.open(movieId); break;
                    case 'favorite': handleFavorite(movieId); break;
                    case 'remove-continue': handleRemoveContinue(movieId); break;
                    default: break;
                }
                return;
            }

            // Clicking anywhere else on a card opens its details. The card had
            // cursor:pointer from day one but clicking it did nothing - and on
            // touch screens (no hover, so no overlay) it was the ONLY target.
            const card = e.target.closest('.movie-card[data-movie-id]');
            if (card && !e.target.closest('a, button')) {
                ModalManager.open(card.dataset.movieId);
                return;
            }

            // Browse genre filter chips.
            const genreChip = e.target.closest('.genre-filter [data-genre]');
            if (genreChip) {
                const genre = genreChip.dataset.genre;
                AppRouter.navigate(genre === 'All' ? '/browse' : `/browse/${encodeURIComponent(genre)}`);
                return;
            }

            // Theme toggle (dark/light).
            const themeBtn = e.target.closest('#theme-toggle');
            if (themeBtn) {
                const next = StorageManager.getTheme() === 'dark' ? 'light' : 'dark';
                StorageManager.setTheme(next);
                document.documentElement.setAttribute('data-theme', next);
                themeBtn.querySelector('i')?.setAttribute('class', `bi ${next === 'dark' ? 'bi-moon-stars' : 'bi-sun'}`);
                return;
            }

            // Mobile hamburger toggle.
            const menuToggle = e.target.closest('.menu-toggle');
            if (menuToggle) {
                const open = $('.mobile-menu')?.classList.toggle('open');
                menuToggle.setAttribute('aria-expanded', String(Boolean(open)));
                return;
            }

            // Profile dropdown toggle.
            const profileBtn = e.target.closest('.profile-btn');
            if (profileBtn) {
                const open = $('.profile-menu')?.classList.toggle('show');
                profileBtn.setAttribute('aria-expanded', String(Boolean(open)));
                return;
            }

            // Clicking anywhere else closes any open profile dropdown / mobile menu.
            if (!e.target.closest('.profile-menu')) closeProfileMenu();
            if (!e.target.closest('.mobile-menu')) closeMobileMenu();
        });

        // Escape closes the small menus. (Keyboard users reach card actions
        // through the overlay buttons, which cards.css now reveals on
        // :focus-within - the title link is kept out of the tab order so each
        // card is three tab stops, not four.)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeProfileMenu();
                closeMobileMenu();
            }
        });
    };

    const hideLoader = () => {
        const loader = $('#loader');
        if (!loader) return;

        setTimeout(() => {
            loader.style.transition = 'opacity .4s ease';
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
            setTimeout(() => loader.remove(), 450);
        }, 400);
    };

    document.addEventListener('DOMContentLoaded', () => {
        // Must be registered before the first render so the very first hero
        // and card images get fallback artwork if their files are missing.
        initArtworkFallback();
        initModules();
        initBackToTop();
        initNavbarScrollEffect();
        initGlobalClickHandlers();
        hideLoader();
    });
})();
