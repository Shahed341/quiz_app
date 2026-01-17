const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    // FIXED: Changed DB_PASS to DB_PASSWORD to match your docker-compose.yml
    password: process.env.DB_PASSWORD || 'root', 
    database: process.env.DB_NAME || 'quiz_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Increased timeout for Docker stabilization
    connectTimeout: 15000 
});

// Adding a quick error logger to help us debug connection issues
pool.on('connection', () => {
    console.log('[DB] 🛰️  New connection established to the Void.');
});

module.exports = pool;