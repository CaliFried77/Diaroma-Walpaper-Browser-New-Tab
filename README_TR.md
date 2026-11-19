# Living Pixel Diorama

[English](README.md) | **Türkçe**

**Sürüm:** `2.0.0`  
**Çalışma Ortamları:** Windows Masaüstü Wallpaper Engine + Yerel Masaüstü Köprüsü **ve** Tarayıcı Yeni Sekme (Cloudflare Workers Static Assets)  
**Lisans:** MIT (`LICENSE`). Yerel fontlar kendi SIL Open Font License 1.1 lisanslarını korur (`THIRD_PARTY_NOTICES.md`).

Living Pixel Diorama; **8 canlı piksel-art ekosistem**, tek dilde birleştirilmiş **Hibrit Füme-Kristal Liquid Glass** arayüz, çok kaynaklı RSS haber okuyucu, hava durumu + CAMS hava kalitesi, ambiyans sesli Pomodoro odak sayacı, akıllı takvim, not/görev defteri ve Windows masaüstü entegrasyonu sunan yerel öncelikli bir interaktif duvar kâğıdı ve yeni sekme uygulamasıdır.

---

## Öne Çıkan Özellikler

- **8 İnteraktif Piksel-Art Habitat (`config/habitat-catalog.js`, `js/`):** Arılı Çayır, Beta Akvaryumu, Ateşböcekli Söğüt Sulak Alanı, Botanik Sera, Mercan Resifi Denizanaları, Zen Koi Göleti, Yağmur Ormanı Papağanları ve Kutup Tilkili Aurora. Sahneye tıklayarak her biyoma özgü yem/etkileşim bırakabilirsin.
- **Birleşik Hibrit Füme-Kristal Liquid Glass (`wallpaper/wallpaper.css`, `js/10-glass-renderer.js`):** Yüzen widget'lar, üst araç çubuğu pill'leri ve açılır panellerde 1:1 gerçek zamanlı kırılan piksel cam merceklerini dengeli füme okunabilirlik katmanı ve iç kart cepleriyle Gece/Gündüz modlarında tek tasarım dilinde sunar.
- **Laptop Dostu Performans & Güç Tasarrufu:** Varsayılan **Dengeli (30 FPS sahne / 20 FPS cam / 1x detay)** profili, tek tıkla **Sessiz/Laptop (24 FPS / 15 FPS cam)** ve **Yüksek HD (60 FPS)** seçenekleri, flora/güneş/ay/bloom offscreen önbellekleri, Wallpaper Engine tam ekran duraklatma (`setPaused`) desteği ve hibrit laptoplarda NVIDIA GPU'yu uyandırmayan **dGPU D3Cold koruması**.
- **Anlık TR / EN Dil Desteği & Yerel Fontlar:** Türkçe ve İngilizce arasında anlık geçiş + `fonts/` altında yerel pixel/UI fontları.
- **Kapsamlı Widget Ekosistemi:** PC uygulama/dosya başlatıcısı ve kısayol dock'u, Windows GSMTC uyumlu piksel plak çalar (`#weMusicWidget`), canlı sistem & Diorama kaynak monitörü (`#weSystemWidget`), akıllı takvim (TR/US/UK/DE resmi tatilleri, kulüp ve milli takım maç fikstürleri, ders/iş programı, boş zaman hesabı), RSS haber merkezi, hava/ay/UV/CAMS kartı ve yerel ağ Xiaomi Hava Temizleyici kontrolü.

---

## Wallpaper Engine Üzerinde Kurulum ve Açma

