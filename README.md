# Sound Elevator — 66 Curiosities

A continuous watercolor climb from the ground to 100 km. Plain HTML, CSS and JavaScript; no backend, API key, npm install or environment variables required.

## Run locally

1. Extract the full ZIP.
2. Windows: double-click START_WINDOWS.bat, or run `py -3 start.py`.
3. macOS/Linux: run `python3 start.py`.
4. Open http://127.0.0.1:8000/ and enable sound with the existing control.

Python 3.8+; stop with Ctrl+C. Serve the files rather than opening file:// so audio can load. For GitHub Pages, publish the contents of dist/ with index.html at the root. Keep relative asset paths and recording credits intact.

## What changed

- Exactly 66 main stops, divided 13/11/12/16/14 over five equal-length chapters.
- Every stop presents an illustration, bare height, simple question and short answer. Measurement details, categories and sources remain in the data and credits.
- Equal reading space with logarithmic height interpolation between anchors. All bands expand together when text sizing needs more space.
- Original elevator, background transitions, watercolor presentation, unboxed facts, hover highlights, direct gestures and reduced-motion behavior retained.
- Compact live standard-atmosphere HUD: horizon, pressure, water boiling point, ideal sound speed and temperature.
- Minimal stop presentation: illustration, height, sound-led question and short answer. Categories, height datums, numeric fact values and sources remain in the data and credits.
- New matched watercolor cutouts and real recordings. The bat sample is labelled 10×slower; no synthesized replacement noises.

See dist/changes.html for the current numbered route, moved heights, replacements and omissions. See dist/credits.html for every source and recording licence.

## Folder structure

- dist/index.html: page entry and existing interface.
- dist/stops.js: all 66 facts, sources, categories, artwork keys and height mapping.
- dist/app.js: rendering, scroll/navigation, scene gestures and HUD updates.
- dist/atmosphere.js: ISA-compatible lower atmosphere, COESA upper extension, IAPWS water and geometric horizon.
- dist/soundscapes.js: recording assignments and illustrative listening distances.
- dist/audio.js: recorded audio graph, scene crossfades, window filter, one-shot crack and waveform.
- dist/assets.js: bundled image map.
- dist/style.css: preserved presentation and compact content/HUD additions.
- dist/images/: watercolor WebP assets.
- dist/sounds/: licensed real recordings and source metadata.
- start.py: standard-library local HTTP server; never part of the hosted frontend.

The atmosphere HUD is a reference model for geometric altitude above sea level, not live weather, conditions inside a cabin, or measured conditions around each illustrated object. Recorded sound levels and falloff are illustrative, not calibrated decibels. 34 stops play real recordings or habitat ambience; 32 stay quiet. The credits identify each recording and illustrative use. See dist/sounds/coverage.json and credits.html.

## Validation

Checked 66 stops, band counts, unique identifiers, ascending height labels, source coverage, image/audio references, spacing and navigation; standard-atmosphere reference values; window gestures and recorded audio graph in a lightweight DOM/audio harness. A rendered browser preview was not available in this static-site environment.

## Height audit

All 66 height connections are documented in dist/height-audit.json. Approximate ranges are described as ranges. Six replacement illustrations are included as optimized local WebP files.

## Publish on GitHub and Vercel

### GitHub repository

Create a public repository named `sound-elevator` under your account. Upload this folder's contents, including `.github/workflows/pages.yml`, to the `main` branch. Do not upload the ZIP itself. The code is MIT licensed; keep the asset credits.

### GitHub Pages

In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. Run the **Deploy GitHub Pages** workflow from the Actions tab, or push a new commit. The workflow publishes `dist/`. The published address appears under Settings → Pages.

### Vercel

Choose **Add New → Project**, import this GitHub repository, and deploy. Keep Root Directory at the repository root. Framework Preset: **Other**. No install or build command. Output Directory: **dist**. The included `vercel.json` supplies these settings. No environment variables are needed. Later pushes to `main` can update both hosts automatically.

### Public-source check

This export contains no repository history, hosting credentials, `.openai` settings, `.env` files or account tokens. Its browser code requires no API keys. Public source makes the included code and assets downloadable, so their licences and attribution remain important.
