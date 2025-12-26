import React, { useState } from 'react';
import Landpage from './pages/Landpage';
import QuizPage from './pages/QuizPage';

function App() {
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  // Router Logic
  return (
    <div className="app-main">
      {selectedQuizId ? (
        <QuizPage 
          quizId={selectedQuizId} 
          onBack={() => setSelectedQuizId(null)} 
        />
      ) : (
        <Landpage 
          onSelectQuiz={(id) => setSelectedQuizId(id)} 
        />
      )}
    </div>
  );
}

export default App;