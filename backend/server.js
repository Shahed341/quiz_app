const express = require('express');
const cors = require('cors');
const chokidar = require('chokidar');
const path = require('path');
const apiRoutes = require('./routes/api');
const pool = require('./utils/db');
const migrate = require('./utils/migrate'); 
const syncController = require('./controllers/syncController');

const app = express();

// 1. Middleware
app.use(cors());
app.use(express.json());

// API Request Logger
app.use((req, res, next) => {
    console.log(`[API] 📥 ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
    next();
});

// 2. Routes
app.use('/api', apiRoutes);

const startServer = async () => {
    // Determine path for Docker (/usr/src/app/Courses) or Local Windows
    const watchPath = process.env.COURSE_DATA_PATH || path.join(__dirname, 'Courses');
    
    console.log("\n" + "╔" + "═".repeat(50) + "╗");
    console.log(`║   🌌  SCHOLAR SYSTEM: INITIALIZING VOID...       ║`);
    console.log("╚" + "═".repeat(50) + "╝");

    try {
        // STEP 1: Test MySQL Connection
        console.log(`[DB] 🛰️  Targeting MySQL Database...`);
        await pool.query('SELECT 1');
        console.log(`[DB] ✅ Core Connection Established.`);

        // STEP 2: RUN MIGRATIONS
        // This fixes the "Unknown column is_ai_generated" error automatically
        await migrate(); 

        // STEP 3: Initial Startup Sync
        // Auto-loads CMPT/CHEM/STAT folders into the fixed schema
        console.log(`[SYNC] 🔄 Crawling Scholar Drive: ${watchPath}`);
        await syncController.syncAll(); 
        console.log(`[SYNC] ✅ Scholar Drive Materialized in Database.`);

        // STEP 4: Initialize File Watcher (Chokidar)
        console.log(`[WATCHER] 👀 Watching for local JSON edits...`);
        const watcher = chokidar.watch(watchPath, {
            persistent: true,
            ignoreInitial: true, 
            usePolling: true,    
            interval: 500,       
            binaryInterval: 1000,
            depth: 10,           
            awaitWriteFinish: {  
                stabilityThreshold: 1000,
                pollInterval: 200
            }
        });

        watcher.on('all', async (event, filePath) => {
            if (filePath.endsWith('.json')) {
                const relativeName = path.relative(watchPath, filePath);
                console.log(`[WATCHER] 🔔 ${event.toUpperCase()}: ${relativeName}`);
                
                if (event === 'add' || event === 'change') {
                    console.log(`[WATCHER] ⚙️  Syncing change to database...`);
                    await syncController.routeFileToProcessor(filePath);
                }
            }
        });

        watcher.on('error', error => console.error(`[WATCHER] ❌ Error: ${error}`));

        // STEP 5: Start API Server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log("\n" + "═".repeat(40));
            console.log(`🚀 VOID SERVER ONLINE`);
            console.log(`📡 URL: http://localhost:${PORT}`);
            console.log(`📂 DRIVE: ${watchPath}`);
            console.log("═".repeat(40) + "\n");
        });

    } catch (err) {
        console.error(`[CRITICAL] ❌ Void Collapse: ${err.message}`);
        console.log('♻️  Attempting restart in 5 seconds...');
        setTimeout(startServer, 5000);
    }
};

startServer();