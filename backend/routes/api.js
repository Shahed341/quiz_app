const express = require('express');
const router = express.Router();

// Import Controllers
const syncController = require('../controllers/syncController');
const courseController = require('../controllers/courseController');
const quizController = require('../controllers/quizController');
const flashController = require('../controllers/flashController');
const aiController = require('../controllers/aiController');
const archiveController = require('../controllers/archiveController');

/**
 * --- HELPER: SAFE ROUTE MOUNTING ---
 */
const safeMount = (method, path, handler, name) => {
    if (typeof handler === 'function') {
        router[method](path, handler);
    } else {
        console.error(`⚠️  SYSTEM WARNING: Route [${method.toUpperCase()} ${path}] failed. Controller function "${name}" is undefined.`);
    }
};

// --- 1. System & Sync Operations ---
safeMount('post', '/sync/all', syncController?.syncAll, 'syncController.syncAll');

// --- 2. Dashboard Analytics & Search ---
safeMount('get', '/stats', courseController?.getGlobalStats, 'courseController.getGlobalStats');
safeMount('get', '/search', courseController?.globalSearch, 'courseController.globalSearch');
// Fix: Ensure this matches the registry fetch in api.js
safeMount('get', '/stats/full-history', quizController?.getFullHistory, 'quizController.getFullHistory');

// --- 3. Gemini AI Content Generation ---
safeMount('post', '/ai/generate-quiz', aiController?.generateQuiz, 'aiController.generateQuiz');
safeMount('post', '/ai/generate-flashcards', aiController?.generateFlashcards, 'aiController.generateFlashcards');

// --- 4. Course Management ---
safeMount('get', '/courses', courseController?.getAllCourses, 'courseController.getAllCourses');
safeMount('get', '/courses/:slug', courseController?.getCourseBySlug, 'courseController.getCourseBySlug');
safeMount('put', '/courses/:id', courseController?.updateCourse, 'courseController.updateCourse');
safeMount('delete', '/courses/:id', courseController?.deleteCourse, 'courseController.deleteCourse');
safeMount('post', '/courses', courseController?.addCourse, 'courseController.addCourse');

// --- 5. Quiz Engine ---
// Save full quiz payload
safeMount('post', '/quizzes/save', quizController?.saveFullQuiz, 'quizController.saveFullQuiz');

// NEW: Create Individual Segment (Resolves the 404 error for new questions)
safeMount('post', '/quizzes/:quizId/questions', quizController?.addQuestion, 'quizController.addQuestion');

// Update Existing Segment (Inline edits)
safeMount('put', '/quizzes/questions/:id', quizController?.updateQuestion, 'quizController.updateQuestion');

// Asset & History Management
safeMount('get', '/quizzes/:uid', quizController?.getQuizByUid, 'quizController.getQuizByUid');
safeMount('delete', '/quizzes/:id', quizController?.deleteQuiz, 'quizController.deleteQuiz');
safeMount('post', '/quizzes/save-result', quizController?.saveResult, 'quizController.saveResult');
safeMount('get', '/quizzes/:id/history', quizController?.getQuizHistory, 'quizController.getQuizHistory');

// --- 6. Flashcard & Spaced Repetition Engine ---
safeMount('get', '/flashcards/:uid', flashController?.getFlashcardSetByUid, 'flashController.getFlashcardSetByUid');
safeMount('post', '/flashcards/:setId/save-card', flashController?.addOrUpdateCard, 'flashController.addOrUpdateCard');
safeMount('delete', '/flashcards/:setId/cards/:cardId', flashController?.deleteCard, 'flashController.deleteCard');
safeMount('post', '/flashcards/mastery', flashController?.updateMastery, 'flashController.updateMastery');
safeMount('delete', '/flashcard-sets/:id', flashController?.deleteFlashcardSet, 'flashController.deleteFlashcardSet');

// --- 7. Archive Vault (Recycle Bin) ---
safeMount('get', '/archive', archiveController?.getDeletedItems, 'archiveController.getDeletedItems');
safeMount('post', '/archive/restore', archiveController?.restoreItem, 'archiveController.restoreItem');
safeMount('delete', '/archive/permanent', archiveController?.permanentlyDelete, 'archiveController.permanentlyDelete');

module.exports = router;