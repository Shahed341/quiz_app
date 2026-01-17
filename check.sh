#!/bin/bash

# Configuration
CONTAINER_NAME="quiz-backend"
SEARCH_TERM="SYSTEM WARNING"

echo "🔍 Auditing Scholar System Route Integrity..."
echo "------------------------------------------------------------"

# Fetch logs and filter for the safeMount error messages
# 2>&1 ensures we catch errors even if they are sent to stderr
LOG_ERRORS=$(docker logs $CONTAINER_NAME 2>&1 | grep "$SEARCH_TERM")

if [ -z "$LOG_ERRORS" ]; then
    echo "✅ SUCCESS: All routes materialized. No undefined controllers found."
else
    echo "❌ CRITICAL: Undefined Controller Functions Detected!"
    echo "------------------------------------------------------------"
    # Sort and Uniq prevents duplicate logs from multiple server restarts
    echo "$LOG_ERRORS" | sed 's/.*SYSTEM WARNING/⚠️ SYSTEM WARNING/' | sort | uniq
    echo "------------------------------------------------------------"
    echo "💡 Fix: Check exports in quizController.js or aiController.js"
fi