import React, { useState } from 'react';
import Landpage from './pages/Landpage';
import QuizPage from './pages/QuizPage';
import Flashcards from './pages/Flashcards'; // Import the new page

function App() {
  // Use 'view' to track where the user is: 'landpage', 'quiz', or 'flashcards'
  const [view, setView] = useState('landpage');
  const [selectedId, setSelectedId] = useState(null);

  // Navigation Handlers
  const openQuiz = (id) => {
    setSelectedId(id);
    setView('quiz');
  };

  const openFlashcards = () => {
    setView('flashcards');
  };

  const goHome = () => {
    setView('landpage');
    setSelectedId(null);
  };

  return (
    <div className="app-main">
      {view === 'landpage' && (
        <Landpage 
          onSelectQuiz={openQuiz} 
          onOpenFlashcards={openFlashcards} 
        />
      )}

      {view === 'quiz' && (
        <QuizPage 
          quizId={selectedId} 
          onBack={goHome} 
        />
      )}

      {view === 'flashcards' && (
        <Flashcards 
          onBack={goHome} 
        />
      )}
    </div>
  );
}

export default App;