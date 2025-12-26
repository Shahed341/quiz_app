const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Trigger seeding
router.post('/seed', quizController.seedQuiz);

// Standard routes
router.get('/', quizController.getAllQuizzes);
router.get('/:id', quizController.getQuizById);

module.exports = router;