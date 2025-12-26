// Helper to get DB connection from pool
const getDb = (req) => req.app.get('db');

const quizController = {
    // 1. Create a new Quiz with Questions (Transaction)
    createQuiz: async (req, res) => {
        const { title, description, questions } = req.body;
        const db = getDb(req);
        
        // We get a connection for the transaction
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Insert Quiz
            const [quizResult] = await connection.query(
                'INSERT INTO quizzes (title, description) VALUES (?, ?)',
                [title, description]
            );
            const quizId = quizResult.insertId;

            // Prepare questions data
            const questionValues = questions.map(q => [
                quizId, q.question_text, q.option_a, q.option_b, 
                q.option_c, q.option_d, q.correct_answer, q.hint
            ]);

            // Bulk Insert Questions
            await connection.query(
                'INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, hint) VALUES ?',
                [questionValues]
            );

            await connection.commit();
            res.status(201).json({ message: "Quiz created successfully!", quizId });

        } catch (error) {
            await connection.rollback();
            console.error("Transaction Error:", error);
            res.status(500).json({ error: "Failed to save quiz", details: error.message });
        } finally {
            connection.release();
        }
    },

    // 2. Get all Quizzes
    getAllQuizzes: async (req, res) => {
        try {
            const db = getDb(req);
            const [quizzes] = await db.query('SELECT * FROM quizzes ORDER BY created_at DESC');
            res.json(quizzes);
        } catch (error) {
            res.status(500).json({ error: "Database error", details: error.message });
        }
    },

    // 3. Get a single Quiz with its questions
    getQuizById: async (req, res) => {
        try {
            const db = getDb(req);
            const quizId = req.params.id;

            const [quiz] = await db.query('SELECT * FROM quizzes WHERE id = ?', [quizId]);
            if (quiz.length === 0) return res.status(404).json({ error: "Quiz not found" });

            const [questions] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [quizId]);
            
            res.json({ ...quiz[0], questions });
        } catch (error) {
            res.status(500).json({ error: "Database error", details: error.message });
        }
    }
};

module.exports = quizController;