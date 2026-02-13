const supabase = require('../server/supabase');

class CommentModel {

    // Get all comments (formatted as key-value for frontend compat)
    // Frontend key format: "storeCode_tableName" (old) -> we might need to adjust this
    // New frontend requirement: Comments are specific to Period + Type
    static async getAll(periodId, type) {
        let query = supabase.from('comments').select('*');

        if (periodId) query = query.eq('period_id', periodId);
        if (type) query = query.eq('type', type);

        const { data, error } = await query;
        if (error) {
            console.error('Supabase get comments error:', error);
            return {};
        }

        // Convert array to object hash: "storeCode_tableName": { text, author, timestamp }
        const result = {};
        data.forEach(item => {
            const key = `${item.store_code}_${item.table_name}`;
            result[key] = {
                text: item.text,
                author: item.author,
                timestamp: item.created_at
            };
        });
        return result;
    }

    // Save comment
    static async save(storeCode, tableName, periodId, type, text, author) {
        const { data, error } = await supabase
            .from('comments')
            .upsert({
                store_code: storeCode,
                table_name: tableName,
                period_id: periodId,
                type: type,
                text: text,
                author: author,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'store_code, table_name, period_id, type'
            });

        if (error) {
            console.error('Supabase save comment error:', error);
            throw error;
        }
        return data;
    }

    // Delete comment
    static async delete(storeCode, tableName, periodId, type) {
        const { error } = await supabase
            .from('comments')
            .delete()
            .match({
                store_code: storeCode,
                table_name: tableName,
                period_id: periodId,
                type: type
            });

        if (error) throw error;
        return true;
    }
}

module.exports = CommentModel;
