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
        self.elements_by_id = {}
        self.fragments = []
        self.videos = []

    def handle_starttag(self, tag, attrs):
        if tag == "body":
            self.in_body = True
        if self.in_body:
            attributes = dict(attrs)
            if "id" in attributes:
                self.elements_by_id[attributes["id"]] = (tag, attributes)
            href = attributes.get("href", "")
            if href.startswith("#") and len(href) > 1:
                self.fragments.append(href[1:])
            if tag == "video":
                self.videos.append(attributes)
            self.keys.update(value for name, value in attrs if name == "name" or name.startswith("data-i18n-"))
            if tag == "button":
                self.locales.extend(value for name, value in attrs if name == "data-locale")

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

    def test_navigation_triggers_and_fragments(self):
        page = TranslationReferences()
        page.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        self.assertFalse(set(page.fragments) - set(page.elements_by_id))
        for trigger in ("featuresDropdownTrigger", "globe", "langSelect"):
            tag, attrs = page.elements_by_id[trigger]
            self.assertEqual(tag, "button")
            self.assertEqual(attrs["aria-expanded"], "false")
            self.assertIn(attrs["aria-controls"], page.elements_by_id)

    def test_videos_allow_pause_and_campaign_has_an_opaque_origin(self):
        page = TranslationReferences()
        page.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        self.assertTrue(page.videos)
        for attrs in page.videos:
            self.assertIn("controls", attrs)
            self.assertIn("loop", attrs)
            self.assertNotIn("autoplay", attrs)
            self.assertEqual(attrs["preload"], "none")
            self.assertTrue((ROOT / attrs["poster"]).is_file())
        tag, attrs = page.elements_by_id["keep-android-open-banner"]
        self.assertEqual(tag, "iframe")
        sandbox = attrs["sandbox"].split()
        self.assertIn("allow-scripts", sandbox)
        self.assertNotIn("allow-same-origin", sandbox)

    def test_video_names_reference_localized_text(self):
        page = TranslationReferences()
        page.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        source = {entry.attrib["name"] for path in self.source_files for entry in ET.parse(path).getroot()}
        names = set()
        for video in page.videos:
            with self.subTest(video=video["src"]):
                if "aria-labelledby" in video:
                    tag, heading = page.elements_by_id[video["aria-labelledby"]]
                    self.assertEqual(tag, "h3")
                    name = heading["name"]
                else:
                    self.assertTrue(video.get("aria-label"))
                    name = video["data-i18n-aria-label"]
                self.assertIn(name, source)
                self.assertNotIn(name, names)
                names.add(name)

    def test_resources_are_sorted_within_each_domain(self):
        for path in self.files:
            with self.subTest(locale=path.parent.name):
                keys = [entry.attrib["name"] for entry in ET.parse(path).getroot()]
                for domain in ("hero", "navigation", "feature", "download", "footer"):
                    group = [key for key in keys if key.startswith(domain + "_")]
                    self.assertEqual(group, sorted(group))


if __name__ == "__main__":
    unittest.main()
