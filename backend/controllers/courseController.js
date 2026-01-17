const fs = require('fs');
const path = require('path');
const pool = require('../utils/db');

// Path normalization for I: Drive Scholar Drive
const rootDir = process.env.COURSE_DATA_PATH || 'I:/Winter_26/Q/Courses';

/**
 * COURSE CONTROLLER
 * Orchestrates the relationship between the Scholar Drive folders and the SQL Database.
 */
const courseController = {

    /**
     * 1. ADD COURSE (Scholar Drive Materialization)
     * Physically creates folder structure (Topic 1-10) and initial JSON assets.
     */
    addCourse: async (req, res) => {
        const { name, description, color_code } = req.body;
        
        if (!name) return res.status(400).json({ error: "Course name is required." });

        // Generate Folder Name (Slug) - Uppercase, no spaces
        const slug = name.toUpperCase().replace(/\s+/g, '');
        const courseFolderPath = path.join(rootDir, slug);

        try {
            // 1. Physical Folder Creation
            if (!fs.existsSync(courseFolderPath)) {
                fs.mkdirSync(courseFolderPath, { recursive: true });
                console.log(`📁 Materializing Course Directory: ${courseFolderPath}`);

                // 2. Create Topic Subfolders (Topic-1 to Topic-10)
                for (let i = 1; i <= 10; i++) {
                    const topicDir = path.join(courseFolderPath, `Topic-${i}`);
                    fs.mkdirSync(topicDir, { recursive: true });

                    // 3. Initialize Topic-1 with starter JSON templates
                    if (i === 1) {
                        const quizFile = path.join(topicDir, `${slug.toLowerCase()}-topic1-quiz.json`);
                        const flashFile = path.join(topicDir, `${slug.toLowerCase()}-topic1-flashcards.json`);

                        const quizTemplate = { 
                            title: `${name} - Topic 1 Quiz`, 
                            questions: [] 
                        };
                        const flashTemplate = { 
                            title: `${name} - Topic 1 Concepts`, 
                            cards: [] 
                        };

                        fs.writeFileSync(quizFile, JSON.stringify(quizTemplate, null, 2));
                        fs.writeFileSync(flashFile, JSON.stringify(flashTemplate, null, 2));
                    }
                }
            }

            // 4. Database Synchronization (Upsert)
            const [result] = await pool.query(`
                INSERT INTO courses (name, slug, description, color_code, is_active) 
                VALUES (?, ?, ?, ?, 1) 
                ON DUPLICATE KEY UPDATE is_active = 1, description = VALUES(description)
            `, [name.toUpperCase(), slug.toLowerCase(), description || "", color_code || "#3498db"]);

            res.json({ 
                success: true, 
                message: "Course materialized on Drive and DB.",
                courseId: result.insertId,
                slug: slug.toLowerCase()
            });

        } catch (err) {
            console.error("🔴 Course Materialization Error:", err);
            res.status(500).json({ error: "Failed to materialize course on Scholar Drive." });
        }
    },

    /**
     * 2. GET ALL COURSES (Landing Page)
     */
    getAllCourses: async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    c.id, c.name, c.slug, c.description, c.icon_name, c.color_code,
                    (SELECT COUNT(*) FROM quizzes WHERE course_id = c.id AND is_deleted = 0) as quiz_count,
                    (SELECT COUNT(*) FROM flashcard_sets WHERE course_id = c.id AND is_deleted = 0) as flashcard_count
                FROM courses c 
                WHERE c.is_active = 1
                ORDER BY c.name ASC
            `);
            res.json(rows);
        } catch (err) {
            console.error("🔴 Error in getAllCourses:", err);
            res.status(500).json({ error: "Failed to fetch courses" });
        }
    },

    /**
     * 3. GET COURSE BY SLUG (Course Detail Page)
     */
    getCourseBySlug: async (req, res) => {
        const slug = req.params.slug.toLowerCase(); 
        try {
            const [[course]] = await pool.query(
                'SELECT id, name, slug, description, color_code FROM courses WHERE LOWER(slug) = ? AND is_active = 1', 
                [slug]
            );
            
            if (!course) return res.status(404).json({ error: "Course not found" });

            const [quizzes] = await pool.query(
                'SELECT id, uid, title, file_path, is_ai_generated FROM quizzes WHERE course_id = ? AND is_deleted = 0 ORDER BY uid ASC', 
                [course.id]
            );

            const [flashcards] = await pool.query(
                'SELECT id, uid, title, file_path, is_ai_generated FROM flashcard_sets WHERE course_id = ? AND is_deleted = 0 ORDER BY uid ASC', 
                [course.id]
            );

            res.json({ course, quizzes, flashcards });
        } catch (err) {
            console.error(`🔴 Error in getCourseBySlug [${slug}]:`, err);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    /**
     * 4. GLOBAL SEARCH
     */
    globalSearch: async (req, res) => {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json([]);
        try {
            const queryParam = `%${q}%`;
            const [results] = await pool.query(`
                SELECT 'course' as type, name as title, slug, NULL as uid
                FROM courses 
                WHERE (LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?)) AND is_active = 1
                UNION ALL
                SELECT 'quiz' as type, title, NULL as slug, uid
                FROM quizzes 
                WHERE LOWER(title) LIKE LOWER(?) AND is_deleted = 0
                UNION ALL
                SELECT 'flashcard' as type, title, NULL as slug, uid
                FROM flashcard_sets 
                WHERE LOWER(title) LIKE LOWER(?) AND is_deleted = 0
                LIMIT 15
            `, [queryParam, queryParam, queryParam, queryParam]);
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: "Search failed" });
        }
    },

    /**
     * 5. GET GLOBAL STATS
     */
    getGlobalStats: async (req, res) => {
        try {
            const [[stats]] = await pool.query(`
                SELECT 
                    IFNULL(ROUND(AVG(f.mastery_level) * 10), 0) as avg_mastery_percent,
                    (SELECT streak_count FROM learning_history ORDER BY attempted_at DESC LIMIT 1) as study_streak,
                    (SELECT score FROM learning_history WHERE content_type = 'quiz' ORDER BY attempted_at DESC LIMIT 1) as last_quiz_score
                FROM flashcards f
                JOIN flashcard_sets fs ON f.set_id = fs.id
                WHERE fs.is_deleted = 0
            `);
            res.json({
                avg_mastery_percent: stats?.avg_mastery_percent || 0,
                study_streak: stats?.study_streak || 0,
                last_quiz_score: stats?.last_quiz_score || 0
            });
        } catch (err) {
            res.status(500).json({ error: "Failed to calculate stats" });
        }
    },

    /**
     * 6. UPDATE COURSE METADATA
     */
    updateCourse: async (req, res) => {
        const { id } = req.params;
        const { name, description, color_code, icon_name } = req.body;
        try {
            await pool.query(
                'UPDATE courses SET name = ?, description = ?, color_code = ?, icon_name = ? WHERE id = ?',
                [name, description, color_code, icon_name, id]
            );
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: "Update failed" });
        }
    },

    /**
     * 7. DELETE COURSE (Soft Delete)
     */
    deleteCourse: async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('UPDATE courses SET is_active = 0 WHERE id = ?', [id]);
            res.json({ success: true, message: "Course moved to the Archive." });
        } catch (err) {
            res.status(500).json({ error: "Failed to remove course." });
        }
    }
};

module.exports = courseController;