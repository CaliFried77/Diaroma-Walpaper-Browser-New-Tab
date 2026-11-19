# Diorama — Cloudflare Workers Dağıtım Rehberi

Bu rehber projedeki Tarayıcı / PWA sürümünü (`dist/` + `cloudflare/worker.mjs`) Cloudflare Workers Static Assets üzerinde yayınlamak için adımları özetler. Ana geliştirme ve yayın dalı `main`'dir.

## Mimari

- Statik uygulama `npm run build` ile `dist/` içine üretilir.
- Cloudflare Workers Static Assets, `dist/` dosyalarını `ASSETS` binding'i üzerinden sunar.
- `cloudflare/worker.mjs` yalnızca `/api/*` isteklerini (`run_worker_first = ["/api/*"]`) işler.
- Ortak RSS ayrıştırıcı ve API doğrulaması `server/` altındadır; Cloudflare'a özel ağ taşıması `cloudflare/rss-fetch.mjs` içindedir.
- `_headers`, statik dosyalara güvenlik başlıklarını uygular. Worker API yanıtları kendi başlıklarını doğrudan ekler.
- Çevrimdışı uygulama kabuğu `dist/sw.js`, derleme sırasında `sw.template.js` şablonundan içerik karma parmak iziyle üretilir.

## Yerel Geliştirme

Node.js 22+ gerekir:

```bash
npm run dev
```

Wrangler `4.162.0` proje komutlarında sabitlenmiştir; ilk çalıştırmada `npx` bu sürümü indirir ve `wrangler.toml` dosyasındaki Worker yapılandırmasını kullanır.

## GitHub Bağlantısı ve Yayın

1. Cloudflare Dashboard'da **Workers & Pages → Create application → GitHub** yoluyla `CaliFried77/Diaroma-Walpaper-Browser-New-Tab` deposunu bağlayın.
2. Production branch olarak `main` seçin.
3. Build command: `npm run build`. Deploy command: `npx --yes wrangler@4.162.0 deploy`.
4. Worker adı `living-pixel-diorama` olarak `wrangler.toml` içinde tanımlıdır (`workers_dev = true`).
5. Önizleme ortamında RSS uç noktalarını, güvenlik başlıklarını, rate-limit binding'lerini ve Service Worker davranışını doğrulamadan özel alan adına geçiş yapmayın.

## Rate-Limit Binding'leri

`wrangler.toml` iki ayrı rate-limit binding tanımlar:

- `NEWS_RATE_LIMITER`: yerleşik kategori haber API'si
- `CUSTOM_NEWS_RATE_LIMITER`: kullanıcı tanımlı özel RSS API'si

Her biri 60 saniyede 40 birim olarak yapılandırılmıştır. Namespace kimlikleri Cloudflare hesabınız içinde benzersiz olmalı ve üretim/önizleme ortamlarında çakışmamalıdır. Cloudflare rate-limit kararları veri merkezi (POP) bazında yaklaşık çalışır.

## Yayın Öncesi Kontroller

```bash
npm run check
npm test
npm run security
npm run build
npm run deploy:dry-run
```

`npm run deploy:dry-run` komutu canlı yayın yapmadan Worker paketini ve `wrangler.toml` uyumluluğunu doğrular. Gerçek yayın için yalnızca tüm kalite adımları geçtikten sonra `npm run deploy` kullanın.
