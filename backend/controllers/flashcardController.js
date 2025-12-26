const fs = require('fs');
const path = require('path');

/**
 * [DEBUG] Helper to retrieve the database connection pool from the app settings.
 */
const getDb = (req) => req.app.get('db');

const flashcardController = {
    /**
     * DYNAMIC AUTO-SEED: 
     * Scans the designated container folder and syncs .json files to the MySQL DB.
     * [DEBUG] Called during server startup and manual sync requests.
     */
    autoSeed: async (dbPromise) => {
        try {
            const folderPath = '/usr/src/questions/flashcards';
            
            // [DEBUG] Verify the mapped volume path exists
            if (!fs.existsSync(folderPath)) {
                console.log('📂 [DEBUG] Flashcard folder not found at /usr/src/questions/flashcards. Skipping.');
                return;
            }

            // [DEBUG] Identify all valid JSON files in the directory
            const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.json'));
            console.log(`🔍 [DEBUG] Sync: Found ${files.length} flashcard JSON files. Checking for new data...`);

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                
                // [DEBUG] Skip files that have no content
                if (!fileContent.trim()) {
                    console.log(`⚠️ [DEBUG] Skipping empty file: ${file}`);
                    continue;
                }

                const data = JSON.parse(fileContent);
                const { set, cards } = data;

                // [DEBUG] Check if this set is already in the DB by title to avoid duplicates
                const [existing] = await dbPromise.query(
                    'SELECT id FROM flashcard_sets WHERE title = ?', 
                    [set.title]
                );

                if (existing.length === 0) {
                    console.log(`🌱 [DEBUG] New Set Detected: "${set.title}". Syncing...`);
                    
                    // 1. Insert Metadata into flashcard_sets
                    const [setResult] = await dbPromise.query(
                        'INSERT INTO flashcard_sets (title, description, category) VALUES (?, ?, ?)',
                        [set.title, set.description, set.category]
                    );
                    const setId = setResult.insertId;

                    // 2. Bulk Map JSON data to MySQL Columns (mapping front -> front_text, etc.)
                    const cardValues = cards.map(c => [
                        setId, 
                        c.front, 
                        c.back,  
                        c.hint || null
                    ]);

                    // 3. Batch Insert for performance
                    await dbPromise.query(
                        'INSERT INTO flashcards (set_id, front_text, back_text, hint) VALUES ?',
                        [cardValues]
                    );
                    console.log(`✅ [DEBUG] Successfully synced: "${set.title}" (${cards.length} cards added).`);
                } else {
                    console.log(`ℹ️ [DEBUG] Set "${set.title}" already exists in DB. Skipping.`);
                }
            }
        } catch (error) {
            console.error('❌ [DEBUG] Flashcard Sync failed critical error:', error.message);
        }
    },

    /**
     * [DEBUG] Endpoint handler for fetching all flashcard set cards for the library UI.
     */
    getAllSets: async (req, res) => {
        try {
            const db = getDb(req);
            const [sets] = await db.query('SELECT * FROM flashcard_sets ORDER BY created_at DESC');
            res.json(sets);
        } catch (error) {
            console.error('❌ [DEBUG] getAllSets DB Error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * [DEBUG] Endpoint handler for fetching specific set data + all cards for the Study mode.
     */
    getCardsBySetId: async (req, res) => {
        try {
            const db = getDb(req);
            const setId = req.params.id;

            // [DEBUG] Confirm the set exists
            const [setRows] = await db.query('SELECT * FROM flashcard_sets WHERE id = ?', [setId]);
            if (setRows.length === 0) {
                console.log(`⚠️ [DEBUG] Client requested non-existent flashcard set ID: ${setId}`);
                return res.status(404).json({ error: "Set not found" });
            }

            // [DEBUG] Fetch associated cards
            const [cards] = await db.query('SELECT * FROM flashcards WHERE set_id = ?', [setId]);
            res.json({ ...setRows[0], cards });
        } catch (error) {
            console.error(`❌ [DEBUG] getCardsBySetId DB Error (ID: ${setId}):`, error.message);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = flashcardController;