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

// NEW: Quiz History Route (Used by QuizHistory.jsx)
router.get('/history/:id', quizController.getQuizHistory);

// Get specific quiz questions
router.get('/:id', quizController.getQuizById);

/**
 * SAVE RESULTS ROUTE
 */
router.post('/results', quizController.saveQuizResult); 

/**
 * DELETE ROUTE <--- ADD THIS TO FIX THE 404
 */
router.delete('/:id', quizController.deleteQuiz);

module.exports = router;