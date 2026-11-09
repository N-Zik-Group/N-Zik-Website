const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "js/multilingual.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const supported = [...html.matchAll(/<button\b[^>]*\bdata-locale="([^"]+)"/g)].map((match) => match[1]);

function create(browserLanguage = "en", savedLanguage = null, elements = [], environment = {}) {
  const storage = new Map(savedLanguage ? [["language", savedLanguage]] : []);
  const Multilingual = vm.runInNewContext(`${script}; Multilingual;`, {
    window: {},
    navigator: { language: browserLanguage },
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    document: { createElement: (tagName) => ({ tagName }), body: { getElementsByTagName: () => elements, querySelectorAll: () => [] } },
    ...environment,
  });
  return { loader: new Multilingual(supported), storage };
}

test("les langues régionales du navigateur utilisent un catalogue existant", () => {
  const cases = {
    "fr-FR": "fr", "pt-BR": "pt-rBR", "pt-Latn-BR": "pt-rBR", "pt-PT": "pt",
    "nb-NO": "no", "nn-NO": "no", "no-NO": "no",
    zh: "zh-rCN", "zh-CN": "zh-rCN", "zh-Hans": "zh-rCN",
    "zh-TW": "zh-rTW", "zh-Hant": "zh-rTW", "zh-HK": "zh-rTW",
    "zh-Hans-TW": "zh-rCN", "zh-Hant-CN": "zh-rTW",
    "sr-Latn-RS": "sr-rCS", "sr-CS": "sr-rCS", "sr-Cyrl-RS": "sr",
    "in-ID": "id", "iw-IL": "he", "unknown-XX": "en",
  };
  for (const [browser, expected] of Object.entries(cases)) {
    const { loader } = create(browser);
    assert.equal(loader.language, expected, browser);
    assert.ok(fs.existsSync(path.join(root, `localization/translations/${loader.language}`)), browser);
  }
});

test("les anciennes préférences sont migrées et la préférence enregistrée reste prioritaire", () => {
  for (const [saved, expected] of [["zh", "zh-rCN"], ["in", "id"], ["zh-TW", "zh-rTW"], ["pt-rBR", "pt-rBR"], ["eu", "en"]]) {
    const { loader, storage } = create("fr-FR", saved);
    assert.equal(loader.language, expected);
    assert.equal(storage.get("language"), expected);
  }
});

test("chaque choix du sélecteur conserve sa variante régionale", () => {
  assert.equal(supported.length, 48);
  assert.equal(new Set(supported).size, 48);
  for (const locale of supported) {
    assert.equal(create("fr", locale).loader.language, locale);
  }
});

test("les noms renommés remplissent le DOM avec repli anglais pour une traduction partielle", () => {
  const elements = ["feature_glass_title", "feature_modern_ui_title"].map((key) => ({
    getAttribute: (attribute) => attribute === "name" ? key : null,
    replaceChildren(...nodes) { this.nodes = nodes; },
    setAttribute(attribute, value) { this[attribute] = value; },
  }));
  const { loader } = create("fr", null, elements);
  loader.defaultValues = { feature_glass_title: "Glass\nBETA", feature_modern_ui_title: "Modern UI" };
  loader.selectedValues = { feature_modern_ui_title: "<img src=x onerror=alert(1)>Interface moderne" };
  loader.updateDom();
  assert.deepEqual(elements[0].nodes, ["Glass", { tagName: "br" }, "BETA"]);
  assert.deepEqual(elements[1].nodes, ["<img src=x onerror=alert(1)>Interface moderne"]);
  assert.equal(elements[0].lang, "en");
  assert.equal(elements[0].dir, "ltr");
  assert.equal(elements[1].lang, "fr");
  loader.selectedValues = { feature_glass_title: "   ", feature_modern_ui_title: "  " };
  loader.updateDom();
  assert.deepEqual(elements[1].nodes, ["Modern UI"]);
  assert.equal(elements[1].lang, "en");
});

