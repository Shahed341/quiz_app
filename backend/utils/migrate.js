const pool = require('./db');

const migrate = async () => {
    console.log(`[MIGRATION] 🛠️  Checking database schema integrity...`);
    
    try {
        // Define the columns we need to ensure exist
        const updates = [
            { table: 'flashcard_sets', column: 'is_ai_generated', type: 'TINYINT(1) DEFAULT 0' },
            { table: 'flashcards', column: 'is_ai_generated', type: 'TINYINT(1) DEFAULT 0' },
            { table: 'quizzes', column: 'is_ai_generated', type: 'TINYINT(1) DEFAULT 0' },
            { table: 'questions', column: 'is_ai_generated', type: 'TINYINT(1) DEFAULT 0' }
        ];

        for (const update of updates) {
            // Check if column exists
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'quiz_app' 
                AND TABLE_NAME = ? 
                AND COLUMN_NAME = ?
            `, [update.table, update.column]);

            if (columns.length === 0) {
                console.log(`[MIGRATION] ➕ Adding missing column [${update.column}] to [${update.table}]`);
                await pool.query(`ALTER TABLE ${update.table} ADD COLUMN ${update.column} ${update.type}`);
            }
        }
        
        console.log(`[MIGRATION] ✅ Schema is up to date.`);
    } catch (err) {
        console.error(`[MIGRATION] ❌ Migration failed:`, err.message);
        // We don't throw here so the server can still try to boot
    }
};

module.exports = migrate;