### 1. Gereksinimler
- **Windows 10 veya Windows 11**
- **Node.js 22 veya üzeri** ([nodejs.org](https://nodejs.org/))
- **Wallpaper Engine** (Steam)

### 2. Projeyi İndirme ve Duvar Kâğıdı Paketini Derleme
```bash
git clone https://github.com/CaliFried77/Diaroma-Walpaper-Browser-New-Tab.git
cd Diaroma-Walpaper-Browser-New-Tab
npm run build:wallpaper
```
İstersen komut satırı yerine proje klasöründeki **`build-wallpaper.bat`** dosyasına çift tıklaman yeterlidir. Bu işlem Wallpaper Engine için **`dist-wallpaper/`** klasörünü (`project.json`, `index.html`, `css/wallpaper.css`, `js/wallpaper.bundle.js` ve `.bat` araçlarını) üretir.

### 3. Wallpaper Engine İçinden Açma
1. **Wallpaper Engine** uygulamasını aç.
2. Sol alt köşedeki **Duvar Kâğıdı Aç (Open Wallpaper)** → **Çevrimdışı / Dosyadan Aç (Open from File)** seçeneğine tıkla.
3. Proje klasörünün içindeki **`dist-wallpaper/project.json`** dosyasını seç.
4. **Önerilen Ayarlar:**
   - Wallpaper Engine ayarlarından **Tam ekran uygulama çalışırken duraklat** seçeneğini açık tut; uygulama tam ekrandayken sahne çizim döngüsü, zamanlayıcılar ve arka plan yoklamaları otomatik durur (`setPaused`).
   - Masaüstündeki sağ üst **Ayarlar (⚙)** menüsünden veya Wallpaper Engine sağ kenar panelinden **Performans Profili** (`Sessiz` / `Dengeli` / `Yüksek HD`), Tema, Görev Çubuğu Yüksekliği, Üst Çubuk Modu, Pixel Font, Dil (`tr` / `en`) ve aktif widget'ları dilediğin gibi özelleştirebilirsin.

### 4. İsteğe Bağlı: Yerel Masaüstü Köprüsü (`127.0.0.1:47831`)
Duvar kâğıdı tek başına ek servis olmadan da tam görsel olarak çalışır. Masaüstü PC özelliklerini açmak için yerel köprüyü başlatabilirsin:

- **Elle başlatma:** **`start-desktop-bridge.bat`** dosyasına çift tıkla veya terminalde `npm run bridge` çalıştır.
- **Windows açılışında gizli otomatik başlatma:** **`install-startup-bridge.bat`** dosyasını bir kez çalıştır.

Masaüstü Köprüsünün kazandırdığı özellikler:
- **PC Uygulama & Dosya Arama Başlatıcısı:** Orta arama çubuğundan Başlat Menüsü uygulamalarını, kısayolları ve klasörleri arayıp başlatma.
- **Piksel Plak Çalar (`#weMusicWidget`):** Spotify, Chrome, Edge, VLC vb. medya oturumlarını Windows GSMTC üzerinden okur (`desktop-media-helper.ps1`).
- **Sistem & Diorama İzleyici (`#weSystemWidget`):** Kalıcı native `pdh.dll` GPU/VRAM sayaçları, HWiNFO64/Afterburner/Core Temp shared-memory CPU sıcaklığı, Diorama'nın kendi RAM/CPU/GPU yükü ve hibrit laptoplar için **dGPU D3Cold koruma** mantığı (`desktop-sysmon-helper.ps1`).
- **Masaüstü Tekerlek & Klavye İletimi:** Masaüstü simgelerini gizlemeden widget içi kaydırma tekerleğini yumuşak biçimde iletme (`desktop-wheel-hook.ps1`).
- **Yerel Haber, Fikstür ve Akıllı Ev:** Yerel RSS okuyucu (`/api/news`), ESPN spor fikstürleri (`/api/sports/fixtures`) ve Xiaomi Air Purifier yerel ağ kontrolü.

---

## Tarayıcı Yeni Sekme ve Cloudflare Workers Kullanımı

Node.js `22+` gereklidir (Wrangler `4.162.0` komutlar içinde `npx` ile otomatik kullanılır).

```bash
# Yerel Cloudflare Workers geliştirme sunucusu (statik uygulama + /api/news + /api/custom-news)
npm run dev

# Tarayıcı / PWA üretim derlemesi (dist/ ve dist/sw.js üretir)
npm run build

# Yayınlamadan yerel Cloudflare Worker paket kontrolü
npm run deploy:dry-run
```

Canlıya alma adımları için [docs/DEPLOY_CLOUDFLARE_TR.md](docs/DEPLOY_CLOUDFLARE_TR.md) rehberine bakabilirsin. Online yayında haber API'leri `cloudflare/worker.mjs` üzerindeki `/api/*` rotalarını kullanır.

---

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run build:wallpaper` | Yardımcı CSS'i ve Wallpaper Engine paketini (`dist-wallpaper/`) derler |
| `npm run bridge` | Yerel Windows Masaüstü Köprüsünü (`127.0.0.1:47831`) başlatır |
| `npm run check` | CSS üretir ve modül grafiği, importlar ile sözdizimini doğrular |
| `npm test` | Tarayıcı + Wallpaper hedeflerini derler ve tüm Node testlerini çalıştırır |
| `npm run security` | Statik CSP, XSS sink, font ve güvenlik başlığı denetimini çalıştırır |
| `npm run build` | `dist/` klasörüne üretim tarayıcı derlemesini yazar |
| `npm run dev` | Yerel Wrangler Worker geliştirme sunucusunu başlatır |
| `npm run deploy:dry-run` | Cloudflare Worker paketini yayınlamadan doğrular |

---

## Proje Yapısı

- `wallpaper/` — Wallpaper Engine Liquid Glass / widget CSS'i (`wallpaper.css`), başlatıcı runtime'ı (`wallpaper-launcher.js`) ve PowerShell yardımcıları (`desktop-sysmon-helper.ps1`, `desktop-media-helper.ps1`, `desktop-wheel-hook.ps1`)
- `index.html`, `js/`, `css/` — Ana tarayıcı arayüzü, ES modülleri (habitatlar, canlılar, cam renderer, widget'lar) ve temel/yardımcı stiller
- `config/` — Habitat ve yerleşik RSS yayıncı katalogları
- `server/` — Platformdan bağımsız RSS/Atom ayrıştırıcı, URL doğrulama ve API işleyicileri
- `cloudflare/` — Cloudflare Worker giriş noktası ve ağ taşıması (`wrangler.toml`, `_headers`)
- `scripts/` — CSS üreteci (`build-css.mjs`), Wallpaper Engine derleyicisi (`build-wallpaper.mjs`), masaüstü köprüsü (`desktop-bridge.mjs`), modül kontrolü (`check.mjs`), güvenlik denetimi (`security-audit.mjs`) ve tarayıcı smoke testi (`browser-smoke.py`)
- `tests/` — Otomatik Node birim ve sözleşme testleri (`tests/*.test.mjs`)
- `fonts/` & `licenses/` — Yerel WOFF2 yazı tipleri ve OFL 1.1 lisans dosyaları
- `docs/` — Mimari, Cloudflare dağıtımı, güvenlik, kalite ve geliştirme rehberleri

Derleme çıktıları (`dist/`, `dist-wallpaper/`) `.gitignore` ile hariç tutulur; kaynak koddan `npm run build` veya `npm run build:wallpaper` ile yeniden üretilir.

---

## Dokümantasyon

- [Mimari Genel Bakış](docs/ARCHITECTURE.md)
- [Cloudflare Workers Dağıtım Rehberi](docs/DEPLOY_CLOUDFLARE_TR.md)
- [Kod Rehberi ve Güvenli Düzenleme Standardı](docs/CODE_GUIDE_TR.md)
- [Güvenlik Modeli](docs/SECURITY.md)
- [Kalite Güvence Kontrol Listesi](docs/QA_CHECKLIST.md)
- [Yeni Habitat Ekleme](docs/ADDING_HABITATS.md)
- [Yeni Haber Kaynağı Ekleme](docs/ADDING_NEWS_SOURCES.md)

## Lisans

Uygulama kaynak kodu **MIT Lisansı** ([LICENSE](LICENSE)) altındadır. Pakete dahil font ikilileri kendi **SIL Open Font License 1.1** koşullarını korur; ayrıntılar için [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) dosyasına ve `licenses/fonts/` klasörüne bakın.
