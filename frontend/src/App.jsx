import React, { useState, useEffect } from 'react';
import QuizPage from './pages/QuizPage';
import './styles/Quizpage.css';

function App() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/quizzes')
      .then(res => res.json())
      .then(data => setQuizzes(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  if (selectedQuizId) {
    return <QuizPage quizId={selectedQuizId} onBack={() => setSelectedQuizId(null)} />;
  }

  return (
    <div className="container">
      <header className="hero">
        <h1>Select a Quiz</h1>
        <p>Challenge yourself with our community quizzes</p>
      </header>
      
      <div className="quiz-grid">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="card" onClick={() => setSelectedQuizId(quiz.id)}>
            <h3>{quiz.title}</h3>
            <p>{quiz.description}</p>
            <div className="card-footer">
              <span>{quiz.created_at ? new Date(quiz.created_at).toLocaleDateString() : ''}</span>
              <button className="btn-primary">Start</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;