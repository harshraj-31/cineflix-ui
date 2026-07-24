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

        const updateButtons = () => {
            const maxScroll = row.scrollWidth - row.clientWidth - 2;
            if (prevBtn) prevBtn.disabled = row.scrollLeft <= 0;
            if (nextBtn) nextBtn.disabled = row.scrollLeft >= maxScroll;
        };

        prevBtn?.addEventListener('click', () => {
            row.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
        });

        nextBtn?.addEventListener('click', () => {
            row.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
        });

        row.addEventListener('scroll', debounce(updateButtons, 80));
        window.addEventListener('resize', debounce(updateButtons, 150));
        updateButtons();
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
