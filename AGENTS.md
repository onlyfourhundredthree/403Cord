# Agent Memory - Proje Kuralları

## Release Akışı

**Yeni versiyon yayınlamak için tek komut:**
```bash
pnpm release
```

Bu komut otomatik olarak:
1. Versiyonu artırır (403.1.69 → 403.1.70)
2. Lint fix yapar
3. Commit eder
4. Tag oluşturur ve push eder
5. GitHub Actions release yayınlar
6. Discord'a bildirim atar
7. 403Installer'ı tetikler

**MANUEL YAPILMASI GEREKENLER YOK!**

---

## Normal Commit Akışı

Sadece özellik/fix geliştirirken:
1. Değişiklikleri yap
2. `git add -A`
3. `git commit -m "..."`
4. `git push`

Versiyon artırmaya gerek yok - sadece release yaparken artırılır.

---

## Performans Optimizasyonları

Bu projede aşağıdaki performans optimizasyonları uygulanmıştır:

### CSS GPU Hızlandırma
- Animasyonlu elementlere `will-change`, `contain`, `transform: translateZ(0)` eklendi
- Transition süreleri optimize edildi

### Image Caching
- `FixImagesQuality` eklentisinde LRU cache sistemi
- Aynı görseller için URL tekrar hesaplaması önleniyor

### RAF ve Passive Events
- `ImageZoom` eklentisinde `requestAnimationFrame` kullanımı
- Mouse ve wheel event'leri passive olarak işaretlendi

### Memory Leak Prevention
- `IntervalManager` utility sınıfı eklendi
- Automatic cleanup için kullanılabilir

### Image Lazy Loading
- `LazyImage` utility component oluşturuldu
- `loading="lazy"` attribute tüm görsellere eklendi
- ServerInfo, ExpressionCloner, PermissionsViewer, SpotifyControls güncellendi

### React Memo Optimizasyonları
- `CircleIcon`, `VoiceIcon` - React.memo ile sarıldı
- `PermissionDeniedIcon`, `PermissionAllowedIcon`, `PermissionDefaultIcon` - React.memo ile sarıldı

### Bundle Optimizasyonları
- Renderer.js: ~480KB
- Gereksiz imports temizlenmeli
- Dynamic imports ile code splitting yapılabilir

### Virtual Scrolling
- `VirtualList` utility component oluşturuldu
- `useVirtualList` hook oluşturuldu
- Büyük listeler için performans optimizasyonu

### Web Workers
- `WorkerUtils.ts` utility oluşturuldu
- `createWorker` - Basit worker oluşturma
- `WorkerPool` - Paralel işleme için worker havuzu
- Ağır işlemler için main thread bloke olmaz

### BackgroundOptimizer Plugin
- **Ultra Agresif Mod**: Discord arka plandayken neredeyse her şeyi durdurur
- **4 Mod Seçeneği**: Hafif, Orta, Agresif, Ultra
- **CSS Animasyon Dondurma**: Tüm animasyonları durdurur
- **Flux Event Filtreleme**: Gereksiz event'leri bloklar (ses hariç)
- **Interval/Timeout Patch**: Arka planda çalışan timer'ları durdurur
- **requestAnimationFrame Patch**: RAF'leri durdurur
- **DOM Freeze**: Ultra modda DOM'u dondurur
- **GC Trigger**: Belirli aralıklarla garbage collection
- **Voice Protection**: Ses bağlantısını korur

---

## GitHub Actions Workflows

### CI Workflow (`ci.yml`)
- Her push'ta çalışır
- Sadece test ve lint yapar
- Release yapmaz

### Release Workflow (`build.yml`)
- Tag push'ta tetiklenir
- ASAR paketi oluşturur
- GitHub release yayınlar
- Discord bildirimi atar
- 403Installer'ı tetikler

---

## Dosya Yapısı

```
src/
├── api/              # API katmanı
├── components/       # React bileşenleri
├── plugins/          # Eklentiler
├── utils/            # Utility fonksiyonları
└── main/             # Electron main process

scripts/
├── release.mjs       # Release script
├── build/            # Build konfigürasyonu
└── ...

.github/workflows/
├── ci.yml            # Test/Lint workflow
└── build.yml         # Release workflow
```

---

## Notlar

- Lint hataları `pnpm lint --fix` ile düzeltilebilir
- Release sadece `pnpm release` ile yapılır
- Versiyon numarası manuel değiştirilmez