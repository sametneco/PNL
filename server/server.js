const express = require('express');
const multer = require('multer');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

// AG Imports
const PeriodModel = require('../md/PeriodModel');
const StoreModel = require('../md/StoreModel');
const DataModel = require('../md/DataModel');
const StoreSettingsModel = require('../md/StoreSettingsModel');
const CommentModel = require('../md/CommentModel');
const UploadRules = require('../rules/UploadRules');
const CsvSkill = require('../skills/CsvSkill');

const app = express();
const PORT = process.env.PORT || 8080;
const crypto = require('crypto');

// Auth Configuration
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'starbucks2026';
const AUTH_TOKENS = new Set(); // Active tokens in memory

// Keep-alive for Render free tier
if (process.env.RENDER_EXTERNAL_URL) {
    require('../keep-alive');
}

// Middleware
app.use(compression()); // Gzip compression
app.use(cors());
app.use(express.json());

// Static files with cache
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '1d', // 1 gün cache
    etag: true
}));

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


// --- Auth Endpoints ---

// Login
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Şifre gerekli.' });
    }

    if (password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        AUTH_TOKENS.add(token);
        res.json({ token, message: 'Giriş başarılı.' });
    } else {
        res.status(401).json({ error: 'Hatalı şifre.' });
    }
});

// Verify token
app.get('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (token && AUTH_TOKENS.has(token)) {
        res.json({ valid: true });
    } else {
        res.status(401).json({ valid: false, error: 'Geçersiz token.' });
    }
});

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

// API: Get System Status (Last Updated)
app.get('/api/status', (req, res) => {
    try {
        const dbDir = path.join(__dirname, 'database');
        const uploadsDir = path.join(__dirname, 'uploads');

        let lastUpdated = null;

        const checkDir = (dir) => {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const stats = fs.statSync(path.join(dir, file));
                    if (!lastUpdated || stats.mtime > lastUpdated) {
                        lastUpdated = stats.mtime;
                    }
                });
            }
        };

        checkDir(dbDir);
        checkDir(uploadsDir);

        res.json({ lastUpdated: lastUpdated || new Date() });
    } catch (err) {
        console.error('Status check error:', err);
        res.status(500).json({ error: 'Durum kontrolü hatası.' });
    }
});

