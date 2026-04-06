# Agent Memory - Proje Kuralları

## Commit Öncesi Yapılması Gerekenler

Her commit'ten önce şu 2 işlem **MUTLAKA** yapılmalıdır:

### 1. Versiyon Artışı
- `package.json` dosyasındaki `version` alanı **+1** artırılmalıdır
- Örnek: `"version": "403.1.48"` → `"version": "403.1.49"`

### 2. Lint Fix
- Her commit'ten önce `pnpm lint -- --fix` çalıştırılmalıdır
- CSS dosyalarında `comment-empty-line-before` gibi hatalar otomatik düzeltilir

### 3. Stylelint Fix
- Her commit'ten önce `pnpm lint-styles -- --fix` çalıştırılmalıdır
- CSS dosyalarındaki style hatalarını düzeltir

## Commit Akışı

1. Değişiklikleri yap
2. `package.json` versiyonunu artır
3. `pnpm lint -- --fix` çalıştır
4. `pnpm lint-styles -- --fix` çalıştır
5. `git add -A`
6. `git commit -m "..."`
7. Push yap

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

## Dosya Yapısı

```
src/
├── api/              # API katmanı
│   └── Notifications/styles.css  # GPU hızlandırma eklendi
├── components/       # React bileşenleri
│   ├── Button.css    # GPU hızlandırma
│   ├── Switch.css    # GPU hızlandırma
│   └── settings/
│       ├── AddonCard.css      # GPU hızlandırma
│       ├── QuickAction.css   # GPU hızlandırma
│       └── SpecialCard.css   # GPU hızlandırma
├── plugins/
│   ├── fixImagesQuality/index.tsx  # Image cache eklendi
│   └── imageZoom/
│       ├── components/Magnifier.tsx  # RAF optimizasyonu
│       └── styles.css                # GPU hızlandırma
└── utils/
    └── IntervalManager.ts  # Yeni utility sınıfı
```

## Notlar

- Lint hataları her zaman `--fix` ile düzeltilebilir
- Versiyon numarası her zaman artan sırada olmalı