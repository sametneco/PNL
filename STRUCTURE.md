# 📊 Starbucks PNL Analiz Sistemi - Proje Yapısı ve Mimari

> **Versiyon:** 2.0  
> **Mimari:** AntiGravity (AG) Pattern  
> **Teknoloji:** Node.js + Express + Vanilla JavaScript  
> **Veritabanı:** JSON File-Based Storage

---

## 🎯 Proje Özeti

Bu proje, Starbucks Konya Bölgesi mağazalarının **Profit & Loss (PNL)** verilerini analiz etmek, görselleştirmek ve yorum eklemek için geliştirilmiş bir web uygulamasıdır.

### Temel Özellikler
- ✅ **12 Periyot** (Fiscal Year) bazlı veri yönetimi
- ✅ **PX (Aylık)** ve **YTD (Kümülatif)** veri desteği
- ✅ **CSV Upload** ile otomatik veri işleme
- ✅ **Mağaza bazlı** ve **Kalem bazlı** görünüm modları
- ✅ **Dinamik tablo görünürlük** ayarları (periyot + veri tipi bazlı)
- ✅ **Highlight sistemi** ile önemli kalemleri işaretleme
- ✅ **Yorum sistemi** (localStorage tabanlı)
- ✅ **Admin Panel** ile veri yükleme ve ayar yönetimi
- ✅ **Responsive** ve modern UI/UX

---

## 🏗️ Mimari: AntiGravity (AG) Pattern

Proje, **Separation of Concerns** prensibine göre katmanlara ayrılmıştır:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                     │
│  public/ - HTML, CSS, JavaScript (Vanilla)              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────▼────────────────────────────────┐
│                  SERVER (Entry Point)                    │
│  server/server.js - Express Routes & Middleware         │
└─────┬──────────────────┬──────────────────┬────────────┘
      │                  │                  │
┌─────▼─────┐   ┌───────▼────────┐   ┌────▼──────┐
│   RULES   │   │    SKILLS      │   │    MD     │
│  (Logic)  │──▶│  (Technical)   │──▶│  (Data)   │
└───────────┘   └────────────────┘   └───────────┘
```

### Katman Sorumlulukları

| Katman | Klasör | Sorumluluk | Örnek |
|--------|--------|------------|-------|
| **Rules** | `rules/` | İş mantığı, validasyon, karar verme | `UploadRules.js` - CSV işleme kuralları |
| **Skills** | `skills/` | Teknik işlemler, IO, parsing | `CsvSkill.js` - CSV okuma, `FileSkill.js` - JSON IO |
| **MD (Models)** | `md/` | Veri erişim katmanı, CRUD işlemleri | `DataModel.js`, `StoreModel.js`, `PeriodModel.js` |
| **VD (View Data)** | `vd/` | API response formatları (şu an kullanılmıyor) | - |
| **Server** | `server/` | HTTP endpoint'leri, routing | `server.js` - Express app |
| **Client** | `public/` | Frontend UI, kullanıcı etkileşimi | `app.js`, `admin.js` |

---

## 📁 Detaylı Klasör Yapısı

```
PNL/
├── 📂 server/                    # Backend Core
│   ├── server.js                 # Express sunucusu, API routes
│   ├── 📂 database/              # JSON-based veritabanı
│   │   ├── data.json             # Periyot verileri (PX/YTD)
│   │   ├── periods.json          # 12 periyot tanımları
│   │   ├── stores.json           # Mağaza listesi
│   │   ├── settings.json         # Mağaza ayarları (hiddenGroups, highlights)
│   │   └── table-visibility.json # Tablo görünürlük ayarları
│   └── 📂 uploads/               # Yüklenen CSV dosyaları
│
├── 📂 rules/                     # İş Mantığı Katmanı
│   ├── UploadRules.js            # CSV upload iş kuralları
│   └── README.md                 # Rules katmanı dokümantasyonu
│
├── 📂 skills/                    # Teknik Yetenekler Katmanı
│   ├── CsvSkill.js               # CSV parsing (csv-parser + iconv-lite)
│   ├── FileSkill.js              # JSON dosya okuma/yazma
│   └── README.md                 # Skills katmanı dokümantasyonu
│
├── 📂 md/                        # Model/Data Katmanı
│   ├── DataModel.js              # PNL verileri CRUD
│   ├── PeriodModel.js            # Periyot CRUD
│   ├── StoreModel.js             # Mağaza CRUD
│   ├── StoreSettingsModel.js     # Ayarlar CRUD
│   └── README.md                 # MD katmanı dokümantasyonu
│
├── 📂 public/                    # Frontend (Client)
│   ├── index.html                # Ana sayfa (kullanıcı görünümü)
│   ├── admin.html                # Admin panel
│   ├── 📂 js/
│   │   ├── app.js                # Ana uygulama logic (1173 satır)
│   │   └── admin.js              # Admin panel logic (1173 satır)
│   └── 📂 css/
│       ├── styles.css            # Ana sayfa stilleri
│       └── admin.css             # Admin panel stilleri
│
├── 📂 vd/                        # View Data (DTO) - Şu an boş
│   └── README.md
│
├── package.json                  # NPM bağımlılıkları
├── STRUCTURE.md                  # 👈 Bu dosya
└── README.md                     # (Yok - oluşturulabilir)
```

---

## 🔄 Veri Akışı (Data Flow)

### 1️⃣ CSV Upload Akışı
```
[Admin Panel] 
    ↓ (CSV dosyası seçilir)
