class Multilingual {
  static catalogFiles = [
    "strings_home.xml",
    "strings_features.xml",
    "strings_download.xml",
    "strings_footer.xml",
  ];

  language;
  defaultValues = {};
  fixedNames = new Set();
  defaultCatalogComplete = false;
  selectedValues = {};
  loadVersion = 0;
  constructor(supported) {
    this.supported = supported;
    const saved = localStorage.getItem("language");
    this.language = this.resolveLanguage(saved || navigator.language || navigator.userLanguage || "en");
    if (saved && saved !== this.language) {
      localStorage.setItem("language", this.language);
    }
  }

  resolveLanguage(language) {
    const code = language.toLowerCase().replaceAll("_", "-");
    const find = (candidate) => this.supported.find((value) => value.toLowerCase() === candidate);
    const exact = find(code);
    if (exact) return exact;
    const base = code.split("-")[0];
    let candidate = base;
    if (base === "zh") {
      const parts = code.split("-");
      const traditional = parts.includes("hant") ||
        (!parts.includes("hans") && parts.some((part) => ["tw", "hk", "mo"].includes(part)));
      candidate = traditional ? "zh-rtw" : "zh-rcn";
    } else if (base === "sr" && /(?:^|-)(latn|cs)(?:-|$)/.test(code)) {
      candidate = "sr-rcs";
    } else if (code === "pt-br") {
      candidate = "pt-rbr";
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
  async loadStrings(lang) {
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
    const selected = readCatalog(`localization/translations/${language}`, true);
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
  getString(name) {
    if (this.fixedNames.has(name)) return this.defaultValues[name];
    return this.selectedValues[name] || this.defaultValues[name];
  }
  updateDom() {
    const allElements = Array.prototype.slice.call(
      document.body.getElementsByTagName("*"),
    );
    allElements.forEach((el) => {
      const name = el.getAttribute("name");
      if (name) {
        const value = this.getString(name);
        if (value) el.innerHTML = value.replaceAll("\n", "<br>");
      }
      for (const attribute of ["alt", "aria-label"]) {
        const key = el.getAttribute("data-i18n-" + attribute);
        const value = key && this.getString(key);
        if (value) el.setAttribute(attribute, value);
      }
    });
    if (typeof updateThemeIcon === "function") updateThemeIcon();
  }
  updateLanguage(el) {
    const lang = el.attributes.lang.value;
    localStorage.setItem("language", lang);
  }
  loadLanguageSelectInput(el) {
    const element = el.children[0].children[0].children[0];
    for (const option of element.children) {
      if (option.attributes.lang.value == this.language) {
        langSelect.childNodes[0].textContent = option.innerText;
        const headerText = document.getElementById('headerLangText');
        if (headerText) headerText.textContent = option.innerText;
        break;
      }
    }
  }
  setAttribute(el) {
    const locale = this.language === "sr-rCS" ? "sr-Latn" : this.language.replace(/-r([A-Z]{2})$/, "-$1");
    el.setAttribute("lang", locale);
    const direction = /^(ar|fa|he)(-|$)/.test(locale) ? "rtl" : "ltr";
    el.setAttribute("dir", direction);
    this.updateCampaignBanner(locale, direction);
  }
  updateCampaignBanner(locale, direction) {
    const frame = document.getElementById?.("keep-android-open-banner");
    if (!frame || frame.dataset.locale === locale) return;
    frame.dataset.locale = locale;
    frame.style.height = "0px";
    frame.onload = () => {
      const body = frame.contentDocument?.body;
      if (!body) return;
      const resize = () => { frame.style.height = Math.ceil(body.getBoundingClientRect().height) + "px"; };
      resize();
      const observer = new frame.contentWindow.ResizeObserver(resize);
      observer.observe(body);
    };
    const url = new URL("https://keepandroidopen.org/banner.js");
    url.search = new URLSearchParams({
      id: "campaign", size: "minimal", link: "https://keepandroidopen.org", animation: "on",
      lang: locale,
    });
    frame.srcdoc = '<!doctype html><html dir="' + direction + '"><body style="margin:0">' +
      '<div id="campaign"></div><script src="' + url.href.replaceAll("&", "&amp;") + '"></script></body></html>';
  }
  changeLang(a) {
    const lang = a.target.attributes.lang.value
    console.log("Language change to: " + lang)
    LoadingScreen.unload();
    langSelect.childNodes[0].textContent = a.target.innerText;
    const headerText = document.getElementById('headerLangText');
    if (headerText) headerText.textContent = a.target.innerText;
    langSel.setAttribute("value", lang);
    this.updateLanguage(a.target);
    this.loadStrings(lang);
    if (document.activeElement) document.activeElement.blur();
    setTimeout(() => {
      LoadingScreen.loaded();
    }, 400);
  }
  langEvent(e) {
    if (e.target.closest('#langOption')) {
      if (e.target.tagName.toLowerCase() === 'div') {
        this.changeLang(e);
      }
      return;
    }
    
    const isLangSelect = e.target.closest('#langSelect') !== null;
    const isGlobe = e.target.closest('#globe-container') !== null || e.target.closest('#globe') !== null;
    
    if (isLangSelect || isGlobe) {
      const langBorder = document.getElementById("langBorder");
      const langOption = document.getElementById("langOption");
      if (isGlobe) {
        document.getElementById("globe-container").appendChild(langBorder);
        langOption.style.top = "calc(100% + 5px)";
        langOption.style.bottom = "auto";
      } else {
        langSelect.appendChild(langBorder);
        langOption.style.bottom = "calc(100% + 5px)";
        langOption.style.top = "auto";
      }
      
      document.body.classList.toggle("visible");
      return;
    }
    if (document.body.classList.contains("visible")){
      document.body.classList.remove("visible");
    }
  };
  onwheel = window.onwheel = function (e) {
    if (e.target.id == langSelect.id || e.target.attributes.lang) {
      return;
    }
    document.body.classList.remove("visible");
  }
}
