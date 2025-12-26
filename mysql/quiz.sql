-- 1. Create the Database
CREATE DATABASE IF NOT EXISTS quiz_db;
USE quiz_db;

-- 2. Quizzes Table (FIXED: Added category column)
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- Added this to match the dashboard logic
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT,
    question_text TEXT,
    option_a TEXT, 
    option_b TEXT, 
    option_c TEXT, 
    option_d TEXT,
    correct_answer CHAR(1),
    hint TEXT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- 4. Flashcard Sets Table
CREATE TABLE IF NOT EXISTS flashcard_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
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