import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Lightbulb, Trophy } from 'lucide-react';

function QuizPage({ quizId, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [curr, setCurr] = useState(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(false);

  // Fetch the specific quiz and its 20 questions from the DB
  useEffect(() => {
    fetch(`http://localhost:5000/api/quizzes/${quizId}`)
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data);
      })
      .catch((err) => console.error("Error loading quiz questions:", err));
  }, [quizId]);

  // Helper to save result to LocalStorage for the Landpage sidebar
  const saveResult = (finalScore) => {
    const history = JSON.parse(localStorage.getItem('quiz_history')) || [];
    const percentage = Math.round((finalScore / quiz.questions.length) * 100);
    
    const newEntry = {
      title: quiz.title,
      score: percentage,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Keep only the most recent 5 attempts
    const updatedHistory = [newEntry, ...history].slice(0, 5);
    localStorage.setItem('quiz_history', JSON.stringify(updatedHistory));
  };

  if (!quiz) return <div className="loading">Preparing Questions...</div>;

  const q = quiz.questions[curr];

  const handleAnswer = (ans) => {
    let currentScore = score;
    if (ans === q.correct_answer) {
      currentScore = score + 1;
      setScore(currentScore);
    }

    if (curr + 1 < quiz.questions.length) {
      setCurr(curr + 1);
      setShowHint(false);
    } else {
      saveResult(currentScore); // Save to history when finished
      setDone(true);
    }
  };

  if (done) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="result-view"
      >
        <Trophy size={80} color="#6366f1" strokeWidth={1.5} />
        <h2>Quiz Complete!</h2>
        <p className="final-score">
          You scored <strong>{score}</strong> out of <strong>{quiz.questions.length}</strong>
        </p>
        <div className="percentage-circle">
          {Math.round((score / quiz.questions.length) * 100)}%
        </div>
        <button className="btn-primary" onClick={onBack}>Return to Dashboard</button>
      </motion.div>
    );
  }

  return (
    <div className="quiz-view">
      <div className="quiz-header">
        <button className="btn-back" onClick={onBack}>
          <ChevronLeft size={20} /> Exit Quiz
        </button>
        <div className="quiz-title-small">{quiz.title}</div>
      </div>
      
      <div className="progress-container">
        <div className="progress-text">Question {curr + 1} of {quiz.questions.length}</div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((curr + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={curr} 
          initial={{ x: 20, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="q-card"
        >
          <h2 className="question-text">{q.question_text}</h2>
          
          <div className="options">
            {['A', 'B', 'C', 'D'].map(key => (
              <button 
                key={key} 
                onClick={() => handleAnswer(key)} 
                className="option-btn"
              >
                <div className="option-label">{key}</div>
                <div className="option-text">{q[`option_${key.toLowerCase()}`]}</div>
              </button>
            ))}
          </div>

          <div className="hint-container">
            <button 
              className={`btn-hint ${showHint ? 'active' : ''}`} 
              onClick={() => setShowHint(!showHint)}
            >
              <Lightbulb size={18} /> {showHint ? "Hide Hint" : "Need a hint?"}
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.p 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="hint-text"
                >
                  💡 {q.hint}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default QuizPage;