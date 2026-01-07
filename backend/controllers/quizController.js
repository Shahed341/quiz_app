const fs = require('fs');
const path = require('path');

/**
 * RECURSIVE HELPER: Crawls directories to find all JSON files.
 */
const getAllFiles = (dirPath, arrayOfFiles) => {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });
    return arrayOfFiles;
};

const quizController = {
    /**
     * SEEDER: Scans /usr/src/Courses and syncs JSON to MySQL.
     * UPDATED: Now uses file_path as the unique identifier for a 1:1 sync.
     */
    autoSeed: async (dbPromise) => {
        try {
            const rootDir = '/usr/src/Courses';
            if (!fs.existsSync(rootDir)) {
                console.log('📂 [DEBUG] Sync: Root directory not found.');
                return;
            }

            const allFiles = getAllFiles(rootDir);
            
            // Arrays to track existing paths found on the physical disk
            const diskQuizPaths = [];
            const diskFlashcardPaths = [];

            for (const filePath of allFiles) {
                const pathParts = filePath.split(path.sep);
                const coursesIdx = pathParts.indexOf('Courses');
                const category = pathParts[coursesIdx + 1] || 'General';

                const fileContent = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(fileContent);

                // --- 1. HANDLE QUIZ FILES ---
                if (filePath.endsWith('-quiz.json')) {
                    const { quiz, questions } = data;
                    diskQuizPaths.push(filePath);

                    // Check if this specific file path is already in the DB
                    const [existing] = await dbPromise.query(
                        'SELECT id FROM quizzes WHERE file_path = ?', 
                        [filePath]
                    );

                    if (existing.length === 0) {
                        console.log(`🌱 [SEED] New Quiz: "${quiz.title}" from ${filePath}`);
                        const [res] = await dbPromise.query(
                            'INSERT INTO quizzes (title, description, category, file_path) VALUES (?, ?, ?, ?)',
                            [quiz.title, quiz.description, category, filePath]
                        );
                        const quizId = res.insertId;

                        const values = questions.map(q => [
                            quizId, q.question_text, q.option_a, q.option_b, 
                            q.option_c, q.option_d, q.correct_answer, q.hint
                        ]);

                        await dbPromise.query(
                            'INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, hint) VALUES ?',
                            [values]
                        );
                    }
                }

                // --- 2. HANDLE FLASHCARD FILES ---
                if (filePath.endsWith('-flashcard.json')) {
                    const { set, cards } = data;
                    diskFlashcardPaths.push(filePath);

                    const [existing] = await dbPromise.query(
                        'SELECT id FROM flashcard_sets WHERE file_path = ?',
                        [filePath]
                    );

                    if (existing.length === 0) {
                        console.log(`🗂️ [SEED] New Flashcards: "${set.title}" from ${filePath}`);
                        const [res] = await dbPromise.query(
                            'INSERT INTO flashcard_sets (title, description, category, file_path) VALUES (?, ?, ?, ?)',
                            [set.title, set.description, category, filePath]
                        );
                        const setId = res.insertId;

                        const values = cards.map(c => [
                            setId, c.front || c.front_text, c.back || c.back_text, c.hint
                        ]);

                        await dbPromise.query(
                            'INSERT INTO flashcards (set_id, front_text, back_text, hint) VALUES ?',
                            [values]
                        );
                    }
                }
            }

            // --- 3. TWO-WAY SYNC CLEANUP ---
            // If a file is NOT on disk, delete its record from the DB.
            // MySQL ON DELETE CASCADE handles the questions/results/cards.
            if (diskQuizPaths.length > 0) {
                await dbPromise.query('DELETE FROM quizzes WHERE file_path NOT IN (?)', [diskQuizPaths]);
            } else {
                await dbPromise.query('DELETE FROM quizzes');
            }

            if (diskFlashcardPaths.length > 0) {
                await dbPromise.query('DELETE FROM flashcard_sets WHERE file_path NOT IN (?)', [diskFlashcardPaths]);
            } else {
                await dbPromise.query('DELETE FROM flashcard_sets');
            }

            console.log('🔄 [DEBUG] Sync Complete: Database matches filesystem.');
        } catch (error) {
            console.error('❌ [DEBUG] Sync failed:', error.message);
        }
    },

    /**
     * API: Fetch all quizzes with their highest user score.
     */
    getAllQuizzes: async (req, res) => {
        try {
            const db = req.app.get('db');
            const query = `
                SELECT q.*, 
                COALESCE((SELECT MAX(score) FROM quiz_results WHERE quiz_id = q.id), 0) as user_score 
                FROM quizzes q ORDER BY q.id DESC`;
            const [rows] = await db.query(query);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: "Database error" });
        }
    },

    /**
     * API: Get Quiz metadata + Questions.
     */
    getQuizById: async (req, res) => {
        try {
            const db = req.app.get('db');
            const [quiz] = await db.query('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);
            if (quiz.length === 0) return res.status(404).json({ error: "Quiz not found" });
            const [questions] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [req.params.id]);
            res.json({ ...quiz[0], questions });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * API: Get all past attempt scores for a specific quiz.
     */
    getQuizHistory: async (req, res) => {
        try {
            const db = req.app.get('db');
            const [rows] = await db.query(
                'SELECT score, completed_at FROM quiz_results WHERE quiz_id = ? ORDER BY completed_at DESC',
                [req.params.id]
            );
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch attempt history" });
        }
    },

    /**
     * API: Manual delete request from Frontend.
     */
    deleteQuiz: async (req, res) => {
        try {
            const db = req.app.get('db');
            await db.query('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete quiz" });
        }
    },

    /**
     * API: Post a quiz result score.
     */
    saveQuizResult: async (req, res) => {
        try {
            const db = req.app.get('db');
            const { quiz_id, score } = req.body;
            await db.query('INSERT INTO quiz_results (quiz_id, score) VALUES (?, ?)', [quiz_id, score]);
            res.status(201).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to save score" });
        }
    },

    // --- FLASHCARD METHODS ---

    getAllFlashcards: async (req, res) => {
        try {
            const db = req.app.get('db');
            const [rows] = await db.query('SELECT * FROM flashcard_sets ORDER BY id DESC');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getFlashcardsById: async (req, res) => {
        try {
            const db = req.app.get('db');
            const [set] = await db.query('SELECT * FROM flashcard_sets WHERE id = ?', [req.params.id]);
            if (set.length === 0) return res.status(404).json({ error: "Set not found" });
            const [cards] = await db.query('SELECT * FROM flashcards WHERE set_id = ?', [req.params.id]);
            res.json({ ...set[0], cards });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteFlashcardSet: async (req, res) => {
        try {
            const db = req.app.get('db');
            await db.query('DELETE FROM flashcard_sets WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete flashcard set" });
        }
    }
};

module.exports = quizController;