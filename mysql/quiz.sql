-- 1. Setup
CREATE DATABASE IF NOT EXISTS quiz_db;
USE quiz_db;

-- 2. Quizzes Table
-- Added 'file_path' to uniquely identify the source file for Two-Way Sync
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    file_path VARCHAR(512) UNIQUE, -- Used to track if the physical file still exists
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL, 
    option_b TEXT NOT NULL, 
    option_c TEXT NOT NULL, 
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL,
    hint TEXT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- 4. Flashcard Sets Table
CREATE TABLE IF NOT EXISTS flashcard_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    file_path VARCHAR(512) UNIQUE, -- Used to track if the physical file still exists
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Flashcards Table
CREATE TABLE IF NOT EXISTS flashcards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    set_id INT NOT NULL,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    hint TEXT,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
);

-- 6. Quiz Results (History)
CREATE TABLE IF NOT EXISTS quiz_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    score INT NOT NULL, -- Percentage (0-100)
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- 7. Flashcard Results (History)
-- Tracks when a user completes a flashcard session
CREATE TABLE IF NOT EXISTS flashcard_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    set_id INT NOT NULL,
    score INT DEFAULT 100, -- Can be used to track progress
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
);

-- 8. Performance Indexes
CREATE INDEX idx_quiz_cat ON quizzes(category);
CREATE INDEX idx_flash_cat ON flashcard_sets(category);