POST /api/upload
    ↓
[server.js] → Multer (dosya yükleme)
    ↓
[CsvSkill.parse()] → CSV → JSON array
    ↓
[UploadRules.processUpload()]
    ├─→ [DataModel.saveForPeriod()] → data.json'a kaydet
    ├─→ [StoreModel] → Yeni mağazaları ekle
    └─→ [PeriodModel.updateStatus()] → Periyot durumunu 'active' yap
    ↓
Response: { success: true, processedCount, newStores }
```

### 2️⃣ Veri Görüntüleme Akışı
```
[Ana Sayfa]
    ↓
GET /api/periods → Periyot listesi
GET /api/stores → Mağaza listesi
    ↓
[Kullanıcı periyot seçer]
    ↓
GET /api/data/:periodId → { px: [...], ytd: [...] }
    ↓
[Frontend] → Veriyi parse eder
    ├─→ Mağaza kartları oluşturur
    ├─→ Kalem tabloları oluşturur
    └─→ Highlight ve gizli grupları uygular
```

### 3️⃣ Ayar Kaydetme Akışı
```
[Admin Panel - Settings]
    ↓
[Kullanıcı checkbox toggle eder]
    ↓
POST /api/settings/:storeCode/update
Body: { periodId, type, data: { hiddenGroups: [], highlights: [] } }
    ↓
[StoreSettingsModel.save()]
    ↓
settings.json güncellenir
```

---

## 🗄️ Veritabanı Şemaları (JSON)

### 1. `periods.json`
```json
[
  {
    "id": 1,
    "name": "Periyot 1",
    "start": "2025-12-26",
    "end": "2026-01-22",
    "status": "active" | "empty"
  }
]
```

### 2. `stores.json`
```json
[
  {
    "code": "U684",
    "name": "STA KON Kivilcim Bulvar",
    "visible": true,
    "area": 150,
    "openingDate": "2020-01-15"
  }
]
```

### 3. `data.json`
```json
{
  "1": {
    "px": [
      {
        "EPM Store Name": "STA-U684-STA KON Kivilcim Bulvar",
        "Actual Net Sales": "1234567,89",
        "BP-2025 Net Sales": "1000000,00",
        "Actual COGS": "456789,12",
        "cogs%": "0,37",
        ...
      }
    ],
    "ytd": [...],
    "files": {
      "px": "1770334258779-ytd.csv",
      "ytd": "1770334259776-p1.csv"
    }
  }
}
```

### 4. `settings.json`
```json
{
  "U684": {
    "1": {
      "px": {
        "hiddenGroups": ["COGS", "Royalty"],
        "highlights": ["Net Sales-Actual Net Sales", "Store Margin-Store Margin %"]
      },
      "ytd": {
        "hiddenGroups": [],
        "highlights": []
      }
    }
  }
}
```

**Yapı:** `settings[storeCode][periodId][type] = { hiddenGroups, highlights }`

### 5. `table-visibility.json`
```json
{
  "1": {
    "px": {
      "Net Sales": true,
      "COGS": false,
      "Store Margin": true
    },
    "ytd": {
      "Net Sales": true
    }
  }
}
```

**Yapı:** `visibility[periodId][type][tableName] = boolean`

---

## 🔌 API Endpoints

### Periyot İşlemleri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/periods` | Tüm periyotları listele |
| `GET` | `/api/data/:periodId` | Belirli periyodun PX/YTD verilerini getir |
| `POST` | `/api/clear/:periodId` | Periyot verilerini ve dosyalarını sil |

