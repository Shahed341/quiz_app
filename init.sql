-- --------------------------------------------------
-- DATABASE INITIALIZATION
-- --------------------------------------------------
CREATE DATABASE IF NOT EXISTS quiz_app;
USE quiz_app;

-- --------------------------------------------------
-- 1. COURSES: High-level academic categories
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, 
    slug VARCHAR(120) UNIQUE NOT NULL, 
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'Book', 
    color_code VARCHAR(7) DEFAULT '#3498db',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FULLTEXT INDEX (name, description)
) ENGINE=InnoDB;

-- --------------------------------------------------
-- 2. QUIZZES: Metadata and File System Mapping
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    uid VARCHAR(255) UNIQUE NOT NULL, 
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE, 
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FULLTEXT INDEX (title)
) ENGINE=InnoDB;

-- --------------------------------------------------
-- 3. QUESTIONS: Cached for Search (Synced with JSON)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    uid VARCHAR(255) UNIQUE,           
    question_text TEXT NOT NULL,
    options JSON DEFAULT NULL,         
    correct_answer TEXT NOT NULL,      
    explanation TEXT,
    order_index INT DEFAULT 0,         
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE, -- ADDED: For soft-deletion logic
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FULLTEXT INDEX (question_text)
) ENGINE=InnoDB;

-- --------------------------------------------------
-- 4. FLASHCARD SETS: Collections of cards
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS flashcard_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    uid VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- ADDED: For drive sync tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FULLTEXT INDEX (title)
) ENGINE=InnoDB;

-- --------------------------------------------------
-- 5. FLASHCARDS: Spaced Repetition Items
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS flashcards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    set_id INT NOT NULL,
    uid VARCHAR(255) UNIQUE,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    hint TEXT,
    mastery_level INT DEFAULT 0, 
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE, -- FIXED: Added missing column to prevent Controller 500 errors
    last_review TIMESTAMP NULL DEFAULT NULL,
    next_review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE,
    FULLTEXT INDEX (front_text, back_text)
) ENGINE=InnoDB;

-- --------------------------------------------------
-- 6. LEARNING HISTORY: Real-time Analytics
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type ENUM('quiz', 'flashcard') NOT NULL,
    content_id INT NOT NULL, -- References either quizzes(id) or flashcard_sets(id)
    score DECIMAL(5,2), 
    total_items INT, 
    streak_count INT DEFAULT 1, 
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- --------------------------------------------------
-- 7. TAGS: For categorization and search
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS content_tags (
    tag_id INT NOT NULL,
    target_type ENUM('quiz', 'flashcard', 'question') NOT NULL,
    target_id INT NOT NULL,
    PRIMARY KEY (tag_id, target_type, target_id),
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;