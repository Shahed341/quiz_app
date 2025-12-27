const fs = require('fs');
const path = require('path');

/**
 * RECURSIVE HELPER: Crawls directories to find all files.
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
     * SEEDER: Scans the /usr/src/Courses volume and syncs JSON to MySQL.
     * Maps the 'category' based on the top-level folder name.
     */
    autoSeed: async (dbPromise) => {
        try {
            const rootDir = '/usr/src/Courses';
            if (!fs.existsSync(rootDir)) {
                console.log('📂 [DEBUG] Sync: Root directory not found.');
                return;
            }

            const allFiles = getAllFiles(rootDir).filter(f => f.endsWith('-quiz.json'));
            console.log(`🔍 [DEBUG] Sync: Found ${allFiles.length} Quiz files.`);

            for (const filePath of allFiles) {
                const pathParts = filePath.split(path.sep);
                const coursesIdx = pathParts.indexOf('Courses');
                const category = pathParts[coursesIdx + 1];

                const fileContent = fs.readFileSync(filePath, 'utf8');
                const { quiz, questions } = JSON.parse(fileContent);

                // Prevent duplicates within the same course category
                const [existing] = await dbPromise.query(
                    'SELECT id FROM quizzes WHERE title = ? AND category = ?', 
                    [quiz.title, category]
                );

                if (existing.length === 0) {
                    console.log(`🌱 [DEBUG] Seeding: "${quiz.title}" -> [${category}]`);
                    const [res] = await dbPromise.query(
                        'INSERT INTO quizzes (title, description, category) VALUES (?, ?, ?)',
                        [quiz.title, quiz.description, category]
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
        } catch (error) {
            console.error('❌ [DEBUG] Sync failed:', error.message);
        }
    },
    
    /**
     * GET ALL: Returns all quizzes with their HIGHEST user score.
     * Uses a subquery to ensure only the best attempt is returned.
     */
    getAllQuizzes: async (req, res) => {
        try {
            const db = req.app.get('db');
            const query = `
                SELECT 
                    q.*, 
                    COALESCE((
                        SELECT MAX(score) 
                        FROM quiz_results 
                        WHERE quiz_id = q.id
                    ), 0) as user_score 
                FROM quizzes q
                ORDER BY q.id DESC
            `;
            const [rows] = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('❌ [DEBUG] getAllQuizzes Error:', error.message);
            res.status(500).json({ error: "Database error" });
        }
    },

    /**
     * GET ONE: Returns quiz details + all associated questions.
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
     * SAVE RESULT: Records a new quiz attempt.
     */
    saveQuizResult: async (req, res) => {
        try {
            const db = req.app.get('db');
            const { quiz_id, score } = req.body;

            console.log(`💾 [DEBUG] Incoming Score: ${score}% for Quiz ID: ${quiz_id}`);

            if (!quiz_id || score === undefined) {
                return res.status(400).json({ error: "quiz_id and score are required" });
            }

            await db.query(
                'INSERT INTO quiz_results (quiz_id, score) VALUES (?, ?)',
                [quiz_id, score]
            );

            res.status(201).json({ success: true });
        } catch (error) {
            console.error('❌ [DEBUG] saveQuizResult Error:', error.message);
            res.status(500).json({ error: "Failed to persist result" });
        }
    }
};

module.exports = quizController;