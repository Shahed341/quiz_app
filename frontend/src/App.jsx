import React, { useState } from 'react';
import NavFooter from './pages/NavFooter';
import Landpage from './pages/Landpage';
import CourseView from './pages/CourseView';
import QuizPage from './pages/QuizPage';
import Flashcards from './pages/Flashcards';

function App() {
  const [view, setView] = useState('dashboard'); // dashboard, course, quiz, flashcards
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <NavFooter>
      {/* The content inside NavFooter is the "children" prop */}
      {view === 'dashboard' && (
        <Landpage onSelectCourse={(name) => {
          setSelectedCourse(name);
          setView('course');
        }} />
      )}

      {view === 'course' && (
        <CourseView 
          courseName={selectedCourse} 
          onBack={() => setView('dashboard')}
          onSelectQuiz={(id) => { setSelectedId(id); setView('quiz'); }}
          onSelectFlashcards={(id) => { setSelectedId(id); setView('flashcards'); }}
        />
      )}

      {view === 'quiz' && (
        <QuizPage 
          quizId={selectedId} 
          onBack={() => setView('course')} 
        />
      )}

      {view === 'flashcards' && (
        <Flashcards 
          setId={selectedId} 
          onBack={() => setView('course')} 
        />
      )}
    </NavFooter>
  );
}

export default App;