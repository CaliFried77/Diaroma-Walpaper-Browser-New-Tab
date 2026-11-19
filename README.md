# Living Pixel Diorama

[English](README.md) | [Türkçe](README_TR.md)

**Version:** `2.0.0`  
**Targets:** Windows Desktop Wallpaper Engine + Local Desktop Bridge **and** Browser New Tab (Cloudflare Workers Static Assets)  
**License:** MIT (`LICENSE`). Self-hosted fonts retain their original SIL Open Font License 1.1 notices (`THIRD_PARTY_NOTICES.md`).

Living Pixel Diorama is an interactive, local-first desktop ecosystem and personal browser new-tab experience featuring **8 handcrafted pixel-art habitats**, a **Unified Hybrid Smoked-Crystal Liquid Glass** UI, multi-source RSS news, weather + CAMS air quality, Pomodoro focus timer with procedural ambient audio, smart calendar, notes, and Windows desktop integration.

---

## Key Features

- **8 Interactive Pixel-Art Habitats (`config/habitat-catalog.js`, `js/`):** Meadow Bees, Halfmoon Betta Aquarium, Willow Firefly Wetland, Botanical Conservatory, Coral Reef Jellyfish, Zen Koi Pond, Tropical Rainforest Parrots, and Arctic Aurora Foxes. Click anywhere in a scene to drop habitat-specific stimuli.
- **Unified Hybrid Smoked-Crystal Liquid Glass (`wallpaper/wallpaper.css`, `js/10-glass-renderer.js`):** Real-time 1:1 refracted pixel canvas lenses layered with balanced smoked-crystal scrims and inner readability pockets across floating widgets, top pills, and popovers in both Dark and Light modes.
- **Laptop-Friendly Performance & Power Design:** Default **Balanced (30 FPS scene / 20 FPS glass / 1x detail)** profile, 1-click **Eco (24 FPS / 15 FPS glass)** and **High HD (60 FPS)** presets, offscreen flora/sun/moon/bloom caching, transition-tracked lenses, Wallpaper Engine fullscreen pause (`setPaused`), and hybrid-laptop **dGPU D3Cold protection** so NVIDIA GPUs are not woken just for telemetry polling.
- **Bilingual TR / EN & Self-Hosted Typography:** Instant runtime switching between Turkish and English plus bundled pixel/UI fonts (`fonts/`).
- **Rich Widget Suite:** Multi-engine search & desktop app/file launcher, custom shortcuts dock, Windows GSMTC vinyl player (`#weMusicWidget`), live system + Diorama footprint monitor (`#weSystemWidget`), smart calendar (TR/US/UK/DE public holidays, football club & national team fixtures, weekly timetables, free-time calculator), RSS news reader, weather/moon/UV/CAMS panel, focus stage, and optional Xiaomi MiOT Air Purifier LAN card.

---

## Using in Wallpaper Engine (Windows)

