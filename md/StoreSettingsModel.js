const path = require('path');
const FileSkill = require('../skills/FileSkill');

const DB_PATH = path.join(__dirname, '../server/database/settings.json');

class StoreSettingsModel {
    static getAll() {
        return FileSkill.readJSON(DB_PATH, {});
    }

    static saveAll(data) {
        FileSkill.writeJSON(DB_PATH, data);
    }

    static get(storeCode) {
        const all = this.getAll();
        return all[storeCode] || {};
    }

    static save(storeCode, settings) {
        const all = this.getAll();
        all[storeCode] = settings;
        this.saveAll(all);
    }
}

module.exports = StoreSettingsModel;
