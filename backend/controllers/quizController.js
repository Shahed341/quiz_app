const fs = require('fs');
const path = require('path');

// Helper to get DB connection from pool for standard routes
const getDb = (req) => req.app.get('db');

const quizController = {
    /**
     * DYNAMIC AUTO-SEED: 
     * Scans the folder and syncs all JSON files to the DB.
     * Called by server.js on startup.
     */
    autoSeed: async (dbPromise) => {
        try {
            const folderPath = '/usr/src/questions';
            
            if (!fs.existsSync(folderPath)) {
                console.log('📂 Questions folder not found in container.');
                return;
            }

            // Get all .json files in the folder
            const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.json'));
            console.log(`🔍 Sync: Found ${files.length} JSON files. Checking for updates...`);

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                
                // Skip empty files
                if (!fileContent.trim()) continue;

                const { quiz, questions } = JSON.parse(fileContent);

                // Check if this quiz already exists by title
                const [existing] = await dbPromise.query(
                    'SELECT id FROM quizzes WHERE title = ?', 
                    [quiz.title]
                );

                if (existing.length === 0) {
                    console.log(`🌱 New quiz detected: "${quiz.title}". Importing...`);
                    
                    // 1. Insert Quiz Metadata
                    const [quizResult] = await dbPromise.query(
                        'INSERT INTO quizzes (title, description) VALUES (?, ?)',
                        [quiz.title, quiz.description]
                    );
                    const quizId = quizResult.insertId;

                    // 2. Prepare and Bulk Insert Questions
                    const questionValues = questions.map(q => [
                        quizId, q.question_text, q.option_a, q.option_b, 
                        q.option_c, q.option_d, q.correct_answer, q.hint
                    ]);

                    await dbPromise.query(
                        'INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, hint) VALUES ?',
                        [questionValues]
                    );
                    console.log(`✅ Successfully synced: ${quiz.title}`);
                }
            }
        } catch (error) {
            console.error('❌ Dynamic Sync failed:', error.message);
        }
    },

    /**
     * GET ALL QUIZZES:
     * Fetches all synced quizzes for the Landpage grid.
     */
    getAllQuizzes: async (req, res) => {
        try {
            const db = getDb(req);
            const [quizzes] = await db.query('SELECT * FROM quizzes ORDER BY created_at DESC');
            res.json(quizzes);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch quizzes", details: error.message });
        }
    },

    /**
     * GET SINGLE QUIZ:
     * Fetches quiz metadata + all associated questions for the QuizPage.
     */
    getQuizById: async (req, res) => {
        try {
            const db = getDb(req);
            const quizId = req.params.id;

            const [quiz] = await db.query('SELECT * FROM quizzes WHERE id = ?', [quizId]);
            if (quiz.length === 0) return res.status(404).json({ error: "Quiz not found" });

            const [questions] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [quizId]);
            res.json({ ...quiz[0], questions });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch quiz details", details: error.message });
        }
    }
};

module.exports = quizController;