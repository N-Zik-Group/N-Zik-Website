const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "js/multilingual.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const supported = [...html.matchAll(/<div\b[^>]*\blang="([^"]+)"/g)].map((match) => match[1]);

function create(browserLanguage = "en", savedLanguage = null, elements = [], environment = {}) {
  const storage = new Map(savedLanguage ? [["language", savedLanguage]] : []);
  const Multilingual = vm.runInNewContext(`${script}; Multilingual;`, {
    window: {},
    navigator: { language: browserLanguage },
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    document: { body: { getElementsByTagName: () => elements } },
    ...environment,
  });
  return { loader: new Multilingual(supported), storage };
}

test("les langues régionales du navigateur utilisent un catalogue existant", () => {
  const cases = {
    "fr-FR": "fr", "pt-BR": "pt-rBR", "pt-PT": "pt",
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
    getAttribute: (attribute) => attribute === "name" ? key : null, innerHTML: "ancienne langue",
  }));
  const { loader } = create("fr", null, elements);
  loader.defaultValues = { feature_glass_title: "Glass\nBETA", feature_modern_ui_title: "Modern UI" };
  loader.selectedValues = { feature_modern_ui_title: "Interface moderne" };
  loader.updateDom();
  assert.equal(elements[0].innerHTML, "Glass<br>BETA");
  assert.equal(elements[1].innerHTML, "Interface moderne");
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
    "localization/translations/fr/strings_download.xml": { download_title: "Téléchargement français" },
  };
  const { loader } = create("fr", null, [image], {
    document: { body: { getElementsByTagName: () => [image] }, documentElement: { setAttribute: (name, value) => rootAttrs.set(name, value) } },
    fetch: async (file) => {
      requested.push(file);
      return { ok: file in catalogues, status: file in catalogues ? 200 : 404, text: async () => file };
    },
    DOMParser: class {
      parseFromString(file) {
        return {
          querySelector: () => null,
          getElementsByTagName: () => Object.entries(catalogues[file]).map(([key, value]) => ({
            getAttribute: () => key,
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
  assert.equal(imgAttrs.get("alt"), "English Glass");
  await loader.loadStrings("fr");
  assert.equal(requested.filter((file) => file.startsWith("localization/source/")).length, 4);
});
