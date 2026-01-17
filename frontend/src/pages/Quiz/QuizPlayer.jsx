import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, RotateCcw, Home, Loader2, Trophy, 
  Sparkles, BookOpen, HelpCircle, ChevronLeft, AlertTriangle,
  Edit3, Save, X, Plus 
} from 'lucide-react';
import { 
  getQuiz, 
  request, 
  updateIndividualQuestion, 
  createIndividualQuestion 
} from '../../utils/api';

export default function QuizPlayer({ onComplete }) {
  const { uid } = useParams();
  const navigate = useNavigate();
  const railRef = useRef(null);
  
  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); 
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    getQuiz(uid)
      .then(data => { if (data) setQuiz(data); })
      .catch(err => console.error("🔴 Sync Failed:", err))
      .finally(() => setLoading(false));
  }, [uid]);

  // Auto-scroll the rail
  useEffect(() => {
    if (railRef.current) {
      const activeElement = railRef.current.children[currentIdx + 1]; 
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentIdx, quiz?.questions?.length]);

  // Sync editData
  useEffect(() => {
    if (quiz && quiz.questions[currentIdx]) {
      setEditData({ ...quiz.questions[currentIdx] });
    }
  }, [currentIdx, isEditing, quiz]);

  const handleAddNewQuestion = () => {
    const newQuestion = {
      id: `temp-${Date.now()}`,
      question_text: "",
      options: { A: "", B: "", C: "", D: "" },
      correct_answer: "A",
      explanation: "",
      is_ai_generated: 0
    };

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    // Focus and edit immediately
    setTimeout(() => {
      setCurrentIdx(quiz.questions.length);
      setIsEditing(true);
    }, 100);
  };

  const handleQuickUpdate = async () => {
    try {
      let materializedQuestion;
      if (String(editData.id).startsWith('temp-')) {
        const response = await createIndividualQuestion(quiz.id, editData);
        materializedQuestion = { ...editData, id: response.newId };
      } else {
        await updateIndividualQuestion(editData.id, editData);
        materializedQuestion = editData;
      }
      
      const updatedQuestions = [...quiz.questions];
      updatedQuestions[currentIdx] = materializedQuestion;
      setQuiz({ ...quiz, questions: updatedQuestions });
      setIsEditing(false);
      window.dispatchEvent(new Event('refreshData'));
    } catch (err) {
      alert("🔴 Materialization Failure: Ensure backend routes are active.");
    }
  };

  const handleSelect = (option) => {
    if (isSubmitted || isEditing) return; 
    setUserAnswers(prev => ({ ...prev, [currentIdx]: option }));
    if (currentIdx < quiz.questions.length - 1) {
      setTimeout(() => {
        setCurrentIdx(prev => prev + 1);
        setShowHint(false);
      }, 400); 
    }
  };

  const handleFinalSubmit = async () => {
    const allAnswered = Object.keys(userAnswers).length === quiz.questions.length;
    if (!allAnswered && !showWarning) {
      setShowWarning(true);
      return;
    }
    const totalQuestions = quiz.questions.length;
    const correctCount = quiz.questions.reduce((acc, q, idx) => 
      acc + (userAnswers[idx] === q.correct_answer ? 1 : 0), 0);
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    try {
      await request('/quizzes/save-result', {
        method: 'POST',
        body: JSON.stringify({ quizId: quiz.id, score: percentage, totalItems: totalQuestions })
      });
      window.dispatchEvent(new Event('refreshData'));
      if (onComplete) onComplete();
      setIsSubmitted(true);
    } catch (err) { setIsSubmitted(true); }
  };

  if (loading) return <div style={fullPageCenter}><Loader2 className="spin" color="var(--accent-blue)" size={44} /></div>;

  if (isSubmitted) {
    const correctCount = quiz.questions.reduce((acc, q, idx) => acc + (userAnswers[idx] === q.correct_answer ? 1 : 0), 0);
    const percentage = Math.round((correctCount / quiz.questions.length) * 100);
    return (
      <div style={fullPageCenter} className="fade-in">
        <div style={resultCardStyle(percentage >= 60)}>
          <Trophy size={80} color="var(--accent-orange)" />
          <h1 style={scoreDisplay}>{percentage}%</h1>
          <h2 style={resultTitle}>{correctCount} / {quiz.questions.length} Correct</h2>
          <div style={resultActionGrid}>
            <button onClick={() => window.location.reload()} style={glassCapsuleBtn('var(--accent-blue)')}><RotateCcw size={18}/> Retry</button>
            <button onClick={() => navigate(`/course/${quiz.course_slug}`)} style={secondaryBtnStyle}><BookOpen size={18}/> Course</button>
            <button onClick={() => navigate('/')} style={secondaryBtnStyle}><Home size={18}/> Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentIdx];
  const isLastQuestion = currentIdx === quiz.questions.length - 1;

  return (
    <div style={layoutWrapper} className="fade-in">
      
      <div style={railContainer}>
         <div style={numberLineRail} ref={railRef} className="no-scrollbar">
            <div style={lineVertical} />
            {quiz.questions.map((_, idx) => (
              <div key={idx} style={numberWrapper}>
                <button
                  disabled={isEditing && idx !== currentIdx} // Disable other buttons during edit
                  onClick={() => { setCurrentIdx(idx); setShowHint(false); }}
                  style={lineDotStyle(idx === currentIdx, !!userAnswers[idx])}
                >
                  {idx + 1}
                </button>
                {idx === currentIdx && <div style={activePointer} />}
              </div>
            ))}

            {/* CONDITIONAL RENDER: Plus icon shows ONLY during Edit Mode */}
            {isEditing && (
              <button 
                onClick={handleAddNewQuestion} 
                style={addQuestionRailBtn} 
                className="fade-in"
                title="Add Segment"
              >
                <Plus size={20} />
              </button>
            )}
         </div>
      </div>

      <div style={mainContainer}>
        <div style={headerRow}>
          <div style={{flex: 1}}>
            <span style={titleTag}>{quiz.title}</span>
            <div style={stepCounter}>Module Segment {currentIdx + 1}</div>
          </div>
          <button 
            onClick={() => {
                setIsEditing(!isEditing);
                setShowHint(false);
            }} 
            style={editIconBtn(isEditing)}
          >
            {isEditing ? <X size={20}/> : <Edit3 size={20} />}
          </button>
        </div>

        <div style={mainIsland} className="glass-island">
          {isEditing ? (
            <div className="fade-in">
              <textarea 
                style={editTextArea}
                placeholder="Enter question text..."
                value={editData?.question_text || ''}
                onChange={(e) => setEditData({...editData, question_text: e.target.value})}
              />
              <div style={optionsGridStyle}>
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt} style={editOptionRow}>
                    <div style={optLabelStyle(editData?.correct_answer === opt)}>{opt}</div>
                    <input 
                      style={editInput}
                      placeholder={`Option ${opt}`}
                      value={editData?.options?.[opt] || ''}
                      onChange={(e) => setEditData({
                        ...editData, 
                        options: {...editData.options, [opt]: e.target.value}
                      })}
                    />
                    <button 
                      onClick={() => setEditData({...editData, correct_answer: opt})}
                      style={correctSelectBtn(editData?.correct_answer === opt)}
                    >
                      Answer
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleQuickUpdate} style={saveBtnStyle}>
                <Save size={18} /> Update Segment
              </button>
            </div>
          ) : (
            <>
              <h2 style={questionTextStyle}>
                {q?.question_text}
                {q?.is_ai_generated === 1 && <Sparkles size={24} color="var(--accent-orange)" style={{marginLeft: '15px'}}/>}
              </h2>
              {showHint && <div style={hintBox} className="fade-in"><strong>SCHEMA HINT:</strong> {q?.explanation}</div>}
              <div style={optionsGridStyle}>
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    style={optionBtnStyle(userAnswers[currentIdx] === opt)}
                  >
                    <div style={optLabelStyle(userAnswers[currentIdx] === opt)}>{opt}</div>
                    <span style={{flex: 1}}>{q?.options?.[opt]}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={footerStyle}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button 
                  disabled={currentIdx === 0 || isEditing} 
                  onClick={() => setCurrentIdx(i => i - 1)} 
                  style={{...secondaryBtnStyle, opacity: (currentIdx === 0 || isEditing) ? 0.3 : 1, padding: '14px 18px'}}
                >
                  <ChevronLeft size={20}/>
                </button>
                {q?.explanation && !isEditing && (
                  <button onClick={() => setShowHint(!showHint)} style={hintActionBtn(showHint)}>
                    <HelpCircle size={20} /> {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {!isLastQuestion ? (
                  <button 
                    disabled={isEditing}
                    onClick={() => setCurrentIdx(i => i + 1)} 
                    style={{...glassCapsuleBtn('var(--accent-blue)'), opacity: isEditing ? 0.5 : 1}}
                  >
                    Next <ChevronRight size={20}/>
                  </button>
                ) : (
                  <>
                    {showWarning && (
                      <div style={warningPill} className="fade-in">
                        <AlertTriangle size={16} /> Incomplete
                      </div>
                    )}
                    <button 
                      disabled={isEditing}
                      onClick={handleFinalSubmit} 
                      style={{...submitBtnStyle, opacity: isEditing ? 0.5 : 1}}
                    >
                      {showWarning ? "Still Submit" : "Finalize Results"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const layoutWrapper = { display: 'flex', gap: '40px', maxWidth: '1200px', margin: '0 auto', padding: '1rem', height: 'calc(100vh - 140px)', overflow: 'hidden' };
const railContainer = { height: '100%', padding: '20px 0', display: 'flex', flexDirection: 'column' };
const numberLineRail = { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', padding: '0 30px', minWidth: '100px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', flex: 1 };
const lineVertical = { position: 'absolute', top: 0, bottom: 0, width: '2px', background: 'var(--border)', zIndex: 0, opacity: 0.3 };
const numberWrapper = { position: 'relative', margin: '12px 0', zIndex: 1 };
const lineDotStyle = (active, answered) => ({ width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', border: '2px solid', fontWeight: '900', transition: 'all 0.3s ease', background: active ? 'var(--accent-blue)' : 'var(--bg-glass)', borderColor: active ? 'var(--accent-blue)' : answered ? 'var(--accent-green)' : 'var(--border)', color: active ? 'white' : answered ? 'var(--accent-green)' : 'var(--text-soft)', fontSize: '0.85rem' });
const activePointer = { position: 'absolute', right: '-15px', top: '50%', transform: 'translateY(-50%)', width: '0', height: '0', borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid var(--accent-blue)' };
const mainContainer = { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const fullPageCenter = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh' };
const mainIsland = { background: 'var(--bg-glass)', padding: '2.5rem 3.5rem', borderRadius: '40px', border: '1px solid var(--border)', backdropFilter: 'blur(20px) saturate(180%)', maxHeight: '100%', overflowY: 'auto' };
const headerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' };
const titleTag = { fontSize: '0.7rem', fontWeight: '900', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '4px' };
const stepCounter = { fontSize: '2rem', fontWeight: '900', color: 'var(--text-bold)', marginTop: '5px', letterSpacing: '-1.5px' };
const questionTextStyle = { color: 'var(--text-bold)', fontSize: '1.8rem', fontWeight: '900', lineHeight: '1.3', marginBottom: '2.5rem' };
const optionsGridStyle = { display: 'grid', gap: '12px' };
const optionBtnStyle = (active) => ({ width: '100%', padding: '1.2rem 2rem', borderRadius: '20px', border: '2px solid', textAlign: 'left', background: active ? 'rgba(59, 130, 246, 0.08)' : 'transparent', borderColor: active ? 'var(--accent-blue)' : 'var(--border)', color: 'var(--text-bold)', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', transition: 'all 0.2s ease' });
const optLabelStyle = (active) => ({ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', background: active ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: active ? 'white' : 'var(--text-bold)', border: '1px solid var(--border)', fontSize: '0.8rem' });
const footerStyle = { marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' };
const glassCapsuleBtn = (color) => ({ padding: '14px 32px', background: 'var(--bg-main)', color: color || 'var(--text-bold)', border: `1px solid ${color}66`, borderRadius: '50px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' });
const secondaryBtnStyle = { background: 'transparent', border: '1px solid var(--border)', borderRadius: '50px', color: 'var(--text-soft)', fontWeight: '800', cursor: 'pointer' };
const submitBtnStyle = { ...secondaryBtnStyle, background: 'var(--accent-green)', color: 'white', border: 'none', padding: '14px 32px', fontWeight: '900' };
const warningPill = { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '8px 16px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' };
const editIconBtn = (active) => ({ background: active ? 'var(--accent-blue)' : 'var(--bg-glass)', border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`, color: active ? 'white' : 'var(--text-soft)', padding: '10px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' });
const hintActionBtn = (active) => ({ background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`, color: active ? 'var(--accent-blue)' : 'var(--text-soft)', padding: '10px 20px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '0.8rem' });
const hintBox = { padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)', color: 'var(--text-bold)', marginBottom: '2rem', fontSize: '0.95rem' };
const resultCardStyle = (passed) => ({ background: 'var(--bg-glass)', padding: '5rem 4rem', borderRadius: '50px', border: `2px solid ${passed ? 'var(--accent-green)' : 'var(--accent-red)'}`, textAlign: 'center', maxWidth: '600px', width: '100%', backdropFilter: 'blur(20px)' });
const scoreDisplay = { fontSize: '7rem', fontWeight: '900', color: 'var(--text-bold)', letterSpacing: '-5px', margin: '0' };
const resultTitle = { color: 'var(--text-soft)', fontSize: '1.8rem', marginBottom: '3rem', fontWeight: '700' };
const resultActionGrid = { display: 'flex', gap: '20px', justifyContent: 'center' };
const editTextArea = { width: '100%', background: 'rgba(0,0,0,0.1)', color: 'var(--text-bold)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.5rem', fontSize: '1.4rem', fontWeight: '700', minHeight: '100px', marginBottom: '1.5rem', outline: 'none' };
const editInput = { flex: 1, background: 'rgba(0,0,0,0.1)', color: 'var(--text-bold)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 15px', fontSize: '1rem', fontWeight: '600', outline: 'none' };
const editOptionRow = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' };
const correctSelectBtn = (active) => ({ padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: active ? 'var(--accent-green)' : 'var(--border)', color: active ? 'black' : 'var(--text-soft)', fontWeight: '800', fontSize: '0.75rem' });
const saveBtnStyle = { marginTop: '1.5rem', width: '100%', padding: '14px', background: 'var(--accent-blue)', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '900', cursor: 'pointer' };
const addQuestionRailBtn = { width: '38px', height: '38px', borderRadius: '50%', border: '2px dashed var(--border)', background: 'transparent', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '20px', zIndex: 2 };