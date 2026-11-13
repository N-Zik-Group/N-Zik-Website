# 🤝 Contributing to N-Zik-Website

## 🛠️ Improve the project

Pull requests are welcome. Describe the problem or improvement and how you verified the change. Follow the [Code of Conduct](CODE_OF_CONDUCT.md).



## 📜 Clone the repo

    git clone -b main --single-branch --recursive https://github.com/N-Zik-Group/N-Zik-Website.git

## ✅ Verify your changes

Serve the static files locally with `python -m http.server 8000`. Check the pages you changed at desktop and mobile widths and verify affected translations.

## 📬 Open a pull request

Keep the change focused and link the related issue when there is one. Include verification steps and screenshots for visual changes when applicable.

## Localization

The English language option reads `localization/source/`. Crowdin exports matching
files to `localization/translations/<locale>/`. The language selector in
`index.html` uses the same locale codes as the export directories.

The catalogs cover the home page and navigation, features, downloads, and the footer.
In `index.html`, `name` references text, including the screen-reader label for the
language selector. The attributes `data-i18n-alt` and
`data-i18n-aria-label` reference accessible labels. The theme button uses
`data-i18n-dark-theme` and `data-i18n-light-theme` to identify the action that
switches to each theme. The script applies the selected label to both `aria-label`
and `title`.

The loader falls back to the English source when a key or catalog is missing and
exposes the text's language to screen readers. For other locales, it uses
`localization/translations/en/` as an optional reference for exported English
copies, including older wording. A full copy falls back to the current source.
In mixed catalogs, only known English phrases are compared with the source and
reference. Shared wording such as homographs and brand names can legitimately
match the English text. Videos use
their localized section title or a dedicated label for the Glass demonstration.

The N-Zik DevGlobe badge uses its existing translations. The N-Zik Desktop
Compagnon badge identifies a different project. Sharing a single label with a
project name parameter would require retranslating the full phrase to preserve
word order and agreement in each language. The six theme previews use individual
keys to preserve their existing Turkish labels, including the spacing in the
sixth label, which a shared numbered template would change.

These commands check the catalogs and their references without additional dependencies.

```sh
python -B -m unittest discover -s tests -v
node --test tests/*.test.cjs
```
