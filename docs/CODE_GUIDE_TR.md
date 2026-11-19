# Kod rehberi ve güvenli düzenleme standardı

Bu belge, projeyi ileride düzenlerken doğru dosyayı bulmayı ve değişikliklerin çalışan siteyi bozmasını önlemeyi amaçlar. Uygulamanın çalışma mantığını değiştirmez.

## 1. Dosyayı nerede aramalıyım?

| Dosya / klasör | Sorumluluğu | Ne zaman düzenlenir? |
|---|---|---|
| `index.html` | Sayfanın HTML yapısı, bileşenlerin ve panellerin yerleşimi | Yeni panel, düğme, form alanı veya temel sayfa yapısı eklerken |
| `js/main.js` | Tarayıcı modüllerini başlatır ve Service Worker'ı kaydeder | Yeni bir özellik modülü uygulamaya bağlanırken |
| `js/01-core-ui.js` | Tema, arama, saat, kısayollar, popover ve ortak arayüz davranışları | Genel arayüz davranışları değişirken |
| `js/02-news.js` | Haber kaynakları, kullanıcı tercihleri, önbellek, haber kartları ve istek akışı | Haber paneli veya RSS kaynak seçimi değişirken |
| `js/03-weather.js` | Hava durumu, hava kalitesi, ay/güneş bilgisi ve hava çizim efektleri | Hava paneli veya hava efektleri değişirken |
| `js/04-focus-audio.js` | Odak sayacı, oturumlar, bildirim sesi ve ambiyans sesi | Pomodoro veya ses özellikleri değişirken |
| `js/05-workspace.js` | Görevler ve notlar | Görev/not arayüzü veya saklanan veriler değişirken |
| `js/06-data-manager.js` | JSON yedek alma, geri yükleme ve veri doğrulama | Yedekleme biçimi veya veri taşıma davranışı değişirken |
| `js/07-habitat-state.js` | Sahne canvas'ı, ortak sahne dizileri, aktif habitat ve kare/zaman ölçekleri | Bütün habitatların paylaştığı temel durum değişirken |
| `js/08-creatures.js` | Hayvan sınıflarının sabit dışa aktarma kapısı; diğer modüller bu dosyadan import etmeye devam eder | Yeni hayvan dosyasını sisteme tanıtırken |
| `js/creature-bee.js`, `creature-koi.js`, `creature-betta.js`, `creature-dragonfly.js`, `creature-butterfly.js`, `creature-jellyfish.js`, `creature-parrot.js`, `creature-arctic-fox.js` | Her türün kendi hareket, etkileşim, durum ve piksel çizim kodu | Belirli bir hayvanın davranışını veya görünümünü değiştirirken |
| `js/creature-utils.js` | Birden fazla türün kullandığı ortak yem hedefleme yardımcısı | Tüm canlıların ortak yem sahiplenme davranışını değiştirirken |
| `js/habitat-interactions.js` | Canvas tıklamalarını yem/uyarana çevirir; yemlerin animasyon, çizim ve ömür döngüsünü yürütür | Yeni yem türü, tıklama etkileşimi veya yem çizimi eklerken |
| `js/arctic-geometry.js` | Kutup platform koordinatları, tilki rotaları ve böğürtlen iniş yüzeyleri; DOM/canvas bağımlılığı olmayan saf geometri | Kutup platformlarının boyutu, konumu veya tilki rotaları değişirken |
| `js/habitat-geometry.js` | Tüm habitat profillerinin zemin eğrileri; sahne boyutlarını parametre olarak alan saf hesaplamalar | Bir habitatın zemin eğrisi veya yükseklik formülü değişirken |
| `js/habitat-backgrounds.js` | Önbelleğe alınan statik habitat arka planları, ağaçlar, kayalar ve çevre katmanları | Statik çevre görünümü veya arka plan kompozisyonu değişirken |
| `js/habitat-flora-renderer.js` | Flora oluşturucusunun hazırladığı bitkilerin kare bazlı animasyon/çizimi | Bitki türlerinin görünümü, sallanması veya hareketli çizim davranışı değişirken |
| `js/habitat-initializer.js` | Aktif habitatı seçer; sahne dizilerini ve önbelleği sıfırlayıp flora/canlı oluşturucularını çağırır | Habitat geçişinin genel başlangıç akışını değiştirirken |
| `js/habitat-flora-generator.js` | Her biyom için bitkilerin türünü, miktarını, rengini ve sahnedeki başlangıç koordinatlarını üretir | Yeni biyoma bitki eklerken veya bitkilerin başlangıç yerleşimini değiştirirken |
| `js/09-scenery.js` | Gökyüzü/hava efektlerini ve sahne katmanlarının kare başına çağrı sırasını yönetir | Hareketli atmosfer efektleri veya çizim sırası değişirken |
| `js/10-glass-renderer.js` | Animasyon döngüsü, canlıların sahneye çizilmesi, cam yansıma katmanı ve klavye kısayolları | Animasyon, çizim sırası veya cam efektleri değişirken |
| `js/11-calendar.js` | Takvim, etkinlik doğrulama ve yerel kayıt | Takvim özellikleri değişirken |
| `js/storage.js`, `js/news-utils.js`, `js/scene-math.js`, `js/scene-state.js`, `js/services.js`, `js/focus-timer-state.js` | Birden fazla modülün kullandığı küçük, ortak yardımcılar ve döngü engelleyici servis köprüleri | Aynı mantık birden fazla modülde gerçekten ortaksa |
| `config/` | Habitat ve haber kaynağı katalogları | Yeni habitat profili veya haber sağlayıcısı eklerken |
| `server/` | Platformdan bağımsız haber API'si, RSS ayrıştırma ve istek doğrulama | API kuralları veya RSS ayrıştırma değişirken |
| `cloudflare/` | Cloudflare Worker yönlendirmesi, ağ taşıması, cache ve rate-limit bağlantıları | Yalnızca Cloudflare çalışma ortamına özgü davranış değişirken |
| `wallpaper/` | Wallpaper Engine widget/cam CSS'i, başlatıcı katmanı ve PowerShell sistem/medya/tekerlek yardımcıları | Wallpaper Engine arayüzü, performans profilleri veya yerel köprü istemcisi değişirken |
| `css/base.css`, `css/news.css`, `css/widgets.css`, `css/responsive.css` | Elle yazılan ana stil dosyaları | Görünüm, bileşen veya mobil düzen değişirken |
| `scripts/` ve `tests/` | Derleme (`build-css.mjs`, `build-wallpaper.mjs`), masaüstü köprüsü (`desktop-bridge.mjs`), kontrol, güvenlik denetimi ve otomatik testler | Derleme hattı, masaüstü köprüsü veya test kuralları değiştiğinde |