### 1. Prerequisites
- **Windows 10 / 11**
- **Node.js 22+** ([nodejs.org](https://nodejs.org/))
- **Wallpaper Engine** (Steam)

### 2. Clone & Build the Wallpaper Package
```bash
git clone https://github.com/CaliFried77/Diaroma-Walpaper-Browser-New-Tab.git
cd Diaroma-Walpaper-Browser-New-Tab
npm run build:wallpaper
```
Or simply double-click **`build-wallpaper.bat`** in the project folder. This generates **`dist-wallpaper/`** including `dist-wallpaper/project.json`, `dist-wallpaper/index.html`, `dist-wallpaper/css/wallpaper.css`, `dist-wallpaper/js/wallpaper.bundle.js`, and portable `.bat` helpers.

### 3. Open in Wallpaper Engine
1. Launch **Wallpaper Engine**.
2. Click **Open Wallpaper** (bottom-left) → **Open Offline / Open from File**.
3. Browse to the cloned folder and select **`dist-wallpaper/project.json`**.
4. **Recommended Settings:**
   - Enable **Pause when another application is fullscreen / maximized** in Wallpaper Engine settings — Diorama natively hooks `setPaused` to suspend canvas animation loops, timers, and background telemetry.
   - Adjust **Performance Profile** (`Eco` / `Balanced` / `High HD`), Theme, Taskbar Height, Top Bar visibility, Pixel Font, Language (`tr` / `en`), and Widgets either from the top-right **Settings (⚙)** panel on the wallpaper or from Wallpaper Engine's properties sidebar.

### 4. Optional: Local Desktop Bridge (`127.0.0.1:47831`)
The wallpaper renders immediately without any background service. To unlock Windows PC features, run the local loopback bridge:

- **Manual start:** Double-click **`start-desktop-bridge.bat`** or run `npm run bridge`.
- **Auto-start at Windows login (hidden window):** Double-click **`install-startup-bridge.bat`**.

What the Desktop Bridge enables:
- **PC App & File Search Launcher:** Indexes Start Menu apps, shortcuts, and user folders directly from the center search bar.
- **Vinyl Turntable (`#weMusicWidget`):** Reads live Windows GSMTC media sessions (Spotify, Chrome, Edge, VLC, etc.) with adaptive waiting (`desktop-media-helper.ps1`).
- **System & Diorama Telemetry (`#weSystemWidget`):** Persistent native PDH (`pdh.dll`) GPU/VRAM counters, shared-memory CPU temps (HWiNFO64 / Afterburner / Core Temp), Diorama RAM/CPU/GPU footprint, and hybrid dGPU D3Cold protection (`desktop-sysmon-helper.ps1`).
- **Desktop Wheel & Input Relay:** Smooth scroll pass-through into widgets while running on the Windows desktop (`desktop-wheel-hook.ps1`).
- **Local News, Sports & LAN Devices:** RSS aggregation (`/api/news`), ESPN sports schedule fixtures (`/api/sports/fixtures`), and Xiaomi Air Purifier MiOT LAN control.

---

## Using as a Browser New Tab / Cloudflare Worker

Node.js `22+` is required (Wrangler `4.162.0` is invoked automatically via `npx`).

```bash
# Local Cloudflare Workers preview (static app + /api/news + /api/custom-news)
npm run dev

# Build deployable browser bundle into dist/
npm run build

# Dry-run Cloudflare bundle validation (does not publish)
npm run deploy:dry-run
```

For full Cloudflare Worker deployment instructions, see [docs/DEPLOY_CLOUDFLARE_TR.md](docs/DEPLOY_CLOUDFLARE_TR.md). Note that `dist/` relies on `/api/*` routes in `cloudflare/worker.mjs` for live RSS fetching when hosted online.

---

## Validation & Build Scripts

| Command | Purpose |
|---|---|
| `npm run build:wallpaper` | Build utility CSS + Wallpaper Engine package (`dist-wallpaper/`) |
| `npm run bridge` | Start local Windows Desktop Bridge on `127.0.0.1:47831` |
| `npm run check` | Generate utility CSS and validate module graph, imports & syntax |
| `npm test` | Build browser + wallpaper targets and run all Node automated tests |
| `npm run security` | Run static CSP, XSS sink, font and security header audit |
| `npm run build` | Generate production browser build in `dist/` and `dist/sw.js` |
| `npm run dev` | Run local Wrangler Worker development server |
| `npm run deploy:dry-run` | Verify Cloudflare Worker bundle locally without deploying |

---

## Project Structure

- `wallpaper/` — Wallpaper Engine glass/widget stylesheet (`wallpaper.css`), launcher runtime (`wallpaper-launcher.js`), and Windows PowerShell helpers (`desktop-sysmon-helper.ps1`, `desktop-media-helper.ps1`, `desktop-wheel-hook.ps1`)
- `index.html`, `js/`, `css/` — Core browser application markup, ES modules (habitats, creatures, glass renderer, UI panels) and base/utility styles
- `config/` — Habitat and built-in RSS publisher catalogs
- `server/` — Runtime-neutral RSS/Atom parser, URL validator, and API request handlers
- `cloudflare/` — Cloudflare Worker entrypoint and fetch transport (`wrangler.toml`, `_headers`)
- `scripts/` — Deterministic CSS generator (`build-css.mjs`), Wallpaper Engine bundler (`build-wallpaper.mjs`), desktop bridge (`desktop-bridge.mjs`), module check (`check.mjs`), security audit (`security-audit.mjs`), browser smoke test (`browser-smoke.py`)
- `tests/` — Automated Node unit & contract tests (`tests/*.test.mjs`)
- `fonts/` & `licenses/` — Self-hosted Open Source WOFF2 fonts and upstream OFL 1.1 license files
- `docs/` — Architecture, security, QA and customization guides

Generated output folders (`dist/`, `dist-wallpaper/`) are ignored by Git and rebuilt from source via `npm run build` and `npm run build:wallpaper`.

---

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Cloudflare Workers Deployment Guide (TR)](docs/DEPLOY_CLOUDFLARE_TR.md)
- [Code Navigation & Safe Editing Guide (TR)](docs/CODE_GUIDE_TR.md)
- [Security Model](docs/SECURITY.md)
- [QA Checklist (TR)](docs/QA_CHECKLIST.md)
- [Adding Habitats (TR)](docs/ADDING_HABITATS.md)
- [Adding News Sources (TR)](docs/ADDING_NEWS_SOURCES.md)

## License

Application source code is licensed under the **MIT License** ([LICENSE](LICENSE)). Bundled font binaries remain under their respective **SIL Open Font License 1.1** terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `licenses/fonts/`.
