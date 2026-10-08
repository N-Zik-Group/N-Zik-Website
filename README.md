<div align="center">
  <img alt="project's banner" src="./images/ic_banner2.png" width="1080" />

  <h3>📱 <a href="https://github.com/N-Zik-Group/N-Zik">N-Zik App</a> · 🖥️ <a href="https://github.com/N-Zik-Group/N-Zik-Desktop-Compagnon">N-Zik Desktop Compagnon</a></h3>
  <p>
    <b>N-Zik Website</b> is the official website for <a href="https://github.com/N-Zik-Group/N-Zik">N-Zik</a>,
    the multilingual YouTube Music streaming app.
  </p>
  <p>
    Hosted at <a href="https://n-zik.vercel.app/">n-zik.vercel.app</a> - a zero-build static site:
    vanilla HTML, CSS and JavaScript, no framework, no build step.
    Multilingual via <code>res/values-*/strings.xml</code> (46 translated locales + English default).
  </p>
  <p>
    <strong>Note:</strong> This project is based on the website from
    <a href="https://github.com/fast4x/RiMusic">RiMusic</a>.
  </p>
</div>

<br>

<div align="center">
  [![Launched on DevGlobe](./images/devglobe.svg)](https://devglobe.app/projects/n-zik?utm_source=badge&utm_medium=embed)

  <br><br>

  [![Localization Progress](https://badges.crowdin.net/N-Zik/localized.svg)](https://crowdin.com/project/N-Zik) [![License: GPL v3](https://img.shields.io/github/license/N-Zik-Group/n-zik-website?color=blue)](https://www.gnu.org/licenses/gpl-3.0)
  [![CodeFactor](https://www.codefactor.io/repository/github/n-zik-group/n-zik-website/badge)](https://www.codefactor.io/repository/github/n-zik-group/n-zik-website)

</div>

# 📲 Installation

## 🚀 Run It Locally

This is a zero-build static site - no `npm install` needed. Serve the folder with any
static HTTP server, then open the page:

```
python -m http.server 8080
```

> ⚠️ The i18n loader uses `fetch()`, so opening `index.html` directly via `file://`
> breaks language loading - a local HTTP server is required.

## 📁 Structure

```
N-Zik-Website/
├── index.html          # The whole site (single page)
├── css/                # style.css, custom.css, fonts.css
├── js/                 # multilingual.js (i18n), additional.js, reveal.js, scrollreveal.min.js, main.min.js
├── res/                # One strings.xml per locale (values/ = English default, values-*/ = translations)
├── images/             # SVG/PNG assets, download badges, screenshots
├── videos/             # Feature demo videos
├── crowdin.yml         # Crowdin file configuration
├── robots.txt · sitemap.xml · favicon.png
└── LICENSE             # GPLv3
```

---

<div align="center">

## 📚 Wiki

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/N-Zik-Group/N-Zik-Website)

<br>

## 🌍 Community

Join the N-Zik Discord:

<a href="https://discord.gg/bneHC7QRje">
  <img src="https://discord.com/api/guilds/1345079801324634193/widget.png?style=banner2" alt="Discord Server">
</a>

<br>

</div>

# 🎧 Features

- 🌍 **Multilingual Support**: 46 translated locales in `res/` + English default - 35 are selectable in the footer language selector.
- 📥 **Download Hub**: Store badges for GitHub, F-Droid, IzzyOnDroid, OpenAPK, AndroidFreeware, Obtainium and Appteka, plus a dedicated N-Zik Desktop Compagnon section.
- 🎬 **Feature Showcase**: Demo videos walking through the app's main features - lyrics, Discord Rich Presence, offline caching, search, OTA updates, artist pages, playback queue, history and more.
- 🎨 **Theme Presets Gallery**: Preview every visual theme the app ships with.
- ⚡ **Zero Build**: Vanilla HTML/CSS/JavaScript - no framework, no build step, no dependencies.
- 📱 **Fully Responsive**: From phone to widescreen.
- 🔎 **SEO Ready**: `robots.txt`, `sitemap.xml` and semantic single-page markup.

# 🌐 Supported Languages

Thanks to all our amazing contributors!
Here are the languages currently supported:

- 🇿🇦 **Afrikaans**
- 🇸🇦 **Arabic**
- 🇦🇿 **Azerbaijani**
- 🇷🇺 **Bashkir**
- 🇧🇩 **Bangla**
- 🇪🇸 **Catalan**
- 🇨🇿 **Czech**
- 🇩🇰 **Danish**
- 🇩🇪 **German**
- 🇬🇧 **English**
- 🌍 **Esperanto**
- 🇪🇸 **Spanish**
- 🇪🇪 **Estonian**
- 🇪🇸 **Basque**
- 🇫🇮 **Finnish**
- 🇵🇭 **Filipino**
- 🇫🇷 **French**
- 🇮🇪 **Irish**
- 🇪🇸 **Galician**
- 🇮🇱 **Hebrew**
- 🇮🇳 **Hindi**
- 🇭🇺 **Hungarian**
- 🌐 **Interlingua**
- 🇮🇩 **Indonesian**
- 🇮🇹 **Italian**
- 🇯🇵 **Japanese**
- 🇰🇷 **Korean**
- 🇮🇳 **Malayalam**
- 🇳🇱 **Dutch**
- 🇳🇴 **Norwegian**
- 🇮🇳 **Odia**
- 🇵🇱 **Polish**
- 🇵🇹 **Portuguese (Portugal)**
- 🇧🇷 **Portuguese (Brazil)**
- 🇷🇴 **Romanian**
- 🇷🇺 **Russian**
- 🇱🇰 **Sinhala**
- 🇷🇸 **Serbian (Latin)**
- 🇷🇸 **Serbian (Cyrillic)**
- 🇸🇪 **Swedish**
- 🇮🇳 **Tamil**
- 🇮🇳 **Telugu**
- 🇹🇷 **Turkish**
- 🇺🇦 **Ukrainian**
- 🇨🇳 **Chinese (Simplified)**
- 🇹🇼 **Chinese (Traditional)**

## 🌍 Help Translate

Want to:

- Translate into a new language?
- Improve an existing translation?
- Fix typos or inconsistencies?

Join us on Crowdin!

> ❓ Don't see your language?

[![Translated with Crowdin](https://badges.crowdin.net/badge/light/crowdin-on-dark.png)](https://crowdin.com/project/N-Zik)

---

# 🤝 Contributing

## 🛠️ Improve the Website

Pull requests are welcome!
Feel free to fix bugs, enhance features, or suggest new ideas.

## 📜 Clone the repo

Use this command to clone the repo

```
git clone -b main --single-branch https://github.com/N-Zik-Group/N-Zik-Website.git
```

## 🌍 Translations

Translations are managed on [Crowdin](https://crowdin.com/project/N-Zik) (see
[Help Translate](#-help-translate) above).
To add a translation manually: create `res/values-xx/strings.xml` **and** add the language to
the footer language selector in `index.html` (the selector currently lags behind `res/` -
11 translated locales are present in `res/` but not yet selectable in the UI).

# 🫂 Acknowledgements

### 🛠 Based on / Inspired by:

- [**RiMusic**](https://github.com/fast4x/RiMusic): The website this project is based on.
- [**ViMusic**](https://github.com/vfsfitvnm/ViMusic)

### 🔗 Related projects:

- [**N-Zik**](https://github.com/N-Zik-Group/N-Zik): The app this site promotes.
- [**N-Zik Desktop Compagnon**](https://github.com/N-Zik-Group/N-Zik-Desktop-Compagnon)

### 🌍 Platform & Ecosystem:

- [**Crowdin**](https://crowdin.com/): Community translation platform powering 46+ languages.
- [**Vercel**](https://vercel.com/): Hosting and deployments.

# ⚠️ Disclaimer

This project has no relation to the original author of [RiMusic](https://github.com/fast4x/RiMusic).

Furthermore, its contents are not affiliated with, funded, authorized, endorsed by, or in any way associated with YouTube, Google LLC, or any of its affiliates or subsidiaries.

Any trademarks, service marks, trade names, or other intellectual property rights used in this project remain the property of their respective owners.

Made with ❤️ by [NEVARLeVrai](https://github.com/NEVARLeVrai)
Licensed under GPLv3 - see [LICENSE](LICENSE)
