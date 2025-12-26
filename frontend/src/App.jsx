import React, { useState } from 'react';
import Landpage from './pages/Landpage';
import CourseView from './pages/CourseView';
import QuizPage from './pages/QuizPage';
import Flashcards from './pages/Flashcards';

function App() {
  const [view, setView] = useState('landpage');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // When a Course card (e.g. CMPT-215) is clicked
  const handleCourseSelect = (courseName) => {
    setSelectedCourse(courseName);
    setView('course-view');
  };

  const handleStartQuiz = (id) => {
    setSelectedId(id);
    setView('quiz');
  };

  const handleStartFlashcards = (id) => {
    setSelectedId(id);
    setView('flashcards');
  };

  const goHome = () => {
    setView('landpage');
    setSelectedCourse(null);
  };

  return (
    <div className="app-main">
      {view === 'landpage' && (
        <Landpage onSelectCourse={handleCourseSelect} />
      )}

      {view === 'course-view' && (
        <CourseView 
          courseName={selectedCourse} 
          onBack={goHome} 
          onSelectQuiz={handleStartQuiz}
          onSelectFlashcards={handleStartFlashcards}
        />
      )}

      {view === 'quiz' && (
        <QuizPage quizId={selectedId} onBack={() => setView('course-view')} />
      )}

      {view === 'flashcards' && (
        <Flashcards setId={selectedId} onBack={() => setView('course-view')} />
      )}
    </div>
  );
}

export default App;