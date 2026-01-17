const fs = require('fs');
const path = require('path');
const pool = require('../utils/db');

// Root directory for Course data (Academic Void Core)
const rootDir = process.env.COURSE_DATA_PATH || 'I:/Winter_26/Q/Courses';

/**
 * HELPER: Sync Database state back to the Physical JSON File
 * Ensures the physical Scholar Drive asset matches the MySQL registry perfectly.
 */
const syncFlashToFile = async (setId) => {
    try {
        const [[set]] = await pool.query(
            'SELECT title, file_path, is_deleted FROM flashcard_sets WHERE id = ?', 
            [setId]
        );
        
        if (!set || !set.file_path) return;

        const [cards] = await pool.query(
            'SELECT uid, front_text as front, back_text as back, hint FROM flashcards WHERE set_id = ? AND is_deleted = 0 ORDER BY id ASC', 
            [setId]
        );

        const fileContent = {
            title: set.title,
            is_archived: !!set.is_deleted,
            last_materialized: new Date().toISOString(),
            cards: cards.map(c => ({
                uid: c.uid,
                front: c.front,
                back: c.back,
                hint: c.hint || ""
            }))
        };

        const dir = path.dirname(set.file_path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(set.file_path, JSON.stringify(fileContent, null, 2), 'utf8');
        console.log(`💾 Scholar Drive Synced: ${set.file_path}`);
    } catch (err) {
        console.error("🔴 Disk Sync Error (Flash):", err.message);
    }
};

const flashController = {
    /**
     * 1. RETRIEVE FLASHCARD SET
     */
    getFlashcardSetByUid: async (req, res) => {
        const { uid } = req.params;
        try {
            const [[set]] = await pool.query(
                `SELECT s.*, c.slug as course_slug 
                 FROM flashcard_sets s
                 JOIN courses c ON s.course_id = c.id
                 WHERE s.uid = ? AND s.is_deleted = 0`, 
                [uid]
            );
            
            if (!set) return res.status(404).json({ error: "Concept cluster not found." });

            const [cards] = await pool.query(
                'SELECT * FROM flashcards WHERE set_id = ? AND is_deleted = 0 ORDER BY id ASC',
                [set.id]
            );

            res.json({ ...set, cards });
        } catch (err) {
            res.status(500).json({ error: "Error retrieving concept set." });
        }
    },

    /**
     * 2. MATERIALIZE/UPSERT CARD
     * Handles set creation and individual card updates.
     */
    addOrUpdateCard: async (req, res) => {
        let { setId } = req.params;
        const { uid, front, back, hint, courseId, slug, title } = req.body;
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let responseUid = null;

            // Handle New Set Creation
            if (setId === 'new') {
                const safeTitle = (title || 'manual').toLowerCase().replace(/[^a-z0-9]/g, '-');
                const setUid = `${slug}-${safeTitle}-${Date.now()}`;
                const filePath = path.join(rootDir, slug.toUpperCase(), `${setUid}-flashcards.json`);

                const [newSet] = await connection.query(
                    `INSERT INTO flashcard_sets (course_id, uid, title, file_path, is_deleted) VALUES (?, ?, ?, ?, 0)`,
                    [courseId, setUid, title || 'Manual Concept Set', filePath]
                );
                setId = newSet.insertId;
                responseUid = setUid;
            } else {
                const [[existing]] = await connection.query('SELECT uid FROM flashcard_sets WHERE id = ?', [setId]);
                responseUid = existing?.uid;
            }

            // Card Upsert
            await connection.query(
                `INSERT INTO flashcards (set_id, uid, front_text, back_text, hint, next_review_date) 
                 VALUES (?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                    front_text=VALUES(front_text), 
                    back_text=VALUES(back_text), 
                    hint=VALUES(hint),
                    is_deleted=0`,
                [setId, uid || `fc-${Date.now()}`, front, back, hint || null]
            );

            await connection.commit();
            await syncFlashToFile(setId);

            res.json({ success: true, setId, setUid: responseUid });
        } catch (err) {
            await connection.rollback();
            res.status(500).json({ error: err.message });
        } finally {
            connection.release();
        }
    },

    /**
     * 3. SPACED REPETITION ENGINE (Leitner)
     */
    updateMastery: async (req, res) => {
        const { card_id, rating } = req.body; 
        try {
            const intervals = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
            const daysToAdd = intervals[rating] || 1;

            await pool.query(`
                UPDATE flashcards SET 
                mastery_level = CASE 
                    WHEN ? >= 4 THEN LEAST(mastery_level + 1, 10) 
                    WHEN ? <= 2 THEN GREATEST(mastery_level - 1, 0) 
                    ELSE mastery_level 
                END,
                last_review = NOW(),
                next_review_date = DATE_ADD(NOW(), INTERVAL ? DAY)
                WHERE id = ?`, 
                [rating, rating, daysToAdd, card_id]
            );

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: "Failed to update mastery registry." });
        }
    },

    /**
     * 4. DELETION & ARCHIVAL
     */
    deleteCard: async (req, res) => {
        const { setId, cardId } = req.params;
        try {
            await pool.query('UPDATE flashcards SET is_deleted = 1 WHERE id = ?', [cardId]);
            await syncFlashToFile(setId);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: "Card archival failed." });
        }
    },

    deleteFlashcardSet: async (req, res) => {
        const { id } = req.params; // Expects numeric ID from CourseDetail.jsx
        try {
            await pool.query('UPDATE flashcard_sets SET is_deleted = 1 WHERE id = ?', [id]);
            await syncFlashToFile(id);
            res.json({ success: true, message: "Asset moved to Archive Vault." });
        } catch (err) {
            res.status(500).json({ error: "Set archival failed." });
        }
    }
};

module.exports = flashController;