/**
 * @module AppRouter
 * @description Manages client-side routing and orchestrates view rendering for the SPA.
 * It uses the Navigo library to handle URL changes and dynamically builds pages
 * by fetching data from MovieDB and using UIManager to render components.
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

    /**
     * Updates the active state of navigation links based on the current route.
     * @private
     * @param {object} match - The route match object from Navigo.
     */
    const _updateNavLinks = (match) => {
        const currentPath = match.url || '/';
        const navLinks = $all('.nav-link');

        navLinks.forEach(link => {
            // Use getAttribute to get the raw href value
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    /**
     * Renders the Home page.
     * @private
     */
    const _renderHomePage = () => {
        document.body.classList.add('has-hero');
        const pageFragment = document.createDocumentFragment();

        // 1. Create and add the Hero section
        const trendingMovies = MovieDB.getTrendingMovies();
        const heroMovie = getRandomItem(trendingMovies);
        if (heroMovie) {
            pageFragment.appendChild(UIManager.createHeroSection(heroMovie));
        }

        // 2. Create and add movie rows
        const mainContent = createElement('div', { className: 'main-content' });

        // "Continue Watching" - previously tracked by StorageManager but never
        // surfaced anywhere in the UI. Only shown once the user has actually
        // pressed Play on something (see app.js's playBtn handler).
        const continueEntries = StorageManager.getContinueWatching();
        if (continueEntries.length > 0) {
            const continueMovies = continueEntries
                .map((entry) => MovieDB.getMovieById(entry.id))
                .filter(Boolean);
            const progressById = Object.fromEntries(continueEntries.map((e) => [e.id, e.progress]));

            if (continueMovies.length > 0) {
                mainContent.appendChild(UIManager.createMovieRow('Continue Watching', continueMovies, { progressById }));
            }
        }

        // Example rows. This can be customized or randomized further.
        mainContent.appendChild(UIManager.createMovieRow('Trending Now', shuffleArray(trendingMovies)));
        mainContent.appendChild(UIManager.createMovieRow('New Releases', MovieDB.getNewReleases()));
        mainContent.appendChild(UIManager.createMovieRow('Popular on CineFlix', MovieDB.getPopularMovies()));
        mainContent.appendChild(UIManager.createMovieRow('Action & Adventure', MovieDB.getMoviesByGenre('Action')));
        mainContent.appendChild(UIManager.createMovieRow('Sci-Fi Thrillers', MovieDB.getMoviesByGenre('Sci-Fi')));

        pageFragment.appendChild(mainContent);
        UIManager.renderView(pageFragment);

        // Initialize sliders for the newly created rows
        // Assumes Slider.initAll() will be defined in slider.js
        if (window.Slider) {
            Slider.initAll();
        }
    };

    /**
     * Renders the Browse page, organized by genre.
     * @private
     */
    const _renderBrowsePage = () => {
        document.body.classList.remove('has-hero');
        const pageFragment = document.createDocumentFragment();
        const mainContent = createElement('div', { className: 'main-content view-padding' });

        const pageTitle = createElement('h1', { className: 'view-title' });
        pageTitle.textContent = 'Browse All';
        mainContent.appendChild(pageTitle);

        const allGenres = MovieDB.getAllGenres();
        allGenres.forEach(genre => {
            const moviesInGenre = MovieDB.getMoviesByGenre(genre);
            if (moviesInGenre.length > 0) {
                mainContent.appendChild(UIManager.createMovieRow(genre, moviesInGenre));
            }
        });

        pageFragment.appendChild(mainContent);
        UIManager.renderView(pageFragment);

        if (window.Slider) {
            Slider.initAll();
        }
    };

    /**
     * Renders the "My List" page with the user's favorite movies.
     * @private
     */
    const _renderMyListPage = () => {
        document.body.classList.remove('has-hero');
        const pageFragment = document.createDocumentFragment();
        const mainContent = createElement('div', { className: 'main-content view-padding' });

        const pageTitle = createElement('h1', { className: 'view-title' });
        pageTitle.textContent = 'My List';
        mainContent.appendChild(pageTitle);

        const favoriteIds = StorageManager.getFavorites();
        const favoriteMovies = favoriteIds.map(id => MovieDB.getMovieById(id)).filter(Boolean);

        if (favoriteMovies.length > 0) {
            const gridContainer = createElement('div', { className: 'movie-grid' });
            favoriteMovies.forEach(movie => {
                gridContainer.appendChild(UIManager.createMovieCard(movie));
            });
            mainContent.appendChild(gridContainer);
        } else {
            const emptyMessage = createElement('p', { className: 'empty-list-message' });
            emptyMessage.textContent = 'Your list is empty. Add movies by clicking the plus icon.';
            mainContent.appendChild(emptyMessage);
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
        const movieId = match?.data?.id;
        if (!movieId) return _renderNotFound();

        // On a fresh load / hard refresh / shared link there's no page
        // underneath the modal yet - render the home page first so closing
        // the modal doesn't leave a blank view.
        if (!$('#view-root').hasChildNodes()) {
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
        const notFoundFragment = document.createDocumentFragment();
        const message = createElement('h1', { className: 'view-title text-center' });
        message.textContent = '404 - Page Not Found';
        notFoundFragment.appendChild(message);
        UIManager.renderView(notFoundFragment);
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

        router.on({
            '/': _renderHomePage,
            '/browse': _renderBrowsePage,
            '/my-list': _renderMyListPage,
            '/movie/:id': _renderMovieDetailRoute,
        }).notFound(_renderNotFound).resolve();

        router.hooks({
            after: (match) => {
                _updateNavLinks(match);
                router.updatePageLinks(); // Re-bind data-navigo links rendered by this route.

                const path = match?.url ? `/${match.url}`.replace(/^\/\//, '/') : '/';
                if (path.startsWith('/movie/')) {
                    // The movie route handler opens the modal itself; don't
                    // scroll the page underneath it to the top.
                    return;
                }

                // Any other route becoming active (including the user hitting
                // back/forward out of a /movie/:id URL) means the modal, if
                // still open, is now stale - close it without re-navigating.
                if (window.ModalManager) ModalManager.close({ goBack: false });
                window.scrollTo(0, 0); // Ensure user starts at the top of the new page.
            }
        });
    };

    return {
        init,
        navigate: (path) => router.navigate(path),
        // Lets UIManager.renderView() re-bind any data-navigo links it just injected
        // (e.g. inside a freshly rendered view) without waiting for the next route change.
        refreshLinks: () => router.updatePageLinks(),
    };
})();