### Özellikle dikkat edilmesi gereken dosyalar

- `js/07-habitat-state.js` ortak durum deposudur. Buradaki değişiklik çok sayıda sahne modülünü etkileyebilir.
- Her hayvanın kodu kendi `js/creature-*.js` dosyasındadır. `js/08-creatures.js` yalnızca geriye dönük uyumlu dışa aktarma kapısıdır; sınıfı doğrudan burada tanımlama. Ortak yem bulma davranışı `js/creature-utils.js` içindedir.
- `js/09-scenery.js` artık sahne çizim orkestrasyonunu yapar; gerçek flora, statik çevre ve yem çizimleri ayrı modüllerdedir. Yeni çizim katmanı eklerken sıralamayı burada güncelle.
- `js/10-glass-renderer.js` animasyon döngüsünü yönetir. Burada küçük görünen değişiklikler FPS, pil tüketimi ve çizim sırasını etkileyebilir.
- `js/02-news.js` kaynak önbelleği, isteklerin eşzamanlılığı ve yeniden deneme kurallarını içerir. Sadece görünümü değiştirirken istek/önbellek mantığına dokunma.

## 2. Kod bölümlerini nasıl işaretleyeceğiz?

Dosyadaki büyük ve anlamlı bölümlerin başına ve sonuna aynı başlığı taşıyan açıklamalar ekleyeceğiz. Böylece düzenleyici dosya içinde arama yaparak bir bölümün başlangıcını ve bitişini kolayca bulabilir.

### JavaScript örneği

```js
// ============================================================================
// BÖLÜM BAŞI: HABİTAT DURUMU
// Görev: Canvas boyutunu ve diğer modüllerin kullandığı ortak sahne durumunu tutar.
// Düzenleme notu: Buradaki değişkenler diğer modüller tarafından içe aktarılır.
// ============================================================================

// Bu bölümün mevcut kodu burada kalır.

// ============================================================================
// BÖLÜM SONU: HABİTAT DURUMU
// ============================================================================
```

### HTML örneği

```html
<!-- BÖLÜM BAŞI: HABİTAT SEÇİCİ -->
<!-- Bu panelin açılıp kapanma davranışı JavaScript modülünde yönetilir. -->

<!-- Panelin mevcut HTML kodu burada kalır. -->

<!-- BÖLÜM SONU: HABİTAT SEÇİCİ -->
```

### CSS örneği

```css
/* BÖLÜM BAŞI: HABİTAT MENÜSÜ */
/* Kaynak CSS dosyasına eklenir; üretim CSS'i derleme sırasında küçültülür. */

/* Mevcut habitat menüsü stilleri burada kalır. */

/* BÖLÜM SONU: HABİTAT MENÜSÜ */
```

