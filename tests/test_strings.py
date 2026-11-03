"""Vérification des ressources : python -m unittest discover -s tests -v."""

from html.parser import HTMLParser
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]


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
            self.keys.update(value for name, value in attrs if name == "name")
            if tag == "div":
                self.locales.extend(value for name, value in attrs if name == "lang")

    def handle_endtag(self, tag):
        if tag == "body":
            self.in_body = False


class StringResourcesTest(unittest.TestCase):
    def setUp(self):
        self.files = sorted(ROOT.glob("res/*/strings.xml"))
        self.assertTrue(self.files)
        self.source = ET.parse(ROOT / "res/values/strings.xml").getroot()
        self.source_keys = {entry.attrib["name"] for entry in self.source}

    def test_xml_is_valid_utf8_without_bom(self):
        for path in self.files:
            with self.subTest(locale=path.parent.name):
                data = path.read_bytes()
                self.assertFalse(data.startswith(b"\xef\xbb\xbf"))
                self.assertEqual(ET.fromstring(data.decode("utf-8")).tag, "resources")

    def test_keys_are_unique_and_known_in_every_locale(self):
        for path in self.files:
            with self.subTest(locale=path.parent.name):
                entries = ET.parse(path).getroot()
                keys = [entry.attrib["name"] for entry in entries]
                self.assertTrue(keys)
                self.assertEqual(len(keys), len(set(keys)))
                # Les traductions partielles gardent le repli anglais du chargeur.
                self.assertFalse(set(keys) - self.source_keys)
                for entry in entries:
                    self.assertEqual(entry.tag, "string")
                    self.assertTrue("".join(entry.itertext()).strip())

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
        locales = {path.parent.name.removeprefix("values-") for path in self.files if path.parent.name != "values"}
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
