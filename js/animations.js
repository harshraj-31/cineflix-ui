/**
 * @module AnimationManager
 * @description Drives the scroll-reveal behaviour for elements with the
 * `.reveal` class (see animations.css .reveal / .reveal.active).
 */
const AnimationManager = (() => {
    let observer = null;

    /**
     * (Re)scans the DOM for `.reveal` elements and observes any that aren't
     * already visible. Safe to call repeatedly, e.g. after every route change.
     */
    const refresh = () => {
        if (!('IntersectionObserver' in window)) {
            // Fallback for very old browsers: just show everything.
            $all('.reveal').forEach((el) => el.classList.add('active'));
            return;
        }

        if (!observer) {
            observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });
        }

        $all('.reveal:not(.active)').forEach((el) => observer.observe(el));
    };

    /**
     * Sets up the initial observer and keeps watching for new content
     * injected by the router (movie rows are added dynamically per page).
     */
    const init = () => {
        refresh();
        const viewRoot = $('#view-root');
        if (viewRoot) {
            const mutationObserver = new MutationObserver(debounce(refresh, 150));
            mutationObserver.observe(viewRoot, { childList: true, subtree: true });
        }
    };

    return { init, refresh };
})();
window.AnimationManager = AnimationManager;

/**
 * @module Toast
 * @description Lightweight toast notification helper for #toast-root.
 * Styling lives in the "Toast" section appended to the bottom of style.css.
 */
const Toast = (() => {
    const root = $('#toast-root');

    /**
     * Shows a toast message for a few seconds.
     * @param {string} message
     * @param {'info'|'success'|'error'} [type='info']
     * @param {number} [duration=3000]
     */
    const show = (message, type = 'info', duration = 3000) => {
        if (!root) return;

        const toast = createElement('div', { className: `toast toast-${type}` }, message);
        root.appendChild(toast);

        // Force a reflow so the transition to `.show` actually animates.
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    return { show };
})();
window.Toast = Toast;
