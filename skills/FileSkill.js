const fs = require('fs');
const path = require('path');

class FileSkill {
    /**
     * JSON dosyasını okur, yoksa oluşturur.
     * @param {string} filePath - Dosya yolu
     * @param {*} defaultValue - Dosya yoksa dönecek ve yazılacak varsayılan değer
     * @returns {*}
     */
    static readJSON(filePath, defaultValue = []) {
        if (!fs.existsSync(filePath)) {
            // Klasör yapısının var olduğundan emin olalım
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error(`Error reading ${filePath}:`, err);
            return defaultValue;
        }
    }

    /**
     * Veriyi JSON dosyasına yazar.
     * @param {string} filePath - Dosya yolu
     * @param {*} data - Yazılacak veri
     */
    static writeJSON(filePath, data) {
        // Klasör yapısının var olduğundan emin olalım
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    /**
     * Dosyanın varlığını kontrol eder.
     * @param {string} filePath 
     * @returns {boolean}
     */
    static exists(filePath) {
        return fs.existsSync(filePath);
    }
}

module.exports = FileSkill;
