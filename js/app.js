/**
 * @module App (entry point)
 * @description This is the file that was missing from the original project.
 * Nothing initialized any module before this existed - the loader would have
 * spun forever and no click handlers would ever have been attached.
 *
 * Boot order matters:
 *  1. StorageManager.init()   - load favorites/continue-watching from localStorage
 *  2. UIManager.renderLayout() - inject the navbar + footer into the DOM
 *  3. AppRouter.init()         - resolve the current route and render the first view
 *  4. ModalManager / SearchManager / AnimationManager .init()
 *  5. Wire up global (delegated) click handlers
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
        }, 100));

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };

    const initNavbarScrollEffect = () => {
        const nav = $('.navbar');
        if (!nav) return;

        const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
        window.addEventListener('scroll', debounce(onScroll, 50));
        onScroll();
    };

    /**
     * A single delegated listener handles every dynamically-created button
     * (movie cards are re-created on every route change, so binding listeners
     * per-card would leak and miss future cards).
     */
    const initGlobalClickHandlers = () => {
        document.addEventListener('click', (e) => {
            // Favorite / My List toggle (works from both cards and the modal).
            const favoriteBtn = e.target.closest('.favorite-btn');
            if (favoriteBtn) {
                const card = favoriteBtn.closest('[data-movie-id]');
                const movieId = card?.dataset.movieId || favoriteBtn.dataset.movieId;
                if (movieId) {
                    const isFavorite = StorageManager.toggleFavorite(movieId);
                    UIManager.updateFavoriteButton(movieId, isFavorite);
                    Toast?.show(isFavorite ? 'Added to My List' : 'Removed from My List', 'success');
                }
                return;
            }

            // Open the movie detail modal.
            const modalTrigger = e.target.closest('.btn-modal');
            if (modalTrigger) {
                const card = modalTrigger.closest('[data-movie-id]');
                const movieId = card?.dataset.movieId || modalTrigger.dataset.movieId;
                if (movieId && window.ModalManager) ModalManager.open(movieId);
                return;
            }

            // "Play" is a portfolio demo - there's no real video backend, but we
            // still record a Continue Watching entry so that row (and the
            // watch-progress bar cards.css already styles for it) has real
            // data to show on the next Home visit instead of sitting unused.
            const playBtn = e.target.closest('.play-btn');
            if (playBtn && !playBtn.classList.contains('btn-modal')) {
                const card = playBtn.closest('[data-movie-id]');
                const movieId = card?.dataset.movieId || playBtn.dataset.movieId;
                if (movieId) {
                    const progress = Math.floor(Math.random() * 71) + 10; // demo: 10-80%
                    StorageManager.updateContinueWatching(movieId, progress);
                }
                Toast?.show('This is a UI demo - playback isn\u2019t wired to real video.', 'info');
                return;
            }

            // Theme toggle (dark/light) - StorageManager already persisted a
            // theme preference; nothing in the UI ever offered a way to change it.
            const themeBtn = e.target.closest('#theme-toggle');
            if (themeBtn) {
                const next = StorageManager.getTheme() === 'dark' ? 'light' : 'dark';
                StorageManager.setTheme(next);
                document.documentElement.setAttribute('data-theme', next);
                themeBtn.querySelector('i')?.setAttribute('class', `bi ${next === 'dark' ? 'bi-moon-stars' : 'bi-sun'}`);
                return;
            }

            // Mobile hamburger toggle.
            if (e.target.closest('.menu-toggle')) {
                $('.mobile-menu')?.classList.toggle('open');
                return;
            }

            // Profile dropdown toggle.
            const profileBtn = e.target.closest('.profile-btn');
            if (profileBtn) {
                $('.profile-menu')?.classList.toggle('show');
                return;
            }

            // Clicking anywhere else closes any open profile dropdown.
            if (!e.target.closest('.profile-menu')) {
                $('.profile-menu.show')?.classList.remove('show');
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
        initModules();
        initBackToTop();
        initNavbarScrollEffect();
        initGlobalClickHandlers();
        hideLoader();
    });
})();
