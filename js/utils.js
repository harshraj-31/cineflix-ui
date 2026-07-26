/**
 * @module Utils
 * @description A collection of general utility functions used across the CineFlix application.
 * This file is loaded FIRST (right after Navigo) because storage.js, movies.js, ui.js
 * and router.js all depend on these helpers being globally available.
 */

/**
 * Shorthand querySelector.
 * @param {string} selector
 * @param {ParentNode} [scope=document]
 * @returns {Element|null}
 */
const $ = (selector, scope = document) => scope.querySelector(selector);

/**
 * Shorthand querySelectorAll, returned as a real array (so .forEach/.map/.filter all work).
 * @param {string} selector
 * @param {ParentNode} [scope=document]
 * @returns {Element[]}
 */
const $all = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/**
 * Creates a DOM element with the given attributes/children.
 * Supports className, data- and aria- attributes, and any other DOM property.
 * @param {string} tag
 * @param {object} [attributes={}]
 * @param {Array|Node|string} [children=[]]
 * @returns {HTMLElement}
 */
const createElement = (tag, attributes = {}, children = []) => {
    const el = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key.startsWith('data-') || key.startsWith('aria-')) {
            el.setAttribute(key, value);
        } else {
            el[key] = value;
        }
    });

    const list = Array.isArray(children) ? children : [children];
    list.forEach((child) => {
        if (child === null || child === undefined) return;
        el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });

    return el;
};

/**
 * Converts an HTML string into a DocumentFragment so it can be appended in one call.
 * @param {string} htmlString
 * @returns {DocumentFragment}
 */
const fragmentFromHTML = (htmlString = '') => {
    const template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content;
};

/**
 * Truncates text to a maximum length, breaking cleanly on a word boundary and
 * appending an ellipsis. Returns the original text if it's already short enough.
 * @param {string} text
 * @param {number} [maxLength=150]
 * @returns {string}
 */
const truncateText = (text = '', maxLength = 150) => {
    if (!text || text.length <= maxLength) return text || '';
    const sliced = text.slice(0, maxLength);
    const lastSpace = sliced.lastIndexOf(' ');
    return `${sliced.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
};

/**
 * Escapes HTML-significant characters so untrusted/data-driven strings can be
 * safely interpolated into template-string markup (innerHTML) without risking
 * markup/attribute breakout.
 * @param {string} value
 * @returns {string}
 */
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}[ch]));

/**
 * Safely parses a JSON string, returning null instead of throwing on invalid input.
 * @param {string} jsonString
 * @returns {any|null}
 */
const safeJsonParse = (jsonString) => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('safeJsonParse: could not parse value', error);
        return null;
    }
};

/**
 * Returns a random item from an array (or null for an empty/invalid array).
 * @param {Array} array
 * @returns {*}
 */
const getRandomItem = (array = []) => (array.length ? array[Math.floor(Math.random() * array.length)] : null);

/**
 * Returns a new, randomly-shuffled copy of an array (Fisher–Yates). Does not mutate the input.
 * @param {Array} array
 * @returns {Array}
 */
const shuffleArray = (array = []) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

/**
 * Converts a string into a URL/ID-friendly slug.
 * @param {string} text
 * @returns {string}
 */
const slugify = (text = '') => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

/**
 * Standard debounce helper - handy for scroll/resize/input listeners.
 * @param {Function} fn
 * @param {number} [delay=200]
 * @returns {Function}
 */
const debounce = (fn, delay = 200) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

// This project uses plain <script> tags (no bundler/ES modules), so every helper
// is attached to window explicitly, in addition to existing as a top-level const
// for scripts loaded later in the same global scope.
Object.assign(window, {
    $,
    $all,
    createElement,
    fragmentFromHTML,
    truncateText,
    escapeHTML,
    safeJsonParse,
    getRandomItem,
    shuffleArray,
    slugify,
    debounce,
});