### Mağaza İşlemleri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/stores` | Tüm mağazaları listele |
| `PUT` | `/api/stores/:code` | Mağaza bilgilerini güncelle |
| `POST` | `/api/stores/:code/visibility` | Mağaza görünürlüğünü değiştir |

### Upload İşlemleri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/api/upload` | CSV dosyası yükle (multipart/form-data) |
| `POST` | `/api/delete-file` | Belirli dosyayı sil (periodId + type) |

### Ayar İşlemleri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/settings/:storeCode` | Mağaza ayarlarını getir |
| `POST` | `/api/settings/:storeCode/update` | Granular ayar güncelleme (periodId + type) |
| `POST` | `/api/settings/:storeCode` | Legacy: Tüm ayarları kaydet |
| `GET` | `/api/table-visibility` | Tablo görünürlük ayarlarını getir |
| `POST` | `/api/table-visibility` | Tablo görünürlük ayarlarını kaydet |

---

## 📊 Veri Modeli: Kalem Grupları (ITEM_GROUPS)

Sistem, 12 ana kalem grubunu destekler:

```javascript
const ITEM_GROUPS = [
  {
    name: 'Net Sales',
    items: [
      'Actual Net Sales',
      'BP-2025 Net Sales',
      'Actual vs BP Difference Net Sales',
      'Actual vs BP Difference (%) Net Sales'
    ]
  },
  { name: 'COGS', items: ['Actual COGS', 'COGS %'] },
  { name: 'Royalty', items: ['Actual Royalty', 'Royalty %'] },
  { name: 'Store Margin', items: [...] },
  { name: 'Cost of Sales', items: ['Cost of Sales (Others)'] },
  { name: 'Operating Margin', items: [...] },
  { name: 'Staff Cost', items: [...] },
  { name: 'Controllables', items: [...] },
  { name: 'Rent', items: [...] },
  { name: 'Depreciation', items: [...] },
  { name: 'Store Contribution', items: [...] },
  { name: 'Cash +/- Stores', items: ['Cash +/- Stores'] }
];
```

### CSV Sütun Eşleştirmeleri

CSV dosyasındaki sütun isimleri ile frontend'deki kalem isimleri arasında mapping yapılır:

| Frontend Item | CSV Column | Not |
|---------------|------------|-----|
| `Actual Net Sales` | `Actual Net Sales` | - |
| `BP-2025 Net Sales` | `BP-2025 Net Sales` | - |
| `Actual vs BP Difference Net Sales` | `Actual vs BP Difference Net sales` | ⚠️ Küçük 's' |
| `COGS %` | `cogs%` | ⚠️ Küçük harf |
| `Staff Cost` | `Staff cost` | ⚠️ Küçük 'c' |
| `Store Contribution` | `Store Contribution` | - |
| `Actual vs BP Difference Store Contribution` | `Actual vs BP Difference store conribution` | ⚠️ Typo: "conribution" |
| `Cash +/- Stores` | `Cash +/-  Stores` | ⚠️ Çift boşluk |

---

## 🎨 Frontend Yapısı

### Ana Sayfa (`index.html` + `app.js`)

#### State Yönetimi
```javascript
let state = {
  selectedPeriod: null,           // Seçili periyot objesi
  currentMode: 'stores',          // 'stores' | 'items'
  dataSource: 'px',               // 'px' | 'ytd'
  selectedStore: null,            // Seçili mağaza (stores modunda)
  tableFilters: {},               // { tableName: 'comment' | 'all' }
  tableSorts: {},                 // { tableName: { column, direction } }
  expandedTable: null,            // Açık accordion tablosu
  comments: {},                   // { 'storeCode_tableName': 'comment text' }
  storeSettings: {},              // Seçili mağaza ayarları
  allSettings: {},                // Tüm mağaza ayarları cache
  showAllItems: false             // Gizli kalemleri göster toggle
};
```

