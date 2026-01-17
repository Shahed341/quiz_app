import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, ArrowRight, AlertCircle, Loader2, 
  Settings2, Trash2, Ghost, RefreshCw, FolderPlus
} from 'lucide-react';
import { getCourses, deleteCourse, request } from '../utils/api';

export default function CourseGrid() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseToArchive, setCourseToArchive] = useState(null);
  
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
      setError(null);
    } catch (err) {
      setError("Unable to connect to the scholar server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    window.addEventListener('refreshData', fetchCourses);
    return () => window.removeEventListener('refreshData', fetchCourses);
  }, []);

  const handleConfirmArchive = async () => {
    if (!courseToArchive) return;
    try {
      await deleteCourse(courseToArchive.id);
      setCourses(prev => prev.filter(c => c.id !== courseToArchive.id));
      setCourseToArchive(null);
      window.dispatchEvent(new Event('refreshData'));
    } catch (err) {
      alert("Failed to archive course.");
    }
  };

  const handleDeepSync = async () => {
    try {
      setLoading(true);
      await request('/sync/all', { method: 'POST' });
      fetchCourses();
    } catch (err) {
      alert("Sync failed.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={centeredState}>
        <Loader2 className="spin" color="var(--accent-blue)" size={44} />
        <p style={{ color: 'var(--text-soft)', fontWeight: '800', marginTop: '1.5rem', letterSpacing: '1px' }}>
          SYNCHRONIZING SCHOLAR GRID...
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '5rem' }} className="fade-in">
      
      {/* HEADER SECTION */}
      <div style={headerRow}>
        <div>
          <h1 style={pageTitle}>Academic Void</h1>
          <p style={pageSubtitle}>Volume: <span style={{color: 'var(--accent-blue)', fontWeight: '700'}}>I:/Scholar_Drive</span></p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={handleDeepSync} title="Deep Sync Folders" style={glassIconBtn}>
            <RefreshCw size={20} />
          </button>
          
          <button onClick={() => navigate('/course-editor')} style={glassCapsuleBtn('var(--accent-blue)')}>
            <FolderPlus size={18} /> Materialize Course
          </button>
        </div>
      </div>

      {error && (
        <div style={errorBanner}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* GRID OF COURSES */}
      {courses.length === 0 ? (
        <div style={emptyStateGlass}>
          <Ghost size={64} color="var(--text-soft)" style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
          <h2 style={{ color: 'var(--text-bold)', margin: '0 0 10px 0' }}>The Drive is Empty</h2>
          <p style={{ color: 'var(--text-soft)', marginBottom: '2rem' }}>No directories discovered on the Scholar Drive.</p>
          <button onClick={() => navigate('/course-editor')} style={glassCapsuleBtn('var(--accent-blue)')}>Materialize First Course</button>
        </div>
      ) : (
        <div style={gridContainer}>
          {courses.map(course => (
            <div 
              key={course.id} 
              className="glass-island" 
              style={cardBaseStyle}
              onClick={() => navigate(`/course/${course.slug}`)}
            >
              <div style={cardGlow(course.color_code)} />

              {/* ACTION BUTTONS */}
              <div style={cardActionTray}>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    navigate(`/course-editor?id=${course.id}`); 
                  }} 
                  style={smallGlassBtn}
                  title="Edit Settings"
                >
                  <Settings2 size={16} />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setCourseToArchive(course); 
                  }} 
                  style={smallDeleteGlassBtn}
                  title="Archive"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={iconIslandStyle(course.color_code)}>
                <BookOpen size={32} color={course.color_code || 'var(--accent-blue)'} />
              </div>
              
              <h2 style={courseNameStyle}>{course.name}</h2>
              <p style={courseDescStyle}>{course.description || `Learning modules for ${course.name}.`}</p>

              {/* STATS AREA */}
              <div style={statsContainer}>
                <div style={statBox}>
                  <span style={statLabel}>Quizzes</span>
                  <span style={statValue}>{course.quiz_count || 0}</span>
                </div>
                <div style={statDivider} />
                <div style={statBox}>
                  <span style={statLabel}>Cards</span>
                  <span style={statValue}>{course.flashcard_count || 0}</span>
                </div>
              </div>

              {/* EXPLORE BUTTON */}
              <button style={ctaCapsule(course.color_code)}>
                Explore Directory <ArrowRight size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ARCHIVE */}
      {courseToArchive && (
        <div style={modalOverlay} onClick={() => setCourseToArchive(null)}>
          <div style={glassModal} onClick={e => e.stopPropagation()}>
            <div style={modalWarningIcon}>
              <Trash2 size={32} color="var(--accent-red)" />
            </div>
            <h2 style={{ color: 'var(--text-bold)', fontSize: '1.8rem', marginBottom: '10px' }}>Archive Directory?</h2>
            <p style={{ color: 'var(--text-soft)', lineHeight: '1.6', marginBottom: '2.5rem' }}>
              Hide <span style={{ color: 'var(--text-bold)', fontWeight: '800' }}>{courseToArchive.name}</span> from the grid? 
              <br/><br/>
              <small style={{opacity: 0.7}}>Physical assets on <strong>I:/Scholar_Drive</strong> will remain safe.</small>
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setCourseToArchive(null)} style={modalCancelBtn}>Cancel</button>
              <button onClick={handleConfirmArchive} style={modalConfirmBtn}>Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Synced Styles ---

const centeredState = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' };
const headerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' };
const pageTitle = { color: 'var(--text-bold)', fontSize: '3rem', fontWeight: '900', margin: 0, letterSpacing: '-2px' };
const pageSubtitle = { color: 'var(--text-soft)', margin: '8px 0 0 0', fontWeight: '600', letterSpacing: '0.5px' };

const glassCapsuleBtn = (color) => ({
  background: 'var(--bg-glass)',
  color: color,
  border: `1px solid ${color}66`,
  padding: '12px 28px',
  borderRadius: '50px',
  fontWeight: '900',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backdropFilter: 'blur(10px)',
  textTransform: 'uppercase',
  fontSize: '0.8rem',
  letterSpacing: '1px',
  boxShadow: 'var(--shadow-premium)'
});

const glassIconBtn = {
  background: 'var(--bg-glass)',
  color: 'var(--text-soft)',
  border: '1px solid var(--border)',
  padding: '12px',
  borderRadius: '16px',
  cursor: 'pointer',
  backdropFilter: 'blur(10px)'
};

const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' };

const cardBaseStyle = { 
  background: 'var(--bg-glass)',
  padding: '3rem 2.5rem', 
  borderRadius: '32px', 
  border: '1px solid var(--border)', 
  display: 'flex', 
  flexDirection: 'column', 
  position: 'relative', 
  overflow: 'hidden', 
  cursor: 'pointer',
  backdropFilter: 'blur(20px) saturate(180%)',
  boxShadow: 'var(--shadow-premium)'
};

const cardGlow = (color) => ({ 
  position: 'absolute', top: '-70px', right: '-70px', width: '180px', height: '180px', 
  background: color || 'var(--accent-blue)', filter: 'blur(80px)', opacity: 0.12 
});

const cardActionTray = { position: 'absolute', top: '25px', right: '25px', display: 'flex', gap: '10px', zIndex: 10 };
const smallGlassBtn = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-soft)', padding: '10px', borderRadius: '12px', cursor: 'pointer' };
const smallDeleteGlassBtn = { ...smallGlassBtn, color: 'var(--accent-red)', background: 'rgba(255, 77, 77, 0.08)' };

const iconIslandStyle = (color) => ({ 
  width: '70px', height: '70px', borderRadius: '22px', 
  background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', 
  justifyContent: 'center', marginBottom: '2.5rem', border: `1px solid ${color}33` 
});

const courseNameStyle = { fontSize: '2rem', fontWeight: '900', color: 'var(--text-bold)', margin: '0 0 12px 0', letterSpacing: '-1px' };
const courseDescStyle = { color: 'var(--text-soft)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem', flex: 1 };

const statsContainer = { 
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
  padding: '20px 30px', background: 'rgba(0,0,0,0.15)', borderRadius: '24px', 
  border: '1px solid var(--border)', marginBottom: '2.5rem' 
};

const statBox = { textAlign: 'center' };
const statLabel = { display: 'block', fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', fontWeight: '900', marginBottom: '5px' };
const statValue = { fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-bold)' };
const statDivider = { width: '1px', height: '35px', background: 'var(--border)' };

const ctaCapsule = (color) => ({ 
  width: '100%', padding: '18px', borderRadius: '50px', border: 'none', 
  background: color || 'var(--accent-blue)', color: 'white', fontWeight: '900', 
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
  gap: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' 
});

const errorBanner = { padding: '1.2rem 2rem', background: 'rgba(255, 77, 77, 0.1)', color: 'var(--accent-red)', borderRadius: '16px', border: '1px solid rgba(255, 77, 77, 0.2)', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '3rem' };
const emptyStateGlass = { textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-glass)', borderRadius: '40px', border: '2px dashed var(--border)', backdropFilter: 'blur(20px)' };

const modalOverlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const glassModal = { background: 'var(--bg-glass)', padding: '3.5rem', borderRadius: '40px', border: '1px solid var(--border)', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-premium)' };
const modalWarningIcon = { width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 77, 77, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto' };
const modalCancelBtn = { flex: 1, padding: '16px', borderRadius: '50px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-bold)', fontWeight: '800', cursor: 'pointer' };
const modalConfirmBtn = { flex: 1, padding: '16px', borderRadius: '50px', border: 'none', background: 'var(--accent-red)', color: 'white', fontWeight: '800', cursor: 'pointer' };