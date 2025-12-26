const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

/**
 * DYNAMIC SYNC ROUTE
 * Instead of seeding one specific file, this triggers the folder scanner.
 * Useful if you add a JSON file while the server is already running.
 */
router.post('/sync', async (req, res) => {
    try {
        const db = req.app.get('db');
        await quizController.autoSeed(db);
        res.json({ message: "Sync process triggered. New quizzes have been imported." });
    } catch (error) {
        res.status(500).json({ error: "Manual sync failed", details: error.message });
    }
});

/**
 * DISPLAY ROUTES
 * These power the Landpage (all) and QuizPage (by ID).
 */
router.get('/', quizController.getAllQuizzes);
router.get('/:id', quizController.getQuizById);

module.exports = router;