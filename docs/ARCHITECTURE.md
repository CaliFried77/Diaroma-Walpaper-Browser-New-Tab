# Mimari ve geliştirme sınırları

## Katmanlar

### 1. Tarayıcı & Cloudflare Workers Modu

```text
Browser (index.html, js/, css/, config/)
        |
        | same-origin /api/*
        v
Cloudflare Worker (cloudflare/worker.mjs)
        |
        +-- server/news-handler.mjs
        +-- server/custom-news-handler.mjs
        +-- cloudflare/rss-fetch.mjs
                   |
                   v
             server/rss-parser.mjs

Static files -> Cloudflare Workers Static Assets (dist/)
Offline shell -> generated dist/sw.js from sw.template.js
```

### 2. Wallpaper Engine & Yerel Masaüstü Köprüsü Modu

```text
Source (index.html, js/, config/, wallpaper/*)
        |
        | scripts/build-wallpaper.mjs (classic file:// bundle)
        v
dist-wallpaper/ (project.json, index.html, wallpaper.bundle.js, wallpaper.css)
        |
        | localhost http://127.0.0.1:47831 (optional)
        v
scripts/desktop-bridge.mjs
        +-- wallpaper/desktop-sysmon-helper.ps1 (PDH / SHM / D3Cold guard)
        +-- wallpaper/desktop-media-helper.ps1  (Windows GSMTC playback)
        +-- wallpaper/desktop-wheel-hook.ps1    (Desktop wheel & IME relay)
```

## Sorumluluklar

- `js/`: browser-only UI, habitat physics, creature art, Liquid Glass refraction and local state. No hosting-provider imports.
- `wallpaper/`: Wallpaper Engine runtime enhancements, Unified Hybrid Liquid Glass CSS, Performance Profiles and PowerShell telemetry/media/input helpers.
- `config/`: data-only habitat and news publisher catalog.
- `server/`: Request/Response API contracts, RSS XML parsing and URL validation. Keep this layer runtime-neutral; avoid Node-only APIs.
- `cloudflare/`: Cloudflare-specific fetch transport, Worker routing, cache and rate-limit bindings.
- `scripts/`: deterministic CSS, Wallpaper Engine bundler, local desktop bridge, build, dependency-graph and security checks.
- `tests/`: pure unit tests first, then Worker adapter, Wallpaper Engine contract and browser smoke tests.

## Change rules

1. Prefer one responsibility per module; keep runtime adapters small.
2. Keep browser APIs separate from Worker runtime APIs.
3. Inject outbound-fetch functions into shared server handlers so behavior can be tested without the network.
4. Treat every RSS publisher response and user-provided URL as untrusted input.
5. Never enable automatic redirects for custom feeds.
6. Cache only validated successful built-in feed responses; keep custom feed responses private.
7. Update tests and this documentation when API contracts, Wallpaper Engine properties, or platform bindings change.
8. Run `npm run check`, `npm test`, and `npm run security` before pushing to `main` or deploying.
