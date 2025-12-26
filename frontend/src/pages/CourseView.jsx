import React, { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen, GraduationCap, PlayCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Landpage.css'; 
import '../styles/CourseView.css';

function CourseView({ courseName, onBack, onSelectQuiz, onSelectFlashcards }) {
  const [items, setItems] = useState({ quizzes: [], flashcards: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, fRes] = await Promise.all([
          fetch('http://localhost:5000/api/quizzes'),
          fetch('http://localhost:5000/api/flashcards')
        ]);
        const quizzes = await qRes.json();
        const flashcards = await fRes.json();

        // Filter data based on the course name (e.g., "CMPT-215")
        setItems({
          quizzes: quizzes.filter(q => q.category === courseName),
          flashcards: flashcards.filter(f => f.category === courseName)
        });
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [courseName]);

  return (
    <div className="dashboard-wrapper">
      {/* Header Section */}
      <header className="dash-header">
        <div className="header-content-wide">
          <button className="back-btn" onClick={onBack}>
            <ChevronLeft size={20} /> <span>Courses</span>
          </button>
          
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="course-title-display"
          >
            {courseName}
          </motion.h2>

          <div style={{ width: '120px' }} className="hide-mobile" /> 
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dash-content">
        <div className="content-inner">
          
          {/* Quizzes Section */}
          <section className="view-section">
            <div className="section-label">
              <BookOpen size={18} color="var(--accent-red)" />
              <span>Available Quizzes</span>
              <div className="label-line" />
            </div>

            <div className="course-grid">
              {items.quizzes.length > 0 ? (
                items.quizzes.map((quiz) => (
                  <motion.div 
                    key={quiz.id} 
                    className="glass-card quiz-card" 
                    whileHover={{ y: -5 }}
                    onClick={() => onSelectQuiz(quiz.id)}
                  >
                    <div className="card-accent" style={{ background: 'var(--accent-red)' }} />
                    <div className="card-body">
                      <span className="course-tag">QUIZ</span>
                      <h3>{quiz.title}</h3>
                      <p className="card-desc">{quiz.description}</p>
                      <div className="card-footer">
                        <span className="action-link">
                          <PlayCircle size={16} /> Start Attempt
                        </span>
                        <ArrowRight size={16} className="arrow-icon" />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : !loading && <div className="empty-placeholder">No quizzes found for this module.</div>}
            </div>
          </section>

          {/* Flashcards Section */}
          <section className="view-section">
            <div className="section-label">
              <GraduationCap size={18} color="var(--accent-green)" />
              <span>Active Recall Sets</span>
              <div className="label-line" />
            </div>

            <div className="course-grid">
              {items.flashcards.length > 0 ? (
                items.flashcards.map((set) => (
                  <motion.div 
                    key={set.id} 
                    className="glass-card flash-card"
                    whileHover={{ y: -5 }}
                    onClick={() => onSelectFlashcards(set.id)}
                  >
                    <div className="card-accent" style={{ background: 'var(--accent-green)' }} />
                    <div className="card-body">
                      <span className="course-tag">STUDY SET</span>
                      <h3>{set.title}</h3>
                      <p className="card-desc">{set.description}</p>
                      <div className="card-footer">
                        <span className="action-link">
                          <GraduationCap size={16} /> Flashcards
                        </span>
                        <ArrowRight size={16} className="arrow-icon" />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : !loading && <div className="empty-placeholder">No flashcards assigned to this module yet.</div>}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default CourseView;