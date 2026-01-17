const pool = require('../utils/db');

/**
 * ARCHIVE CONTROLLER
 * Manages the "Recycle Bin" logic for Courses, Quizzes, and Flashcards.
 * Handles Soft-Deleted items and provides restoration or permanent purge capabilities.
 */
const archiveController = {
    
    /**
     * 1. FETCH ALL DELETED CONTENT
     * Combines deleted courses (is_active=0), quizzes (is_deleted=1), 
     * and flashcard sets (is_deleted=1) into a single feed.
     */
    getDeletedItems: async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT id, name AS title, 'course' AS type 
                FROM courses 
                WHERE is_active = 0
                UNION ALL
                SELECT id, title, 'quiz' AS type 
                FROM quizzes 
                WHERE is_deleted = 1
                UNION ALL
                SELECT id, title, 'flashcard' AS type 
                FROM flashcard_sets 
                WHERE is_deleted = 1
                ORDER BY title ASC
            `);
            
            console.log(`📂 Archive accessed. Found ${rows.length} items.`);
            res.json(rows);
        } catch (err) {
            console.error("🔴 Archive Retrieval Error:", err);
            res.status(500).json({ error: "Could not access the vault." });
        }
    },

    /**
     * 2. RESTORE ITEM (Undo Delete)
     * Reverses the soft-delete flag based on the item type.
     */
    restoreItem: async (req, res) => {
        const { type, id } = req.body;
        
        if (!type || !id) {
            return res.status(400).json({ error: "Missing type or ID for restoration." });
        }

        try {
            let query = "";
            if (type === 'course') {
                query = "UPDATE courses SET is_active = 1 WHERE id = ?";
            } else if (type === 'quiz') {
                query = "UPDATE quizzes SET is_deleted = 0 WHERE id = ?";
            } else if (type === 'flashcard') {
                query = "UPDATE flashcard_sets SET is_deleted = 0 WHERE id = ?";
            }

            await pool.query(query, [id]);
            
            console.log(`♻️  Restored ${type} [ID: ${id}]`);
            res.json({ success: true, message: "Item materialized back into system." });
        } catch (err) {
            console.error("🔴 Restoration Error:", err);
            res.status(500).json({ error: "Failed to restore item." });
        }
    },

    /**
     * 3. PERMANENT PURGE (Hard Delete)
     * Physically removes the row from the database.
     * SQL 'ON DELETE CASCADE' handles cleanup of child records (questions/cards).
     */
    permanentlyDelete: async (req, res) => {
        const { type, id } = req.body;

        if (!type || !id) {
            return res.status(400).json({ error: "Missing type or ID for purge." });
        }

        try {
            let table = "";
            if (type === 'course') table = "courses";
            else if (type === 'quiz') table = "quizzes";
            else if (type === 'flashcard') table = "flashcard_sets";

            await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
            
            console.log(`💀 Permanently purged ${type} [ID: ${id}]`);
            res.json({ success: true, message: "Item removed from existence." });
        } catch (err) {
            console.error("🔴 Purge Error:", err);
            res.status(500).json({ error: "Failed to purge item from database." });
        }
    }
};

module.exports = archiveController;