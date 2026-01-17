import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, BookOpen, Plus, 
  Trash2, Save, HelpCircle 
} from 'lucide-react';
import { getQuiz, request } from '../../utils/api';

export default function QuizEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const courseId = searchParams.get('courseId');
  const slug = searchParams.get('slug');
  const quizUid = searchParams.get('quizUid'); 

  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(!!quizUid);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (quizUid) {
      getQuiz(quizUid)
        .then(data => {
          setQuizTitle(data.title);
          setQuestions(data.questions || []);
        })
        .catch(err => console.error("🔴 Void Retrieval Failure", err))
        .finally(() => setLoading(false));
    } else {
      addBlankQuestion(); 
    }
  }, [quizUid]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (questions.length > 1 || quizTitle !== '') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [questions, quizTitle]);

  const addBlankQuestion = () => {
    const template = {
      tempId: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question_text: "",
      options: { A: "", B: "", C: "", D: "" },
      correct_answer: "A",
      explanation: "",
      is_ai_generated: 0
    };
    setQuestions(prev => [...prev, template]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (index, field, value, optionKey = null) => {
    const updated = [...questions];
    if (optionKey) {
      updated[index].options[optionKey] = value;
    } else {
      updated[index][field] = value;
    }
    setQuestions(updated);
  };

  const handleCommitChanges = async () => {
    if (!quizTitle.trim()) return alert("Identify this module: Title Required.");
    if (questions.some(q => !q.question_text.trim())) return alert("All segments must contain question text.");
    
    setIsSaving(true);
    try {
      const payload = {
        courseId,
        slug,
        title: quizTitle,
        questions,
        quizUid: quizUid || null 
      };

      await request('/quizzes/save', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      window.dispatchEvent(new Event('refreshData'));
      navigate(-1); 
    } catch (err) {
      alert("❌ Synthesis failed. Check Scholar Drive connectivity.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div style={loaderStyle}>
      <Loader2 className="spin" size={44} color="var(--accent-blue)" />
    </div>
  );

  return (
    <div style={pageContainer} className="fade-in">
      <div style={headerNav}>
        <button onClick={() => navigate(-1)} style={backBtn}>
          <ArrowLeft size={18} /> Exit Editor
        </button>
        <button 
          onClick={handleCommitChanges} 
          disabled={isSaving} 
          style={saveBtnStyle}
        >
          {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
          {quizUid ? 'Sync to Drive' : 'Materialize JSON'}
        </button>
      </div>

      <div style={headerSection} className="glass-island">
        <div style={iconBox}><BookOpen size={24} color="var(--accent-blue)" /></div>
        <div style={{ flex: 1 }}>
          <input 
            style={titleInputStyle}
            placeholder="Module Title..."
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
          />
          <p style={subtitleStyle}>
            {quizUid ? `I:/Scholar_Drive/${slug?.toUpperCase()}/${quizUid}.json` : `New asset path: /${slug?.toUpperCase()}`}
          </p>
        </div>
      </div>

      <div style={editorList}>
        {questions.map((q, idx) => (
          <div key={q.id || q.tempId || idx} style={editorCard} className="glass-island">
            <div style={cardHeader}>
              <div style={qNumber}>Module Segment {idx + 1}</div>
              <button 
                onClick={() => removeQuestion(idx)} 
                style={deleteBtn}
                title="De-materialize segment"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <textarea 
              style={questionArea}
              placeholder="Question prompt..."
              value={q.question_text || ''}
              onChange={(e) => handleInputChange(idx, 'question_text', e.target.value)}
            />

            <div style={optionsGrid}>
              {['A', 'B', 'C', 'D'].map(label => (
                <div key={label} style={optionRow(q.correct_answer === label)}>
                  <button 
                    style={correctToggle(q.correct_answer === label)}
                    onClick={() => handleInputChange(idx, 'correct_answer', label)}
                  >
                    {label}
                  </button>
                  <input 
                    style={optionInput}
                    placeholder={`Option ${label}`}
                    value={q.options[label] || ''}
                    onChange={(e) => handleInputChange(idx, 'options', e.target.value, label)}
                  />
                </div>
              ))}
            </div>

            <div style={explanationBox}>
              <HelpCircle size={16} color="var(--accent-blue)" />
              <input 
                style={explanationInput}
                placeholder="Schema Hint / Explanation (Optional)"
                value={q.explanation || ''}
                onChange={(e) => handleInputChange(idx, 'explanation', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={addBlankQuestion} style={addBtnStyle}>
        <Plus size={20} /> Add Question Segment
      </button>
    </div>
  );
}

// --- Styles Sync'd with Void Theme ---

const pageContainer = { maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem', paddingBottom: '10rem' };
const headerNav = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' };
const backBtn = { background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' };

const headerSection = { display: 'flex', gap: '25px', alignItems: 'center', marginBottom: '4rem', background: 'var(--bg-glass)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' };
const iconBox = { width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const titleInputStyle = { background: 'transparent', border: 'none', color: 'var(--text-bold)', fontSize: '2.5rem', fontWeight: '900', outline: 'none', width: '100%', letterSpacing: '-1.5px' };
const subtitleStyle = { color: 'var(--text-soft)', margin: '10px 0 0 0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900' };

const editorList = { display: 'flex', flexDirection: 'column', gap: '30px' };
const editorCard = { background: 'var(--bg-glass)', padding: '3rem', borderRadius: '40px', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', position: 'relative' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' };
const qNumber = { fontSize: '0.75rem', fontWeight: '900', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '3px' };

const questionArea = { width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-bold)', padding: '24px', fontSize: '1.3rem', minHeight: '120px', marginBottom: '2.5rem', outline: 'none', resize: 'none', fontWeight: '700', lineHeight: '1.4' };
const optionsGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '2.5rem' };

const optionRow = (active) => ({ 
  display: 'flex', alignItems: 'center', gap: '15px', background: active ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-main)', 
  padding: '12px 18px', borderRadius: '16px', border: `2px solid ${active ? 'var(--accent-green)' : 'var(--border)'}`, transition: '0.3s all'
});

const optionInput = { background: 'transparent', border: 'none', color: 'var(--text-bold)', outline: 'none', flex: 1, fontSize: '1rem', fontWeight: '700' };

const correctToggle = (active) => ({
  width: '36px', height: '36px', borderRadius: '10px', border: 'none',
  background: active ? 'var(--accent-green)' : 'var(--border)',
  color: active ? 'white' : 'var(--text-soft)',
  fontWeight: '900', cursor: 'pointer', transition: '0.2s'
});

const explanationBox = { display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--bg-main)', padding: '18px 24px', borderRadius: '18px', border: '1px solid var(--border)' };
const explanationInput = { background: 'transparent', border: 'none', color: 'var(--text-soft)', outline: 'none', flex: 1, fontSize: '0.95rem', fontWeight: '600' };

const saveBtnStyle = { background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '50px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-premium)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' };
const deleteBtn = { background: 'rgba(239, 68, 68, 0.08)', border: 'none', color: 'var(--accent-red)', padding: '10px', borderRadius: '12px', cursor: 'pointer' };
const addBtnStyle = { width: '100%', marginTop: '4rem', padding: '2.5rem', background: 'transparent', border: '2px dashed var(--border)', borderRadius: '40px', color: 'var(--text-soft)', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.85rem' };
const loaderStyle = { height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' };