#### Görünüm Modları

**1. Stores Mode (Mağaza Bazlı)**
- Mağaza kartları grid görünümü
- Her kart: Mağaza adı + seçili grup verisi (Actual, BP, Diff %)
- Karta tıklayınca: O mağazanın tüm kalem grupları açılır
- Grup kartına tıklayınca: Yorum modal'ı açılır

**2. Items Mode (Kalem Bazlı)**
- Accordion tablo görünümü
- Her tablo: Bir kalem grubu (Net Sales, COGS, vb.)
- Satırlar: Mağazalar
- Sütunlar: Kalem detayları (Actual, BP, Diff, %)
- Filtreleme: "Tümü" | "Yorumlu"
- Sıralama: Her sütuna göre ASC/DESC

#### Önemli Fonksiyonlar

| Fonksiyon | Açıklama |
|-----------|----------|
| `fetchPeriodData(periodId)` | API'den periyot verisini çeker |
| `getStoreGroupData(storeCode, groupName)` | Mağaza + grup için veri hesaplar |
| `generateStoreTableData(groupName)` | Tablo için mağaza satırlarını oluşturur |
| `renderStoresMode()` | Mağaza kartlarını render eder |
| `renderItemsMode()` | Kalem tablolarını render eder |
| `openCommentModal(storeCode, group)` | Yorum modal'ını açar |
| `saveComment()` | Yorumu localStorage'a kaydeder |
| `toggleGroupVisibility(storeCode, groupName)` | Grup görünürlüğünü toggle eder |
| `toggleItemHighlight(storeCode, tableName, itemName)` | Kalem highlight'ını toggle eder |

### Admin Panel (`admin.html` + `admin.js`)

#### Özellikler
1. **Dashboard**: Genel durum özeti
2. **Veri Yükleme**: 
   - Periyot seçimi
   - PX/YTD dosya upload (drag & drop)
   - Dosya silme (granular)
   - Periyot temizleme
3. **Görünüm Ayarları**:
   - Periyot + Veri Tipi seçimi (segmented control)
   - Tablo görünürlük ayarları (periyot bazlı)
   - Mağaza kartları (accordion)
   - Grup görünürlük toggle (checkbox)
   - Kalem highlight toggle (yıldız ikonu)
   - Otomatik kaydetme

#### Önemli Fonksiyonlar

| Fonksiyon | Açıklama |
|-----------|----------|
| `loadPeriods()` | Periyot dropdown'unu doldurur |
| `checkPeriodStatus()` | PX/YTD yüklü mü kontrol eder |
| `uploadFile(type)` | CSV dosyasını yükler |
| `deleteFile(type)` | Belirli dosyayı siler |
| `loadStoresForSettings()` | Mağaza listesini ve ayarları yükler |
| `renderStoreCards()` | Mağaza ayar kartlarını render eder |
| `renderTableVisibilityGrid()` | Tablo görünürlük grid'ini render eder |
| `toggleTableVisibility(tableName)` | Tablo görünürlüğünü toggle eder |
| `toggleGroupVisibility(storeCode, groupName)` | Grup görünürlüğünü toggle eder |
| `toggleItemHighlight(storeCode, tableName, itemName)` | Kalem highlight'ını toggle eder |

---

## 🔧 Teknik Detaylar

### Bağımlılıklar (package.json)
```json
{
  "dependencies": {
    "cors": "^2.8.6",           // CORS middleware
    "csv-parser": "^3.2.0",     // CSV parsing
    "express": "^5.2.1",        // Web framework
    "iconv-lite": "^0.7.2",     // Encoding dönüşümü
    "multer": "^2.0.2"          // File upload
  }
}
```

### CSV Parsing Ayarları
```javascript
// CsvSkill.js
{
  separator: ';',              // Noktalı virgül ayracı
  mapHeaders: ({ header }) => 
    header.trim()              // Boşlukları temizle
          .replace(/^\uFEFF/, '') // BOM karakterini kaldır
}
```

### Sayı Formatları

