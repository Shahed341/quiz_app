import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  RefreshCcw, ChevronLeft, Loader2, 
  CheckCircle2, Keyboard, Plus, X, Save,
  ArrowRight, RotateCcw, BookOpen, HelpCircle, Info
} from 'lucide-react';
import { getFlashcards, updateMastery as apiUpdateMastery, saveFlashcard } from '../../utils/api';

export default function FlashcardPlayer() {
  const { uid } = useParams();
  const navigate = useNavigate();
  
  const [set, setSet] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false); // NEW: Hint Toggle State
  const [sessionComplete, setSessionComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCard, setNewCard] = useState({ front: '', back: '', hint: '' });

  useEffect(() => {
    getFlashcards(uid).then(data => {
        if (data.cards?.length > 0) {
          const deck = [...data.cards].sort(() => Math.random() - 0.5);
          setSet({ ...data, cards: deck });
        } else { setSet(data); }
      })
      .catch(err => console.error("🔴 Retrieval Failed:", err))
      .finally(() => setLoading(false));
  }, [uid]);

  const handleNext = useCallback(async (rating = 5) => {
    if (isAdding) return;
    try { await apiUpdateMastery(set.cards[currentIdx].id, rating); } catch (e) {}

    if (currentIdx + 1 < set.cards.length) {
      setFlipped(false); 
      setShowHint(false); // Reset hint for next card
      setTimeout(() => setCurrentIdx(prev => prev + 1), 150);
    } else {
      setSessionComplete(true);
    }
  }, [currentIdx, set, isAdding]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAdding || sessionComplete) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!flipped) setFlipped(true); 
        else handleNext(5);
      } 
      // NEW: Press 'H' to toggle hint
      if (e.key.toLowerCase() === 'h' && !flipped) {
        setShowHint(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipped, handleNext, isAdding, sessionComplete]);

  if (loading) return <div style={fullPageCenter}><Loader2 className="spin" size={44} color="var(--accent-blue)"/></div>;

  if (sessionComplete) return (
    <div style={fullPageCenter} className="fade-in">
      <CheckCircle2 size={80} color="var(--accent-green)" />
      <h1 style={completeTitle}>Session Complete</h1>
      <div style={{ display: 'flex', gap: '20px', marginTop: '2rem' }}>
        <button onClick={() => window.location.reload()} style={retryBtnStyle}><RotateCcw size={18}/> Retry Deck</button>
        <button onClick={() => navigate(`/course/${set.course_slug}`)} style={nextBtnStyle}><BookOpen size={18}/> Course Page</button>
      </div>
    </div>
  );

  const card = set?.cards?.[currentIdx];
  const progress = ((currentIdx + 1) / set.cards.length) * 100;

  return (
    <div style={pageWrapper}>
      
      {/* HEADER HUD */}
      <div style={glassHeaderStyle}>
        <button onClick={() => navigate(-1)} style={exitBtnStyle}><ChevronLeft size={18}/> Back</button>
        <div style={titleArea}>
          <span style={setTitleStyle}>{set?.title}</span>
          <div style={utilityGroup}>
            <div style={counterBadge}>{currentIdx + 1} / {set?.cards?.length}</div>
            <button onClick={() => setIsAdding(!isAdding)} style={addBtn(isAdding)}>
               {isAdding ? <X size={18}/> : <Plus size={18}/>}
            </button>
          </div>
        </div>
      </div>

      <div style={progressBg}><div style={{...progressFill, width: `${progress}%`}} /></div>

      <div style={{ perspective: '2000px', height: '420px', position: 'relative' }}>
        {isAdding ? (
            /* QUICK ADD WITH HINT SUPPORT */
            <div style={addIsland} className="fade-in">
                <h3 style={addHeader}>Quick Materialize</h3>
                <input style={addInput} placeholder="Concept" value={newCard.front} onChange={e => setNewCard({...newCard, front: e.target.value})}/>
                <textarea style={{...addInput, minHeight: '80px'}} placeholder="Definition" value={newCard.back} onChange={e => setNewCard({...newCard, back: e.target.value})}/>
                <input style={{...addInput, fontSize: '0.9rem'}} placeholder="Hint / Context (Optional)" value={newCard.hint} onChange={e => setNewCard({...newCard, hint: e.target.value})}/>
                <button onClick={async () => {
                    const res = await saveFlashcard(set.id, newCard);
                    setSet(prev => ({...prev, cards: [...prev.cards, {...newCard, id: res.newId, front_text: newCard.front, back_text: newCard.back}]}));
                    setIsAdding(false);
                    setNewCard({front:'', back:'', hint:''});
                }} style={saveBtn}>Commit to Drive</button>
            </div>
        ) : (
            <div 
              onClick={() => setFlipped(!flipped)} 
              style={{...cardContainer, transform: flipped ? 'rotateY(180deg)' : 'none'}}
            >
              {/* FRONT FACE */}
              <div style={glassCardFace}>
                <span style={tag}>Front / Concept</span>
                <h2 style={cardText}>{card?.front_text}</h2>
                
                {/* HINT BUTTON & DISPLAY */}
                {card?.hint && !flipped && (
                  <div style={hintWrapper}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }} 
                      style={hintToggleBtn(showHint)}
                    >
                      <HelpCircle size={16} /> {showHint ? "Hide Hint" : "Need a Hint?"}
                    </button>
                    {showHint && <div style={hintTextBox} className="fade-in">{card.hint}</div>}
                  </div>
                )}

                <div style={footerHint}><RefreshCcw size={14}/> Click to flip</div>
              </div>

              {/* BACK FACE */}
              <div style={{...glassCardFace, transform: 'rotateY(180deg)', border: '1px solid var(--accent-blue)'}}>
                <span style={{...tag, color: 'var(--accent-blue)'}}>Back / Definition</span>
                <p style={{...cardText, fontSize: '1.4rem', fontWeight: '500'}}>{card?.back_text}</p>
              </div>
            </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div style={actionFooter(flipped && !isAdding)}>
        <button onClick={() => setFlipped(false)} style={retryBtnStyle}>
          <RotateCcw size={20} /> Loop Card
        </button>
        <button onClick={() => handleNext(5)} style={nextBtnStyle}>
          Next Question <ArrowRight size={20} />
        </button>
      </div>

      {!isAdding && (
        <div style={shortcutHint}>
             <Keyboard size={14}/> {flipped ? "SPACE TO CONTINUE" : "SPACE TO REVEAL • 'H' FOR HINT"}
        </div>
      )}
    </div>
  );
}

