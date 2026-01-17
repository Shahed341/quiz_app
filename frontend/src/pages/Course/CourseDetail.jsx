import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpenCheck, Layers, ArrowLeft, Plus, Trash2, 
  History, X, FileText, ChevronDown, ChevronUp, Loader2 
} from 'lucide-react';
import { getCourseBySlug, request } from '../../utils/api';

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewHistory, setViewHistory] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  
  // Visibility States
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);

  const fetchCourseData = () => {
    getCourseBySlug(slug)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourseData();
    window.addEventListener('refreshData', fetchCourseData);
    return () => window.removeEventListener('refreshData', fetchCourseData);
  }, [slug]);

  useEffect(() => {
    if (viewHistory) {
      request(`/quizzes/${viewHistory.id}/history`)
        .then(setHistoryData)
        .catch(() => setHistoryData([]));
    }
  }, [viewHistory]);

  const handleDeleteAsset = async (type, id) => {
    if (!window.confirm(`Remove this ${type} from Scholar Drive?`)) return;
    try {
      const endpoint = type === 'quiz' ? `/quizzes/${id}` : `/flashcard-sets/${id}`;
      await request(endpoint, { method: 'DELETE' });
      fetchCourseData();
      window.dispatchEvent(new Event('refreshData'));
    } catch (err) {
      alert("Void Deletion Failed.");
    }
  };

  if (loading) return <div style={fullPageCenter}><Loader2 className="spin" size={44} color="var(--accent-blue)" /></div>;
  if (!data || !data.course) return <div style={fullPageCenter}>Path Not Found</div>;

  const { course, quizzes = [], flashcards = [] } = data;
  const accentColor = course.color_code || 'var(--accent-blue)';

  // Slicing logic for "Show More"
  const visibleQuizzes = showAllQuizzes ? quizzes : quizzes.slice(0, 5);
  const visibleCards = showAllCards ? flashcards : flashcards.slice(0, 5);

  return (
    <div style={containerLayout} className="fade-in">
      <button onClick={() => navigate('/')} style={backBtnStyle}>
        <ArrowLeft size={16} /> Library
      </button>

      {/* --- HERO SECTION --- */}
      <div style={{...topTitleCard, borderLeft: `6px solid ${accentColor}`}}>
        <div style={titleContent}>
          <div style={badge}>{slug.toUpperCase()} DIRECTORY</div>
          <h1 style={mainTitle}>{course.name}</h1>
          <p style={courseDesc}>{course.description || "Scholar Drive active volume."}</p>
        </div>
        <div style={statGroup}>
          <div style={statItem}>
            <span style={statLabel}>Topics</span>
            <span style={statVal}>{quizzes.length}</span>
          </div>
          <div style={statDivider} />
          <div style={statItem}>
            <span style={statLabel}>Assets</span>
            <span style={statVal}>{flashcards.length}</span>
          </div>
        </div>
      </div>

      {/* --- KNOWLEDGE MODULES (QUIZZES) --- */}
      <section style={sectionWrapper}>
        <div style={sectionHeader}>
          <div style={headerTitle}>
            <BookOpenCheck size={22} color="var(--accent-blue)" />
            <h2 style={sectionText}>Knowledge Modules</h2>
          </div>
          <button 
            style={glassAddBtn('var(--accent-blue)')} 
            onClick={() => navigate(`/quiz-editor?courseId=${course.id}&slug=${course.slug}`)}
          >
            <Plus size={16} /> New Quiz
          </button>
        </div>

        <div style={listGrid}>
          {visibleQuizzes.map((quiz) => (
            <div key={quiz.uid} style={glassItemIsland} className="glass-island">
              <div style={itemInfo}>
                <h3 style={itemTitle}>{quiz.title}</h3>
                <span style={uidLabel}>{quiz.uid}.json</span>
              </div>
              <div style={actionTray}>
                <button onClick={() => setViewHistory(quiz)} style={iconAction} title="History"><History size={18}/></button>
                <button onClick={() => handleDeleteAsset('quiz', quiz.id)} style={iconActionDelete} title="Delete"><Trash2 size={18}/></button>
                <button onClick={() => navigate(`/quiz/${quiz.uid}`)} style={glassLaunchBtn('var(--accent-blue)')}>Launch</button>
              </div>
            </div>
          ))}
          {quizzes.length > 5 && (
            <button style={toggleBtn} onClick={() => setShowAllQuizzes(!showAllQuizzes)}>
              {showAllQuizzes ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} 
              {showAllQuizzes ? 'Show Less' : `View All (${quizzes.length})`}
            </button>
          )}
        </div>
      </section>

      {/* --- CONCEPT CLUSTERS (FLASHCARDS) --- */}
      <section style={sectionWrapper}>
        <div style={sectionHeader}>
          <div style={headerTitle}>
            <Layers size={22} color="var(--accent-green)" />
            <h2 style={sectionText}>Concept Clusters</h2>
          </div>
          <button 
            style={glassAddBtn('var(--accent-green)')} 
            onClick={() => navigate(`/flashcard-editor?courseId=${course.id}&slug=${course.slug}`)}
          >
            <Plus size={16} /> New Set
          </button>
        </div>

        <div style={listGrid}>
          {visibleCards.map((set) => (
            <div key={set.uid} style={glassItemIsland} className="glass-island">
              <div style={itemInfo}>
                <h3 style={itemTitle}>{set.title || "Untitled Cluster"}</h3>
                <span style={uidLabel}>{set.uid}.json</span>
              </div>
              <div style={actionTray}>
                <button onClick={() => handleDeleteAsset('flashcard', set.id)} style={iconActionDelete} title="Delete"><Trash2 size={18}/></button>
                <button onClick={() => navigate(`/flashcards/${set.uid}`)} style={glassLaunchBtn('var(--accent-green)')}>Study</button>
              </div>
            </div>
          ))}
          {flashcards.length > 5 && (
            <button style={toggleBtn} onClick={() => setShowAllCards(!showAllCards)}>
              {showAllCards ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} 
              {showAllCards ? 'Show Less' : `View All (${flashcards.length})`}
            </button>
          )}
        </div>
      </section>

      {/* --- MODAL: HISTORY --- */}
      {viewHistory && (
        <div style={modalOverlay} onClick={() => setViewHistory(null)}>
          <div style={glassHistoryModal} className="glass-island">
            <div style={historyHeader}>
              <h2 style={modalHeading}>Module History</h2>
              <button onClick={() => setViewHistory(null)} style={closeX}><X size={20}/></button>
            </div>
            <p style={historySub}>{viewHistory.title}</p>
            <div style={historyScroll}>
              {historyData.map((att, i) => (
                <div key={i} style={glassHistoryRow}>
                  <div style={{fontWeight: '800', color: 'var(--text-bold)'}}>{new Date(att.attempted_at).toLocaleDateString()}</div>
                  <div style={{fontWeight: '900', color: att.score >= 80 ? 'var(--accent-green)' : 'var(--text-bold)'}}>{att.score}%</div>
                  <div style={{color: 'var(--accent-orange)'}}>🔥 {att.streak_count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SYNCED STYLE MANIFEST ---

const containerLayout = { maxWidth: '1050px', margin: '0 auto', padding: '3rem 2rem' };
const fullPageCenter = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' };

const backBtnStyle = { 
  background: 'transparent', border: 'none', color: 'var(--text-soft)', 
  cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', 
  gap: '8px', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem' 
};

const topTitleCard = { 
  background: 'var(--bg-glass)', padding: '2.5rem 3rem', borderRadius: '32px', 
  border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', 
  alignItems: 'center', marginBottom: '4rem', boxShadow: 'var(--shadow-premium)',
  backdropFilter: 'blur(15px)'
};

const titleContent = { flex: 1 };
const badge = { fontSize: '0.65rem', fontWeight: '900', color: 'var(--accent-blue)', letterSpacing: '2px', marginBottom: '10px' };
const mainTitle = { fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: 'var(--text-bold)', margin: 0, fontWeight: '900', letterSpacing: '-2px' };
const courseDesc = { color: 'var(--text-soft)', fontSize: '1.1rem', marginTop: '8px' };

const statGroup = { display: 'flex', gap: '30px', alignItems: 'center' };
const statItem = { textAlign: 'center' };
const statLabel = { display: 'block', fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', fontWeight: '800' };
const statVal = { fontSize: '2rem', color: 'var(--text-bold)', fontWeight: '900' };
const statDivider = { width: '1px', height: '40px', background: 'var(--border)' };

const sectionWrapper = { marginBottom: '5rem' };
const sectionHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' };
const headerTitle = { display: 'flex', alignItems: 'center', gap: '12px' };
const sectionText = { color: 'var(--text-bold)', fontSize: '1.5rem', fontWeight: '800', margin: 0 };

const glassLaunchBtn = (color) => ({
  background: 'var(--bg-main)', 
  color: color,
  border: `1px solid ${color}66`,
  padding: '8px 24px',
  borderRadius: '50px',
  fontWeight: '900',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
});

const glassAddBtn = (color) => ({
  background: 'transparent', border: `1px solid ${color}44`, color: color,
  padding: '10px 20px', borderRadius: '50px', cursor: 'pointer', fontWeight: '800',
  display: 'flex', alignItems: 'center', gap: '8px'
});

const listGrid = { display: 'flex', flexDirection: 'column', gap: '14px' };

const glassItemIsland = { 
  background: 'var(--bg-glass)', padding: '1.2rem 2rem', borderRadius: '24px', 
  border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', 
  alignItems: 'center', backdropFilter: 'blur(10px)'
};

const itemInfo = { flex: 1 };
const itemTitle = { margin: 0, color: 'var(--text-bold)', fontSize: '1.15rem', fontWeight: '700' };
const uidLabel = { fontSize: '0.65rem', color: 'var(--text-mute)', letterSpacing: '1px' };

const actionTray = { display: 'flex', alignItems: 'center', gap: '20px' };
const iconAction = { background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer' };
const iconActionDelete = { ...iconAction, color: 'var(--text-mute)' };

const toggleBtn = { 
  width: '100%', padding: '15px', background: 'transparent', border: '1px solid var(--border)', 
  borderRadius: '20px', color: 'var(--text-soft)', cursor: 'pointer', fontWeight: '800', 
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
  marginTop: '10px'
};

const modalOverlay = { 
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
  backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', 
  justifyContent: 'center', zIndex: 3000 
};

const glassHistoryModal = { 
  background: 'var(--bg-glass)', padding: '2.5rem', borderRadius: '32px', 
  border: '1px solid var(--border)', width: '550px', color: 'var(--text-bold)',
  backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-premium)'
};

const modalHeading = { margin: 0, color: 'var(--text-bold)', fontWeight: 900, fontSize: '1.6rem' };
const closeX = { background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer' };
const historyHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' };
const historySub = { color: 'var(--text-soft)', marginBottom: '2.5rem', fontWeight: '600' };
const historyScroll = { maxHeight: '350px', overflowY: 'auto' };

const glassHistoryRow = { 
  display: 'flex', justifyContent: 'space-between', padding: '15px 20px', 
  background: 'rgba(255,255,255,0.03)', borderRadius: '16px', 
  border: '1px solid var(--border)', marginBottom: '10px' 
};