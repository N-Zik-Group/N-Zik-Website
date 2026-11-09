class Multilingual {
  static catalogFiles = [
    "strings_home.xml",
    "strings_features.xml",
    "strings_download.xml",
    "strings_footer.xml",
  ];

  static sessionPreferences = new Map();

  static readPreference(key) {
    if (this.sessionPreferences.has(key)) return this.sessionPreferences.get(key);
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  static writePreference(key, value) {
    const text = String(value);
    this.sessionPreferences.set(key, text);
    try {
      localStorage.setItem(key, text);
    } catch {
      // Keep the preference for the current page when storage is unavailable.
    }
  }

  language;
  defaultValues = {};
  fixedNames = new Set();
  defaultCatalogComplete = false;
  htmlFallbacksCaptured = false;
  selectedValues = {};
  loadVersion = 0;
  constructor(supported) {
    this.supported = supported;
    const saved = Multilingual.readPreference("language");
    this.language = this.resolveLanguage(saved || navigator.language || navigator.userLanguage || "en");
    if (saved && saved !== this.language) {
      Multilingual.writePreference("language", this.language);
    }
  }

  resolveLanguage(language) {
    const code = language.toLowerCase().replaceAll("_", "-");
    const find = (candidate) => this.supported.find((value) => value.toLowerCase() === candidate);
    const exact = find(code);
    if (exact) return exact;
    const [base, ...subtags] = code.split("-");
    let candidate = base;
    if (base === "zh") {
      const traditional = subtags.includes("hant") ||
        (!subtags.includes("hans") && subtags.some((part) => ["tw", "hk", "mo"].includes(part)));
      candidate = traditional ? "zh-rtw" : "zh-rcn";
    } else if (base === "sr" && /(?:^|-)(latn|cs)(?:-|$)/.test(code)) {
      candidate = "sr-rcs";
    } else if (base === "pt" && /^(?:[a-z]{4}-)?br(?:-|$)/.test(subtags.join("-"))) {
      candidate = "pt-rbr";
    } else if (base === "nb" || base === "nn") {
      candidate = "no";
    } else if (base === "in" || base === "iw") {
      candidate = base === "in" ? "id" : "he";
    }
    return find(candidate) || find(base) || "en";
  }

  _decode(string) {
    return string
      .replace(/\\n/g, "\n")
      .replaceAll("\\'", "'")
      .replaceAll('\\"', '"')
      .replaceAll("\\\\", "\\")
      .replaceAll("\\t", "\t");
  }
  captureHtmlFallbacks() {
    if (this.htmlFallbacksCaptured) return;
    for (const el of document.body.getElementsByTagName("*")) {
      const name = el.getAttribute("name");
      const text = el.textContent?.trim().replace(/\s+/g, " ");
      if (name && text) this.defaultValues[name] ??= text;
      for (const attribute of ["alt", "aria-label"]) {
        const key = el.getAttribute("data-i18n-" + attribute);
        const value = key && el.getAttribute(attribute);
        if (value) this.defaultValues[key] ??= value;
      }
    }
    this.htmlFallbacksCaptured = true;
  }
  async loadStrings(lang) {
    this.captureHtmlFallbacks();
    const language = this.resolveLanguage(lang || this.language);
    const version = ++this.loadVersion;
    this.language = language;
    const readValues = async (path, optional, fixedNames) => {
      const response = await fetch(path);
      if (optional && response.status === 404) return {};
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      const xml = new DOMParser().parseFromString(await response.text(), "text/xml");
      if (xml.querySelector("parsererror")) throw new Error(`Invalid XML: ${path}`);
      const values = {};
      for (const string of xml.getElementsByTagName("string")) {
        const name = string.getAttribute("name");
        values[name] = this._decode(string.textContent);
        if (!optional && string.getAttribute("translatable") === "false") fixedNames.add(name);
      }
      return values;
    };
    const readCatalog = async (directory, optional = false) => {
      const fixedNames = new Set();
      const results = await Promise.allSettled(Multilingual.catalogFiles.map(
        (file) => readValues(`${directory}/${file}`, optional, fixedNames),
      ));
      const values = {};
      for (const result of results) {
        if (result.status === "fulfilled") Object.assign(values, result.value);
        else console.warn(result.reason);
      }
      return { values, fixedNames, complete: results.every((result) => result.status === "fulfilled") };
    };
    const defaults = this.defaultCatalogComplete
      ? Promise.resolve({ values: this.defaultValues, fixedNames: this.fixedNames, complete: true })
      : readCatalog("localization/source");
    const selected = language === "en"
      ? Promise.resolve({ values: {} })
      : readCatalog(`localization/translations/${language}`, true);
    const [defaultCatalog, { values: selectedValues }] = await Promise.all([defaults, selected]);
    if (version !== this.loadVersion) return;
    this.defaultValues = { ...this.defaultValues, ...defaultCatalog.values };
    for (const name of defaultCatalog.fixedNames) this.fixedNames.add(name);
    this.defaultCatalogComplete = defaultCatalog.complete;
    this.selectedValues = selectedValues;
    if (lang) {
      this.updateDom();
      if (document.documentElement) this.setAttribute(document.documentElement);
    }
  }
  catalogLocale() {
    return this.language === "sr-rCS" ? "sr-Latn" : this.language.replace(/-r([A-Z]{2})$/, "-$1");
  }
  hasTranslation(name) {
    return !this.fixedNames.has(name) && Boolean(this.selectedValues[name]?.trim());
  }
  stringLanguage(name) {
    return this.hasTranslation(name) ? this.catalogLocale() : "en";
  }
  getString(name) {
    return this.hasTranslation(name) ? this.selectedValues[name] : this.defaultValues[name];
  }
  updateDom() {
    const allElements = Array.prototype.slice.call(
      document.body.getElementsByTagName("*"),
    );
    allElements.forEach((el) => {
      const name = el.getAttribute("name");
      if (name) {
        const value = this.getString(name);
        if (value) {
          const language = this.stringLanguage(name);
          el.setAttribute("lang", language);
          el.setAttribute("dir", this.directionFor(language));
          const lines = value.split("\n");
          el.replaceChildren(...lines.flatMap((line, index) =>
            index ? [document.createElement("br"), line] : [line],
          ));
        }
      }
      for (const attribute of ["alt", "aria-label"]) {
        const key = el.getAttribute("data-i18n-" + attribute);
        const value = key && this.getString(key);
        if (value) {
          el.setAttribute(attribute, value);
          el.setAttribute("lang", this.stringLanguage(key));
        }
      }
    });
    const labelled = 'video[aria-labelledby], [role="group"][aria-labelledby], #homeLink[aria-labelledby]';
    for (const el of document.body.querySelectorAll(labelled)) {
      const label = document.getElementById(el.getAttribute("aria-labelledby"));
      const language = label?.getAttribute("lang");
      if (language) el.setAttribute("lang", language);
    }
    const links = 'a[href]:not([aria-label]):not([aria-labelledby])';
    for (const link of document.body.querySelectorAll(links)) {
      if (link.childElementCount !== 1) continue;
      const child = link.firstElementChild;
      const label = child.matches(".localized-badge") ? child.lastElementChild : child;
      if (label === child && (link.textContent.trim() || !child.matches("img[data-i18n-alt]:not([aria-hidden=true])"))) continue;
      const language = label.getAttribute("lang");
      if (language) link.setAttribute("lang", language);
    }
    if (typeof updateThemeIcon === "function") updateThemeIcon();
  }
  updateLanguageLabels() {
    const option = Array.from(document.getElementById("langOption").children)
      .find((button) => button.dataset.locale === this.language);
    if (!option) return;
    for (const id of ["footerLangText", "headerLangText"]) {
      const label = document.getElementById(id);
      label.textContent = option.textContent;
      label.lang = option.lang;
    }
  }
  directionFor(language) {
    return /^(ar|fa|he)(-|$)/.test(language) ? "rtl" : "ltr";
  }
  setAttribute(el) {
    const locale = this.catalogLocale();
    el.setAttribute("lang", locale);
    const direction = this.directionFor(locale);
    el.setAttribute("dir", direction);
    this.updateCampaignBanner(locale, direction);
  }
  updateCampaignBanner(locale, direction) {
    const frame = document.getElementById?.("keep-android-open-banner");
    if (!frame || frame.dataset.locale === locale) return;
    const dismissKey = "kao-banner-hidden";
    const dismissedAt = Number(Multilingual.readPreference(dismissKey));
    if (Date.now() - dismissedAt < 30 * 24 * 60 * 60 * 1000) return;
    frame.dataset.locale = locale;
    frame.hidden = false;
    frame.style.height = "0px";
    if (!frame.dataset.resizeListener) {
      window.addEventListener("message", (event) => {
        if (frame.hidden || event.source !== frame.contentWindow || event.origin !== "null") return;
        if (event.data?.type === "campaign-banner-dismissed") {
          Multilingual.writePreference(dismissKey, Date.now());
          frame.hidden = true;
          frame.removeAttribute("srcdoc");
        } else if (event.data?.type === "campaign-banner-height" && Number.isFinite(event.data.height)) {
          frame.style.height = Math.min(500, Math.max(0, Math.ceil(event.data.height))) + "px";
        }
      });
      frame.dataset.resizeListener = "true";
    }
    const url = new URL("https://keepandroidopen.org/banner.js");
    url.search = new URLSearchParams({
      id: "campaign", size: "minimal", link: "https://keepandroidopen.org", animation: "off",
      lang: locale,
    });
    frame.srcdoc = '<!doctype html><html lang="' + locale + '" dir="' + direction + '"><body style="margin:0">' +
      '<div id="campaign"></div><script>' +
      'new ResizeObserver(() => parent.postMessage({type:"campaign-banner-height",height:document.body.getBoundingClientRect().height},"*")).observe(document.body);' +
      'document.addEventListener("click", (event) => { if (event.target.closest(".kao-banner-close")) parent.postMessage({type:"campaign-banner-dismissed"},"*"); });' +
      '</script><script src="' + url.href.replaceAll("&", "&amp;") + '"></script></body></html>';
  }
  async changeLang(option) {
    const lang = option.dataset.locale;
    this.closeLanguageMenu(true);
    Multilingual.writePreference("language", lang);
    LoadingScreen.unload();
    try {
      await this.loadStrings(lang);
      this.updateLanguageLabels();
    } finally {
      LoadingScreen.loaded();
    }
  }
  closeLanguageMenu(restoreFocus = false) {
    document.body.classList.remove("visible");
    this.languageMenuTrigger?.setAttribute("aria-expanded", "false");
    if (restoreFocus) this.languageMenuTrigger?.focus();
    this.languageMenuTrigger = null;
  }
  langEvent(event) {
    const option = event.target.closest("#langOption button[data-locale]");
    if (option) {
      this.changeLang(option);
      return;
    }
    if (event.target.closest("#langOption")) return;

    const trigger = event.target.closest("#globe, #langSelect");
    if (!trigger || this.languageMenuTrigger === trigger) {
      this.closeLanguageMenu();
      return;
    }

    this.closeLanguageMenu();
    const header = trigger.id === "globe";
    const border = document.getElementById("langBorder");
    const options = document.getElementById("langOption");
    trigger.parentElement.appendChild(border);
    options.style.top = header ? "calc(100% + 5px)" : "auto";
    options.style.bottom = header ? "auto" : "calc(100% + 5px)";
    this.languageMenuTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("visible");
    const selected = Array.from(options.children).find((option) => option.dataset.locale === this.language);
    (selected || options.firstElementChild).focus();
  }
}