**CSV'den Okuma:**
- Ondalık ayracı: Virgül (`,`) → `"1234,56"`
- Parse: `parseFloat(val.replace(',', '.'))`

**Frontend'de Gösterim:**
- Türkçe format: `new Intl.NumberFormat('tr-TR')`
- Yüzde değerleri: `%21.5` formatında

**Yüzde Değerleri:**
- CSV'de `0.21` (0.21 = 21%) veya `21` (direkt 21%)
- Kontrol: `if (Math.abs(pVal) < 1) { return (pVal * 100).toFixed(1); }`

### Tarih Formatları

**Excel Serial Number Desteği:**
```javascript
// Excel'den gelen 43763 gibi sayıları tarihe çevir
const excelEpoch = new Date(1899, 11, 30);
const jsDate = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
```

**Türkçe Tarih:**
```javascript
new Intl.DateTimeFormat('tr-TR', { 
  day: 'numeric', 
  month: 'long', 
  year: 'numeric' 
}).format(date);
// Örnek: "26 Aralık 2025"
```

---

## 🎯 Önemli İş Kuralları

### 1. Tablo Görünürlük Mantığı
```javascript
// İlk kez ayar yapılıyorsa (hiddenGroups boş array)
// → Tüm gruplar GİZLİ (isVisible = false)
const isVisible = hiddenGroups.length === 0 
  ? false 
  : !hiddenGroups.includes(groupName);
```

### 2. Highlight Sistemi
```javascript
// Highlight key formatı: "tableName-itemName"
const itemKey = `${tableName}-${itemName}`;
const isHighlighted = highlights.includes(itemKey);
```

### 3. Yorum Sistemi
```javascript
// Yorum key formatı: "storeCode_tableName"
const commentKey = `${storeCode}_${tableName}`;
state.comments[commentKey] = commentText;
localStorage.setItem('pnl_comments', JSON.stringify(state.comments));
```

**Yorum Modal Özellikleri:**
- **Enter Tuşu**: Yeni satıra geçer (çok satırlı yorum yazılabilir)
- **Shift+Enter**: Yorumu kaydeder (opsiyonel)
- **Kaydet Butonu**: Yorumu localStorage'a kaydeder
- **Otomatik Boyutlandırma**: Textarea içerik arttıkça genişler (max 400px)
- **Karakter Sayacı**: Anlık karakter sayısını gösterir
- **Highlight Gösterimi**: Vurgulanan kalemler sarı arka planla gösterilir
- **Gerçek Veri Gösterimi**: Modal içinde seçili mağaza ve kalemin gerçek değerleri gösterilir

### 4. Ayar Kaydetme Stratejisi
- **Granular Update**: Sadece değişen periyot + type ayarı güncellenir
- **Otomatik Kaydetme**: Her toggle/checkbox değişikliğinde API çağrısı
- **Cache Mekanizması**: Frontend'de `allSettings` objesi ile cache

---

## 🚀 Çalıştırma

### Geliştirme Ortamı
```bash
# Bağımlılıkları yükle
npm install

# Sunucuyu başlat
npm start
# veya
npm run dev

# Tarayıcıda aç
http://localhost:8080        # Ana sayfa
http://localhost:8080/admin.html  # Admin panel
```

### Üretim Ortamı
```bash
# PM2 ile çalıştırma (önerilir)
pm2 start server/server.js --name pnl-app

# Veya systemd service olarak
# /etc/systemd/system/pnl.service
```

---

## 🐛 Bilinen Sorunlar ve Çözümler

### 1. CSV Sütun İsimleri Tutarsızlığı
**Sorun:** CSV'deki bazı sütun isimleri typo içeriyor  
**Çözüm:** Frontend'de mapping tablosu kullanılıyor

### 2. Yüzde Değerleri Format Karmaşası
**Sorun:** Bazı yüzdeler 0.21, bazıları 21 formatında  
**Çözüm:** `processPercent()` fonksiyonu ile normalize ediliyor

### 3. localStorage Veri Bozulması
**Sorun:** Eski versiyonlarda yorumlar string olmayabilir  
**Çözüm:** `loadComments()` fonksiyonunda type checking eklendi

