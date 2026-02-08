const path = require('path');
const FileSkill = require('../skills/FileSkill');

// Veritabanı dosya yolu (Server'dan bağımsız çalışabilmesi için)
// Not: Gerçek uygulamada config'den gelmeli ama şimdilik path resolving yapıyoruz.
const DB_PATH = path.join(__dirname, '../server/database/periods.json');

class PeriodModel {
    static getAll() {
        return FileSkill.readJSON(DB_PATH, []);
    }

    static saveAll(periods) {
        FileSkill.writeJSON(DB_PATH, periods);
    }

    static findById(id) {
        const periods = this.getAll();
        return periods.find(p => p.id == id);
    }

    static updateStatus(id, status) {
        const periods = this.getAll();
        const index = periods.findIndex(p => p.id == id);
        if (index !== -1) {
            periods[index].status = status;
            this.saveAll(periods);
            return true;
        }
        return false;
    }
}

module.exports = PeriodModel;
