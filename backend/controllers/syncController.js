const fs = require('fs');
const path = require('path');
const quizController = require('./quizController');
const flashController = require('./flashController');

// Root directory for Scholar Drive (Academic Void Core)
const rootDir = process.env.COURSE_DATA_PATH || 'I:/Winter_26/Q/Courses';

/**
 * SYNC CONTROLLER
 * The central intelligence for materializing physical JSON assets into the MySQL Void.
 */
const syncController = {
    /**
     * 1. GLOBAL SYNC ENGINE
     * Crawls the entire drive and routes files to their respective logic processors.
     */
    syncAll: async (req = null, res = null) => {
        const startTime = Date.now();
        
        console.log("\n" + "╔" + "═".repeat(65) + "╗");
        console.log(`║ 🚀 SYNC START: ${new Date().toLocaleString().padEnd(41)} ║`);
        console.log(`║ 📂 DRIVE: ${rootDir.padEnd(52)} ║`);
        console.log("╚" + "═".repeat(65) + "╝");

        try {
            if (!fs.existsSync(rootDir)) {
                throw new Error(`Scholar Drive path not discovered: ${rootDir}`);
            }

            // Phase 1: Discovery
            const files = syncController.getFilesRecursive(rootDir);
            console.log(`🔍 Discovered ${files.length} JSON assets. Validating integrity...\n`);
            
            let stats = { success: 0, error: 0, skipped: 0 };

            // Phase 2: Processing
            for (const filePath of files) {
                // If triggered via API (Manual Sync button), we force the sync regardless of file age
                const isManualTrigger = !!req; 
                const result = await syncController.routeFileToProcessor(filePath, isManualTrigger);
                
                if (result === true) stats.success++; 
                else if (result === null) stats.skipped++;
                else stats.error++;
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            
            console.log("\n" + "═".repeat(67));
            console.log(`📊 SYNC SUMMARY (${duration}s)`);
            console.log(`✅ SUCCESS: ${stats.success}`.padEnd(22) + 
                        `❌ FAILED: ${stats.error}`.padEnd(22) + 
                        `⏩ SKIPPED: ${stats.skipped}`);
            console.log("═".repeat(67) + "\n");

            if (res) return res.json({ success: true, stats, duration: `${duration}s` });

        } catch (err) {
            console.error(`\n🛑 [SYNC CRASH]: ${err.message}`);
            if (res) return res.status(500).json({ error: "Sync Engine Materialization Failure", details: err.message });
        }
    },

    /**
     * 2. RECURSIVE FILE CRAWLER
     * Traverses directories while ignoring system folders (git, node_modules).
     */
    getFilesRecursive: (dir, fileList = []) => {
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // System Exclusions
                    if (['node_modules', '.git', '.docker'].includes(item) || item.startsWith('.')) continue;
                    syncController.getFilesRecursive(fullPath, fileList);
                } else if (item.toLowerCase().endsWith('.json')) {
                    fileList.push(fullPath);
                }
            }
            return fileList;
        } catch (err) {
            console.error(`⚠️  Access Denied [${dir}]: ${err.message}`);
            return fileList;
        }
    },

    /**
     * 3. INTELLIGENT PROCESSOR ROUTER
     * Determines asset type and prevents "Race Condition" duplicates.
     */
    routeFileToProcessor: async (filePath, force = false) => {
        const fileName = path.basename(filePath).toLowerCase();
        const relativePath = path.relative(rootDir, filePath);
        
        try {
            const fileStats = fs.statSync(filePath);
            
            // Ignore empty files or those without valid content
            if (fileStats.size <= 2) return null; 

            /**
             * WRITE GUARD LOGIC:
             * If the file was written within the last 3 seconds, it was likely 
             * created by the app itself (Manual Editor or Gemini). 
             * We skip the auto-sync to avoid "Sync Loops" and primary key collisions.
             */
            const fileAgeMs = Date.now() - fileStats.mtimeMs;
            if (!force && fileAgeMs < 3000) {
                console.log(`   [SKIP]     ⏩ ${relativePath} (Recently Materialized)`);
                return true; 
            }

            // Classification logic
            let isQuiz = fileName.includes('quiz');
            let isFlash = fileName.includes('flash');

            // Deep Fallback: If filename is generic (e.g. 12345.json), inspect the schema
            if (!isQuiz && !isFlash) {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (content.questions) isQuiz = true;
                else if (content.cards) isFlash = true;
            }

            // Routing
            if (isQuiz) {
                await quizController.processQuizFile(filePath);
                console.log(`   [QUIZ]     ✅ ${relativePath}`);
                return true;
            } 
            
            if (isFlash) {
                await flashController.processFlashFile(filePath);
                console.log(`   [FLASH]    ✅ ${relativePath}`);
                return true;
            }

            return null; // File type unrecognized

        } catch (err) {
            console.error(`   [ERROR]    ❌ ${relativePath}: ${err.message}`);
            return false;
        }
    }
};

module.exports = syncController;