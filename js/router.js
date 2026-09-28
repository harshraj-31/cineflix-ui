/**
 * @module AppRouter
 * @description Manages client-side routing and orchestrates view rendering for the SPA.
 * It uses the Navigo library to handle URL changes and dynamically builds pages
 * by fetching data from MovieDB and using UIManager to render components.
 *
 * Routes:
 *   /                 Home (hero + curated rows)
 *   /browse           Every genre as a row
 *   /browse/:genre    One genre as a grid (shareable filter)
 *   /my-list          Favorites
 *   /movie/:id        Opens the detail modal over the current page
 */
const AppRouter = (() => {
    // IMPORTANT: Navigo's `root` must match the path the app is actually served
    // from, or it silently fails to match ANY route (including '/') - a known
    // Navigo issue (see krasimir/navigo#314). A hardcoded '/' works when the
    // site is served from a real web server's root, but breaks when the file is
    // opened directly, e.g. file:///D:/JS-project/cineflix/index.html, where
    // the pathname is nested rather than '/'. Computing it from the current
    // location makes both cases work.
    const computedRoot = window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1) || '/';
    const router = new Navigo(computedRoot, { hash: true });

    /* ------------------------------------------------------------------
       In-app history tracking
       ------------------------------------------------------------------
       Every history entry this app lands on is stamped with an increasing
       `cfIndex` (via replaceState, so the URL is untouched). ModalManager
       asks canGoBack() before calling history.back(): if the /movie/:id
       entry was the FIRST one of this visit (someone opened a shared link),
       going "back" would leave CineFlix entirely, so it navigates to Home
       instead. The stamp lives on the history entry itself, so it stays
       correct across back/forward and reloads.
       ------------------------------------------------------------------ */
    let _historyCounter = Number(window.history.state?.cfIndex) || 0;

    const _stampHistoryEntry = () => {
        const state = window.history.state || {};
        if (typeof state.cfIndex === 'number') {
            _historyCounter = Math.max(_historyCounter, state.cfIndex);
            return;
        }
        _historyCounter += 1;
        try {
            window.history.replaceState({ ...state, cfIndex: _historyCounter }, '');
        } catch (err) {
            // Some file:// contexts disallow replaceState - harmless to skip.
        }
    };

    /** @returns {boolean} True if history.back() will stay inside CineFlix. */
    const canGoBack = () => (Number(window.history.state?.cfIndex) || 1) > 1;

    /**
     * Normalizes any route-ish string to "/first-segment".
     * Navigo reports match.url without a leading slash ("browse/Action"),
     * while nav hrefs are written with one ("/browse"). Comparing them raw is
     * why only Home ever got the active underline.
     * @private
     * @param {string} path
     * @returns {string}
     */
    const _topLevel = (path = '') => {
        const clean = String(path).replace(/^[#/]+/, '').split(/[?#]/)[0];
        const first = clean.split('/')[0];
        return first ? `/${first}` : '/';
    };

    /**
     * Updates the active state of navigation links based on the current route.
     * @private
     * @param {object} match - The route match object from Navigo.
     */
    const _updateNavLinks = (match) => {
        const current = _topLevel(match?.url);
        // The movie modal floats over whatever page is underneath, so leave the
        // underlying page's link highlighted instead of clearing everything.
        if (current === '/movie') return;

        $all('.nav-link').forEach((link) => {
            const isActive = _topLevel(link.getAttribute('href')) === current;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    /**
     * Sets document.title so each view is distinguishable in tabs/history.
     * @private
     * @param {string} [label]
     */
    const _setTitle = (label) => {
        document.title = label ? `${label} | CineFlix` : 'CineFlix | Watch Beyond Reality';
    };

    /**
     * Renders the Home page.
     * @private
     */
    const _renderHomePage = () => {
        document.body.classList.add('has-hero');
        _setTitle();
        const pageFragment = document.createDocumentFragment();

        // 1. Create and add the Hero section
        const trendingMovies = MovieDB.getTrendingMovies();
        const heroMovie = getRandomItem(trendingMovies);
        if (heroMovie) {
            pageFragment.appendChild(UIManager.createHeroSection(heroMovie));
        }

        // 2. Create and add movie rows
        const mainContent = createElement('div', { className: 'main-content' });

        // "Continue Watching" - only shown once the user has actually pressed
        // Play on something (see app.js's play handler).
        const continueEntries = StorageManager.getContinueWatching();
        if (continueEntries.length > 0) {
            const continueMovies = continueEntries
                .map((entry) => MovieDB.getMovieById(entry.id))
                .filter(Boolean);
            const progressById = Object.fromEntries(continueEntries.map((e) => [e.id, e.progress]));

            if (continueMovies.length > 0) {
                mainContent.appendChild(UIManager.createMovieRow('Continue Watching', continueMovies, { progressById, id: 'row-continue-watching' }));
            }
        }

        // "Recently Viewed" - StorageManager has recorded every opened detail
        // modal since day one, but nothing ever displayed it.
        const recentMovies = StorageManager.getRecentlyViewed()
            .map((id) => MovieDB.getMovieById(id))
            .filter(Boolean);
        if (recentMovies.length > 0) {
            mainContent.appendChild(UIManager.createMovieRow('Recently Viewed', recentMovies, { id: 'row-recently-viewed' }));
        }

        mainContent.appendChild(UIManager.createMovieRow('Trending Now', shuffleArray(trendingMovies)));
        mainContent.appendChild(UIManager.createMovieRow('New Releases', MovieDB.getNewReleases()));
        mainContent.appendChild(UIManager.createMovieRow('Popular on CineFlix', MovieDB.getPopularMovies()));
        mainContent.appendChild(UIManager.createMovieRow('Top Rated', MovieDB.getTopRated(12)));
        mainContent.appendChild(UIManager.createMovieRow('Action & Adventure', MovieDB.getMoviesByGenre('Action')));
        mainContent.appendChild(UIManager.createMovieRow('Sci-Fi Thrillers', MovieDB.getMoviesByGenre('Sci-Fi')));

        pageFragment.appendChild(mainContent);
        UIManager.renderView(pageFragment);
    };

    /**
     * Renders the Browse page. With no genre it shows every genre as a row;
     * with /browse/:genre it shows that genre as a grid.
     * @private
     * @param {object} [match]
     */
    const _renderBrowsePage = (match) => {
        document.body.classList.remove('has-hero');

        const allGenres = MovieDB.getAllGenres();
        const requested = match?.data?.genre ? decodeURIComponent(match.data.genre) : 'All';
        // Match case-insensitively but display the canonical spelling.
        const activeGenre = allGenres.find((g) => g.toLowerCase() === requested.toLowerCase()) || 'All';

        _setTitle(activeGenre === 'All' ? 'Browse' : `${activeGenre} Movies`);

        const pageFragment = document.createDocumentFragment();
        const mainContent = createElement('div', { className: 'main-content view-padding' });

        const pageTitle = createElement('h1', { className: 'view-title' });
        pageTitle.textContent = activeGenre === 'All' ? 'Browse All' : activeGenre;
        mainContent.appendChild(pageTitle);

        mainContent.appendChild(UIManager.createGenreFilter(allGenres, activeGenre));

        if (activeGenre === 'All') {
            allGenres.forEach((genre) => {
                const moviesInGenre = MovieDB.getMoviesByGenre(genre);
                if (moviesInGenre.length > 0) {
                    mainContent.appendChild(UIManager.createMovieRow(genre, moviesInGenre));
                }
            });
        } else {
            const movies = [...MovieDB.getMoviesByGenre(activeGenre)]
                .sort((a, b) => b.imdbRating - a.imdbRating);

            const count = createElement('p', { className: 'result-count' },
                `${movies.length} ${movies.length === 1 ? 'title' : 'titles'}, sorted by rating`);
            mainContent.appendChild(count);

            const grid = createElement('div', { className: 'movie-grid' });
            movies.forEach((movie) => grid.appendChild(UIManager.createMovieCard(movie)));
            mainContent.appendChild(grid);
        }

        pageFragment.appendChild(mainContent);
        UIManager.renderView(pageFragment);
    };

    /**
     * Renders the "My List" page with the user's favorite movies.
     * @private
     */
    const _renderMyListPage = () => {
        document.body.classList.remove('has-hero');
        _setTitle('My List');
        const pageFragment = document.createDocumentFragment();
        const mainContent = createElement('div', { className: 'main-content view-padding' });

        const pageTitle = createElement('h1', { className: 'view-title' });
        pageTitle.textContent = 'My List';
        mainContent.appendChild(pageTitle);

        const favoriteMovies = StorageManager.getFavorites()
            .map((id) => MovieDB.getMovieById(id))
            .filter(Boolean);

        if (favoriteMovies.length > 0) {
            const count = createElement('p', { className: 'result-count' },
                `${favoriteMovies.length} ${favoriteMovies.length === 1 ? 'title' : 'titles'} saved`);
            mainContent.appendChild(count);

            const gridContainer = createElement('div', { className: 'movie-grid' });
            favoriteMovies.forEach((movie) => {
                gridContainer.appendChild(UIManager.createMovieCard(movie));
            });
            mainContent.appendChild(gridContainer);
        } else {
            mainContent.appendChild(UIManager.createEmptyState(
                'bookmark-plus',
                'Your list is empty',
                'Tap the + on any movie to save it here for later.',
                { label: 'Browse movies', href: '/browse' },
            ));
        }

        pageFragment.appendChild(mainContent);
        UIManager.renderView(pageFragment);
    };

    /**
     * Renders the movie detail route (/movie/:id). This doesn't have its own
     * page template - it opens the existing ModalManager on top of whatever
     * page is underneath, so the modal is reachable via a real, shareable URL
     * and responds correctly to the browser's back/forward buttons.
     * @private
     * @param {object} match - Navigo match object; named params live in match.data.
     */
    const _renderMovieDetailRoute = (match) => {
        const movieId = match?.data?.id ? decodeURIComponent(match.data.id) : null;
        if (!movieId || !MovieDB.getMovieById(movieId)) return _renderNotFound();

        // On a fresh load / hard refresh / shared link there's no page
        // underneath the modal yet - render the home page first so closing
        // the modal doesn't leave a blank view.
        //
        // BUG FIX: this used to check hasChildNodes(), but index.html ships
        // #view-root with a comment and whitespace inside it, so that check
        // was always true and the home page was never rendered underneath.
        // .children only counts elements.
        if ($('#view-root').children.length === 0) {
            _renderHomePage();
        }

        if (window.ModalManager) {
            // updateUrl: false - the URL already points here, so don't push
            // another history entry on top of the one that got us here.
            ModalManager.open(movieId, { updateUrl: false });
        }
    };

    /**
     * Renders a 404 Not Found page.
     * @private
     */
    const _renderNotFound = () => {
        document.body.classList.remove('has-hero');
        _setTitle('Not Found');
        const fragment = document.createDocumentFragment();
        const mainContent = createElement('div', { className: 'main-content view-padding' });
        mainContent.appendChild(UIManager.createEmptyState(
            'film',
            'We couldn\u2019t find that page',
            'The link may be broken, or the title may have left the catalog.',
            { label: 'Back to Home', href: '/' },
        ));
        fragment.appendChild(mainContent);
        UIManager.renderView(fragment);
    };

    /**
     * Initializes the router and defines all application routes.
     */
    const init = () => {
        // A completely bare load (no "#..." at all, e.g. double-clicking the
        // file) leaves location.hash empty, which Navigo won't match against
        // '/'. Default it before the first resolve() so home always renders.
        if (!window.location.hash) {
            window.location.hash = '#/';
        }

        // BUG FIX: hooks must be registered BEFORE resolve(). They used to be
        // added afterwards, so the very first route of every visit skipped the
        // after-hook entirely (no active nav link, no history stamp).
        router.hooks({
            after: (match) => {
                // Navigo runs this hook BEFORE it pushes the new URL, so stamp
                // on the next tick - otherwise the stamp lands on the entry we
                // just left.
                setTimeout(_stampHistoryEntry, 0);
                _updateNavLinks(match);

                // Navigo calls stopPropagation() on data-navigo link clicks, so
                // app.js's document-level handler never hears about them. Close
                // the mobile menu / profile dropdown here instead, on every route.
                $('.mobile-menu')?.classList.remove('open');
                $('.menu-toggle')?.setAttribute('aria-expanded', 'false');
                $('.profile-menu')?.classList.remove('show');
                $('.profile-btn')?.setAttribute('aria-expanded', 'false');
                router.updatePageLinks(); // Re-bind data-navigo links rendered by this route.

                if (_topLevel(match?.url) === '/movie') {
                    // The movie route handler opens the modal itself; don't
                    // scroll the page underneath it to the top.
                    return;
                }

                // Any other route becoming active (including the user hitting
                // back/forward out of a /movie/:id URL) means the modal, if
                // still open, is now stale - close it without re-navigating.
                if (window.ModalManager) ModalManager.close({ goBack: false });
                window.scrollTo(0, 0); // Ensure user starts at the top of the new page.

                // Move focus to the new view for screen-reader/keyboard users,
                // otherwise focus stays on the (now re-rendered) nav link.
                // (Skipped while search is open - focus belongs in the overlay.)
                const heading = $('#view-root h1');
                if (heading && !window.SearchManager?.isOpen?.()) {
                    heading.setAttribute('tabindex', '-1');
                    heading.focus({ preventScroll: true });
                }
            },
        });

        router.on({
            '/': _renderHomePage,
            '/browse': _renderBrowsePage,
            '/browse/:genre': _renderBrowsePage,
            '/my-list': _renderMyListPage,
            '/movie/:id': _renderMovieDetailRoute,
        }).notFound(_renderNotFound).resolve();
    };

    return {
        init,
        canGoBack,
        navigate: (path) => router.navigate(path),
        // Lets UIManager.renderView() re-bind any data-navigo links it just injected
        // (e.g. inside a freshly rendered view) without waiting for the next route change.
        refreshLinks: () => router.updatePageLinks(),
        /** @returns {string} The current top-level route, e.g. "/my-list". */
        currentSection: () => _topLevel(window.location.hash),
    };
})();

// BUG FIX: top-level `const` declarations are NOT properties of window, so
// every `window.AppRouter` check in modal.js was quietly false. That meant
// opening a movie never actually updated the URL to /movie/:id, and closing
// one never navigated anywhere. Expose it like ModalManager/SearchManager are.
window.AppRouter = AppRouter;
