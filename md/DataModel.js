const path = require('path');
const FileSkill = require('../skills/FileSkill');

const DB_PATH = path.join(__dirname, '../server/database/data.json');

class DataModel {
    static getAll() {
        return FileSkill.readJSON(DB_PATH, {});
    }

    static saveAll(data) {
        FileSkill.writeJSON(DB_PATH, data);
    }

    static getByPeriod(periodId) {
        const allData = this.getAll();
        return allData[periodId] || { px: [], ytd: [] };
    }

    static saveForPeriod(periodId, type, data) {
        const allData = this.getAll();

        if (!allData[periodId]) {
            allData[periodId] = { px: [], ytd: [], files: {} };
        }
        if (!allData[periodId].files) allData[periodId].files = {};


        allData[periodId][type] = data;
        this.saveAll(allData);
    }

    static clearPeriod(periodId) {
        const allData = this.getAll();
        if (allData[periodId]) {
            delete allData[periodId];
            this.saveAll(allData);
            return true;
        }
        return false;
    }
    static clearPeriodType(periodId, type) {
        const allData = this.getAll();
        if (allData[periodId]) {
            if (type === 'px') allData[periodId].px = [];
            if (type === 'ytd') allData[periodId].ytd = [];

            // Should we delete key if both empty? maybe.
            this.saveAll(allData);
            return true;
        }
        return false;
    }

    static getFiles(periodId) {
        const allData = this.getAll();
        return (allData[periodId] && allData[periodId].files) ? allData[periodId].files : {};
    }

    static setFile(periodId, type, filename) {
        const allData = this.getAll();
        if (!allData[periodId]) {
            allData[periodId] = { px: [], ytd: [], files: {} };
        }
        if (!allData[periodId].files) allData[periodId].files = {};

        allData[periodId].files[type] = filename;
        this.saveAll(allData);
    }
}

module.exports = DataModel;
