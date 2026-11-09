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

test("regional browser languages resolve to an existing catalog", () => {
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

test("saved language preferences migrate and take priority", () => {
  for (const [saved, expected] of [["zh", "zh-rCN"], ["in", "id"], ["zh-TW", "zh-rTW"], ["pt-rBR", "pt-rBR"], ["eu", "en"]]) {
    const { loader, storage } = create("fr-FR", saved);
    assert.equal(loader.language, expected);
    assert.equal(storage.get("language"), expected);
  }
});

test("each language option keeps its regional variant", () => {
  assert.equal(supported.length, 48);
  assert.equal(new Set(supported).size, 48);
  for (const locale of supported) {
    assert.equal(create("fr", locale).loader.language, locale);
  }
});

test("localized elements fall back to English when translations are partial", () => {
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

test("loading catalogs preserves partial translations and the English fallback", async () => {
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

test("accessible names retain the language and direction of fallback text", () => {
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
  const image = { ...element({ "data-i18n-alt": "feature_lyrics_title" }), matches: (selector) => selector.startsWith("img") };
  const imageLink = { ...element({}), childElementCount: 1, firstElementChild: image, textContent: " " };
  const textLink = { ...element({}), childElementCount: 1, firstElementChild: image, textContent: "العربية" };
  const badgeLabel = element({ name: "download_get_it_on_github" });
  const badge = { matches: (selector) => selector === ".localized-badge", lastElementChild: badgeLabel };
  const badgeLink = { ...element({}), childElementCount: 1, firstElementChild: badge, textContent: "Get it on GitHub" };
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
        getElementsByTagName: () => [action, video, group, heading, imageLink, image, textLink, badgeLabel],
        querySelectorAll: (selector) => selector.startsWith("video") ? [video, group] : [imageLink, textLink, badgeLink],
      },
    },
  });
  loader.defaultValues = {
    navigation_change_language: "Change language",
    feature_lyrics_title: "Advanced Lyrics Support.",
    download_get_it_on_github: "Get it on GitHub",
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
  assert.equal(badgeLabel.textContent, "Get it on GitHub");
  assert.equal(badgeLink.getAttribute("lang"), "en");
  assert.equal(footer.textContent, "العربية");
  assert.equal(footer.lang, "ar");
  assert.equal(header.lang, "ar");
});

test("known English copies get English metadata while shared brand wording keeps its locale", () => {
  const createElement = (attrs) => ({
    attrs,
    getAttribute(key) { return this.attrs[key]; },
    setAttribute(key, value) { this.attrs[key] = value; },
    replaceChildren(...nodes) { this.textContent = nodes.join(""); },
  });
  const hero = createElement({ name: "hero_description" });
  const preset = createElement({ "data-i18n-alt": "feature_theme_preset_one_alt" });
  const carousel = createElement({ role: "group", "data-i18n-aria-label": "feature_glass_previews_label" });
  const brand = createElement({ name: "download_companion_platforms" });
  const badge = createElement({ name: "download_launched_on_devglobe" });
  const features = createElement({ name: "navigation_features_label" });
  const { loader } = create("ar", null, [hero, preset, carousel, brand, badge, features]);
  loader.defaultValues = {
    hero_description: "N-Zik is a multilingual, open-source Android app.",
    feature_theme_preset_one_alt: "Theme Preset 1",
    feature_glass_previews_label: "Glass previews",
    download_companion_platforms: "N-Zik Desktop Compagnon · Windows & Linux",
    download_launched_on_devglobe: "N-Zik launched on DevGlobe",
    navigation_features_label: "Features",
  };
  loader.selectedValues = { ...loader.defaultValues, download_launched_on_devglobe: "Launched on DevGlobe" };

  loader.updateDom();
  assert.equal(hero.textContent, loader.defaultValues.hero_description);
  assert.equal(hero.attrs.lang, "en");
  assert.equal(hero.attrs.dir, "ltr");
  assert.equal(preset.attrs.alt, "Theme Preset 1");
  assert.equal(preset.attrs.lang, "en");
  assert.equal(preset.attrs.dir, "ltr");
  assert.equal(carousel.attrs.lang, "en");
  assert.equal(carousel.attrs.dir, undefined);
  assert.equal(brand.textContent, loader.defaultValues.download_companion_platforms);
  assert.equal(brand.attrs.lang, "ar");
  assert.equal(brand.attrs.dir, "rtl");
  assert.equal(badge.textContent, "N-Zik launched on DevGlobe");
  assert.equal(badge.attrs.lang, "en");
  assert.equal(features.attrs.lang, "en");
  assert.equal(features.attrs.dir, "ltr");

  loader.selectedValues.hero_description = "وصف التطبيق";
  loader.selectedValues.download_launched_on_devglobe = "تم إطلاقه على DevGlobe";
  loader.updateDom();
  assert.equal(hero.textContent, "وصف التطبيق");
  assert.equal(hero.attrs.lang, "ar");
  assert.equal(hero.attrs.dir, "rtl");
  assert.equal(badge.textContent, "تم إطلاقه على DevGlobe");
  assert.equal(badge.attrs.lang, "ar");
});


test("an unavailable source catalog restores the HTML fallback after a language change", async () => {
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


test("language selection works without local storage", async () => {
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
