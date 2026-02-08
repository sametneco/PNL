const path = require('path');
const FileSkill = require('../skills/FileSkill');

const DB_PATH = path.join(__dirname, '../server/database/stores.json');

class StoreModel {
    static getAll() {
        return FileSkill.readJSON(DB_PATH, []);
    }

    static saveAll(stores) {
        FileSkill.writeJSON(DB_PATH, stores);
    }

    static findByCode(code) {
        const stores = this.getAll();
        return stores.find(s => s.code === code);
    }

    static upsert(store) {
        const stores = this.getAll();
        const index = stores.findIndex(s => s.code === store.code);

        if (index !== -1) {
            stores[index] = { ...stores[index], ...store };
        } else {
            stores.push(store);
        }

        this.saveAll(stores);
    }

    static setVisibility(code, visible) {
        const stores = this.getAll();
        const index = stores.findIndex(s => s.code === code);

        if (index !== -1) {
            stores[index].visible = visible;
            this.saveAll(stores);
            return true;
        }
        return false;
    }
}

module.exports = StoreModel;
