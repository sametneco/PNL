# 📊 Starbucks PNL Analiz Sistemi

> **Starbucks Konya Bölgesi** mağazalarının Profit & Loss (PNL) verilerini analiz etmek, görselleştirmek ve yorum eklemek için geliştirilmiş modern web uygulaması.

![Version](https://img.shields.io/badge/version-2.0-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

---

## 🎯 Özellikler

### ✨ Temel Özellikler
- **12 Periyot Yönetimi**: Fiscal Year bazlı veri takibi
- **Dual Veri Desteği**: PX (Aylık) ve YTD (Kümülatif) görünümleri
- **CSV Upload**: Otomatik veri işleme ve parse etme
- **Dinamik Görünümler**: Mağaza bazlı ve Kalem bazlı analiz modları
- **Akıllı Yorum Sistemi**: Çok satırlı, otomatik boyutlandırmalı yorum kutusu
- **Highlight Sistemi**: Önemli kalemleri vurgulama
- **Responsive Tasarım**: Modern ve kullanıcı dostu arayüz

### 🎨 Kullanıcı Arayüzü
- Dark mode tasarım
- Smooth animasyonlar
- Dinamik tablo görünürlük ayarları
- Gerçek zamanlı karakter sayacı
- Akıllı ikon gösterimi (yazı yazılınca aktif)

---

## 🚀 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone https://github.com/sametneco/PNL.git
cd PNL
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Sunucuyu başlatın**
```bash
npm start
```

4. **Tarayıcıda açın**
```
http://localhost:8080
```

### ⚡ Performans Notları

**Render.com Ücretsiz Plan:**
- İlk yükleme: 30-60 saniye (cold start)
- Sonraki yüklemeler: 3-5 saniye (keep-alive aktif)
- 15 dakika kullanılmazsa uyur

**Daha Hızlı Alternatifler:**
- Railway.app: Cold start yok, her zaman hızlı
- Fly.io: Global edge network, çok hızlı
- Vercel: Serverless, anında başlatma

---

## 📁 Proje Yapısı

```
PNL/
├── 📂 server/              # Backend (Express.js)
│   ├── server.js           # Ana sunucu dosyası
│   ├── database/           # JSON veritabanı
│   └── uploads/            # Yüklenen CSV dosyaları
│
├── 📂 public/              # Frontend
│   ├── index.html          # Ana sayfa
│   ├── admin.html          # Admin panel
│   ├── js/                 # JavaScript dosyaları
│   └── css/                # Stil dosyaları
│
├── 📂 md/                  # Model/Data katmanı
├── 📂 rules/               # İş mantığı katmanı
├── 📂 skills/              # Teknik işlemler katmanı
├── 📂 vd/                  # View Data katmanı
│
├── package.json
├── STRUCTURE.md            # Detaylı mimari dokümantasyonu
└── README.md
```

---

## 🏗️ Mimari: AntiGravity (AG) Pattern

Proje, **Separation of Concerns** prensibine göre katmanlara ayrılmıştır:

```
┌─────────────────────────────────────────┐
│         CLIENT (Frontend)               │
│  HTML, CSS, Vanilla JavaScript          │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────────┐
│         SERVER (Express.js)             │
│  Routes, Middleware, File Upload        │
└──┬────────┬────────┬────────────────────┘
   │        │        │
┌──▼──┐ ┌──▼───┐ ┌──▼──┐
│RULES│ │SKILLS│ │ MD  │
│Logic│ │Tech  │ │Data │
└─────┘ └──────┘ └─────┘
```

### Katmanlar
- **Rules**: İş mantığı ve validasyon
- **Skills**: Teknik işlemler (CSV parse, File IO)
- **MD (Models)**: Veri erişim katmanı (CRUD)
- **VD (View Data)**: API response formatları

Detaylı mimari bilgisi için: [STRUCTURE.md](STRUCTURE.md)

---

## 🔧 Kullanım

### Admin Panel
1. **Periyot Seçin**: Dropdown'dan çalışmak istediğiniz periyodu seçin
2. **CSV Yükleyin**: PX ve YTD dosyalarını sürükle-bırak ile yükleyin
3. **Ayarları Yapın**: 
   - Tablo görünürlük ayarları
   - Mağaza kalem seçimleri
   - Highlight ayarları

### Ana Sayfa
1. **Periyot Seçin**: Analiz etmek istediğiniz periyodu seçin
2. **Görünüm Modu**: Mağazalar veya Kalemler modunu seçin
3. **Veri Tipi**: PX (Aylık) veya YTD (Kümülatif) seçin
4. **Yorum Ekleyin**: Kalem gruplarına tıklayarak yorum ekleyin

---

## 📊 Veri Formatı

### CSV Yapısı
- **Ayraç**: Noktalı virgül (`;`)
- **Encoding**: UTF-8 (BOM destekli)
- **Ondalık**: Virgül (`,`)

### Örnek CSV Satırı
```csv
EPM Store Name;Actual Net Sales;BP-2025 Net Sales;Actual COGS;...
STA-U684-STA KON Kivilcim Bulvar;1234567,89;1000000,00;456789,12;...
```

---

## 🎨 Yorum Sistemi

### Özellikler
- **Enter**: Yeni satıra geçer
- **Shift+Enter**: Yorumu kaydeder (opsiyonel)
- **Otomatik Boyutlandırma**: Textarea içerik arttıkça genişler
- **Akıllı İkonlar**: Yazı yazmaya başlayınca çıkar
- **Karakter Sayacı**: Anlık karakter sayısı gösterimi
- **Highlight Gösterimi**: Vurgulanan kalemler sarı arka planla

---

## 🛠️ Teknolojiler

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload
- **csv-parser** - CSV parsing
- **iconv-lite** - Encoding conversion

### Frontend
- **Vanilla JavaScript** - No framework
- **CSS3** - Modern styling
- **HTML5** - Semantic markup

### Veritabanı
- **JSON File-Based** - Basit ve hızlı

---

## 📝 API Endpoints

### Periyot İşlemleri
- `GET /api/periods` - Tüm periyotları listele
- `GET /api/data/:periodId` - Periyot verilerini getir
- `POST /api/clear/:periodId` - Periyot verilerini sil

### Mağaza İşlemleri
- `GET /api/stores` - Tüm mağazaları listele
- `PUT /api/stores/:code` - Mağaza bilgilerini güncelle
- `POST /api/stores/:code/visibility` - Görünürlük ayarı

### Upload İşlemleri
- `POST /api/upload` - CSV dosyası yükle
- `POST /api/delete-file` - Dosya sil

### Ayar İşlemleri
- `GET /api/settings/:storeCode` - Ayarları getir
- `POST /api/settings/:storeCode/update` - Ayarları güncelle
- `GET /api/table-visibility` - Tablo görünürlük ayarları
- `POST /api/table-visibility` - Tablo görünürlük kaydet

---

## 🔐 Güvenlik

- CORS koruması aktif
- File upload validasyonu
- Input sanitization
- XSS koruması

---

## 🐛 Bilinen Sorunlar

1. **CSV Sütun İsimleri**: Bazı sütunlarda typo var (mapping ile çözüldü)
2. **Yüzde Formatları**: Farklı formatlar normalize ediliyor
3. **localStorage Limiti**: Çok fazla yorum için backend gerekebilir

---

## 🚧 Gelecek Geliştirmeler

### Kısa Vadeli
- [ ] Yorum sistemi backend'e taşınmalı
- [ ] Excel export özelliği
- [ ] Grafik/Chart entegrasyonu
- [ ] Kullanıcı yetkilendirme

### Orta Vadeli
- [ ] PostgreSQL/MongoDB geçişi
- [ ] Real-time collaboration
- [ ] Email notification
- [ ] Audit log sistemi

### Uzun Vadeli
- [ ] React/Vue.js refactor
- [ ] Mobile app
- [ ] AI-powered insights
- [ ] Multi-tenant support

---

## 👥 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Commit edin (`git commit -m 'feat: Yeni özellik eklendi'`)
4. Push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje **Starbucks Türkiye** için özel olarak geliştirilmiştir.  
Tüm hakları saklıdır. © 2026

---

## 📞 İletişim

**Proje Sahibi**: Starbucks Konya Bölgesi  
**Geliştirici**: [Ekip Adı]  
**Versiyon**: 2.0  
**Son Güncelleme**: 2026-02-08

---

## 🙏 Teşekkürler

Bu projeyi kullandığınız için teşekkür ederiz!

---

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**