### Yorum yazma kuralları

1. Yalnızca anlamlı bölümleri işaretle. Her iki satırlık fonksiyona ayrı başlık koymak dosyayı gereksiz uzatır.
2. Açıklama, kodun ne yaptığını veya neden o şekilde çalıştığını söylesin. Satırı kelimesi kelimesine tekrar etmesin.
3. Önemli sınırları belirt: veri nereden geliyor, hangi modül kullanıyor, hangi davranışın korunması gerekiyor?
4. Karmaşık fonksiyonların içinde yalnızca sezgisel olmayan algoritma veya kritik kural için kısa satır yorumları kullan.
5. Bir bölüm taşınır ya da silinirse başlangıç ve bitiş yorumlarını da birlikte taşı veya kaldır.
6. Yorumları JavaScript kodu, HTML etiketi veya CSS kuralı dışında doğru yorum biçimiyle yaz. Template literal, metin, düzenli ifade veya nesne değeri içine gelişigüzel yorum ekleme.
7. Yorumlar çalışma mantığını değiştirmez; ancak yanlış yorum sözdizimi veya yanlış yere eklenen işaretleyici yine hata oluşturabilir. Bu yüzden yorum eklenen dosya da test edilir.

## 3. Elle düzenlenmemesi gereken üretilmiş dosyalar

- `css/utilities.css`, `scripts/build-css.mjs` tarafından HTML ve JavaScript'te kullanılan sınıflardan üretilir. Burayı elle değiştirme; değişiklik sonraki derlemede kaybolur.
- `dist/` tarayıcı derlemesinin çıktısıdır. Kaynak kod değildir; normal geliştirmede elle düzenlenmez ve repoya eklenmez.
- `dist-wallpaper/` Wallpaper Engine derlemesinin (`scripts/build-wallpaper.mjs`) çıktısıdır; `wallpaper/`, `js/` ve `config/` üzerindeki değişikliklerden sonra `npm run build:wallpaper` ile yeniden üretilir.
- `dist/sw.js`, `sw.template.js` ve build işlemi üzerinden üretilir. Offline davranış için kaynak şablonu düzenlenir.

CSS kaynak dosyalarındaki yorumlar okunabilirlik içindir. Build işlemi CSS küçültmesi sırasında yorumları kaldırabilir; bu normaldir.

## 4. Bir değişikliği güvenle nasıl yapacağız?

1. Önce `main` dalındaki güncel sürüm kontrol edilir.
2. Her değişiklik için küçük odaklı bir çalışma dalı (`chore/`, `fix/` veya `feature/`) açılabilir.
3. Tek seferde tek konu değiştirilir.
4. Kod silmeden önce kullanım yerleri, import/export bağlantıları, HTML referansları ve testler aranır.
5. Değişiklikten sonra aşağıdaki kalite kapısı çalıştırılır:

```bash
npm run check
npm test
npm run security
npm run build
npm run build:wallpaper
```

Tarayıcı davranışı etkilendiyse ayrıca `npm run test:browser` çalıştırılır. GitHub Actions aynı kontrolleri `main` üzerinde yeniden çalıştırır. Herhangi bir adım başarısızsa değişiklik birleştirilmez.

## 5. Yeni bir hayvan ekleme

1. Tür için `js/creature-<tür>.js` adında ayrı bir dosya oluştur. Dosyanın başında yalnızca gerçekten kullandığın sahne değişkenlerini `js/07-habitat-state.js` içinden içe aktar.
2. Canlı sınıfını `export class PixelYeniTur` şeklinde dışa aktar. Ortak yem hedefleme gerekiyorsa `findAvailableStimulus` fonksiyonunu `js/creature-utils.js` dosyasından kullan; bu ortak fonksiyonu her canlı dosyasına kopyalama.
3. Sınıfı `js/08-creatures.js` içine yeniden dışa aktar: `export { PixelYeniTur } from './creature-yeni-tur.js';`. Mevcut modüller bu giriş dosyasını kullanmaya devam eder.
4. `js/habitat-initializer.js` içindeki `CREATURE_PROFILES` tablosuna yeni profile ait `count` ve `create` fonksiyonunu ekle. Yeni bir `creatureProfile` adı kullanıyorsan `config/habitat-catalog.js` içindeki izin listesini de güncelle.
5. Yeni yem/uyaran türü gerekiyorsa üretim kuralını `js/habitat-interactions.js` dosyasına, güncelleme/çizimini `drawHabitatStimuli()` içine ekle. Canlının yem arama ve tüketme davranışını kendi sınıfında tut.
6. Yeni sınıfın dışa aktarımını ve başlangıç profilini test et. Tam kalite kapısı ve tarayıcı duman testi geçmeden birleştirme.
