const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// AG Imports
const PeriodModel = require('../md/PeriodModel');
const StoreModel = require('../md/StoreModel');
const DataModel = require('../md/DataModel');
const StoreSettingsModel = require('../md/StoreSettingsModel');
const UploadRules = require('../rules/UploadRules');
const CsvSkill = require('../skills/CsvSkill');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Directories
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Storage configuration for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Initialize DB (Eski kodda readJSON ile init yapılıyordu, burada Models üzerinden kontrol edebiliriz veya manuel çağırabiliriz)
// Ancak Models içinde readJSON zaten dosya yoksa oluşturuyor.
// Bu yüzden ekstra bir init scriptine ihtiyaç yok, ilk istekte oluşur.
// Yine de tutarlılık için basit okuma yapabiliriz:
PeriodModel.getAll();
StoreModel.getAll();
DataModel.getAll();


// --- API Endpoints ---

// Get all periods
app.get('/api/periods', (req, res) => {
    const periods = PeriodModel.getAll();
    res.json(periods);
});

// Get all stores
app.get('/api/stores', (req, res) => {
    const stores = StoreModel.getAll();
    res.json(stores);
});

// Get data for a specific period
app.get('/api/data/:periodId', (req, res) => {
    const { periodId } = req.params;
    const data = DataModel.getByPeriod(periodId);
    res.json(data);
});

// API: Upload CSV and Process
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenemedi.' });
    }

    const { periodId, type } = req.body;
    const filePath = req.file.path;

    try {
        const results = await CsvSkill.parse(filePath);
        const processResult = await UploadRules.processUpload(periodId, type, results);

        // Delete file after processing
        // fs.unlinkSync(filePath); 

        // Save filename references
        DataModel.setFile(periodId, type, req.file.filename);

        // Also update Period status to valid/active if not empty
        // PeriodModel.updateStatus(periodId, 'active'); // Optional logic

        res.json(processResult);
    } catch (err) {
        res.status(500).json({ error: 'İşlem hatası: ' + err.message });
    }
});

// API: Clear Data for Period
// API: Delete File (Granular)
app.post('/api/delete-file', (req, res) => {
    const { periodId, type } = req.body;

    // Logic: Delete specific file
    const files = DataModel.getFiles(periodId);
    if (files && files[type]) {
        const filePath = path.join(UPLOADS_DIR, files[type]);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) { console.error("File delete error", e); }
        }

        // Remove file reference
        DataModel.setFile(periodId, type, null);
    }

    // Clear data for this period + type
    DataModel.clearPeriodType(periodId, type);

    // Check if period is fully empty to update status
    // If both PX and YTD are gone, status = 'empty'
    // This requires checking if any data left. 
    // Simplified: Check if files object has any keys left? 
    // Or just check DataModel.getByPeriod(periodId) has empty arrays?

    const currentData = DataModel.getByPeriod(periodId);
    const hasData = (currentData.px && currentData.px.length > 0) || (currentData.ytd && currentData.ytd.length > 0);

    if (!hasData) {
        PeriodModel.updateStatus(periodId, 'empty');
    }

    res.json({ message: 'Veri silindi' });
});

app.post('/api/clear/:periodId', (req, res) => {
    const { periodId } = req.params;

    // Delete files associated with this period
    const files = DataModel.getFiles(periodId);
    if (files) {
        Object.values(files).forEach(filename => {
            if (filename) {
                const filePath = path.join(UPLOADS_DIR, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        });
    }

    DataModel.clearPeriod(periodId);
    PeriodModel.updateStatus(periodId, 'empty');

    res.json({ message: 'Periyot verileri ve dosyaları silindi.' });
});

// API: Save Settings (Granular Update) - MUST BE FIRST (most specific)
app.post('/api/settings/:storeCode/update', (req, res) => {
    console.log('✅ UPDATE endpoint hit:', req.params.storeCode, req.body);
    
    const { storeCode } = req.params;
    const { periodId, type, data } = req.body; // data: { hiddenGroups, highlights }

    try {
        // Get existing settings
        const currentSettings = StoreSettingsModel.get(storeCode);

        // Determine path to update: settings[periodId][type] = data
        if (!currentSettings[periodId]) currentSettings[periodId] = {};
        currentSettings[periodId][type] = data;

        StoreSettingsModel.save(storeCode, currentSettings);
        console.log('✅ Settings saved successfully for', storeCode, 'period', periodId, 'type', type);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Settings update error:', err);
        res.status(500).json({ error: 'Ayarlar güncellenirken sunucu hatası.' });
    }
});

// API: Get Store Settings
app.get('/api/settings/:storeCode', (req, res) => {
    const FileSkill = require('../skills/FileSkill');
    const settingsPath = path.join(__dirname, 'database/settings.json');
    const settings = FileSkill.readJSON(settingsPath, {});

    res.json(settings[req.params.storeCode] || {});
});

// API: Save Store Settings (Legacy/Full) - MUST BE LAST (least specific)
app.post('/api/settings/:storeCode', (req, res) => {
    console.log('⚠️ LEGACY settings endpoint hit:', req.params.storeCode);
    
    const FileSkill = require('../skills/FileSkill');
    const settingsPath = path.join(__dirname, 'database/settings.json');
    const settings = FileSkill.readJSON(settingsPath, {});

    settings[req.params.storeCode] = req.body;
    FileSkill.writeJSON(settingsPath, settings);

    res.json({ message: 'Ayarlar kaydedildi.' });
});

// API: Update Store Visibility
app.post('/api/stores/:storeCode/visibility', (req, res) => {
    const { storeCode } = req.params;
    const { visible } = req.body;

    const success = StoreModel.setVisibility(storeCode, visible);

    if (success) {
        res.json({ message: 'Görünürlük güncellendi.', visible });
    } else {
        res.status(404).json({ error: 'Mağaza bulunamadı.' });
    }
});

// Mağaza görünürlük ayarı
app.post('/api/stores/:code/visibility', (req, res) => {
    const { code } = req.params;
    const { visible } = req.body;

    const success = StoreModel.setVisibility(code, visible);
    if (success) {
        res.json({ message: 'Mağaza görünürlüğü güncellendi.' });
    } else {
        res.status(404).json({ error: 'Mağaza bulunamadı.' });
    }
});

// Mağaza bilgisi güncelle
app.put('/api/stores/:code', (req, res) => {
    const { code } = req.params;
    const updatedStore = { code, ...req.body };

    StoreModel.upsert(updatedStore);
    res.json({ message: 'Mağaza güncellendi.', store: updatedStore });
});

// API: Get Table Visibility Settings
app.get('/api/table-visibility', (req, res) => {
    const FileSkill = require('../skills/FileSkill');
    const visibilityPath = path.join(__dirname, 'database/table-visibility.json');
    const visibility = FileSkill.readJSON(visibilityPath, {});
    res.json(visibility);
});

// API: Save Table Visibility Settings
app.post('/api/table-visibility', (req, res) => {
    const FileSkill = require('../skills/FileSkill');
    const visibilityPath = path.join(__dirname, 'database/table-visibility.json');
    
    try {
        FileSkill.writeJSON(visibilityPath, req.body);
        res.json({ success: true, message: 'Tablo görünürlük ayarları kaydedildi.' });
    } catch (err) {
        console.error('Table visibility save error:', err);
        res.status(500).json({ error: 'Ayarlar kaydedilemedi.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
