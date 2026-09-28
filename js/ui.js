/**
 * @module UIManager
 * @description Handles all DOM rendering and UI component creation for the CineFlix app.
 * This module is responsible for creating dynamic HTML elements like movie cards,
 * sliders, hero banners, and managing the main application layout.
 *
 * NOTE: The markup produced here has been aligned to the class names already defined
 * in navbar.css / hero.css / cards.css / modal.css (no CSS files were changed).
 */
const UIManager = (() => {
    // Cache frequently accessed DOM elements.
    const ROOT_ELEMENTS = {
        navbar: $('#navbar-root'),
        view: $('#view-root'),
        footer: $('#footer-root'),
        modal: $('#modal-root'),
        search: $('#search-root'),
    };

    /**
     * Creates the main navigation bar component.
     * Matches: navbar.css (.navbar, .nav-left, .nav-right, .brand, .nav-links,
     * .nav-link, .icon-btn, .profile-btn, .profile-menu, .menu-toggle, .mobile-menu)
     * @returns {DocumentFragment}
     */
    const createNavbar = () => {
        const html = `
            <nav class="navbar" aria-label="Primary">
                <div class="container">
                    <div class="nav-left">
                        <a href="/" class="brand" data-navigo aria-label="CineFlix Home">Cine<span>Flix</span></a>
                        <ul class="nav-links">
                            <li><a href="/" class="nav-link" data-navigo>Home</a></li>
                            <li><a href="/browse" class="nav-link" data-navigo>Browse</a></li>
                            <li><a href="/my-list" class="nav-link" data-navigo>My List</a></li>
                        </ul>
                    </div>
                    <div class="nav-right">
                        <button class="icon-btn" id="search-btn" aria-label="Search">
                            <i class="bi bi-search"></i>
                        </button>
                        <button class="icon-btn" id="theme-toggle" aria-label="Toggle light/dark theme">
                            <i class="bi ${StorageManager.getTheme() === 'dark' ? 'bi-moon-stars' : 'bi-sun'}"></i>
                        </button>
                        <div style="position:relative;">
                            <button class="profile-btn" aria-label="Profile menu" aria-haspopup="true" aria-expanded="false">
                                <img src="assets/profile-avatar.svg" alt="User profile">
                                <span class="profile-name">Guest</span>
                            </button>
                            <div class="profile-menu" role="menu">
                                <a href="#" data-demo-link role="menuitem">Account</a>
                                <a href="#" data-demo-link role="menuitem">Help Center</a>
                                <a href="#" data-demo-link role="menuitem">Sign Out</a>
                            </div>
                        </div>
                        <button class="menu-toggle icon-btn" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-menu">
                            <i class="bi bi-list"></i>
                        </button>
                    </div>
                </div>
            </nav>
            <div class="mobile-menu" id="mobile-menu">
                <a href="/" class="nav-link" data-navigo>Home</a>
                <a href="/browse" class="nav-link" data-navigo>Browse</a>
                <a href="/my-list" class="nav-link" data-navigo>My List</a>
            </div>
        `;
        return fragmentFromHTML(html);
    };

    /**
     * Creates the main footer component.
     * Matches the footer rules added at the bottom of style.css.
     * @returns {DocumentFragment}
     */
    const createFooter = () => {
        const currentYear = new Date().getFullYear();
        const html = `
            <div class="footer">
                <div class="footer-content">
                    <div class="footer-socials">
                        <a href="#" data-demo-link aria-label="Facebook"><i class="bi bi-facebook"></i></a>
                        <a href="#" data-demo-link aria-label="Instagram"><i class="bi bi-instagram"></i></a>
                        <a href="#" data-demo-link aria-label="Twitter"><i class="bi bi-twitter-x"></i></a>
                        <a href="#" data-demo-link aria-label="YouTube"><i class="bi bi-youtube"></i></a>
                    </div>
                    <ul class="footer-links">
                        <li><a href="#" data-demo-link>Audio Description</a></li>
                        <li><a href="#" data-demo-link>Help Center</a></li>
                        <li><a href="#" data-demo-link>Gift Cards</a></li>
                        <li><a href="#" data-demo-link>Media Center</a></li>
                        <li><a href="#" data-demo-link>Investor Relations</a></li>
                        <li><a href="#" data-demo-link>Jobs</a></li>
                        <li><a href="#" data-demo-link>Terms of Use</a></li>
                        <li><a href="#" data-demo-link>Privacy</a></li>
                        <li><a href="#" data-demo-link>Legal Notices</a></li>
                        <li><a href="#" data-demo-link>Cookie Preferences</a></li>
                        <li><a href="#" data-demo-link>Corporate Information</a></li>
                        <li><a href="#" data-demo-link>Contact Us</a></li>
                    </ul>
                    <p class="footer-copyright">&copy; ${currentYear} CineFlix, Inc. A portfolio project — not a real streaming service.</p>
                </div>
            </div>
        `;
        return fragmentFromHTML(html);
    };

    /**
     * Creates the hero banner for the homepage.
     * Matches: hero.css (.hero, .hero-background, .hero-content, .hero-badge,
     * .hero-title, .hero-description, .hero-meta, .hero-actions, .hero-scroll,
     * .hero-gradient-bottom)
     * @param {object} movie - The featured movie object from MovieDB.
     * @returns {DocumentFragment}
     */
    const createHeroSection = (movie) => {
        if (!movie) return document.createDocumentFragment();

        const badgeLabel = movie.isNewRelease ? 'New Release' : 'Trending Now';

        // BUG FIX: the hero "Play" button used to be a bare .btn.btn-primary,
        // but app.js only listened for .play-btn - so it silently did nothing.
        // Buttons now declare their intent with data-action instead of relying
        // on a styling class, so the hero keeps its own look and still works.
        const html = `
            <section class="hero" data-movie-id="${escapeHTML(movie.id)}">
                <div class="hero-background">
                    <img src="${escapeHTML(movie.heroImage)}" alt="" width="1920" height="815" fetchpriority="high" decoding="async" data-art-variant="hero">
                </div>
                <div class="container">
                    <div class="hero-content">
                        <span class="hero-badge"><i class="bi bi-fire"></i> ${badgeLabel}</span>
                        <h1 class="hero-title">${escapeHTML(movie.title)}</h1>
                        <p class="hero-description">${escapeHTML(truncateText(movie.plot, 180))}</p>
                        <div class="hero-meta">
                            <span><i class="bi bi-star-fill"></i> ${movie.imdbRating.toFixed(1)}</span>
                            <span>${movie.year}</span>
                            <span>${escapeHTML(movie.rated)}</span>
                            <span>${escapeHTML(formatRuntime(movie.runtime))}</span>
                        </div>
                        <div class="hero-actions">
                            <button class="btn btn-primary" data-action="play" data-movie-id="${escapeHTML(movie.id)}">
                                <i class="bi bi-play-fill"></i> Play
                            </button>
                            <button class="btn btn-secondary btn-modal" data-action="info" data-movie-id="${escapeHTML(movie.id)}">
                                <i class="bi bi-info-circle"></i> More Info
                            </button>
                        </div>
                    </div>
                </div>
                <div class="hero-scroll">
                    <i class="bi bi-chevron-down"></i>
                    <span>Scroll</span>
                </div>
                <div class="hero-gradient-bottom"></div>
            </section>
        `;
        return fragmentFromHTML(html);
    };

    /**
     * Creates a single movie card component.
     * Matches: cards.css (.movie-card, .movie-poster, .movie-overlay, .movie-top,
     * .movie-badge, .favorite-btn, .movie-actions, .play-btn, .info-btn,
     * .movie-content, .movie-title, .movie-meta, .rating, .genre-tags, .genre-tag)
     * @param {object} movie
     * @returns {HTMLElement|null}
     */
    const createMovieCard = (movie, options = {}) => {
        if (!movie) return null;

        const favorite = StorageManager.isFavorite(movie.id);
        const favoriteIcon = favorite ? 'bi-check-circle-fill' : 'bi-plus-circle';
        const favoriteLabel = favorite ? 'Remove from My List' : 'Add to My List';
        const title = escapeHTML(movie.title);

        const card = createElement('article', {
            className: 'movie-card',
            'data-movie-id': movie.id,
        });

        // Continue Watching rows pass a 0-100 progress value so the card can
        // show the .watch-progress bar already styled in cards.css. Those rows
        // also get a dismiss control - StorageManager.removeFromContinueWatching()
        // existed from the start but nothing in the UI ever called it, so an
        // entry could be added and never removed.
        const hasProgress = typeof options.progress === 'number';
        const progressValue = hasProgress ? Math.max(0, Math.min(100, options.progress)) : 0;
        const progressHTML = hasProgress
            ? `
                <div class="watch-progress">
                    <div class="progress-track" role="progressbar" aria-label="Watch progress"
                         aria-valuenow="${progressValue}" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-fill" style="width:${progressValue}%"></div>
                    </div>
                    <span class="progress-label">${progressValue}% watched</span>
                </div>
            `
            : '';

        const dismissHTML = hasProgress
            ? `<button class="card-dismiss" data-action="remove-continue" aria-label="Remove ${title} from Continue Watching">
                   <i class="bi bi-x-lg"></i>
               </button>`
            : '';

        // NOTE: no inline onerror= here any more. A single capture-phase error
        // listener in app.js swaps in generated artwork if an image file is
        // ever missing, using data-art-variant to pick the right aspect ratio.
        const html = `
            <div class="movie-poster">
                <img src="${escapeHTML(movie.poster)}" alt="${title}" width="500" height="750" loading="lazy" decoding="async" data-art-variant="poster">
            </div>
            <div class="movie-overlay">
                <div class="movie-top">
                    <span class="movie-badge">${escapeHTML(movie.rated)}</span>
                    <div class="movie-top-actions">
                        ${dismissHTML}
                        <button class="favorite-btn" data-action="favorite" aria-label="${favoriteLabel}">
                            <i class="bi ${favoriteIcon}"></i>
                        </button>
                    </div>
                </div>
                <div class="movie-actions">
                    <button class="play-btn" data-action="play" aria-label="Play ${title}">
                        <i class="bi bi-play-fill"></i> Play
                    </button>
                    <button class="info-btn btn-modal" data-action="info" aria-label="More info about ${title}">
                        <i class="bi bi-info-circle"></i> Info
                    </button>
                </div>
            </div>
            <div class="movie-content">
                <h3 class="movie-title">
                    <a href="/movie/${encodeURIComponent(movie.id)}" data-navigo tabindex="-1" title="${title}">${title}</a>
                </h3>
                <div class="movie-meta">
                    <span>${movie.year}</span>
                    <span class="movie-runtime">${escapeHTML(formatRuntime(movie.runtime))}</span>
                    <span class="rating"><i class="bi bi-star-fill"></i> ${movie.imdbRating.toFixed(1)}</span>
                </div>
                <div class="genre-tags">
                    ${movie.genres.slice(0, 2).map((g) => `<span class="genre-tag">${escapeHTML(g)}</span>`).join('')}
                </div>
                ${progressHTML}
            </div>
        `;

        card.appendChild(fragmentFromHTML(html));
        return card;
    };

    /**
     * Creates a skeleton placeholder for a movie card while data is loading.
     * @returns {HTMLElement}
     */
    const createSkeletonCard = () => {
        const card = createElement('article', { className: 'movie-card is-loading' });
        const html = `
            <div class="movie-poster skeleton"></div>
            <div class="movie-content">
                <div class="skeleton" style="height:1rem;width:70%;margin-bottom:.6rem;border-radius:4px;"></div>
                <div class="skeleton" style="height:.8rem;width:40%;border-radius:4px;"></div>
            </div>
        `;
        card.appendChild(fragmentFromHTML(html));
        return card;
    };

    /**
     * Creates a full movie row (section) with a header, view-all link, slider
     * controls, and a horizontally-scrolling row of movie cards.
     * Matches: cards.css (.movie-section, .movie-row-header, .movie-row-title,
     * .view-all, .movie-row, .slider-controls, .slider-btn)
     * @param {string} title
     * @param {Array<object>} movies
     * @param {object} [options]
     * @param {string} [options.id]
     * @returns {HTMLElement}
     */
    // Tracks every row id handed out so two rows with the same/slugified
    // title (e.g. two custom genre rows both titled "Action") never collide.
    const _usedRowIds = new Set();
    const _uniqueRowId = (baseId) => {
        if (!_usedRowIds.has(baseId)) {
            _usedRowIds.add(baseId);
            return baseId;
        }
        let suffix = 2;
        while (_usedRowIds.has(`${baseId}-${suffix}`)) suffix += 1;
        const id = `${baseId}-${suffix}`;
        _usedRowIds.add(id);
        return id;
    };

    const createMovieRow = (title, movies, options = {}) => {
        const section = createElement('section', { className: 'movie-section reveal' });
        const rowId = options.id || _uniqueRowId(`row-${window.slugify(title)}`);

        const headerHTML = `
            <div class="movie-row-header">
                <h2 class="movie-row-title">${escapeHTML(title)}</h2>
                <div class="slider-controls" data-row="${rowId}">
                    <button class="slider-btn prev" aria-label="Scroll left" disabled>
                        <i class="bi bi-chevron-left"></i>
                    </button>
                    <button class="slider-btn next" aria-label="Scroll right">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        section.appendChild(fragmentFromHTML(headerHTML));

        const row = createElement('div', { className: 'movie-row', id: rowId });

        if (!movies || movies.length === 0) {
            for (let i = 0; i < 6; i += 1) {
                row.appendChild(createSkeletonCard());
            }
        } else {
            movies.forEach((movie) => {
                // Continue Watching passes { id, progress } wrapper objects;
                // every other row passes plain movie objects.
                const progress = options.progressById ? options.progressById[movie.id] : undefined;
                const card = createMovieCard(movie, { progress });
                if (card) row.appendChild(card);
            });
        }

        section.appendChild(row);
        return section;
    };

    /**
     * Renders the main application layout (navbar and footer).
     * Should be called once when the application initializes.
     */
    const renderLayout = () => {
        ROOT_ELEMENTS.navbar.appendChild(createNavbar());
        ROOT_ELEMENTS.footer.appendChild(createFooter());
    };

    /**
     * Clears the main view and renders new content.
     * @param {DocumentFragment|HTMLElement} content
     */
    const renderView = (content) => {
        while (ROOT_ELEMENTS.view.firstChild) {
            ROOT_ELEMENTS.view.removeChild(ROOT_ELEMENTS.view.firstChild);
        }
        ROOT_ELEMENTS.view.appendChild(content);

        // Row ids only need to be unique within the page that's on screen.
        // Previously this Set was never cleared, so every Home -> Browse ->
        // Home round trip minted new ids (row-action-2, row-action-3, ...)
        // and the Set grew for the lifetime of the tab.
        _usedRowIds.clear();

        // Let Navigo bind data-navigo links that were just added to the DOM.
        // NOTE: AppRouter/MovieDB/StorageManager are declared with top-level `const` in
        // their own files, so - unlike `var` - they are never attached to `window`.
        // They're still reachable here by bare identifier because all classic
        // (non-module) <script> tags share one global lexical scope.
        if (typeof AppRouter !== 'undefined' && typeof AppRouter.refreshLinks === 'function') {
            AppRouter.refreshLinks();
        }
        // Re-wire slider controls and scroll-reveal for the freshly rendered rows.
        if (window.Slider) window.Slider.initAll();
        if (window.AnimationManager) window.AnimationManager.refresh();
    };

    /**
     * Updates the active state of every favorite button for a given movie
     * (a movie can appear in more than one row at once).
     * @param {string} movieId
     * @param {boolean} isFavorite
     */
    const updateFavoriteButton = (movieId, isFavorite) => {
        const buttons = $all(`.movie-card[data-movie-id="${CSS.escape(movieId)}"] .favorite-btn`);
        buttons.forEach((button) => {
            const icon = button.querySelector('i');
            if (!icon) return;
            if (isFavorite) {
                icon.classList.remove('bi-plus-circle');
                icon.classList.add('bi-check-circle-fill');
                button.setAttribute('aria-label', 'Remove from My List');
            } else {
                icon.classList.remove('bi-check-circle-fill');
                icon.classList.add('bi-plus-circle');
                button.setAttribute('aria-label', 'Add to My List');
            }
        });

        // Also keep the modal's "My List" button in sync if the modal is open.
        const modalBtn = $(`#modal-root .favorite-btn[data-movie-id="${CSS.escape(movieId)}"]`);
        if (modalBtn) {
            const icon = modalBtn.querySelector('i');
            if (icon) {
                icon.className = `bi ${isFavorite ? 'bi-check-circle-fill' : 'bi-plus-circle'}`;
            }
            modalBtn.setAttribute('aria-pressed', String(isFavorite));
        }
    };

    /**
     * Builds the "Browse" genre filter bar.
     * @param {string[]} genres
     * @param {string} activeGenre - 'All' or a genre name
     * @returns {HTMLElement}
     */
    const createGenreFilter = (genres, activeGenre = 'All') => {
        const bar = createElement('div', {
            className: 'genre-filter',
            role: 'toolbar',
            'aria-label': 'Filter by genre',
        });

        ['All', ...genres].forEach((genre) => {
            const isActive = genre.toLowerCase() === activeGenre.toLowerCase();
            const chip = createElement('button', {
                className: `genre-chip${isActive ? ' active' : ''}`,
                type: 'button',
                'data-genre': genre,
                'aria-pressed': String(isActive),
            }, genre);
            bar.appendChild(chip);
        });

        return bar;
    };

    /**
     * Builds a friendly empty state block.
     * @param {string} icon - Bootstrap icon name, without the "bi-" prefix
     * @param {string} heading
     * @param {string} body
     * @param {{label:string, href:string}} [cta]
     * @returns {HTMLElement}
     */
    const createEmptyState = (icon, heading, body, cta) => {
        const ctaHTML = cta
            ? `<a href="${escapeHTML(cta.href)}" class="btn btn-primary" data-navigo>${escapeHTML(cta.label)}</a>`
            : '';
        const wrapper = createElement('div', { className: 'empty-state' });
        wrapper.appendChild(fragmentFromHTML(`
            <i class="bi bi-${escapeHTML(icon)}" aria-hidden="true"></i>
            <h2>${escapeHTML(heading)}</h2>
            <p>${escapeHTML(body)}</p>
            ${ctaHTML}
        `));
        return wrapper;
    };

    // --- Public API ---
    return {
        renderLayout,
        renderView,
        createHeroSection,
        createMovieRow,
        createMovieCard,
        createSkeletonCard,
        createGenreFilter,
        createEmptyState,
        updateFavoriteButton,
        elements: ROOT_ELEMENTS,
    };
})();
