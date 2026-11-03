const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "js/multilingual.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const supported = [...html.matchAll(/<div\b[^>]*\blang="([^"]+)"/g)].map((match) => match[1]);

function create(browserLanguage = "en", savedLanguage = null, elements = []) {
  const storage = new Map(savedLanguage ? [["language", savedLanguage]] : []);
  const Multilingual = vm.runInNewContext(`${script}; Multilingual;`, {
    window: {},
    navigator: { language: browserLanguage },
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    document: { body: { getElementsByTagName: () => elements } },
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
    assert.ok(fs.existsSync(path.join(root, `res/values-${loader.language}/strings.xml`)), browser);
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
    getAttribute: () => key, innerHTML: "ancienne langue",
  }));
  const { loader } = create("fr", null, elements);
  loader.defaultValues = { feature_glass_title: "Glass\nBETA", feature_modern_ui_title: "Modern UI" };
  loader.selectedValues = { feature_modern_ui_title: "Interface moderne" };
  loader.updateDom();
  assert.equal(elements[0].innerHTML, "Glass<br>BETA");
  assert.equal(elements[1].innerHTML, "Interface moderne");
});
