import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Lightbulb, Trophy } from 'lucide-react';

function QuizPage({ quizId, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [curr, setCurr] = useState(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/quizzes/${quizId}`)
      .then(res => res.json())
      .then(data => setQuiz(data));
  }, [quizId]);

  if (!quiz) return <div className="loading">Loading...</div>;

  const q = quiz.questions[curr];

  const handleAnswer = (ans) => {
    if (ans === q.correct_answer) setScore(score + 1);
    if (curr + 1 < quiz.questions.length) {
      setCurr(curr + 1);
      setShowHint(false);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="result-view">
        <Trophy size={64} color="#6366f1" />
        <h2>Quiz Complete!</h2>
        <p>You scored <strong>{score}</strong> out of <strong>{quiz.questions.length}</strong></p>
        <button className="btn-primary" onClick={onBack}>Try Another Quiz</button>
      </div>
    );
  }

  return (
    <div className="quiz-view">
      <button className="btn-back" onClick={onBack}><ChevronLeft /> Back</button>
      
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((curr + 1) / quiz.questions.length) * 100}%` }}></div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={curr} 
          initial={{ x: 50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          className="q-card"
        >
          <h2>{q.question_text}</h2>
          <div className="options">
            {['A', 'B', 'C', 'D'].map(key => (
              <button key={key} onClick={() => handleAnswer(key)} className="option-btn">
                <span className="label">{key}</span> {q[`option_${key.toLowerCase()}`]}
              </button>
            ))}
          </div>

          <div className="hint-box">
            <button className="btn-hint" onClick={() => setShowHint(!showHint)}>
              <Lightbulb size={18} /> {showHint ? "Hide Hint" : "Get Hint"}
            </button>
            {showHint && <p className="hint-text">{q.hint}</p>}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default QuizPage;