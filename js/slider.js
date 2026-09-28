/**
 * @module Slider
 * @description Wires up the prev/next slider-btn controls (see cards.css .slider-controls)
 * so each .movie-row can be scrolled horizontally. Also keeps the buttons' disabled
 * state in sync with scroll position.
 */
const Slider = (() => {
    const SCROLL_AMOUNT = 640;
    const wired = new WeakSet();

    /**
     * @private
     * @param {HTMLElement} section - a .movie-section element
     */
    const _wireSection = (section) => {
        const row = $('.movie-row', section);
        const prevBtn = $('.slider-btn.prev', section);
        const nextBtn = $('.slider-btn.next', section);

        if (!row || wired.has(row)) return;
        wired.add(row);

        const controls = $('.slider-controls', section);

        // Keeps the arrows' disabled state, the edge fades (cards.css
        // .fade-left / .fade-right) and the "nothing to scroll" state in sync
        // with where the row actually is.
        const updateButtons = () => {
            // 8px of slack: rows have a little padding and, on touch screens,
            // scroll-snap parks the first card a few pixels in (scrollLeft 4),
            // which used to count as "scrolled" and faded the first card.
            const maxScroll = row.scrollWidth - row.clientWidth;
            const atStart = row.scrollLeft <= 8;
            const atEnd = row.scrollLeft >= maxScroll - 8;
            if (prevBtn) prevBtn.disabled = atStart;
            if (nextBtn) nextBtn.disabled = atEnd;
            row.classList.toggle('fade-left', !atStart);
            row.classList.toggle('fade-right', !atEnd);
            controls?.classList.toggle('is-idle', maxScroll <= 8);
        };

        // Page by (almost) one visible width of cards rather than a fixed
        // 640px, which moved 3 cards on a laptop but less than 1 screen on
        // a wide monitor.
        const pageSize = () => Math.max(SCROLL_AMOUNT, row.clientWidth * 0.85);

        prevBtn?.addEventListener('click', () => {
            row.scrollBy({ left: -pageSize(), behavior: 'smooth' });
        });

        nextBtn?.addEventListener('click', () => {
            row.scrollBy({ left: pageSize(), behavior: 'smooth' });
        });

        row.addEventListener('scroll', debounce(updateButtons, 60), { passive: true });
        // A ResizeObserver per row instead of a window 'resize' listener: the
        // old listeners were never removed, so every page change stacked up
        // another batch of handlers pointing at rows that no longer existed.
        if ('ResizeObserver' in window) {
            new ResizeObserver(debounce(updateButtons, 100)).observe(row);
        } else {
            window.addEventListener('resize', debounce(updateButtons, 150));
        }
        updateButtons();
        // Rows are measured before fonts/layout fully settle on first paint;
        // re-check once the frame after that.
        requestAnimationFrame(updateButtons);
    };

    /**
     * Scans the DOM for every movie row and wires up its controls.
     * Safe to call repeatedly (e.g. after every route change) - already-wired
     * rows are skipped.
     */
    const initAll = () => {
        $all('.movie-section').forEach(_wireSection);
    };

    return { initAll };
})();
window.Slider = Slider;
