# CineFlix UI

A modern movie streaming web application built with **HTML**, **CSS**, and **Vanilla JavaScript**.

CineFlix UI delivers a premium streaming experience inspired by modern OTT platforms through a clean interface, reusable components, responsive layouts, and modular JavaScript architecture.

> **Project Status:** Active Development 🚧  
> New features, UI enhancements, and bug fixes are continuously being implemented.

---

## Features

- **Single-page app** with hash-based routing and shareable URLs for every page, genre, and movie
- **Hero banner** featuring a random trending title on each visit
- **Curated rows**: Continue Watching, Recently Viewed, Trending, New Releases, Popular, Top Rated, and genre rows
- **Browse by genre** with filter chips (`#/browse/Sci-Fi` links straight to a filtered grid)
- **Smart search** across titles, cast, directors, genres, and years, ranked by relevance
- **Movie detail modal** with cast, genres, director, writers, awards, box office, and "More Like This"
- **My List** (favorites) and **Continue Watching** saved in `localStorage`
- **Light / dark theme** toggle, remembered between visits
- **Generated poster art** for any title without an image file, so no card ever shows a broken image
- **Accessible**: keyboard-navigable cards, focus-trapped dialogs, skip link, screen-reader labels, and `prefers-reduced-motion` support
- **Touch-friendly**: tap any card to open its details
- Responsive from small phones to large desktops

---

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `/` | Open search |
| `Enter` (in search) | Open the top result |
| `Esc` | Close the modal, search, or menus (top-most first) |
| `Tab` | Move between card actions; stays inside open dialogs |

---

## Routes

| URL | View |
| --- | --- |
| `#/` | Home |
| `#/browse` | All genres as rows |
| `#/browse/:genre` | One genre as a grid, sorted by rating |
| `#/my-list` | Saved favorites |
| `#/movie/:id` | Movie details (opens over the current page) |

---

## Tech Stack

- HTML5
- CSS3 (custom properties, grid, `:has()`, `:focus-visible`)
- JavaScript (ES6+, no build step)
- [Navigo](https://github.com/krasimir/navigo) for routing, the only JS dependency
- Bootstrap Icons
- Local Storage API

---

## Project Structure

```text
cineflix/
│
├── assets/
│   ├── hero/            # 16:9 banner images
│   ├── posters/         # 2:3 poster images
│   └── *.svg            # avatar + legacy placeholders
│
├── css/
│   ├── variables.css    # design tokens + light theme overrides
│   ├── style.css        # base, buttons, footer, toasts, grids, empty states
│   ├── navbar.css       # navbar, mobile menu, search overlay
│   ├── hero.css
│   ├── cards.css        # movie cards, rows, sliders
│   ├── modal.css
│   ├── animations.css
│   ├── responsive.css
│   └── utilities.css
│
├── js/
│   ├── utils.js         # DOM helpers, artwork generator, scroll lock, focus trap
│   ├── storage.js       # StorageManager  - favorites, continue watching, theme
│   ├── movies.js        # MovieDB         - catalog data, filters, search
│   ├── ui.js            # UIManager       - navbar, footer, hero, cards, rows
│   ├── router.js        # AppRouter       - routes and page rendering
│   ├── slider.js        # Slider          - row scroll buttons
│   ├── search.js        # SearchManager   - search overlay
│   ├── modal.js         # ModalManager    - movie detail dialog
│   ├── animations.js    # AnimationManager + Toast
│   └── app.js           # entry point and global event handling
│
├── index.html
└── README.md
```

---

## Current Progress

### Completed

- Responsive homepage with hero and curated rows
- Browse page with genre filters
- Movie detail modal with deep links
- Search across title, cast, director, genre, and year
- My List, Continue Watching, and Recently Viewed
- Light / dark theme
- Keyboard, screen-reader, and touch accessibility pass
- Generated artwork for titles without images

### In Progress

- Real poster art for the remaining catalog titles
- Performance optimization (image sizes, lazy loading of hero)
- Additional movie categories

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/harshraj-31/cineflix-ui.git
```

Navigate to the project folder and open **index.html** in your preferred web browser.

No additional installation or dependencies are required. (An internet connection is needed the first time for Google Fonts, Bootstrap Icons, and Navigo from their CDNs.)

---

## Roadmap

- [x] Improve search experience
- [x] Improve accessibility
- [x] Add more movie categories (Top Rated, Recently Viewed, genre filters)
- [x] Enhance responsiveness (touch support)
- [ ] Complete UI polish
- [ ] Add real artwork for all 36 titles
- [ ] Optimize images (WebP, responsive `srcset`)
- [ ] Add screenshots to this README
- [ ] Deploy live demo (GitHub Pages)

---

## Author

**Harshrajsinh Zala**

GitHub: https://github.com/harshraj-31

---

Built as a frontend development project to practice responsive web design, modern UI development, and modular JavaScript architecture.
