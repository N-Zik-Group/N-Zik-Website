class Multilingual {
  static catalogFiles = [
    "strings_home.xml",
    "strings_features.xml",
    "strings_download.xml",
    "strings_footer.xml",
  ];

  // In mixed catalogs, compare only phrases known to appear as English copies.
  static englishCopyKeys = new Set([
    "download_companion_description",
    "download_description",
    "download_desktop_on_devglobe",
    "download_get_it_on_androidfreeware",
    "download_get_it_on_appteka",
    "download_get_it_on_f_droid",
    "download_get_it_on_github",
    "download_get_it_on_github_beta",
    "download_get_it_on_izzyondroid",
    "download_get_it_on_obtainium",
    "download_get_it_on_openapk",
    "download_get_the_desktop_companion_beta_on_github",
    "download_get_the_desktop_companion_on_github",
    "download_launched_on_devglobe",
    "download_title",
    "feature_amoled_theme_alt",
    "feature_android_mobile_alt",
    "feature_android_tablet_alt",
    "feature_artist_profile_alt",
    "feature_artists_description",
    "feature_artists_title",
    "feature_audio_controls_description",
    "feature_audio_controls_title",
    "feature_carousel_description",
    "feature_carousel_player_view_alt",
    "feature_carousel_player_with_glass_enabled_alt",
    "feature_carousel_title",
    "feature_classic_player_alt",
    "feature_compatibility_description",
    "feature_compatibility_title",
    "feature_dark_theme_alt",
    "feature_discord_description",
    "feature_discord_rich_presence_settings_alt",
    "feature_glass_credits",
    "feature_glass_description",
    "feature_glass_effect_demonstration_label",
    "feature_glass_previews_label",
    "feature_glass_settings_and_quality_controls_alt",
    "feature_history_alt",
    "feature_history_description",
    "feature_history_statistics_alt",
    "feature_history_title",
    "feature_home_with_glass_enabled_alt",
    "feature_light_theme_alt",
    "feature_lyrics_description",
    "feature_lyrics_title",
    "feature_modern_ui_description",
    "feature_modern_ui_title",
    "feature_next_glass_preview_label",
    "feature_next_search_preview_label",
    "feature_next_theme_preview_label",
    "feature_offline_caching_description",
    "feature_offline_caching_title",
    "feature_optional_glass_player_alt",
    "feature_playback_queue_alt",
    "feature_player_audio_bar_alt",
    "feature_player_lyrics_alt",
    "feature_player_with_glass_enabled_alt",
    "feature_playlists_description",
    "feature_playlists_title",
    "feature_previous_glass_preview_label",
    "feature_previous_search_preview_label",
    "feature_previous_theme_preview_label",
    "feature_profiles_description",
    "feature_profiles_title",
    "feature_queue_description",
    "feature_queue_title",
    "feature_queue_with_mini_player_alt",
    "feature_rewind_description",
    "feature_search_description",
    "feature_search_alt",
    "feature_search_previews_label",
    "feature_search_title",
    "feature_settings_alt",
    "feature_song_recognition_alt",
    "feature_theme_preset_five_alt",
    "feature_theme_preset_four_alt",
    "feature_theme_preset_one_alt",
    "feature_theme_preset_six_alt",
    "feature_theme_preset_three_alt",
    "feature_theme_preset_two_alt",
    "feature_theme_presets_description",
    "feature_theme_presets_title",
    "feature_updates_description",
    "feature_visualizer_description",
    "feature_visualizer_title",
    "feature_voice_search_alt",
    "feature_youtube_account_alt",
    "footer_font_credit",
    "footer_font_license",
    "footer_icon_credits",
    "footer_issue_tracker",
    "hero_description",
    "hero_n_zik_banner_alt",
    "navigation_artist_profiles_label",
    "navigation_audio_controls_label",
    "navigation_carousel_player_label",
    "navigation_change_language",
    "navigation_compatibility_label",
    "navigation_features_label",
    "navigation_history_label",
    "navigation_lyrics_label",
    "navigation_offline_caching_label",
    "navigation_playback_queue_label",
    "navigation_search_label",
    "navigation_switch_to_dark_theme",
    "navigation_switch_to_light_theme",
    "navigation_theme_presets_label",
  ]);

  // These short labels can be shared wording in Latin-script translations.
  static nonLatinEnglishCopyKeys = new Set([
    "feature_discord_rich_presence_live_alt",
    "feature_n_zik_rewind_intro_alt",
    "feature_ota_updates_alt",
    "feature_playlists_alt",
    "feature_profiles_alt",
    "feature_updates_title",
    "hero_logo_alt",
    "hero_n_zik_logo_alt",
    "navigation_download_label",
    "navigation_home_label",
    "navigation_modern_ui_label",
    "navigation_ota_updates_label",
    "navigation_playlists_label",
    "navigation_profiles_label",
    "navigation_rewind_label",
    "navigation_visualizer_label",
  ]);

  // These exact export variants are English despite changes to punctuation or capitalization.
  static englishCopyVariants = {
    ja: { feature_home_with_glass_enabled_alt: "Home-with Glass enabled" },
    nl: { feature_offline_caching_title: "Smart Offline caching." },
  };

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
  englishExport = null;
  selectedCatalogIsEnglishCopy = false;
  selectedCatalogUsesLatinScript = true;
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
    const readValues = async (path, optional, fixedNames) => {
      const response = await fetch(path);
      if (optional && response.status === 404) return null;
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
      return { values, fixedNames, complete: results.every((result) => result.status === "fulfilled" && result.value !== null) };
    };
    const defaults = this.defaultCatalogComplete
      ? Promise.resolve({ values: this.defaultValues, fixedNames: this.fixedNames, complete: true })
      : readCatalog("localization/source");
    const selected = language === "en"
      ? { values: {}, complete: false }
      : readCatalog(`localization/translations/${language}`, true);
    const englishReference = language === "en" ? null
      : this.englishExport?.complete ? this.englishExport : readCatalog("localization/translations/en", true);
    const [defaultCatalog, selectedCatalog, englishExport] = await Promise.all([defaults, selected, englishReference]);
    if (version !== this.loadVersion) return false;
    this.language = language;
    this.selectedCatalogUsesLatinScript = new Intl.Locale(this.catalogLocale()).maximize().script === "Latn";
    this.defaultValues = { ...this.defaultValues, ...defaultCatalog.values };
    for (const name of defaultCatalog.fixedNames) this.fixedNames.add(name);
    this.defaultCatalogComplete = defaultCatalog.complete;
    this.selectedValues = selectedCatalog.values;
    if (englishExport) this.englishExport = englishExport;
    const englishEntries = Object.entries(englishExport?.values ?? {});
    this.selectedCatalogIsEnglishCopy = Boolean(
      selectedCatalog.complete && englishExport?.complete && englishEntries.length &&
      englishEntries.length === Object.keys(this.selectedValues).length &&
      englishEntries.every(([name, value]) => this.selectedValues[name] === value),
    );
    if (lang) {
      this.updateDom();
      if (document.documentElement) this.setAttribute(document.documentElement);
    }
    return true;
  }
  catalogLocale() {
    return this.language === "sr-rCS" ? "sr-Latn" : this.language.replace(/-r([A-Z]{2})$/, "-$1");
  }
  hasTranslation(name) {
    const value = this.selectedValues[name]?.trim();
    if (!value || this.fixedNames.has(name) || this.selectedCatalogIsEnglishCopy) return false;
    // The Serbian Latin export also contains the known English labels from the shared fallback.
    const checkShortLabels = !this.selectedCatalogUsesLatinScript || this.language === "sr-rCS";
    const knownCopy = Multilingual.englishCopyKeys.has(name) ||
      (checkShortLabels && Multilingual.nonLatinEnglishCopyKeys.has(name));
    if (knownCopy && (value === this.defaultValues[name]?.trim() || value === this.englishExport?.values[name]?.trim())) return false;
    if (knownCopy && value === Multilingual.englishCopyVariants[this.language]?.[name]) return false;
    // Older exports can still contain the English source without the project name.
    return name !== "download_launched_on_devglobe" || value !== "Launched on DevGlobe";
  }
  stringLanguage(name) {
    if (!this.hasTranslation(name)) return "en";
    const locale = this.catalogLocale();
    if (locale === "sr-Latn" && /\p{Script=Cyrillic}/u.test(this.selectedValues[name])) return "sr-Cyrl";
    return locale;
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
          const language = this.stringLanguage(key);
          el.setAttribute("lang", language);
          // An accessible name must not change the control's layout direction.
          if (attribute === "alt") el.setAttribute("dir", this.directionFor(language));
        }
      }
    });
    const labelled = 'video[aria-labelledby], [role="group"][aria-labelledby], #homeLink[aria-labelledby], #featuresDropdownTrigger[aria-labelledby]';
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
    const actionLanguage = this.stringLanguage("navigation_change_language");
    for (const [id, triggerId] of [["footerLangText", "langSelect"], ["headerLangText", "globe"]]) {
      document.getElementById(triggerId)?.setAttribute("lang", actionLanguage);
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
    const version = this.loadVersion + 1;
    try {
      if (await this.loadStrings(lang)) this.updateLanguageLabels();
    } finally {
      if (version === this.loadVersion) LoadingScreen.loaded();
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
    const container = window.matchMedia("(max-width: 640px)").matches ? document.body : trigger.parentElement;
    container.appendChild(border);
    options.style.top = header ? "calc(100% + 5px)" : "auto";
    options.style.bottom = header ? "auto" : "calc(100% + 5px)";
    this.languageMenuTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("visible");
    const selected = Array.from(options.children).find((option) => option.dataset.locale === this.language);
    (selected || options.firstElementChild).focus();
  }
}
