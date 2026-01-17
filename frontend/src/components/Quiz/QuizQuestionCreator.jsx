import React, { useState } from 'react';
import { CheckCircle2, Loader2, Save, FilePlus, AlertCircle } from 'lucide-react';
import { request } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function QuizQuestionCreator({ 
    mode = 'edit', 
    courseId, 
    slug, 
    quizId, 
    quizTitle, 
    existingQuestions = [], 
    onSuccess 
}) {
  const navigate = useNavigate();
  
  // Form States
  const [title, setTitle] = useState(quizTitle || '');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const submitQuestion = async () => {
    // Validation Logic
    if (mode === 'new' && !title.trim()) {
        alert("⚠️ Identify the Module: Title Required.");
        return;
    }
    if (!question.trim() || options.some(opt => !opt.trim())) {
      alert("⚠️ Question integrity compromised: Fill all fields.");
      return;
    }

    setIsSubmitting(true);
    const answerMap = ['A', 'B', 'C', 'D'];

    // Construct the new knowledge segment
    const newQuestion = {
      uid: `manual-${Date.now()}`,
      question_text: question,
      options: {
        A: options[0],
        B: options[1],
        C: options[2],
        D: options[3]
      },
      correct_answer: answerMap[correctIndex],
      explanation: explanation,
      is_ai_generated: false
    };

    try {
      /**
       * Backend Materialization Hub:
       * POST /api/quizzes/save handles both physical I: Drive writes
       * and MySQL database registry synchronization.
       */
      await request('/quizzes/save', {
        method: 'POST',
        body: JSON.stringify({
          quizId: mode === 'edit' ? quizId : null, 
          courseId: courseId,
          slug: slug,
          title: mode === 'new' ? title : quizTitle,
          // Append if editing, otherwise start a new array
          questions: mode === 'edit' ? [...existingQuestions, newQuestion] : [newQuestion]
        })
      });

      // Clear internal form state
      setQuestion('');
      setOptions(['', '', '', '']);
      setExplanation('');
      setCorrectIndex(0);
      
      // Notify Global OS to refresh analytics and lists
      window.dispatchEvent(new Event('refreshData'));

      if (onSuccess) onSuccess();
      
      // If materializing a brand new file, return to the course directory
      if (mode === 'new') {
          navigate(`/course/${slug}`);
      }
      
    } catch (err) {
      console.error("🔴 Drive Write Failure:", err);
      alert("🔴 Void Sync Error: Could not reach I: Scholar Drive.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* 1. STATUS HEADER */}
      <div style={headerWrapper}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={mode === 'new' ? newPulse : activePulse} />
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                {mode === 'new' ? 'Initialize New Topic' : 'Append Segment'}
            </h3>
        </div>
        <div style={badgeStyle}>
            <AlertCircle size={12} />
            <span>I: DRIVE SYNC ACTIVE</span>
        </div>
      </div>
      
      {/* 2. MODULE TITLE (Materialization only) */}
      {mode === 'new' && (
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={labelHint}>Module Directory Title</p>
            <input 
                style={titleInputStyle}
                placeholder="e.g. Advanced Thermodynamics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
          </div>
      )}

      {/* 3. CORE QUESTION */}
      <p style={labelHint}>Question Segment</p>
      <textarea 
        style={largeInput}
        placeholder="Materialize question content..."
        value={question}
        rows={3}
        onChange={(e) => setQuestion(e.target.value)}
      />

      {/* 4. ANSWER VECTOR GRID */}
      <p style={labelHint}>Options (Select Correct Vector)</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {options.map((opt, idx) => (
          <div key={idx} style={optionWrapper(correctIndex === idx)}>
            <button 
              onClick={() => setCorrectIndex(idx)}
              style={checkButtonStyle(correctIndex === idx)}
              title="Set as Correct Answer"
            >
              <CheckCircle2 size={22} />
            </button>
            <input 
              style={optionInputStyle(correctIndex === idx)}
              placeholder={`Vector ${['A', 'B', 'C', 'D'][idx]}`}
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* 5. KNOWLEDGE BASE EXPLANATION */}
      <p style={{ ...labelHint, marginTop: '2.5rem' }}>Knowledge Context (Explanation)</p>
      <input 
        style={smallInput}
        placeholder="Why is this vector correct?"
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
      />

      {/* 6. DRIVE COMMITMENT */}
      <button 
        onClick={submitQuestion}
        disabled={isSubmitting}
        style={{
          ...submitButtonStyle,
          background: mode === 'new' ? 'var(--accent-blue)' : 'var(--accent-green)',
        }}
      >
        {isSubmitting ? (
          <Loader2 size={18} className="spin" />
        ) : mode === 'new' ? (
          <FilePlus size={20} />
        ) : (
          <Save size={20} />
        )}
        {isSubmitting ? 'Syncing I: Drive...' : mode === 'new' ? 'Materialize Module' : 'Commit Changes'}
      </button>
    </div>
  );
}

// --- Styles ---

const containerStyle = {
  background: 'var(--bg-card)',
  padding: '3rem',
  borderRadius: '32px',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-premium)'
};

const headerWrapper = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2.5rem'
};

const titleInputStyle = {
    width: '100%',
    padding: '18px',
    background: 'rgba(52, 152, 219, 0.05)',
    border: '1px solid var(--accent-blue)',
    borderRadius: '16px',
    color: 'white',
    fontSize: '1.25rem',
    fontWeight: '800',
    outline: 'none',
    transition: '0.3s'
};

const badgeStyle = {
  fontSize: '0.6rem',
  fontWeight: '900',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 14px',
  borderRadius: '100px',
  background: 'rgba(255, 255, 255, 0.03)',
  color: 'var(--text-soft)',
  border: '1px solid var(--border)',
  letterSpacing: '1.5px',
  textTransform: 'uppercase'
};

const activePulse = { width: '10px', height: '10px', background: 'var(--accent-green)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-green)' };
const newPulse = { width: '10px', height: '10px', background: 'var(--accent-blue)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-blue)' };

const labelHint = { fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-soft)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '2px' };

const largeInput = {
  width: '100%',
  padding: '1.5rem',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  color: 'white',
  fontSize: '1.15rem',
  outline: 'none',
  marginBottom: '2.5rem',
  resize: 'none',
  fontFamily: 'inherit',
  lineHeight: '1.6',
  transition: 'border-color 0.3s'
};

const optionWrapper = (active) => ({ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px',
    background: active ? 'rgba(46, 204, 113, 0.03)' : 'transparent',
    borderRadius: '20px',
    transition: '0.3s all'
});

const optionInputStyle = (active) => ({
  flex: 1,
  padding: '16px 20px',
  background: active ? 'rgba(46, 204, 113, 0.05)' : 'rgba(0,0,0,0.2)',
  border: active ? '1px solid var(--accent-green)' : '1px solid var(--border)',
  borderRadius: '18px',
  color: active ? 'white' : 'var(--text-soft)',
  fontSize: '1rem',
  outline: 'none',
  transition: '0.3s'
});

const checkButtonStyle = (active) => ({
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: active ? 'var(--accent-green)' : 'var(--text-soft)',
  opacity: active ? 1 : 0.2,
  transition: '0.3s'
});

const smallInput = {
  width: '100%',
  padding: '16px 20px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border)',
  borderRadius: '18px',
  color: 'var(--text-soft)',
  fontSize: '1rem',
  outline: 'none',
  transition: '0.3s'
};

const submitButtonStyle = {
  marginTop: '3rem',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '20px',
  color: 'white',
  border: 'none',
  borderRadius: '22px',
  fontWeight: '900',
  fontSize: '1.1rem',
  cursor: 'pointer',
  transition: '0.3s transform',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
};