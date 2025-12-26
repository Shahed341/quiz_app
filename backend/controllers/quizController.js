const fs = require('fs');
const path = require('path');

// Recursive helper to find files
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

const quizController = {
    autoSeed: async (dbPromise) => {
        try {
            const rootDir = '/usr/src/Courses';
            if (!fs.existsSync(rootDir)) return;

            // Find all files ending in -quiz.json
            const allFiles = getAllFiles(rootDir).filter(f => f.endsWith('-quiz.json'));
            console.log(`🔍 [DEBUG] Found ${allFiles.length} Quiz files across all directories.`);

            for (const filePath of allFiles) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const { quiz, questions } = JSON.parse(fileContent);

                const [existing] = await dbPromise.query(
                    'SELECT id FROM quizzes WHERE title = ?', [quiz.title]
                );

                if (existing.length === 0) {
                    console.log(`🌱 [DEBUG] Seeding Quiz: ${quiz.title}`);
                    const [res] = await dbPromise.query(
                        'INSERT INTO quizzes (title, description) VALUES (?, ?)',
                        [quiz.title, quiz.description]
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
            console.error('❌ Quiz Sync failed:', error.message);
        }
    },
    
    getAllQuizzes: async (req, res) => {
        const [rows] = await req.app.get('db').query('SELECT * FROM quizzes ORDER BY id DESC');
        res.json(rows);
    },

    getQuizById: async (req, res) => {
        const db = req.app.get('db');
        const [quiz] = await db.query('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);
        const [questions] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [req.params.id]);
        res.json({ ...quiz[0], questions });
    }
};

module.exports = quizController;