// MIGRATION: Seed Stores from JSON to Supabase
app.get('/api/admin/seed-stores', async (req, res) => {
    try {
        let storesPath = path.join(__dirname, 'database/stores.json');
        if (!fs.existsSync(storesPath)) {
            const dataStoresPath = path.join(__dirname, 'data/stores.json');
            if (fs.existsSync(dataStoresPath)) {
                storesPath = dataStoresPath;
            } else {
                return res.status(404).json({ error: 'Stores JSON not found in database/ or data/' });
            }
        }

        const str = fs.readFileSync(storesPath, 'utf8');
        const stores = JSON.parse(str);

        const supabase = require('./supabase');

        const rows = stores.map(s => {
            // Convert Excel date to ISO date
            let openDate = null;
            if (s.openingDate) {
                const excelEpoch = new Date(1899, 11, 30);
                const days = parseInt(s.openingDate);
                if (!isNaN(days)) {
                    const jsDate = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
                    openDate = jsDate.toISOString().split('T')[0];
                }
            }

            return {
                code: s.code,
                name: s.name,
                opening_date: openDate,
                area: s.area ? parseFloat(s.area) : null,
                visible: s.visible
            };
        });

        const { error } = await supabase.from('stores').upsert(rows);

        if (error) throw error;

        res.json({ success: true, count: rows.length, message: 'Stores migrated to Supabase successfully' });

    } catch (err) {
        console.error('Migration error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DIAGNOSTIC: Check Database State (Stores, Periods, and Write Permissions)
app.get('/api/admin/check-db', async (req, res) => {
    const supabase = require('./supabase');
    const report = {
        online: true,
        checks: []
    };

    try {
        // 1. Check Periods
        const { data: periods, error: periodError } = await supabase.from('periods').select('count', { count: 'exact', head: true });
        report.checks.push({
            name: 'Periods Table',
            status: periodError ? 'ERROR' : 'OK',
            details: periodError || { count: periods }
        });

        // 2. Check Stores
        const { data: stores, error: storeError } = await supabase.from('stores').select('count', { count: 'exact', head: true });
        report.checks.push({
            name: 'Stores Table',
            status: storeError ? 'ERROR' : 'OK',
            details: storeError || { count: stores }
        });

        // 3. Check Specific Store (U744)
        const { data: u744, error: u744Error } = await supabase.from('stores').select('*').eq('code', 'U744').single();
        report.checks.push({
            name: 'Store U744',
            status: u744Error ? 'MISSING/ERROR' : 'FOUND',
            details: u744Error || u744
        });

        // 4. Test Write Permission (Dummy Comment)
        const testComment = {
            key: 'TEST_DIAGNOSTIC',
            store_code: 'U744', // Must exist if checking FK
            table_name: 'Diagnostic',
            text: 'Test',
            period_id: 1, // Must exist
            type: 'px'
        };

        // Only try write if dependencies might exist
        if (!storeError && !periodError) {
            const { error: writeError } = await supabase.from('comments').upsert(testComment);
            if (writeError) {
                report.checks.push({
                    name: 'Write Permission (Comments)',
                    status: 'FAILED',
                    code: writeError.code,
                    message: writeError.message,
                    details: writeError
                });
            } else {
                report.checks.push({
                    name: 'Write Permission (Comments)',
                    status: 'SUCCESS',
                    message: 'Write successful (RLS is OK)'
                });
                // Cleanup
                await supabase.from('comments').delete().eq('key', 'TEST_DIAGNOSTIC');
            }
        }

        res.json(report);

    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// ===== COMMENT API ENDPOINTS =====

// Get all comments (filtered by period and type)
app.get('/api/comments', async (req, res) => {
    try {
        console.log('GET /api/comments endpoint hit'); // DEBUG
        const { periodId, type } = req.query; // Frontend should send these
        const comments = await CommentModel.getAll(periodId, type);
        res.json(comments);
    } catch (err) {
        console.error('Comments fetch error:', err);
        res.status(500).json({ error: 'Yorumlar yüklenemedi.' });
    }
});

// Save comment
app.post('/api/comments', async (req, res) => {
    try {
        console.log('Received comment payload:', req.body); // DEBUG
        // key format from frontend: "storeCode_tableName"
        // frontend must also send periodId and type now
        const { key, text, author, periodId, type } = req.body;

        if (!key || !text || !periodId || !type) {
            console.error('Missing fields:', { key, text, periodId, type }); // DEBUG
            return res.status(400).json({ error: 'Eksik bilgi: key, text, periodId, type zorunlu.' });
        }

        // Parse key to get storeCode and tableName
        // Key format assumption: "STORECODE_TABLENAME"
        // But table name can contain underscores? 
        // Let's assume the first part is storeCode (it usually has no underscores or we split by first underscore)
        // Better yet, update frontend to send storeCode and tableName separately.
        // For now, let's try to parse existing key: "1234_FAVÖK"

        const parts = key.split('_');
        const storeCode = parts[0];
        const tableName = parts.slice(1).join('_'); // Rest is table name

        await CommentModel.save(storeCode, tableName, periodId, type, text, author);
        res.json({ success: true, message: 'Yorum kaydedildi.' });
    } catch (err) {
        console.error('Comment save error:', err);
        res.status(500).json({ error: 'Yorum kaydedilemedi.' });
    }
});

// Delete comment
app.delete('/api/comments/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { periodId, type } = req.query;

        if (!periodId || !type) {
            return res.status(400).json({ error: 'PeriodId ve Type gerekli.' });
        }

        const parts = key.split('_');
        const storeCode = parts[0];
        const tableName = parts.slice(1).join('_');

        await CommentModel.delete(storeCode, tableName, periodId, type);
        res.json({ success: true, message: 'Yorum silindi.' });
    } catch (err) {
        console.error('Comment delete error:', err);
        res.status(500).json({ error: 'Yorum silinemedi.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