test("le chargement par catalogue conserve les traductions partielles et le repli anglais", async () => {
  const requested = [];
  const rootAttrs = new Map();
  const imgAttrs = new Map([["data-i18n-alt", "feature_glass_title"]]);
  const image = { getAttribute: (name) => imgAttrs.get(name), setAttribute: (name, value) => imgAttrs.set(name, value) };
  const catalogues = {
    "localization/source/strings_home.xml": { hero_description: "English home" },
    "localization/source/strings_features.xml": { feature_glass_title: "English Glass" },
    "localization/source/strings_download.xml": { download_title: "English download" },
    "localization/source/strings_footer.xml": { footer_repository: "English repository" },
    "localization/translations/fr/strings_home.xml": { hero_description: "Accueil français" },
    "localization/translations/fr/strings_features.xml": { feature_glass_title: "Verre" },
    "localization/translations/fr/strings_download.xml": { download_title: "Téléchargement français" },
  };
  const { loader } = create("fr", null, [image], {
    document: { body: { getElementsByTagName: () => [image], querySelectorAll: () => [] }, documentElement: { setAttribute: (name, value) => rootAttrs.set(name, value) } },
    fetch: async (file) => {
      requested.push(file);
      return { ok: file in catalogues, status: file in catalogues ? 200 : 404, text: async () => file };
    },
    DOMParser: class {
      parseFromString(file) {
        return {
          querySelector: () => null,
          getElementsByTagName: () => Object.entries(catalogues[file]).map(([key, value]) => ({
            getAttribute: (name) => {
              if (name === "name") return key;
              return name === "translatable" && file.startsWith("localization/source/") && key === "feature_glass_title" ? "false" : null;
            },
            textContent: value,
          })),
        };
      }
    },
  });
  await loader.loadStrings("fr");
  assert.equal(loader.getString("hero_description"), "Accueil français");
  assert.equal(loader.getString("feature_glass_title"), "English Glass");
  assert.equal(loader.getString("download_title"), "Téléchargement français");
  assert.equal(loader.getString("footer_repository"), "English repository");
  assert.equal(requested.length, 8);
  assert.equal(rootAttrs.get("lang"), "fr");
  assert.equal(rootAttrs.get("dir"), "ltr");
  assert.equal(imgAttrs.get("alt"), "English Glass");
  assert.equal(imgAttrs.get("lang"), "en");
  await loader.loadStrings("fr");
  assert.equal(loader.getString("feature_glass_title"), "English Glass");
  assert.equal(requested.filter((file) => file.startsWith("localization/source/")).length, 4);
  await loader.loadStrings("ar");
  assert.equal(rootAttrs.get("dir"), "rtl");
  await loader.loadStrings("fr");
  assert.equal(rootAttrs.get("dir"), "ltr");
  await loader.loadStrings("en");
  assert.equal(loader.getString("hero_description"), "English home");
  assert.equal(rootAttrs.get("lang"), "en");
  assert.ok(!requested.some((file) => file.startsWith("localization/translations/en/")));
});

test("les textes de repli gardent leur langue et leur direction dans les noms accessibles", () => {
  function element(attrs) {
    return {
      getAttribute: (key) => attrs[key],
      setAttribute: (key, value) => { attrs[key] = value; },
      replaceChildren(...nodes) { this.textContent = nodes.join(""); },
    };
  }
  const action = element({ name: "navigation_change_language" });
  const heading = element({ name: "feature_lyrics_title" });
  const video = element({ "aria-labelledby": "demo-lyrics-title" });
  const group = element({ "aria-labelledby": "demo-lyrics-title" });
  const image = { ...element({ "data-i18n-alt": "feature_lyrics_title" }), matches: () => true };
  const imageLink = { ...element({}), childElementCount: 1, firstElementChild: image, textContent: " " };
  const textLink = { ...element({}), childElementCount: 1, firstElementChild: image, textContent: "العربية" };
  const footer = {};
  const header = {};
  const elements = {
    langOption: { children: [{ dataset: { locale: "ar" }, textContent: "العربية", lang: "ar" }] },
    footerLangText: footer,
    headerLangText: header,
    "demo-lyrics-title": heading,
  };
  const { loader } = create("ar", null, [], {
    document: {
      getElementById: (id) => elements[id],
      body: {
        getElementsByTagName: () => [action, video, group, heading, imageLink, image, textLink],
        querySelectorAll: (selector) => selector.startsWith("video") ? [video, group] : [imageLink, textLink],
      },
    },
  });
  loader.defaultValues = {
    navigation_change_language: "Change language",
    feature_lyrics_title: "Advanced Lyrics Support.",
  };
  loader.updateDom();
  loader.updateLanguageLabels();
  assert.equal(action.textContent, "Change language");
  assert.equal(action.getAttribute("lang"), "en");
  assert.equal(heading.getAttribute("dir"), "ltr");
  assert.equal(video.getAttribute("lang"), "en");
  assert.equal(group.getAttribute("lang"), "en");
  assert.equal(imageLink.getAttribute("lang"), "en");
  assert.equal(textLink.getAttribute("lang"), undefined);
  assert.equal(footer.textContent, "العربية");
  assert.equal(footer.lang, "ar");
  assert.equal(header.lang, "ar");
});


