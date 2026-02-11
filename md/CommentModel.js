const FileSkill = require('../skills/FileSkill');
const path = require('path');

const COMMENTS_FILE = path.join(__dirname, '../server/database/comments.json');

class CommentModel {
    /**
     * Get all comments
     * @returns {Object} Comments object { 'storeCode_tableName': 'comment text' }
     */
    static getAll() {
        return FileSkill.readJSON(COMMENTS_FILE, {});
    }

    /**
     * Get comment by key
     * @param {string} key - Comment key (storeCode_tableName)
     * @returns {string|null} Comment text or null
     */
    static get(key) {
        const comments = this.getAll();
        return comments[key] || null;
    }

    /**
     * Save comment
     * @param {string} key - Comment key (storeCode_tableName)
     * @param {string} text - Comment text
     */
    static save(key, text) {
        const comments = this.getAll();
        comments[key] = text; // Obje veya string olarak kaydet
        FileSkill.writeJSON(COMMENTS_FILE, comments);
    }

    /**
     * Delete comment
     * @param {string} key - Comment key (storeCode_tableName)
     */
    static delete(key) {
        const comments = this.getAll();
        delete comments[key];
        FileSkill.writeJSON(COMMENTS_FILE, comments);
    }

    /**
     * Get comments for specific store
     * @param {string} storeCode - Store code
     * @returns {Object} Comments for this store
     */
    static getByStore(storeCode) {
        const comments = this.getAll();
        const storeComments = {};

        for (const key in comments) {
            if (key.startsWith(storeCode + '_')) {
                storeComments[key] = comments[key];
            }
        }

        return storeComments;
    }

    /**
     * Clear all comments
     */
    static clearAll() {
        FileSkill.writeJSON(COMMENTS_FILE, {});
    }
}

module.exports = CommentModel;
