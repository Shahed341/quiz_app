import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, GraduationCap } from 'lucide-react';
import '../styles/Flashcards.css';

function Flashcards({ onBack }) {
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/flashcards')
      .then(res => res.json())
      .then(data => {
        setSets(data);
        setLoading(false);
      });
  }, []);

  const loadSet = (id) => {
    fetch(`http://localhost:5000/api/flashcards/${id}`)
      .then(res => res.json())
      .then(data => {
        setSelectedSet(data);
        setCurrentIndex(0);
        setIsFlipped(false);
      });
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % selectedSet.cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + selectedSet.cards.length) % selectedSet.cards.length);
    }, 150);
  };

  if (loading) return <div className="loading">Loading Flashcards...</div>;

  // Render Selection View
  if (!selectedSet) {
    return (
      <div className="flashcard-container">
        <header className="section-header">
          <GraduationCap size={32} color="#6366f1" />
          <h1>Flashcard Library</h1>
          <p>Select a set to start active recall training</p>
        </header>

        <div className="sets-grid">
          {sets.map(set => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={set.id} 
              className="set-card" 
              onClick={() => loadSet(set.id)}
            >
              <span className="set-category">{set.category}</span>
              <h3>{set.title}</h3>
              <p>{set.description}</p>
              <div className="set-footer">
                <span>Click to Study</span>
                <ChevronRight size={18} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Render Study View
  const currentCard = selectedSet.cards[currentIndex];

  return (
    <div className="study-view">
      <div className="study-header">
        <button className="btn-back" onClick={() => setSelectedSet(null)}>
          <ChevronLeft size={20} /> Back to Library
        </button>
        <div className="study-progress">
          Card {currentIndex + 1} of {selectedSet.cards.length}
        </div>
      </div>

      <div className="card-scene" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div 
          className="flashcard-inner"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front of Card */}
          <div className="card-face card-front">
            <div className="card-label">FRONT</div>
            <h2>{currentCard.front_text}</h2>
            {currentCard.hint && (
              <div className="card-hint">
                <Lightbulb size={16} /> Tip: Click to reveal answer
              </div>
            )}
          </div>

          {/* Back of Card */}
          <div className="card-face card-back" style={{ transform: "rotateY(180deg)" }}>
            <div className="card-label">BACK</div>
            <h2>{currentCard.back_text}</h2>
            {currentCard.hint && <p className="hint-detail">💡 {currentCard.hint}</p>}
          </div>
        </motion.div>
      </div>

      <div className="study-controls">
        <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
          <ChevronLeft />
        </button>
        <button className="flip-btn" onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}>
          <RotateCcw size={20} /> Flip Card
        </button>
        <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

export default Flashcards;