import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavFooter from './pages/NavFooter';
import Landpage from './pages/Landpage';
import CourseView from './pages/CourseView';
import QuizPage from './pages/QuizPage';
import Flashcards from './pages/Flashcards'; // Import your Flashcards component

function App() {
  return (
    <Router>
      <NavFooter>
        <Routes>
          <Route path="/" element={<Landpage />} />
          <Route path="/courses/:courseId" element={<CourseView />} />
          
          {/* Quiz Route: 5173/cmpt-215/quiz/123 */}
          <Route path="/:courseId/quiz/:quizId" element={<QuizPage />} />
          
          {/* Flashcard Route: 5173/cmpt-215/flashcards/456 */}
          <Route path="/:courseId/flashcards/:setId" element={<Flashcards />} />
        </Routes>
      </NavFooter>
    </Router>
  );
}

export default App;