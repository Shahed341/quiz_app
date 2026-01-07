import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Award, Clock, RotateCcw } from 'lucide-react';
import '../styles/QuizHistory.css'; // Ensure you create this CSS file

function QuizHistory() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/quizzes/history/${quizId}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading history:", err);
        setLoading(false);
      });
  }, [quizId]);

  return (
    <div className="history-page-container">
      <header className="history-header">
        <button className="back-link-matte" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} /> <span>BACK TO QUIZ</span>
        </button>
        <h1 className="history-title">Attempt History</h1>
        <p className="history-subtitle">Tracking progress for Quiz ID: {quizId}</p>
      </header>

      <main className="history-list-container">
        {loading ? (
          <div className="loading-state">Fetching records...</div>
        ) : history.length > 0 ? (
          <div className="history-grid">
            {history.map((attempt, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="history-card-matte"
              >
                <div className="card-top">
                  <div className="score-badge">
                    <Award size={20} />
                    <span className="score-val">{attempt.score}%</span>
                  </div>
                  <div className="attempt-number">Attempt #{history.length - index}</div>
                </div>

                <div className="card-footer">
                  <div className="timestamp">
                    <Calendar size={14} />
                    <span>{new Date(attempt.completed_at).toLocaleDateString()}</span>
                  </div>
                  <div className="timestamp">
                    <Clock size={14} />
                    <span>{new Date(attempt.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-history">
            <div className="empty-icon-box">
               <Award size={48} />
            </div>
            <h3>No attempts yet</h3>
            <p>Complete the quiz to see your scores here.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default QuizHistory;