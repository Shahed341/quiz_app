const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

// Route Imports
const quizRoute = require('./routes/quizRoute');
const flashcardRoute = require('./routes/flashcardRoute');

// Controller Imports
const quizController = require('./controllers/quizController');
const flashcardController = require('./controllers/flashcardController');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE POOL SETUP
// Using a pool is more efficient for multiple concurrent users
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Convert the pool to use Promises so we can use async/await
const db = pool.promise();
app.set('db', db);

// 2. ROUTE MOUNTING
app.use('/api/quizzes', quizRoute);
app.use('/api/flashcards', flashcardRoute);

const PORT = process.env.PORT || 5000;

/**
 * START SERVER LOGIC
 * Handles the connection sequence: DB Connection -> Table Check -> Seeding -> Port Listening
 */
const startServer = async () => {
    try {
        // DEBUG: Verify the backend can actually reach the 'db' container
        await db.query('SELECT 1');
        console.log('✅ [DEBUG] Step 1: Physical connection to MySQL container established.');

        // 3. TABLE VERIFICATION (The "Docker Race Condition" Fix)
        // When Docker starts, the DB container might be up, but the init.sql 
        // script might still be running. We check if our tables exist before seeding.
        const [tables] = await db.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        // Check specifically for the flashcard table from the new schema
        if (!tableNames.includes('flashcard_sets')) {
            console.log('⏳ [DEBUG] Step 2: MySQL is up, but schema (init.sql) isn\'t finished.');
            console.log('   -> Retrying in 2 seconds...');
            
            // Return to stop current execution; setTimeout calls this function again
            return setTimeout(startServer, 2000); 
        }

        console.log('⚙️ [DEBUG] Step 3: Schema detected. Starting dynamic file sync...');
        
        // 4. DYNAMIC SEEDING
        // Scans the /questions/ directory and its subfolders for .json files
        // and syncs them to the database if they don't already exist.
        if (quizController.autoSeed) {
            await quizController.autoSeed(db);
            console.log('   -> Quiz seeder process finished.');
        }
        
        if (flashcardController.autoSeed) {
            await flashcardController.autoSeed(db);
            console.log('   -> Flashcard seeder process finished.');
        }

        // 5. OPEN PORT
        app.listen(PORT, () => {
            console.log(`🚀 [DEBUG] Step 4: Success! Server listening on port ${PORT}`);
        });

    } catch (err) {
        // DEBUG: This usually triggers if the 'db' container hasn't started at all
        console.error('❌ [DEBUG] CRITICAL: DB connection failed or refused:', err.message);
        console.log('   -> Container likely booting. Retrying in 5 seconds...');
        
        // Wait 5 seconds and try the whole startup process again
        setTimeout(startServer, 5000); 
    }
};

// Start the sequence
startServer();