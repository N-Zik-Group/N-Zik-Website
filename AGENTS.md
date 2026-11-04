# N-Zik Website

- The site is static HTML, CSS and JavaScript. Language selection and the English fallback are implemented in `js/multilingual.js`.
- Edit the English catalogs under `localization/source/`. Crowdin exports matching files under `localization/translations/<locale>/`. Manage translation values in Crowdin. A structural move can preserve existing translated values exactly.
- Keep screen-specific copy in its catalog. Share a key when the concept and wording should evolve together across usages. Keep separate keys if the same English text serves different contexts.
- Put home and navigation labels in `strings_home.xml`, feature copy in `strings_features.xml`, download copy in `strings_download.xml`, and footer copy in `strings_footer.xml`. Keep existing keys stable during a move and preserve regional locale mappings in `crowdin.yml`.
- Keep text `name` and attribute `data-i18n-*` references in `index.html` aligned with the English keys. Keep the language selector aligned with the locale directories. Missing translated keys or catalogs fall back to English.

## Verification

- `python -B -m unittest discover -s tests -v`
- `node --test "tests/*.test.cjs"`
