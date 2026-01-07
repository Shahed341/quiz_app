const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Route Imports
const quizRoute = require('./routes/quizRoute');
const flashcardRoute = require('./routes/flashcardRoute');
const courseRoute = require('./routes/courseRoute');

// Controller Import for Seeding
const quizController = require('./controllers/quizController');

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE POOL ---
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const db = pool.promise();
app.set('db', db);

// --- ROUTES ---
app.use('/api/quizzes', quizRoute);
app.use('/api/flashcards', flashcardRoute);
app.use('/api/courses', courseRoute);

const PORT = process.env.PORT || 5000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- STARTUP & SEEDING LOGIC ---
const startServer = async () => {
  try {
    // 1. Check DB Connectivity
    await db.query('SELECT 1');
    console.log('✅ MySQL Database Connected');

    // 2. Wait for Schema Initialization
    // This loop ensures tables exist (via your init.sql) before the seeder runs
    let schemaReady = false;
    for (let i = 0; i < 15; i++) {
      const [rows] = await db.query('SHOW TABLES');
      const tableNames = rows.map((t) => Object.values(t)[0]);

      if (tableNames.includes('quizzes') && tableNames.includes('flashcard_sets')) {
        schemaReady = true;
        break;
      }
      console.log(`⏳ Schema not found (Attempt ${i + 1}/15) — Waiting...`);
      await wait(2000);
    }

    if (!schemaReady) {
      throw new Error('Database schema initialization timed out.');
    }

    // 3. Run Two-Way Sync Seeder
    // Scans /usr/src/Courses and syncs filesystem to DB
    console.log('⚙️ Starting Two-Way Content Sync...');
    await quizController.autoSeed(db);
    console.log('📚 Sync Complete: Quizzes and Flashcards are up to date.');

    // 4. Start Listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    console.log('🔄 Retrying server start in 5 seconds...');
    await wait(5000);
    startServer();
  }
};

startServer();