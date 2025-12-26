const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const quizRoute = require('./routes/quizRoute');

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

// Make pool accessible to routes
app.set('db', pool.promise());

// Use Routes
app.use('/api/quizzes', quizRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});