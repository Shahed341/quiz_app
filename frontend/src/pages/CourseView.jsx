import React, { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen, GraduationCap, PlayCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/CourseView.css';

function CourseView({ courseName, onBack, onSelectQuiz, onSelectFlashcards }) {
  const [items, setItems] = useState({ quizzes: [], flashcards: [] });
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const [showAllFlashcards, setShowAllFlashcards] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, fRes] = await Promise.all([
          fetch('http://localhost:5000/api/quizzes'),
          fetch('http://localhost:5000/api/flashcards')
        ]);
        const quizzes = await qRes.json();
        const flashcards = await fRes.json();
        setItems({
          quizzes: quizzes.filter(q => q.category === courseName),
          flashcards: flashcards.filter(f => f.category === courseName)
        });
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [courseName]);

  const visibleQuizzes = showAllQuizzes ? items.quizzes : items.quizzes.slice(0, 3);
  const visibleFlashcards = showAllFlashcards ? items.flashcards : items.flashcards.slice(0, 3);

  return (
    <motion.div className="course-page-flat" layout>
      {/* HEADER: Pushed to the top */}
      <header className="course-header-top">
        <div className="header-left">
          <button className="back-link-matte" onClick={onBack}>
            <ChevronLeft size={18} /> <span>BACK</span>
          </button>
          <h2 className="course-title-flat">{courseName}</h2>
        </div>
        <div className="header-right-stats">
          {items.quizzes.length + items.flashcards.length} MODULES AVAILABLE
        </div>
      </header>

      {/* FLAT SCROLLABLE AREA */}
      <main className="course-content-flat">
        
        {/* Quizzes Section */}
        <motion.section className="flat-section" layout>
          <div className="flat-section-header">
            <div className="label-group">
              <BookOpen size={18} className="icon-white-glow" />
              <span className="enrolled-label">RECENT QUIZZES</span>
            </div>
            {items.quizzes.length > 3 && (
              <button className="arrow-btn-right" onClick={() => setShowAllQuizzes(!showAllQuizzes)}>
                {showAllQuizzes ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
              </button>
            )}
          </div>

          <motion.div className="grid-layout-flat" layout>
            <AnimatePresence>
              {visibleQuizzes.map((quiz) => (
                <motion.div 
                  key={quiz.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="course-card-dark" 
                  onClick={() => onSelectQuiz(quiz.id)}
                >
                  <div className="card-inner">
                    <span className="module-tag">EXAM</span>
                    <h3 className="course-name-dynamic red-glow">{quiz.title}</h3>
                    <p className="card-mini-desc">{quiz.description}</p>
                  </div>
                  <div className="card-footer-action">
                    <span className="enter-text">Start</span>
                    <PlayCircle size={16} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.section>

        {/* Flashcards Section */}
        <motion.section className="flat-section" layout>
          <div className="flat-section-header">
            <div className="label-group">
              <GraduationCap size={18} className="icon-white-glow" />
              <span className="enrolled-label">STUDY SETS</span>
            </div>
            {items.flashcards.length > 3 && (
              <button className="arrow-btn-right" onClick={() => setShowAllFlashcards(!showAllFlashcards)}>
                {showAllFlashcards ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
              </button>
            )}
          </div>

          <motion.div className="grid-layout-flat" layout>
            <AnimatePresence>
              {visibleFlashcards.map((set) => (
                <motion.div 
                  key={set.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="course-card-dark"
                  onClick={() => onSelectFlashcards(set.id)}
                >
                  <div className="card-inner">
                    <span className="module-tag">RECALL</span>
                    <h3 className="course-name-dynamic blue-glow">{set.title}</h3>
                    <p className="card-mini-desc">{set.description}</p>
                  </div>
                  <div className="card-footer-action">
                    <span className="enter-text">Open</span>
                    <ArrowRight size={16} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.section>
      </main>
    </motion.div>
  );
}

export default CourseView;