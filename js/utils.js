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

/**
 * Formats a runtime in minutes as "2h 28m" (or "48m" when under an hour).
 * @param {number} minutes
 * @returns {string}
 */
const formatRuntime = (minutes = 0) => {
    const total = Number(minutes) || 0;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return hours ? `${hours}h ${mins}m` : `${mins}m`;
};

/* ----------------------------------------------------------------------
   Generated poster / banner artwork
   ----------------------------------------------------------------------
   Fallback for any movie whose image file is missing (e.g. a title added
   to movies.js before its artwork exists). Instead of one flat grey
   placeholder for every such card, we synthesize a poster per movie: a
   deterministic two-stop gradient (hue derived from the title, so a given
   movie always gets the same artwork) with the title set over it. It's a
   data: URI, so there's no extra network request.
   ---------------------------------------------------------------------- */

/**
 * Turns a string into a stable 32-bit hash. Used to pick artwork colors
 * so the same title always yields the same poster.
 * @private
 * @param {string} text
 * @returns {number}
 */
const _hashString = (text = '') => {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0; // force 32-bit
    }
    return Math.abs(hash);
};

/**
 * Splits a title into lines that fit the generated poster's width.
 * @private
 * @param {string} title
 * @param {number} perLine - rough max characters per line
 * @returns {string[]}
 */
const _wrapTitle = (title = '', perLine = 14) => {
    const words = String(title).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > perLine && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    });
    if (current) lines.push(current);

    return lines.slice(0, 4);
};

/**
 * Builds a generated artwork data: URI for a movie.
 * @param {object} movie
 * @param {'poster'|'hero'} [variant='poster']
 * @returns {string} A `data:image/svg+xml,...` URL.
 */
const generateArtwork = (movie, variant = 'poster') => {
    const title = movie?.title || 'CineFlix';
    const hash = _hashString(title);
    const hue = hash % 360;
    const hue2 = (hue + 42) % 360;

    const isHero = variant === 'hero';
    const width = isHero ? 1280 : 400;
    const height = isHero ? 720 : 600;
    const fontSize = isHero ? 74 : 38;
    const lines = _wrapTitle(title, isHero ? 22 : 13);
    const lineHeight = fontSize * 1.18;

    // Center the title block vertically.
    const blockTop = height / 2 - ((lines.length - 1) * lineHeight) / 2;

    const tspans = lines
        .map((line, i) => {
            const y = blockTop + i * lineHeight;
            return `<tspan x="50%" y="${y.toFixed(1)}">${escapeHTML(line)}</tspan>`;
        })
        .join('');

    const year = movie?.year ? `<text x="50%" y="${(blockTop + lines.length * lineHeight + fontSize * 0.7).toFixed(1)}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="${(fontSize * 0.42).toFixed(0)}" fill="rgba(255,255,255,.62)" letter-spacing="4">${escapeHTML(String(movie.year))}</text>` : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
        <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="hsl(${hue},48%,26%)"/>
                <stop offset="100%" stop-color="hsl(${hue2},55%,11%)"/>
            </linearGradient>
            <radialGradient id="v" cx="50%" cy="38%" r="72%">
                <stop offset="0%" stop-color="rgba(255,255,255,.16)"/>
                <stop offset="100%" stop-color="rgba(0,0,0,.45)"/>
            </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#g)"/>
        <rect width="${width}" height="${height}" fill="url(#v)"/>
        ${isHero
            // Banners sit right behind the page's own <h1>/<h2> title, so
            // they get soft light shapes instead of repeating the title.
            ? `<circle cx="${width * 0.78}" cy="${height * 0.3}" r="${height * 0.55}" fill="hsla(${hue2},70%,60%,.10)"/>
               <circle cx="${width * 0.62}" cy="${height * 0.9}" r="${height * 0.4}" fill="hsla(${hue},70%,55%,.08)"/>`
            : `<text text-anchor="middle" font-family="Poppins,Inter,system-ui,sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">${tspans}</text>${year}`}
    </svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
};

/* ----------------------------------------------------------------------
   Shared body scroll lock
   ----------------------------------------------------------------------
   ModalManager and SearchManager each used to set and clear
   `document.body.style.overflow` directly. Opening search on top of an
   open modal and then closing search unlocked the page behind the modal,
   which could then be scrolled. A counter makes the lock nest properly:
   the page only scrolls again once every owner has released it.
   ---------------------------------------------------------------------- */
let _scrollLocks = 0;

/** Prevents the page behind an overlay from scrolling. */
const lockScroll = () => {
    _scrollLocks += 1;
    document.body.style.overflow = 'hidden';
};

/** Releases one scroll lock; restores scrolling when none are left. */
const unlockScroll = () => {
    _scrollLocks = Math.max(0, _scrollLocks - 1);
    if (_scrollLocks === 0) document.body.style.overflow = '';
};

// Elements explicitly removed from the tab order (tabindex="-1", e.g. the
// card title links) must be excluded, or the trap mistakes one of them for
// the "last" stop and never wraps focus back to the top.
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]',
].map((sel) => `${sel}:not([tabindex="-1"])`).join(',');

/**
 * Keeps Tab / Shift+Tab inside a container while it's open. Without this a
 * dialog marked `aria-modal="true"` still lets keyboard users tab straight
 * out into the page behind it, which is the single most common a11y bug in
 * hand-rolled modals.
 * @param {HTMLElement} container
 * @returns {Function} A cleanup function that removes the listener.
 */
const trapFocus = (container) => {
    if (!container) return () => {};

    const onKeydown = (e) => {
        if (e.key !== 'Tab') return;

        const focusable = $all(FOCUSABLE_SELECTOR, container)
            .filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    container.addEventListener('keydown', onKeydown);
    return () => container.removeEventListener('keydown', onKeydown);
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
    formatRuntime,
    generateArtwork,
    lockScroll,
    unlockScroll,
    trapFocus,
});
