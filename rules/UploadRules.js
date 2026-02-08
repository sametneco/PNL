const PeriodModel = require('../md/PeriodModel');
const StoreModel = require('../md/StoreModel');
const DataModel = require('../md/DataModel');

class UploadRules {
    /**
     * Yüklenen dosyayı işler ve veritabanına kaydeder.
     * @param {string} periodId 
     * @param {string} type 
     * @param {Array} rawData 
     * @returns {Promise<Object>}
     */
    static async processUpload(periodId, type, rawData) {
        // 1. Veriyi kaydet
        DataModel.saveForPeriod(periodId, type, rawData);

        // 2. Yeni mağazaları bul ve ekle
        const existingStores = StoreModel.getAll();
        const uniqueStores = new Map(existingStores.map(s => [s.code, s]));
        let newStoreCount = 0;

        rawData.forEach(row => {
            const rawName = row['EPM Store Name'];
            if (rawName) {
                const parts = rawName.split('-');
                if (parts.length >= 3) {
                    const code = parts[1]; // U684
                    const name = parts.slice(2).join('-'); // STA KON Kivilcim Bulvar

                    if (!uniqueStores.has(code)) {
                        uniqueStores.set(code, {
                            code,
                            name,
                            visible: true,
                            area: row['AREA (SQM)'] || 0,
                            openingDate: row['STORE OPENING DATE']
                        });
                        newStoreCount++;
                    }
                }
            }
        });

        if (newStoreCount > 0) {
            StoreModel.saveAll(Array.from(uniqueStores.values()));
        }

        // 3. Periyot durumunu güncelle
        PeriodModel.updateStatus(periodId, 'active');

        return {
            success: true,
            message: 'Dosya işlendi',
            details: {
                processedCount: rawData.length,
                newStores: newStoreCount
            }
        };
    }
}

module.exports = UploadRules;