// --- UPDATED STYLES ---

const hintWrapper = {
  marginTop: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  zIndex: 10
};

const hintToggleBtn = (active) => ({
  background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
  border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`,
  color: active ? 'var(--accent-blue)' : 'var(--text-soft)',
  padding: '8px 16px',
  borderRadius: '50px',
  fontSize: '0.8rem',
  fontWeight: '800',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: '0.2s all'
});

const hintTextBox = {
  background: 'var(--bg-main)',
  color: 'var(--text-bold)',
  padding: '12px 20px',
  borderRadius: '16px',
  fontSize: '0.9rem',
  border: '1px solid var(--border)',
  maxWidth: '300px',
  lineHeight: '1.4',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

const actionFooter = (visible) => ({
  marginTop: '4rem', 
  display: 'flex', 
  justifyContent: 'center', 
  gap: '20px',
  opacity: visible ? 1 : 0,
  pointerEvents: visible ? 'all' : 'none',
  transform: visible ? 'translateY(0)' : 'translateY(20px)',
  transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)'
});

// Existing supporting styles preserved
const glassHeaderStyle = { display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 24px', background: 'var(--bg-glass)', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '2.5rem', backdropFilter: 'blur(10px)' };
const titleArea = { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const utilityGroup = { display: 'flex', alignItems: 'center', gap: '12px' };
const counterBadge = { background: 'var(--bg-main)', color: 'var(--accent-blue)', padding: '6px 14px', borderRadius: '12px', fontWeight: '900', fontSize: '0.85rem', border: '1px solid var(--border)' };
const addBtn = (active) => ({ width: '38px', height: '38px', borderRadius: '12px', border: '1px solid var(--border)', background: active ? 'var(--accent-blue)' : 'var(--bg-main)', color: active ? 'white' : 'var(--text-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const setTitleStyle = { color: 'var(--text-bold)', fontWeight: '900', fontSize: '1.2rem' };
const pageWrapper = { maxWidth: '750px', margin: '0 auto', padding: '2rem 1rem' };
const fullPageCenter = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' };
const exitBtnStyle = { background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', textTransform: 'uppercase' };
const progressBg = { height: '6px', background: 'var(--border)', borderRadius: '10px', marginBottom: '3rem', overflow: 'hidden' };
const progressFill = { height: '100%', background: 'var(--accent-blue)', transition: 'width 0.4s ease' };
const cardContainer = { position: 'relative', width: '100%', height: '100%', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', transformStyle: 'preserve-3d', cursor: 'pointer' };
const glassCardFace = { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' };
const cardText = { color: 'var(--text-bold)', fontSize: '2.2rem', fontWeight: '900', margin: 0 };
const tag = { position: 'absolute', top: '30px', left: '40px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-soft)' };
const footerHint = { position: 'absolute', bottom: '30px', color: 'var(--text-mute)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', display: 'flex', gap: '8px' };
const retryBtnStyle = { padding: '15px 35px', borderRadius: '50px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-bold)', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' };
const nextBtnStyle = { padding: '15px 45px', borderRadius: '50px', border: 'none', background: 'var(--accent-blue)', color: 'white', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 15px rgba(59, 130, 246, 0.2)' };
const addIsland = { background: 'var(--bg-glass)', borderRadius: '40px', padding: '3rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '15px' };
const addHeader = { color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' };
const addInput = { background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '15px', padding: '12px', color: 'var(--text-bold)', outline: 'none', fontSize: '1rem' };
const saveBtn = { background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '15px', borderRadius: '50px', fontWeight: '900', cursor: 'pointer' };
const completeTitle = { color: 'var(--text-bold)', fontSize: '3rem', fontWeight: '900' };
const shortcutHint = { textAlign: 'center', color: 'var(--text-soft)', marginTop: '2.5rem', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };