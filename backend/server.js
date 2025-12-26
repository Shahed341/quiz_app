const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

// Routes
const quizRoute = require('./routes/quizRoute');
const flashcardRoute = require('./routes/flashcardRoute');
const courseRoute = require('./routes/courseRoute'); // NEW: Added for dashboard

// Controller for unified seeding
const courseController = require('./controllers/courseController');

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
app.use('/api/courses', courseRoute); // NEW: Dashboard pulls courses from here

const PORT = process.env.PORT || 5000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- STARTUP LOOP ---
const startServer = async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ DB Connected');

    let tableNames = [];
    for (let i = 0; i < 15; i++) {
      const [rows] = await db.query('SHOW TABLES');
      tableNames = rows.map((t) => Object.values(t)[0]);

      if (tableNames.includes('flashcard_sets') && tableNames.includes('quizzes')) {
        break;
      }
      console.log('⏳ Schema not ready — retrying (Step 2)...');
      await wait(2000);
    }

    if (!tableNames.includes('flashcard_sets') || !tableNames.includes('quizzes')) {
      throw new Error('Database schema did not load in time');
    }

    console.log('⚙️ Schema ready — syncing recursive Courses folder...');

    // --- UNIFIED AUTO SEED ---
    // This replaces separate quiz/flashcard seeders with the recursive folder scanner
    if (courseController && typeof courseController.syncAllContent === 'function') {
      await courseController.syncAllContent(db);
      console.log('📚 All Courses, Quizzes, and Flashcards synced ✔');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    console.log('🔄 Retrying in 5 seconds...');
    await wait(5000);
    startServer();
  }
};

startServer();