test("un catalogue source indisponible restaure le repli HTML après un changement de langue", async () => {
  const title = {
    attrs: { name: "feature_modern_ui_title" },
    textContent: "Modern UI",
    getAttribute(name) { return this.attrs[name]; },
    setAttribute(name, value) { this.attrs[name] = value; },
    replaceChildren(...nodes) { this.textContent = nodes.join(""); },
  };
  const image = {
    attrs: { "data-i18n-alt": "feature_classic_player_alt", alt: "Classic player" },
    getAttribute(name) { return this.attrs[name]; },
    setAttribute(name, value) { this.attrs[name] = value; },
  };
  const { loader } = create("en", null, [title, image], {
    console: { warn() {} },
    fetch: async (file) => {
      const translated = file === "localization/translations/fr/strings_features.xml";
      const failed = file === "localization/source/strings_features.xml";
      return {
        ok: translated || (!failed && file.startsWith("localization/source/")),
        status: failed ? 500 : translated ? 200 : 404,
        text: async () => translated ? "fr" : "",
      };
    },
    DOMParser: class {
      parseFromString(body) {
        const values = body === "fr"
          ? { feature_modern_ui_title: "Interface moderne", feature_classic_player_alt: "Lecteur classique" }
          : {};
        return {
          querySelector: () => null,
          getElementsByTagName: () => Object.entries(values).map(([key, value]) => ({
            getAttribute: (name) => name === "name" ? key : null,
            textContent: value,
          })),
        };
      }
    },
  });
  await loader.loadStrings("fr");
  assert.equal(title.textContent, "Interface moderne");
  assert.equal(image.attrs.alt, "Lecteur classique");
  await loader.loadStrings("en");
  assert.equal(title.textContent, "Modern UI");
  assert.equal(title.attrs.lang, "en");
  assert.equal(image.attrs.alt, "Classic player");
  assert.equal(image.attrs.lang, "en");
});


test("le choix de langue fonctionne sans stockage local", async () => {
  const fail = () => { throw new Error("Storage disabled"); };
  const { loader } = create("fr-FR", null, [], {
    localStorage: { getItem: fail, setItem: fail },
    LoadingScreen: { unload() {}, loaded() {} },
  });
  assert.equal(loader.language, "fr");
  loader.closeLanguageMenu = () => {};
  loader.loadStrings = async (lang) => { loader.language = lang; };
  loader.updateLanguageLabels = () => {};
  await loader.changeLang({ dataset: { locale: "ar" } });
  assert.equal(loader.language, "ar");
  assert.equal(loader.constructor.readPreference("language"), "ar");
});


test("le menu des fonctionnalités retrouve son libellé en passant à la largeur mobile", () => {
  const additional = fs.readFileSync(path.join(root, "js/additional.js"), "utf8");
  const listeners = {};
  let observeSections;
  let changeWidth;
  const mobile = {
    matches: false,
    addEventListener: (_, listener) => { changeWidth = listener; },
  };
  const span = (name) => {
    const attrs = { name };
    const classes = new Set();
    return {
      style: {},
      offsetWidth: 100,
      classList: { add: (value) => classes.add(value), contains: (value) => classes.has(value) },
      setAttribute: (key, value) => { attrs[key] = value; },
      getAttribute: (key) => attrs[key],
    };
  };
  const wrapper = {
    children: [span("navigation_features_label")],
    style: {},
    offsetWidth: 100,
    querySelector() { return this.children.find((child) => !child.classList.contains("leaving")); },
    appendChild(child) { this.children.push(child); },
    replaceChildren(child) { this.children = [child]; },
  };
  const section = { id: "feature-glass" };
  const glass = { getAttribute: () => "navigation_glass_label", textContent: "Glass" };
  const toggle = { classList: { toggle() {} }, getAttribute: () => "", setAttribute() {}, addEventListener() {} };
  const elements = { featuresNavTextWrapper: wrapper, featuresDropdownTrigger: toggle, toggledark: toggle };
  const translations = { navigation_features_label: "Fonctionnalités", navigation_glass_label: "Glass" };
  vm.runInNewContext(additional, {
    document: {
      body: { classList: { contains: () => false } },
      getElementById: (id) => elements[id],
      querySelectorAll: (selector) => selector === ".feature-extended[id]" ? [section] : [],
      querySelector: () => glass,
      createElement: () => span(),
      addEventListener: (type, listener) => { listeners[type] = listener; },
    },
    window: { addEventListener() {} },
    matchMedia: (query) => query.includes("max-width") ? mobile : { matches: false, addEventListener() {} },
    IntersectionObserver: class {
      constructor(listener) { observeSections = listener; }
      observe() {}
    },
    multilingual: { getString: (key) => translations[key], stringLanguage: () => "fr", directionFor: () => "ltr" },
    setTimeout() {},
  });
  listeners.DOMContentLoaded();
  observeSections([{ target: section, isIntersecting: true }]);
  assert.equal(wrapper.querySelector().textContent, "Glass");
  mobile.matches = true;
  changeWidth();
  assert.equal(wrapper.children.length, 1);
  assert.equal(wrapper.querySelector().textContent, "Fonctionnalités");
  observeSections([{ target: section, isIntersecting: true }]);
  assert.equal(wrapper.querySelector().textContent, "Fonctionnalités");
});
