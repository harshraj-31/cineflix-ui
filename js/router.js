/**
 * @module AppRouter
 * @description Manages client-side routing and orchestrates view rendering for the SPA.
 * It uses the Navigo library to handle URL changes and dynamically builds pages
 * by fetching data from MovieDB and using UIManager to render components.
 */
const AppRouter = (() => {
    // Assuming Navigo is loaded and available globally.
    // The root is set to '/', and we use the hash-based routing strategy for broader compatibility.
    const router = new Navigo('/', { strategy: 'hash', hash: true });

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
        const pageFragment = document.createDocumentFragment();

        // 1. Create and add the Hero section
        const trendingMovies = MovieDB.getTrendingMovies();
        const heroMovie = getRandomItem(trendingMovies);
        if (heroMovie) {
            pageFragment.appendChild(UIManager.createHeroSection(heroMovie));
        }

        // 2. Create and add movie rows
        const mainContent = createElement('div', { className: 'main-content' });

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
     * Renders a 404 Not Found page.
     * @private
     */
    const _renderNotFound = () => {
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
        router.on({
            '/': _renderHomePage,
            '/browse': _renderBrowsePage,
            '/my-list': _renderMyListPage,
        }).notFound(_renderNotFound).resolve();

        router.hooks({
            after: (match) => {
                _updateNavLinks(match);
                router.updatePageLinks(); // Re-bind data-navigo links rendered by this route.
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