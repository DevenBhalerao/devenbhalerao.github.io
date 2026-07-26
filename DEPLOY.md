# Deploying devenbhalerao.com

Static site — no build step, no dependencies. Pushing to `main` publishes it.

This repo is named `devenbhalerao.github.io`, which makes it a GitHub **user site**:
it serves at the domain root with no `gh-pages` branch and no Actions workflow.

---

## One-time: point the domain at GitHub Pages

### 1. DNS (Route53 → hosted zone for `devenbhalerao.com`)

**A record — apex (`devenbhalerao.com`), all four values in the one record:**

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**AAAA record — apex (`devenbhalerao.com`), all four values in the one record:**

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**CNAME record — `www.devenbhalerao.com`:**

```
devenbhalerao.github.io
```

Leave TTL at the default (300s is fine). Do **not** create an ALIAS record — Route53
aliases only target AWS resources, and GitHub Pages is not one.

### 2. GitHub

1. Repo → **Settings** → **Pages**
2. **Custom domain** → `devenbhalerao.com` → **Save**
3. Wait for the DNS check to go green (usually a few minutes; DNS propagation can take longer)
4. Tick **Enforce HTTPS** once the check passes — the Let's Encrypt certificate is issued
   automatically and can take up to ~15 minutes to appear

### 3. Verify

```bash
curl -sI https://devenbhalerao.com | head -1
```

Expect `HTTP/2 200`. Also check that `https://www.devenbhalerao.com` redirects to the apex.

---

## The `CNAME` file

`CNAME` in the repo root contains exactly `devenbhalerao.com`. **It must stay there.**
GitHub Pages reads it on every deploy; if a push removes it, the custom domain silently
detaches and the site reverts to `devenbhalerao.github.io`.

---

## Local preview

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Nothing to install, nothing to compile.

---

## Regenerating the assets

Three things in `assets/` were generated rather than hand-authored:

- `Deven-Bhalerao-CV.pdf` — built from the resume content with `fpdf2` (real selectable
  text, so ATS parsers can read it). Deliberately omits the phone number, date of birth
  and home address that the source `.docx` carries in its header.
- `og.png` — the 1200×630 link-preview card, built with Pillow.
- `deven-400/800.webp` + `.jpg` — the hero portrait, cropped to 4:5 and resized from the
  full-resolution original. The original (5.4 MB PNG) is deliberately **not** in this repo
  — it lives one directory up as `deven-photo-original.png`, because a 5 MB binary in git
  history can never be removed without a rewrite.

All are committed, so none need regenerating for a normal content edit.

**To swap the photo:** crop a new source to 4:5, export at 800×1000 and 400×500 in both
WebP and JPEG, and keep the existing filenames. The markup references all four via
`<picture>`/`srcset`, so no HTML change is needed.

---

## Editing content

All copy lives in `index.html` as plain markup — there is no CMS and no data file to
thread through. Search for the section id (`#about`, `#experience`, …) and edit in place.

Fonts are self-hosted in `assets/fonts/` (latin subset, ~100 KB total). There are no
third-party requests on the page at all: no CDN, no analytics, no trackers.
