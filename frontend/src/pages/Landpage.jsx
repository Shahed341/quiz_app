import React, { useState, useEffect } from 'react';
import { Search, Clock, BookOpen, ChevronRight, Sparkles, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Landpage.css';

function Landpage({ onSelectQuiz, onOpenFlashcards }) {
  const [quizzes, setQuizzes] = useState([]);
  const [flashcardSets, setFlashcardSets] = useState([]); // New state for flashcards
  const [searchTerm, setSearchTerm] = useState("");
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Quizzes and Flashcards in parallel
    const fetchData = async () => {
      try {
        const [quizRes, flashRes] = await Promise.all([
          fetch('http://localhost:5000/api/quizzes'),
          fetch('http://localhost:5000/api/flashcards')
        ]);

        const quizData = await quizRes.json();
        const flashData = await flashRes.json();

        setQuizzes(Array.isArray(quizData) ? quizData : []);
        setFlashcardSets(Array.isArray(flashData) ? flashData : []);
        setLoading(false);
      } catch (err) {
        console.error("API Error:", err);
        setLoading(false);
      }
    };

    fetchData();

    const history = JSON.parse(localStorage.getItem('quiz_history')) || [];
    setRecentAttempts(history);
  }, []);

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="landpage">
      <section className="search-section">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          Discover & Conquer
        </motion.h1>
        <div className="search-bar-container">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Search quizzes or topics..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <div className="main-content">
        <aside className="sidebar">
          {/* Action Box for Flashcards */}
          <div className="action-box">
             <div className="section-header">
              <GraduationCap size={18} />
              <h2>Learning Mode</h2>
            </div>
            <button className="flashcard-nav-btn" onClick={onOpenFlashcards}>
              <span>Study Flashcards</span>
              <ChevronRight size={16} />
            </button>
            <p className="action-desc">
              {flashcardSets.length} sets available for active recall.
            </p>
          </div>

          {/* Recent Activity */}
          <div className="recent-box">
            <div className="section-header">
              <Clock size={18} />
              <h2>Recent Activity</h2>
            </div>
            <div className="recent-list">
              {recentAttempts.length > 0 ? (
                recentAttempts.map((item, i) => (
                  <div key={i} className="recent-item">
                    <div>
                      <p className="attempt-title">{item.title}</p>
                      <p className="attempt-date">{item.date}</p>
                    </div>
                    <div className={`score-badge ${item.score >= 80 ? 'high' : 'mid'}`}>
                      {item.score}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-msg">No recent attempts yet.</p>
              )}
            </div>
          </div>
        </aside>

        <main className="quiz-discovery">
          <div className="section-header">
            <BookOpen size={18} />
            <h2>Available Quizzes</h2>
          </div>
          
          {loading ? (
            <div className="loading-shimmer">Loading Quizzes...</div>
          ) : (
            <div className="discover-grid">
              {filteredQuizzes.length > 0 ? (
                <>
                  {filteredQuizzes.map((quiz) => (
                    <motion.div 
                      key={quiz.id}
                      whileHover={{ x: 10, backgroundColor: "#fdfdfd" }}
                      className="discover-card"
                      onClick={() => onSelectQuiz(quiz.id)}
                    >
                      <div className="card-info">
                        <h3>{quiz.title}</h3>
                        <p>{quiz.description}</p>
                      </div>
                      <div className="card-action">
                        <span className="action-text">Start Quiz</span>
                        <ChevronRight className="arrow" />
                      </div>
                    </motion.div>
                  ))}

                  <motion.button 
                    className="explore-more-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <Sparkles size={18} />
                    <span>Back to Top</span>
                  </motion.button>
                </>
              ) : (
                <div className="no-results">
                  <p>No quizzes found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Landpage;