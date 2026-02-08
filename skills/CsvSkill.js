const fs = require('fs');
const csv = require('csv-parser');

class CsvSkill {
    /**
     * CSV dosyasını okur ve JSON array olarak döner.
     * @param {string} filePath - CSV dosyasının yolu
     * @param {object} options - csv-parser seçenekleri
     * @returns {Promise<Array>}
     */
    static parse(filePath, options = {}) {
        return new Promise((resolve, reject) => {
            const results = [];

            // Varsayılan ayarlar: noktalı virgül ayracı ve BOM temizleme
            const defaultOptions = {
                separator: ';',
                mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ''),
                ...options
            };

            fs.createReadStream(filePath)
                .pipe(csv(defaultOptions))
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    resolve(results);
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    }
}

module.exports = CsvSkill;
