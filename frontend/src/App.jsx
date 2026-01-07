import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavFooter from './pages/NavFooter';
import Landpage from './pages/Landpage';
import CourseView from './pages/CourseView';
import QuizPage from './pages/QuizPage';
import Flashcards from './pages/Flashcards';
import QuizHistory from './components/QuizHistory'; // Corrected import

function App() {
  return (
    <Router>
      <NavFooter>
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<Landpage />} />
          <Route path="/courses/:courseId" element={<CourseView />} />
          
          {/* Active Learning Routes */}
          <Route path="/:courseId/quiz/:quizId" element={<QuizPage />} />
          <Route path="/:courseId/flashcards/:setId" element={<Flashcards />} />

          {/* History Routes */}
          {/* This matches the navigate(`/quiz-history/${quizId}`) in your QuizPage */}
          <Route path="/quiz-history/:quizId" element={<QuizHistory />} />
          
          {/* If you want course context in history URL use this instead: */}
          {/* <Route path="/:courseId/quiz/:quizId/history" element={<QuizHistory />} /> */}
        </Routes>
      </NavFooter>
    </Router>
  );
}

export default App;