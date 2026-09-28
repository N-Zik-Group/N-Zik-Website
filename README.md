# N-Zik Website

Official website for **N-Zik**, hosted at [n-zik.vercel.app](https://n-zik.vercel.app/).

> **Note:** This project is based on the website from **[RiMusic](https://github.com/fast4x/RiMusic)**

## About

**N-Zik** is a multilingual Android application for streaming music from YouTube Music,
with performance improvements, UI/UX refinement, bug fixes, and new features.

## Tech Stack

- HTML / CSS / JavaScript (vanilla — no framework, no build step)
- Multilingual support via `res/values-*/strings.xml` (46 translated locales + English default)

## Run It Locally

This is a zero-build static site — no `npm install` needed. Serve the folder with any
static HTTP server, then open the page:

```
python -m http.server 8080
```

> ⚠️ The i18n loader uses `fetch()`, so opening `index.html` directly via `file://`
> breaks language loading — a local HTTP server is required.

## Structure

```
N-Zik-Website/
├── index.html          # The whole site (single page)
├── css/                # style.css, custom.css, fonts.css
├── js/                 # multilingual.js (i18n), additional.js, reveal.js, scrollreveal.min.js, main.min.js
├── res/                # One strings.xml per locale (values/ = English default, values-*/ = translations)
├── images/             # SVG/PNG assets, download badges, screenshots
├── videos/             # Feature demo videos
├── robots.txt · sitemap.xml · favicon.png
└── LICENSE             # GPLv3
```

To add a translation: create `res/values-xx/strings.xml` **and** add the language to the
footer language selector in `index.html` (the selector currently lags behind `res/` —
11 translated locales are present in `res/` but not yet selectable in the UI).

## Links

- **N-Zik App:** https://github.com/N-Zik-Group/N-Zik
- **RiMusic:** https://github.com/fast4x/RiMusic
- **ViMusic:** https://github.com/vfsfitvnm/ViMusic

## License

Licensed under **GPLv3** - see [LICENSE](LICENSE) for details.
