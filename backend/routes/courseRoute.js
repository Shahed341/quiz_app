const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// This is what Landpage.jsx will fetch to show the course cards
router.get('/', courseController.getCourseList);

// Optional: Manual sync trigger
router.post('/sync', async (req, res) => {
    const db = req.app.get('db');
    await courseController.syncAllContent(db);
    res.json({ message: "Recursive sync completed" });
});

module.exports = router;