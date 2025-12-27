import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Lightbulb, Trophy } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/QuizPage.css';

function QuizPage() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [curr, setCurr] = useState(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/quizzes/${quizId}`)
      .then((res) => res.json())
      .then((data) => setQuiz(data))
      .catch((err) => console.error("Error loading quiz:", err));
  }, [quizId]);

  // FIXED: Save result to MySQL instead of localStorage
  const saveResultToDatabase = async (finalScore) => {
    const percentage = Math.round((finalScore / quiz.questions.length) * 100);
    
    try {
      await fetch('http://localhost:5000/api/quizzes/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizId,
          score: percentage
        }),
      });
      console.log("✅ Score synced to database");
    } catch (err) {
      console.error("❌ Failed to sync score:", err);
    }
  };

  if (!quiz) return <div className="loading-stage">Initializing Assessment...</div>;

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
      saveResultToDatabase(currentScore); // Trigger DB save
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="quiz-page-container">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="result-card-matte"
        >
          <Trophy size={80} className="trophy-icon" />
          <h2 className="result-title">Quiz Complete!</h2>
          <p className="result-subtitle">Excellent progress in {courseId?.replace(/-/g, ' ').toUpperCase()}</p>
          
          <div className="score-display">
            <span className="score-big">{Math.round((score / quiz.questions.length) * 100)}%</span>
            <p className="score-fraction">{score} correct out of {quiz.questions.length}</p>
          </div>

          <div className="percentage-bar-container">
            <motion.div 
              className="percentage-bar-fill" 
              initial={{ width: 0 }}
              animate={{ width: `${(score / quiz.questions.length) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <button className="btn-return-home" onClick={() => navigate(`/courses/${courseId}`)}>
            Return to Course
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="quiz-page-container">
      <header className="quiz-header-minimal">
        <button className="back-link-matte" onClick={() => navigate(`/courses/${courseId}`)}>
          <ChevronLeft size={18} /> <span>EXIT QUIZ</span>
        </button>
        <div className="quiz-identity">
          <span className="quiz-breadcrumb">{courseId?.replace(/-/g, ' ').toUpperCase()}</span>
          <h1 className="quiz-title-main">{quiz.title}</h1>
        </div>
        <div className="quiz-stats-box">
          {curr + 1} / {quiz.questions.length}
        </div>
      </header>

      <div className="quiz-progress-track">
        <motion.div 
          className="quiz-progress-fill"
          animate={{ width: `${((curr + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <main className="question-stage">
        <AnimatePresence mode="wait">
          <motion.div 
            key={curr} 
            initial={{ x: 30, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: -30, opacity: 0 }}
            className="question-card-matte"
          >
            <h2 className="question-text">{q.question_text}</h2>
            
            <div className="options-grid">
              {['A', 'B', 'C', 'D'].map(key => (
                <button 
                  key={key} 
                  onClick={() => handleAnswer(key)} 
                  className="quiz-option-btn"
                >
                  <span className="option-index">{key}</span>
                  <span className="option-val">{q[`option_${key.toLowerCase()}`]}</span>
                </button>
              ))}
            </div>

            <footer className="question-footer">
              <button 
                className={`hint-toggle ${showHint ? 'active' : ''}`} 
                onClick={() => setShowHint(!showHint)}
              >
                <Lightbulb size={16} /> {showHint ? "Hide Support" : "Request Hint"}
              </button>
              
              <AnimatePresence>
                {showHint && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hint-bubble"
                  >
                    {q.hint}
                  </motion.div>
                )}
              </AnimatePresence>
            </footer>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default QuizPage;