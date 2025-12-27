import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Flashcards.css';

function Flashcards() {
  const { courseId, setId } = useParams();
  const navigate = useNavigate();
  
  const [selectedSet, setSelectedSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the specific set based on the URL setId
    fetch(`http://localhost:5000/api/flashcards/${setId}`)
      .then(res => res.json())
      .then(data => {
        setSelectedSet(data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching flashcards:", err));
  }, [setId]);

  const handleNext = (e) => {
    e?.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % selectedSet.cards.length);
    }, 150);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + selectedSet.cards.length) % selectedSet.cards.length);
    }, 150);
  };

  if (loading) return <div className="loading-stage">Synchronizing Recall Sets...</div>;
  if (!selectedSet || !selectedSet.cards) return <div className="loading-stage">Set not found.</div>;

  const currentCard = selectedSet.cards[currentIndex];

  return (
    <div className="flashcard-study-page">
      {/* HEADER */}
      <header className="study-header-top">
        <button className="back-link-matte" onClick={() => navigate(`/courses/${courseId}`)}>
          <ChevronLeft size={18} /> <span>BACK TO {courseId?.replace(/-/g, ' ').toUpperCase()}</span>
        </button>
        <div className="study-set-info">
          <span className="set-title-label">{selectedSet.title}</span>
          <span className="progress-counter">CARD {currentIndex + 1} / {selectedSet.cards.length}</span>
        </div>
      </header>

      {/* CENTER STAGE: THE CARD */}
      <main className="card-stage">
        <div className="card-scene" onClick={() => setIsFlipped(!isFlipped)}>
          <motion.div 
            className="flashcard-inner"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* FRONT */}
            <div className="card-face card-front">
              <span className="face-tag">QUESTION</span>
              <h2 className="card-text">{currentCard.front_text}</h2>
              <div className="card-hint-area">
                <Lightbulb size={16} className="hint-icon" />
                <span>Click to flip</span>
              </div>
            </div>

            {/* BACK */}
            <div className="card-face card-back">
              <span className="face-tag">ANSWER</span>
              <h2 className="card-text blue-glow-text">{currentCard.back_text}</h2>
              {currentCard.hint && <p className="hint-detail">💡 {currentCard.hint}</p>}
            </div>
          </motion.div>
        </div>
      </main>

      {/* CONTROLS */}
      <footer className="study-controls-area">
        <button className="nav-circle-btn" onClick={handlePrev}>
          <ChevronLeft size={24} />
        </button>
        
        <button className="main-flip-btn" onClick={() => setIsFlipped(!isFlipped)}>
          <RotateCcw size={20} /> REVEAL ANSWER
        </button>

        <button className="nav-circle-btn" onClick={handleNext}>
          <ChevronRight size={24} />
        </button>
      </footer>
    </div>
  );
}

export default Flashcards;