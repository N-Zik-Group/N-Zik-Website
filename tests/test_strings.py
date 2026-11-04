"""Vérification des ressources : python -m unittest discover -s tests -v."""

from html.parser import HTMLParser
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
LOCALIZATION = ROOT / "localization"
CATALOGS = {
    "strings_home.xml": ("hero_", "navigation_"),
    "strings_features.xml": ("feature_",),
    "strings_download.xml": ("download_",),
    "strings_footer.xml": ("footer_",),
}


class TranslationReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_body = False
        self.keys = set()
        self.locales = []

    def handle_starttag(self, tag, attrs):
        if tag == "body":
            self.in_body = True
        if self.in_body:
            self.keys.update(value for name, value in attrs if name == "name" or name.startswith("data-i18n-"))
            if tag == "div":
                self.locales.extend(value for name, value in attrs if name == "lang")

    def handle_endtag(self, tag):
        if tag == "body":
            self.in_body = False


class StringResourcesTest(unittest.TestCase):
    def setUp(self):
        self.source_files = sorted((LOCALIZATION / "source").glob("*.xml"))
        self.locales = sorted(path for path in (LOCALIZATION / "translations").iterdir() if path.is_dir())
        self.files = self.source_files + [p for locale in self.locales for p in locale.glob("*.xml")]
        self.source_keys = {entry.attrib["name"] for path in self.source_files for entry in ET.parse(path).getroot()}

    def test_loader_and_source_catalogs_match(self):
        self.assertEqual({path.name for path in self.source_files}, set(CATALOGS))
        script = (ROOT / "js/multilingual.js").read_text(encoding="utf-8")
        for name in CATALOGS:
            self.assertIn(f'"{name}"', script)

    def test_xml_is_valid_utf8_without_bom(self):
        for path in self.files:
            with self.subTest(locale=path.parent.name):
                data = path.read_bytes()
                self.assertFalse(data.startswith(b"\xef\xbb\xbf"))
                self.assertEqual(ET.fromstring(data.decode("utf-8")).tag, "resources")

    def test_keys_are_unique_and_known_in_every_locale(self):
        for folder in [LOCALIZATION / "source", *self.locales]:
            with self.subTest(locale=folder.name):
                keys = []
                for path in folder.glob("*.xml"):
                    self.assertIn(path.name, CATALOGS)
                    for entry in ET.parse(path).getroot():
                        key = entry.attrib["name"]
                        keys.append(key)
                        self.assertTrue(key.startswith(CATALOGS[path.name]))
                        self.assertEqual(entry.tag, "string")
                        self.assertTrue("".join(entry.itertext()).strip())
                self.assertTrue(keys)
                self.assertEqual(len(keys), len(set(keys)))
                # Les traductions partielles gardent le repli anglais du chargeur.
                self.assertFalse(set(keys) - self.source_keys)

    def test_every_html_reference_has_a_resource_and_every_resource_is_used(self):
        references = TranslationReferences()
        references.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        self.assertEqual(references.keys, self.source_keys)

    def test_keys_follow_semantic_domains(self):
        for key in self.source_keys:
            with self.subTest(key=key):
                self.assertRegex(key, r"^(hero|navigation|feature|download|footer)_[a-z_]+$")

    def test_selector_matches_all_locale_catalogs(self):
        references = TranslationReferences()
        references.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        locales = {path.name for path in self.locales}
        self.assertEqual(set(references.locales), locales)
        self.assertEqual(len(references.locales), len(locales))
        self.assertEqual(len(locales), 48)

    def test_resources_are_sorted_within_each_domain(self):
        for path in self.files:
            with self.subTest(locale=path.parent.name):
                keys = [entry.attrib["name"] for entry in ET.parse(path).getroot()]
                for domain in ("hero", "navigation", "feature", "download", "footer"):
                    group = [key for key in keys if key.startswith(domain + "_")]
                    self.assertEqual(group, sorted(group))


if __name__ == "__main__":
    unittest.main()
