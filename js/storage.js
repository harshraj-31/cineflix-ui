/**
 * @module StorageManager
 * @description Manages all interactions with the browser's localStorage.
 * This module provides a safe and structured way to handle client-side
 * data persistence for user preferences and application state, such as
 * favorites, continue watching list, and theme settings.
 */
const StorageManager = (() => {
    // Define keys for localStorage to prevent magic strings and ensure consistency.
    const KEYS = {
        FAVORITES: 'cineflix-favorites',
        CONTINUE_WATCHING: 'cineflix-continue-watching',
        RECENTLY_VIEWED: 'cineflix-recently-viewed',
        THEME: 'cineflix-theme',
    };

    // Define default values for a clean state initialization.
    const DEFAULTS = {
        FAVORITES: [],
        CONTINUE_WATCHING: [],
        RECENTLY_VIEWED: [],
        THEME: 'dark', // Default theme
    };

    // In-memory cache of the storage state to reduce localStorage reads.
    let state = {};

    /**
     * Safely retrieves an item from localStorage.
     * @private
     * @param {string} key - The key of the item to retrieve.
     * @returns {any} The parsed value or null if not found or on error.
     */
    const _getItem = (key) => {
        try {
            const value = localStorage.getItem(key);
            // Using safeJsonParse from helpers.js (assumed to be globally available)
            return value ? safeJsonParse(value) : null;
        } catch (error) {
            console.error(`Error reading from localStorage for key "${key}":`, error);
            return null;
        }
    };

    /**
     * Safely sets an item in localStorage.
     * @private
     * @param {string} key - The key of the item to set.
     * @param {any} value - The value to store. It will be stringified.
     */
    const _setItem = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing to localStorage for key "${key}":`, error);
            // Here you could add more robust error handling, like notifying the user.
        }
    };

    /**
     * Commits a specific part of the in-memory state to localStorage.
     * @private
     * @param {string} key - The state key (e.g., 'FAVORITES').
     */
    const _commit = (key) => {
        _setItem(KEYS[key], state[key]);
    };

    /**
     * Initializes the storage manager.
     * It loads data from localStorage into the in-memory state.
     * If data is missing or corrupt, it initializes with default values.
     */
    const init = () => {
        Object.keys(KEYS).forEach(key => {
            const storageKey = KEYS[key];
            const storedValue = _getItem(storageKey);

            if (storedValue !== null) {
                state[key] = storedValue;
            } else {
                // If nothing is in storage, initialize with default and save it.
                state[key] = DEFAULTS[key];
                _commit(key);
            }
        });
    };

    // --- Favorites Management ---

    /**
     * Retrieves the list of favorite movie IDs.
     * @returns {string[]} An array of movie IDs.
     */
    const getFavorites = () => [...state.FAVORITES];

    /**
     * Checks if a movie is in the user's favorites.
     * @param {string} movieId - The ID of the movie to check.
     * @returns {boolean} True if the movie is a favorite, false otherwise.
     */
    const isFavorite = (movieId) => state.FAVORITES.includes(movieId);

    /**
     * Adds a movie to the favorites list.
     * @param {string} movieId - The ID of the movie to add.
     */
    const addFavorite = (movieId) => {
        if (!isFavorite(movieId)) {
            state.FAVORITES.push(movieId);
            _commit('FAVORITES');
        }
    };

    /**
     * Removes a movie from the favorites list.
     * @param {string} movieId - The ID of the movie to remove.
     */
    const removeFavorite = (movieId) => {
        const index = state.FAVORITES.indexOf(movieId);
        if (index > -1) {
            state.FAVORITES.splice(index, 1);
            _commit('FAVORITES');
        }
    };

    /**
     * Toggles a movie's favorite status.
     * @param {string} movieId - The ID of the movie to toggle.
     * @returns {boolean} The new favorite status (true if added, false if removed).
     */
    const toggleFavorite = (movieId) => {
        if (isFavorite(movieId)) {
            removeFavorite(movieId);
            return false;
        } else {
            addFavorite(movieId);
            return true;
        }
    };

    // --- Continue Watching Management ---

    /**
     * Retrieves the list of movies to continue watching.
     * @returns {Array<object>} An array of objects, e.g., { id, progress, lastWatched }.
     */
    const getContinueWatching = () => [...state.CONTINUE_WATCHING];

    /**
     * Updates or adds a movie to the "Continue Watching" list.
     * @param {string} movieId - The ID of the movie.
     * @param {number} progress - The viewing progress (e.g., percentage 0-100).
     */
    const updateContinueWatching = (movieId, progress) => {
        const now = new Date().toISOString();
        const existingIndex = state.CONTINUE_WATCHING.findIndex(item => item.id === movieId);

        if (existingIndex > -1) {
            // Update existing entry
            state.CONTINUE_WATCHING[existingIndex].progress = progress;
            state.CONTINUE_WATCHING[existingIndex].lastWatched = now;
        } else {
            // Add new entry
            state.CONTINUE_WATCHING.push({ id: movieId, progress, lastWatched: now });
        }

        // Sort by most recently watched
        state.CONTINUE_WATCHING.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));

        _commit('CONTINUE_WATCHING');
    };
    
    /**
     * Removes a movie from the "Continue Watching" list.
     * @param {string} movieId - The ID of the movie to remove.
     */
    const removeFromContinueWatching = (movieId) => {
        state.CONTINUE_WATCHING = state.CONTINUE_WATCHING.filter(item => item.id !== movieId);
        _commit('CONTINUE_WATCHING');
    };

    // --- Recently Viewed Management ---

    const MAX_RECENTLY_VIEWED = 15; // Keep a list of the last 15 viewed items.

    /**
     * Retrieves the list of recently viewed movie IDs.
     * @returns {string[]} An array of movie IDs.
     */
    const getRecentlyViewed = () => [...state.RECENTLY_VIEWED];

    /**
     * Adds a movie to the "Recently Viewed" list.
     * If the movie is already in the list, it's moved to the front.
     * The list is capped at a maximum size.
     * @param {string} movieId - The ID of the movie to add.
     */
    const addRecentlyViewed = (movieId) => {
        // Remove the movie if it already exists to avoid duplicates and move it to the front.
        const existingIndex = state.RECENTLY_VIEWED.indexOf(movieId);
        if (existingIndex > -1) {
            state.RECENTLY_VIEWED.splice(existingIndex, 1);
        }

        // Add the movie to the beginning of the array.
        state.RECENTLY_VIEWED.unshift(movieId);

        // Ensure the list does not exceed the maximum size.
        if (state.RECENTLY_VIEWED.length > MAX_RECENTLY_VIEWED) {
            state.RECENTLY_VIEWED.pop();
        }

        _commit('RECENTLY_VIEWED');
    };

    // --- Theme Management ---

    /**
     * Gets the current theme.
     * @returns {string} The name of the current theme.
     */
    const getTheme = () => state.THEME;

    /**
     * Sets the application theme.
     * @param {string} themeName - The name of the theme to set.
     */
    const setTheme = (themeName) => {
        state.THEME = themeName;
        _commit('THEME');
        // This could be expanded to apply the theme to the document.
        // e.g., document.documentElement.setAttribute('data-theme', themeName);
    };

    // Public API
    return {
        init,
        getFavorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        getContinueWatching,
        updateContinueWatching,
        removeFromContinueWatching,
        getRecentlyViewed,
        addRecentlyViewed,
        getTheme,
        setTheme,
    };
})();