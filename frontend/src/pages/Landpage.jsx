import React, { useState, useEffect } from 'react';
import { Search, Clock, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Landpage.css';

function Landpage({ onSelectQuiz }) {
  const [quizzes, setQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Quizzes from API
    fetch('http://localhost:5000/api/quizzes')
      .then(res => res.json())
      .then(data => {
        setQuizzes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => console.error("API Error:", err));

    // 2. Load History from LocalStorage
    const history = JSON.parse(localStorage.getItem('quiz_history')) || [];
    setRecentAttempts(history);
  }, []);

  // Filter logic for search
  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="landpage">
      {/* Hero Section */}
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
            placeholder="Search by topic (e.g., C Programming, MySQL...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <div className="main-content">
        {/* Sidebar: Recent Activity */}
        <aside className="recent-box">
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
        </aside>

        {/* Main: Quiz Discovery */}
        <main className="quiz-discovery">
          {/* Featured Header */}
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

                  {/* Explore More Button at the end of results */}
                  <motion.button 
                    className="explore-more-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <Sparkles size={18} />
                    <span>Back to Top to Search More</span>
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