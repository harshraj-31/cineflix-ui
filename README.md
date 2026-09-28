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
- **Artwork for all 36 titles** as optimized WebP (posters ~37 KB each), with a generated fallback if an image is ever missing
- **Accessible**: keyboard-navigable cards, focus-trapped dialogs, skip link, screen-reader labels, and `prefers-reduced-motion` support
- **Touch-friendly**: tap any card to open its details
- Responsive from small phones to large desktops

---

## Preview

| Home | Browse by genre |
| --- | --- |
| ![Home page with hero banner](docs/screenshots/home.webp) | ![Browse page filtered to Sci-Fi](docs/screenshots/browse.webp) |
| **Movie details** | **Search** |
| ![Movie detail modal](docs/screenshots/modal.webp) | ![Search results for a cast name](docs/screenshots/search.webp) |
| **Movie rows** | **Light theme** |
| ![Trending and New Releases rows](docs/screenshots/rows.webp) | ![Light theme movie details](docs/screenshots/light.webp) |

**Mobile**

![Home, Browse and movie details on a phone](docs/screenshots/mobile.webp)

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
│   ├── hero/            # 1920x815 banner images (.webp)
│   ├── posters/         # 500x750 poster images (.webp)
│   └── profile-avatar.svg
│
├── docs/
│   └── screenshots/     # images used in this README
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
- Poster and banner artwork for every title
- Image optimization: WebP, right-sized posters, lazy-loaded cards, high-priority hero
- Screenshots in this README
- UI polish pass across desktop, tablet and phone in both themes

### In Progress

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
- [x] Enhance responsiveness (touch support, 320px phones and up)
- [x] Add artwork for all 36 titles
- [x] Optimize images (WebP, right-sized posters)
- [x] Add screenshots to this README
- [x] Complete UI polish
- [ ] Deploy live demo (GitHub Pages)

---

## Author

**Harshrajsinh Zala**

GitHub: https://github.com/harshraj-31

---

Built as a frontend development project to practice responsive web design, modern UI development, and modular JavaScript architecture.
