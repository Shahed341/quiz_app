const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const quizRoute = require('./routes/quizRoute');
const quizController = require('./controllers/quizController'); // Import controller for seeding

const app = express();
app.use(cors());
app.use(express.json());

// Create Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

const db = pool.promise();
app.set('db', db);

// Use Routes
app.use('/api/quizzes', quizRoute);

const PORT = process.env.PORT || 5000;

// Initialize Database and Seed
const startServer = async () => {
    try {
        // Test connection
        await db.query('SELECT 1');
        console.log('✅ Connected to MySQL database.');

        // Auto-Seed logic
        if (quizController.autoSeed) {
            await quizController.autoSeed(db);
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Database connection/seeding failed:', err.message);
        process.exit(1); // Exit if DB is not ready
    }
};

startServer();