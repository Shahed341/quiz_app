const fs = require('fs');
const path = require('path');

/**
 * RECURSIVE HELPER
 * Crawls through all subdirectories to find every file.
 * Handles the nested Courses/[CourseName]/[Lesson]/ structure.
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

const courseController = {
    /**
     * DYNAMIC SYNC:
     * Scans /usr/src/Courses/ and identifies Course/Lesson/Files.
     * Automatically assigns the "category" based on the folder name.
     */
    syncAllContent: async (db) => {
        try {
            const rootDir = '/usr/src/Courses';
            
            if (!fs.existsSync(rootDir)) {
                console.log('📂 [DEBUG] Sync: Root Course directory not found. Check Docker volume mapping.');
                return;
            }

            const allFiles = getAllFiles(rootDir);
            console.log(`🔍 [DEBUG] Sync: Found ${allFiles.length} total files. Processing...`);

            for (const filePath of allFiles) {
                // Determine course name: /usr/src/Courses/[CourseName]/...
                // Using path.sep for cross-platform compatibility
                const pathParts = filePath.split(path.sep);
                const coursesIdx = pathParts.indexOf('Courses');
                const courseName = pathParts[coursesIdx + 1];

                if (!courseName) continue;

                const fileContent = fs.readFileSync(filePath, 'utf8');
                if (!fileContent.trim()) continue;
                
                let data;
                try {
                    data = JSON.parse(fileContent);
                } catch (e) {
                    console.error(`❌ [DEBUG] JSON Syntax error in file: ${filePath}`);
                    continue;
                }

                // --- PROCESS QUIZZES (*-quiz.json) ---
                if (filePath.endsWith('-quiz.json')) {
                    const { quiz, questions } = data;
                    const [existing] = await db.query('SELECT id FROM quizzes WHERE title = ?', [quiz.title]);

                    if (existing.length === 0) {
                        console.log(`🌱 [DEBUG] Seeding Quiz: "${quiz.title}" into [${courseName}]`);
                        const [res] = await db.query(
                            'INSERT INTO quizzes (title, description, category) VALUES (?, ?, ?)',
                            [quiz.title, quiz.description, courseName]
                        );
                        
                        const values = questions.map(q => [
                            res.insertId, q.question_text, q.option_a, q.option_b, 
                            q.option_c, q.option_d, q.correct_answer, q.hint
                        ]);

                        await db.query(
                            'INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, hint) VALUES ?',
                            [values]
                        );
                    }
                }

                // --- PROCESS FLASHCARDS (*-flashcard.json) ---
                if (filePath.endsWith('-flashcard.json')) {
                    const { set, cards } = data;
                    const [existing] = await db.query('SELECT id FROM flashcard_sets WHERE title = ?', [set.title]);

                    if (existing.length === 0) {
                        console.log(`🌱 [DEBUG] Seeding Flashcards: "${set.title}" into [${courseName}]`);
                        const [res] = await db.query(
                            'INSERT INTO flashcard_sets (title, description, category) VALUES (?, ?, ?)',
                            [set.title, set.description, courseName]
                        );
                        
                        const values = cards.map(c => [res.insertId, c.front, c.back, c.hint || null]);
                        await db.query(
                            'INSERT INTO flashcards (set_id, front_text, back_text, hint) VALUES ?',
                            [values]
                        );
                    }
                }
            }
            console.log('✅ [DEBUG] Content Sync Finished.');
        } catch (error) {
            console.error('❌ [DEBUG] Sync failed:', error.message);
        }
    },

    /**
     * API ENDPOINT: GET /api/courses
     * Returns a flat array of unique course names for the Dashboard.
     */
    getCourseList: async (req, res) => {
        try {
            const db = req.app.get('db');
            if (!db) throw new Error("Database connection not ready");

            const query = `
                SELECT DISTINCT category FROM (
                    SELECT category FROM quizzes WHERE category IS NOT NULL
                    UNION
                    SELECT category FROM flashcard_sets WHERE category IS NOT NULL
                ) AS combined_categories
                ORDER BY category ASC
            `;
            
            const [rows] = await db.query(query);
            const courses = rows.map(r => r.category);
            
            console.log(`📡 [DEBUG] API: Sending ${courses.length} courses to dashboard.`);
            res.json(courses);
        } catch (error) {
            console.error('❌ [DEBUG] API Error (getCourseList):', error.message);
            // Return empty array so frontend .filter() doesn't crash
            res.status(500).json([]);
        }
    }
};

module.exports = courseController;