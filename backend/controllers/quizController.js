const fs = require('fs');
const path = require('path');

// Helper to get DB connection from pool
const getDb = (req) => req.app.get('db');

const quizController = {
    // 1. AUTO-SEED: Called by server.js on startup
    autoSeed: async (dbPromise) => {
        try {
            // Check if quizzes already exist to avoid duplicates
            const [rows] = await dbPromise.query('SELECT COUNT(*) as count FROM quizzes');
            if (rows[0].count > 0) return;

            console.log('🌱 Database empty. Auto-seeding C Programming quiz...');
            
            // Use absolute path for Docker container environment
            const filePath = '/usr/src/questions/Cprogramming.json';
            
            if (fs.existsSync(filePath)) {
                const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const { quiz, questions } = fileData;

                // Insert Quiz
                const [quizResult] = await dbPromise.query(
                    'INSERT INTO quizzes (title, description) VALUES (?, ?)',
                    [quiz.title, quiz.description]
                );
                const quizId = quizResult.insertId;

                // Bulk Insert Questions
                const values = questions.map(q => [
                    quizId, q.question_text, q.option_a, q.option_b, 
                    q.option_c, q.option_d, q.correct_answer, q.hint
                ]);

                await dbPromise.query(
                    'INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, hint) VALUES ?',
                    [values]
                );
                console.log('✅ Auto-seed complete.');
            }
        } catch (error) {
            console.error('❌ Auto-seed failed:', error.message);
        }
    },

    // 2. MANUAL SEED: Triggered via POST /api/quizzes/seed
    seedQuiz: async (req, res) => {
        const db = getDb(req);
        const connection = await db.getConnection();

        try {
            const filePath = '/usr/src/questions/Cprogramming.json';
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const { quiz, questions } = fileData;

            await connection.beginTransaction();

            const [quizResult] = await connection.query(
                'INSERT INTO quizzes (title, description) VALUES (?, ?)',
                [quiz.title, quiz.description]
            );
            const quizId = quizResult.insertId;

            const questionValues = questions.map(q => [
                quizId, q.question_text, q.option_a, q.option_b, 
                q.option_c, q.option_d, q.correct_answer, q.hint
            ]);

            await connection.query(
                'INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, hint) VALUES ?',
                [questionValues]
            );

            await connection.commit();
            res.status(201).json({ message: "Database seeded successfully!", quizId });

        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: "Failed to seed", details: error.message });
        } finally {
            connection.release();
        }
    },

    // 3. GET ALL QUIZZES
    getAllQuizzes: async (req, res) => {
        try {
            const db = getDb(req);
            const [quizzes] = await db.query('SELECT * FROM quizzes ORDER BY created_at DESC');
            res.json(quizzes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. GET SINGLE QUIZ BY ID
    getQuizById: async (req, res) => {
        try {
            const db = getDb(req);
            const [quiz] = await db.query('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);
            if (quiz.length === 0) return res.status(404).json({ error: "Quiz not found" });

            const [questions] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [req.params.id]);
            res.json({ ...quiz[0], questions });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = quizController;