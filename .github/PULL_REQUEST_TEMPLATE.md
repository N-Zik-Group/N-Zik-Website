<!-- Thanks for the contribution! 🙌
     Fill in what applies to your PR and tick the matching boxes — leave the rest unchecked (don't delete them). -->

## 📋 What are you changing?
<!-- The problem, your solution, context and decisions. If similar work already exists, link it and explain how this PR differs. -->

## 🔗 Related issues
<!-- Avoid words that auto-close the issue ("fixes", "closes") — use the `issue https://...` format. -->
- Issue: `issue https://github.com/N-Zik-Group/N-Zik-Website/issues/…`

## 🚀 Type of change
- [ ] ✨ New feature (`feat`)
- [ ] 🐛 Bug fix (`fix`)
- [ ] 📈 Improvement of existing behavior (`improve`)
- [ ] ⚡ Performance (`perf`)
- [ ] 🧹 Refactor, no behavior change (`refactor`)
- [ ] 📖 Docs only (`docs`)
- [ ] 🛠️ Site / assets / tooling (`chore`)

## 🤖 Made with AI?
<!-- Just tells us whether an AI agent helped produce this change. -->
- [ ] 🤖 Yes — an AI agent helped produce this change
- [ ] 👤 No — I wrote it myself, no AI assistance

## 📸 Screenshots / video
<!-- Before/after for visual changes (image, GIF or MP4). Skip if not applicable. -->
| Before | After |
| ------ | ----- |
|        |       |

## ✅ How can we verify it?
<!-- Steps for a reviewer + concrete evidence: diffs, screenshots, local-server output. "It works" alone doesn't cut it 🙂 -->
1.
2.

---

## 🛠️ Checklist
> Tick every box that applies to your PR; leave the rest unchecked.

### ✅ Always (every PR)
- [ ] I tested this change myself before opening the PR
- [ ] No force push, no rewritten history
- [ ] Branch named `feat/…`, `fix/…` or `chore/…`
- [ ] Commits follow the repo convention — e.g. `feat(hero): rework download badges`
  <!-- `type(scope): description` · English · imperative · under 72 chars · no final period · issue links as `issue https://...` -->

### 🌍 i18n
- [ ] New/changed strings go in `res/values/strings.xml` (English default) only — I didn't hand-edit any `values-*/` translation file (Crowdin-managed)
- [ ] If I added a locale: I created `res/values-xx/strings.xml` **and** added the language to the footer selector in `index.html`

### 🏗️ Code
- [ ] No new dependencies (this is a zero-build vanilla HTML/CSS/JS site)
- [ ] No secrets or tokens in the diff

### 🧪 Verification
- [ ] Verified with a local HTTP server (`python -m http.server`) — opening `index.html` via `file://` breaks the i18n loader

## 🗒️ Anything else?
-
