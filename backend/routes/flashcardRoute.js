const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcardController');

/**
 * [DEBUG] ROUTE: GET /api/flashcards
 * Purpose: Fetches all available flashcard sets for the library view.
 */
router.get('/', flashcardController.getAllSets);

/**
 * [DEBUG] ROUTE: GET /api/flashcards/:id
 * Purpose: Fetches a specific set and all its associated cards.
 */
router.get('/:id', flashcardController.getCardsBySetId);

/**
 * [DEBUG] ROUTE: POST /api/flashcards/sync
 * Purpose: Manually triggers the folder scanner to look for new .json files
 * without needing to restart the entire Docker container.
 */
router.post('/sync', async (req, res) => {
    console.log('📡 [DEBUG] Manual flashcard sync requested via API.');
    try {
        const db = req.app.get('db');
        
        // Ensure the seeder exists before calling
        if (flashcardController.autoSeed) {
            await flashcardController.autoSeed(db);
            res.json({ 
                success: true, 
                message: "Flashcard sync completed. Check server logs for details." 
            });
        } else {
            throw new Error("Flashcard seeder function not found in controller.");
        }
    } catch (error) {
        console.error('❌ [DEBUG] Manual sync failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: "Sync failed", 
            details: error.message 
        });
    }
});

module.exports = router;