### 4. Tablo Görünürlük İlk Durum
**Sorun:** İlk kez ayar yapılırken tüm tablolar görünür oluyordu  
**Çözüm:** `hiddenGroups.length === 0` kontrolü ile varsayılan gizli yapıldı

---

## 📝 Geliştirme Notları

### Kod Standartları
- ✅ **CommonJS** modül sistemi (`require/module.exports`)
- ✅ **Vanilla JavaScript** (framework yok)
- ✅ **Async/Await** kullanımı
- ✅ **Try-Catch** error handling
- ✅ **JSDoc** yorumları (kısmi)

### Naming Conventions
- **Dosyalar:** PascalCase (`DataModel.js`, `UploadRules.js`)
- **Fonksiyonlar:** camelCase (`getStoreData`, `renderStoreCards`)
- **Sabitler:** UPPER_SNAKE_CASE (`ITEM_GROUPS`, `API_URL`)
- **CSS Sınıfları:** kebab-case (`store-card`, `comment-modal`)

### Git Workflow (Önerilen)
```bash
# Feature branch
git checkout -b feature/yeni-ozellik

# Commit mesajları
git commit -m "feat: Yeni özellik eklendi"
git commit -m "fix: Bug düzeltildi"
git commit -m "refactor: Kod iyileştirmesi"
git commit -m "docs: Dokümantasyon güncellendi"
```

---

## 🔮 Gelecek Geliştirmeler (Roadmap)

### Kısa Vadeli
- [ ] Yorum sistemi backend'e taşınmalı (localStorage yerine)
- [ ] Excel export özelliği
- [ ] Grafik/Chart entegrasyonu (Chart.js)
- [ ] Kullanıcı yetkilendirme sistemi

### Orta Vadeli
- [ ] PostgreSQL/MongoDB geçişi
- [ ] Real-time collaboration (WebSocket)
- [ ] Email notification sistemi
- [ ] Audit log (kim ne zaman değiştirdi)

### Uzun Vadeli
- [ ] React/Vue.js refactor
- [ ] Mobile app (React Native)
- [ ] AI-powered insights
- [ ] Multi-tenant support

---

## 📚 Ek Kaynaklar

### Dokümantasyon
- `rules/README.md` - Rules katmanı detayları
- `skills/README.md` - Skills katmanı detayları
- `md/README.md` - Model katmanı detayları
- `vd/README.md` - View Data katmanı (boş)

### Dış Bağlantılar
- [Express.js Docs](https://expressjs.com/)
- [csv-parser](https://www.npmjs.com/package/csv-parser)
- [Multer](https://www.npmjs.com/package/multer)

---

## 👥 Ekip ve İletişim

**Geliştirici:** [Ekip Adı]  
**Proje Sahibi:** Starbucks Konya Bölgesi  
**Versiyon:** 2.0  
**Son Güncelleme:** 2026-02-08

---

## 📄 Lisans

Bu proje, Starbucks Türkiye için özel olarak geliştirilmiştir.  
Tüm hakları saklıdır. © 2026

---

## 🎓 Yeni Geliştiriciler İçin Hızlı Başlangıç

### 1. Projeyi Anlamak
1. Bu dosyayı baştan sona oku
2. `server/server.js` dosyasını incele (API endpoint'leri)
3. `public/js/app.js` dosyasını incele (frontend logic)
4. `md/` klasöründeki model dosyalarını incele

### 2. İlk Değişiklik
1. Yeni bir feature branch oluştur
2. Küçük bir değişiklik yap (örn: yeni bir API endpoint)
3. Test et
4. Commit ve push

### 3. Debug İpuçları
- **Backend:** `console.log()` kullan, terminal'i izle
- **Frontend:** Browser DevTools Console'u kullan
- **Network:** DevTools Network tab'ında API çağrılarını izle
- **Database:** `server/database/*.json` dosyalarını manuel kontrol et

### 4. Sık Kullanılan Komutlar
```bash
# Sunucuyu yeniden başlat
npm start

# Veritabanını sıfırla
rm server/database/*.json
# (Sunucu ilk çalıştığında otomatik oluşturur)

# Logları izle
tail -f logs/app.log  # (eğer loglama eklendiyse)
```

---

**🎉 Başarılar! Bu dokümantasyon, projeyi sıfırdan anlaman için gereken her şeyi içeriyor.**
