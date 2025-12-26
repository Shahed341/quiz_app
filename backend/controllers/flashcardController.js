const fs = require('fs');
const path = require('path');

const getAllFiles = (dirPath, arrayOfFiles) => {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach((file) => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles;
};

const flashcardController = {
    autoSeed: async (dbPromise) => {
        try {
            const rootDir = '/usr/src/Courses';
            if (!fs.existsSync(rootDir)) return;

            const allFiles = getAllFiles(rootDir).filter(f => f.endsWith('-flashcard.json'));
            console.log(`🔍 [DEBUG] Found ${allFiles.length} Flashcard files.`);

            for (const filePath of allFiles) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const { set, cards } = data;

                const [existing] = await dbPromise.query(
                    'SELECT id FROM flashcard_sets WHERE title = ?', [set.title]
                );

                if (existing.length === 0) {
                    console.log(`🌱 [DEBUG] Seeding Flashcard Set: ${set.title}`);
                    const [res] = await dbPromise.query(
                        'INSERT INTO flashcard_sets (title, description, category) VALUES (?, ?, ?)',
                        [set.title, set.description, set.category]
                    );
                    const setId = res.insertId;

                    const values = cards.map(c => [setId, c.front, c.back, c.hint || null]);
                    await dbPromise.query(
                        'INSERT INTO flashcards (set_id, front_text, back_text, hint) VALUES ?',
                        [values]
                    );
                }
            }
        } catch (error) {
            console.error('❌ Flashcard Sync failed:', error.message);
        }
    },

    getAllSets: async (req, res) => {
        const [rows] = await req.app.get('db').query('SELECT * FROM flashcard_sets ORDER BY id DESC');
        res.json(rows);
    },

    getCardsBySetId: async (req, res) => {
        const db = req.app.get('db');
        const [set] = await db.query('SELECT * FROM flashcard_sets WHERE id = ?', [req.params.id]);
        const [cards] = await db.query('SELECT * FROM flashcards WHERE set_id = ?', [req.params.id]);
        res.json({ ...set[0], cards });
    }
};

module.exports = flashcardController;