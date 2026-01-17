const { GoogleGenerativeAI } = require("@google/generative-ai");
const pool = require('../utils/db');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const rootDir = process.env.COURSE_DATA_PATH || 'I:/Winter_26/Q/Courses';

const aiController = {
    /**
     * GENERATE QUIZ & PERSIST TO FILE
     */
    generateQuiz: async (req, res) => {
        const { topic, courseId } = req.body;

        if (!topic || !courseId) {
            return res.status(400).json({ error: "Topic and Course ID required." });
        }

        try {
            // 1. Get Course Info to determine folder path
            const [[course]] = await pool.query('SELECT name FROM courses WHERE id = ?', [courseId]);
            if (!course) throw new Error("Course not found in DB");

            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `
                Act as an academic professor. Generate a study quiz about "${topic}".
                Return exactly 5 questions in a strict JSON array format.
                Each object must match this EXACT format:
                {
                    "question": "string",
                    "options": ["string", "string", "string", "string"],
                    "answer": "the exact string of the correct option",
                    "explanation": "string"
                }
                Return ONLY raw JSON. No markdown.
            `;

            const result = await model.generateContent(prompt);
            const questions = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

            // 2. Prepare Metadata
            const timestamp = Date.now();
            const quizUid = `ai-quiz-${timestamp}`;
            const quizTitle = `✨ AI: ${topic}`;
            
            // Create path: Courses/CHEM112/ai-quiz-123.json
            const folderPath = path.join(rootDir, course.name.replace(/\s+/g, ''));
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
            const filePath = path.join(folderPath, `${quizUid}.json`);

            // 3. PERMANENT FILE WRITE
            const fileData = { title: quizTitle, questions: questions };
            fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

            // 4. DATABASE WRITE
            const [quizResult] = await pool.query(
                'INSERT INTO quizzes (course_id, uid, title, file_path, is_ai_generated) VALUES (?, ?, ?, ?, 1)',
                [courseId, quizUid, quizTitle, filePath]
            );

            const insertValues = questions.map((q, i) => [
                quizResult.insertId,
                `${quizUid}-q${i}`,
                q.question,
                JSON.stringify(q.options),
                q.answer,
                q.explanation,
                1
            ]);

            await pool.query(
                `INSERT INTO questions (quiz_id, uid, question_text, options, correct_answer, explanation, is_ai_generated) VALUES ?`,
                [insertValues]
            );

            res.json({ success: true, uid: quizUid, title: quizTitle, filePath });

        } catch (err) {
            console.error("🔴 AI Quiz Error:", err);
            res.status(500).json({ error: "Gemini failed to generate or save content." });
        }
    },

    /**
     * GENERATE FLASHCARDS & PERSIST TO FILE
     */
    generateFlashcards: async (req, res) => {
        const { topic, courseId } = req.body;

        try {
            const [[course]] = await pool.query('SELECT name FROM courses WHERE id = ?', [courseId]);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
                Generate 10 flashcards about "${topic}". 
                Return JSON array where each object is: {"front": "string", "back": "string"}.
                Return ONLY raw JSON.
            `;

            const result = await model.generateContent(prompt);
            const cards = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

            const setUid = `ai-flash-${Date.now()}`;
            const setTitle = `✨ AI: ${topic}`;
            
            const folderPath = path.join(rootDir, course.name.replace(/\s+/g, ''));
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
            const filePath = path.join(folderPath, `${setUid}.json`);

            // 1. FILE WRITE
            fs.writeFileSync(filePath, JSON.stringify({ title: setTitle, cards: cards }, null, 2));

            // 2. DB WRITE
            const [setResult] = await pool.query(
                'INSERT INTO flashcard_sets (course_id, uid, title, file_path, is_ai_generated) VALUES (?, ?, ?, ?, 1)',
                [courseId, setUid, setTitle, filePath]
            );

            const cardValues = cards.map((c, i) => [
                setResult.insertId,
                `${setUid}-c${i}`,
                c.front,
                c.back,
                1
            ]);

            await pool.query(
                `INSERT INTO flashcards (set_id, uid, front_text, back_text, is_ai_generated) VALUES ?`,
                [cardValues]
            );

            res.json({ success: true, uid: setUid, filePath });

        } catch (err) {
            console.error("🔴 AI Flashcard Error:", err);
            res.status(500).json({ error: "Failed to generate AI cards." });
        }
    }
};

module.exports = aiController;