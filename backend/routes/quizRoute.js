const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Definition of routes
router.post('/', quizController.createQuiz);
router.get('/', quizController.getAllQuizzes);
router.get('/:id', quizController.getQuizById);

module.exports = router;