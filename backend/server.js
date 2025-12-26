// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

// Routes
const quizRoute = require('./routes/quizRoute');
const flashcardRoute = require('./routes/flashcardRoute');

// Controllers (used only for auto-seeding)
const quizController = require('./controllers/quizController');
const flashcardController = require('./controllers/flashcardController');

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

const PORT = process.env.PORT || 5000;

// Utility to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- STARTUP LOOP ---
const startServer = async () => {
  try {
    // Confirm DB reachable
    await db.query('SELECT 1');
    console.log('DB connected ✔');

    // Wait for schema to become available (important in Docker)
    let tables = [];
    let tableNames = [];

    for (let i = 0; i < 15; i++) {
      const [rows] = await db.query('SHOW TABLES');
      tables = rows;
      tableNames = tables.map((t) => Object.values(t)[0]);

      // adjust this list if you add more tables
      if (tableNames.includes('flashcard_sets') && tableNames.includes('quizzes')) {
        break;
      }

      console.log('Schema not ready — retrying...');
      await wait(2000);
    }

    if (!tableNames.includes('flashcard_sets') || !tableNames.includes('quizzes')) {
      throw new Error('Database schema did not load in time');
    }

    console.log('Schema ready ✔ — syncing content');

    // --- AUTO SEED ---
    if (typeof quizController.autoSeed === 'function') {
      await quizController.autoSeed(db);
      console.log('Quizzes synced ✔');
    }

    if (typeof flashcardController.autoSeed === 'function') {
      await flashcardController.autoSeed(db);
      console.log('Flashcards synced ✔');
    }

    // --- START SERVER ---
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    console.log('Retrying in 5 seconds...');
    await wait(5000);
    startServer();
  }
};

startServer();
