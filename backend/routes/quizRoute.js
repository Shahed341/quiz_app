const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

/**
 * DYNAMIC SYNC ROUTE
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
 */
router.get('/', quizController.getAllQuizzes);
router.get('/:id', quizController.getQuizById);

/**
 * SAVE RESULTS ROUTE <--- ADD THIS
 * This connects the frontend "Finish Quiz" action to the database save logic.
 */
router.post('/results', quizController.saveQuizResult); 

module.exports = router;