const fs = require('fs');
const path = require('path');
const pool = require('../utils/db');

const rootDir = process.env.COURSE_DATA_PATH || 'I:/Winter_26/Q/Courses';

/**
 * HELPER: Disk Sync
 * Regenerates the physical JSON file from the database registry.
 */
const syncQuizToFile = async (quizId) => {
    try {
        const [[quiz]] = await pool.query('SELECT id, title, file_path FROM quizzes WHERE id = ?', [quizId]);
        const [questions] = await pool.query(
            'SELECT question_text, options, correct_answer, explanation FROM questions WHERE quiz_id = ? AND is_deleted = 0 ORDER BY id ASC',
            [quizId]
        );

        if (quiz && quiz.file_path) {
            const fileContent = {
                title: quiz.title,
                last_materialized: new Date().toISOString(),
                questions: questions.map(q => ({
                    question_text: q.question_text,
                    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation
                }))
            };
            const dir = path.dirname(quiz.file_path);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(quiz.file_path, JSON.stringify(fileContent, null, 2), 'utf8');
        }
    } catch (err) {
        console.error("🔴 Disk Sync Error:", err.message);
    }
};

const quizController = {
    /**
     * 1. CREATE INDIVIDUAL QUESTION (For '+' Button in QuizPlayer)
     * Resolves the POST 404/500 error for new segments.
     */
    addQuestion: async (req, res) => {
        try {
            const { quizId } = req.params;
            const { question_text, options, correct_answer, explanation } = req.body;

            // Insert new segment into MySQL
            const [result] = await pool.query(
                `INSERT INTO questions (quiz_id, uid, question_text, options, correct_answer, explanation, is_ai_generated) 
                 VALUES (?, ?, ?, ?, ?, ?, 0)`,
                [
                    quizId, 
                    `q-${Date.now()}`, 
                    question_text || "", 
                    JSON.stringify(options || {A:"", B:"", C:"", D:""}), 
                    correct_answer || "A", 
                    explanation || ""
                ]
            );

            // Sync database state to physical I: Drive file
            await syncQuizToFile(quizId);

            res.status(201).json({ 
                success: true, 
                newId: result.insertId, 
                message: "Segment materialized." 
            });
        } catch (err) {
            console.error("🔴 Add Question Error:", err.message);
            res.status(500).json({ error: "Failed to materialize segment." });
        }
    },

    /**
     * 2. UPDATE INDIVIDUAL QUESTION (For Inline Edits)
     */
    updateQuestion: async (req, res) => {
        try {
            const { id } = req.params; 
            const { question_text, options, correct_answer, explanation } = req.body;

            const [result] = await pool.query(
                `UPDATE questions 
                 SET question_text = ?, options = ?, correct_answer = ?, explanation = ? 
                 WHERE id = ?`,
                [question_text, JSON.stringify(options), correct_answer, explanation, id]
            );

            if (result.affectedRows === 0) return res.status(404).json({ error: "Segment not found." });

            const [[qData]] = await pool.query('SELECT quiz_id FROM questions WHERE id = ?', [id]);
            if (qData) await syncQuizToFile(qData.quiz_id);

            res.json({ success: true, message: "Segment re-materialized." });
        } catch (err) {
            console.error("🔴 Update Question Error:", err.message);
            res.status(500).json({ error: "Synthesis failed." });
        }
    },

    /**
     * 3. ASSET MANAGEMENT & HISTORY
     */
    getQuizByUid: async (req, res) => {
        const { uid } = req.params;
        try {
            const [[quiz]] = await pool.query(
                `SELECT q.*, c.slug as course_slug FROM quizzes q 
                 JOIN courses c ON q.course_id = c.id 
                 WHERE q.uid = ? AND q.is_deleted = 0`, [uid]
            );
            if (!quiz) return res.status(404).json({ error: "Asset not discovered." });

            const [questions] = await pool.query(
                'SELECT * FROM questions WHERE quiz_id = ? AND is_deleted = 0 ORDER BY id ASC', [quiz.id]
            );
            
            const formattedQuestions = questions.map(q => ({
                ...q,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
            }));

            res.json({ ...quiz, questions: formattedQuestions });
        } catch (err) {
            res.status(500).json({ error: "Retrieval failed." });
        }
    },

    deleteQuiz: async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('UPDATE quizzes SET is_deleted = 1 WHERE id = ?', [id]);
            res.json({ success: true, message: "Asset archived." });
        } catch (err) {
            res.status(500).json({ error: "De-materialization failed." });
        }
    },

    getQuizHistory: async (req, res) => {
        try {
            const { id } = req.params;
            const [history] = await pool.query(
                'SELECT score, streak_count, attempted_at FROM learning_history WHERE content_id = ? AND content_type = "quiz" ORDER BY attempted_at DESC', [id]
            );
            res.json(history);
        } catch (err) {
            res.status(500).json({ error: "Registry read failed." });
        }
    },

    saveFullQuiz: async (req, res) => {
        const { quizId, courseId, title, slug, questions, quizUid } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            let targetId = quizId;
            let finalUid = quizUid;

            if (!targetId && !finalUid) {
                const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
                finalUid = `${slug}-${safeTitle}-${Date.now()}`;
                const filePath = path.join(rootDir, slug.toUpperCase(), `${finalUid}-quiz.json`);
                const [result] = await connection.query(
                    'INSERT INTO quizzes (course_id, uid, title, file_path, is_deleted) VALUES (?, ?, ?, ?, 0)',
                    [courseId, finalUid, title, filePath]
                );
                targetId = result.insertId;
            } else {
                await connection.query('UPDATE quizzes SET title = ? WHERE id = ? OR uid = ?', [title, targetId, finalUid]);
                if (!targetId) {
                    const [[q]] = await connection.query('SELECT id FROM quizzes WHERE uid = ?', [finalUid]);
                    targetId = q.id;
                }
            }

            await connection.query('DELETE FROM questions WHERE quiz_id = ?', [targetId]);
            for (const q of questions) {
                await connection.query(
                    `INSERT INTO questions (quiz_id, uid, question_text, options, correct_answer, explanation, is_ai_generated)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [targetId, q.uid || `q-${Date.now()}`, q.question_text, JSON.stringify(q.options), q.correct_answer, q.explanation, q.is_ai_generated || false]
                );
            }

            await connection.commit();
            await syncQuizToFile(targetId);
            res.json({ success: true, quizId: targetId, uid: finalUid });
        } catch (err) {
            await connection.rollback();
            res.status(500).json({ error: err.message });
        } finally {
            connection.release();
        }
    },

    getFullHistory: async (req, res) => {
        try {
            const [history] = await pool.query(`
                SELECT h.id as attempt_id, h.score, h.total_items, h.attempted_at, h.streak_count,
                       q.title as quiz_title, q.uid as quiz_uid, c.name as course_name, c.slug as course_slug
                FROM learning_history h
                JOIN quizzes q ON h.content_id = q.id
                JOIN courses c ON q.course_id = c.id
                WHERE h.content_type = 'quiz' ORDER BY h.attempted_at DESC
            `);
            res.json(history);
        } catch (err) {
            res.status(500).json({ error: "Failed to read history registry." });
        }
    },

    saveResult: async (req, res) => {
        const { quizId, score, totalItems } = req.body;
        try {
            const [[lastEntry]] = await pool.query('SELECT streak_count, attempted_at FROM learning_history ORDER BY attempted_at DESC LIMIT 1');
            let newStreak = 1;
            if (lastEntry) {
                const lastDate = new Date(lastEntry.attempted_at).toDateString();
                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (lastDate === today) newStreak = lastEntry.streak_count;
                else if (lastDate === yesterday) newStreak = lastEntry.streak_count + 1;
            }
            await pool.query(
                `INSERT INTO learning_history (content_type, content_id, score, total_items, streak_count) 
                 VALUES ('quiz', ?, ?, ?, ?)`, [quizId, score, totalItems, newStreak]
            );
            res.json({ success: true, streak: newStreak });
        } catch (err) {
            res.status(500).json({ error: "Failed to record result." });
        }
    }
};

module.exports = quizController;