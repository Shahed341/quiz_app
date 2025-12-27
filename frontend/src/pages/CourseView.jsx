import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, BookOpen, GraduationCap, PlayCircle, ArrowRight, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/CourseView.css';

function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [items, setItems] = useState({ quizzes: [], flashcards: [] });
  const [themeColor, setThemeColor] = useState('#ffffff');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // New States for "Show More" functionality
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const [showAllFlashcards, setShowAllFlashcards] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [qRes, fRes, cRes] = await Promise.all([
        fetch('http://localhost:5000/api/quizzes'),
        fetch('http://localhost:5000/api/flashcards'),
        fetch('http://localhost:5000/api/courses')
      ]);

      const quizzes = await qRes.json();
      const flashcards = await fRes.json();
      const allCourses = await cRes.json();

      const courseIndex = allCourses.findIndex(c => c.toLowerCase().replace(/\s+/g, '-') === courseId);
      const colors = ['#ff4d4d', '#2ecc71', '#3498db', '#ff8c00'];
      const selectedColor = courseIndex !== -1 ? colors[courseIndex % 4] : '#ffffff';
      setThemeColor(selectedColor);

      setItems({
        quizzes: quizzes.filter(q => q.category?.toLowerCase().replace(/\s+/g, '-') === courseId),
        flashcards: flashcards.filter(f => f.category?.toLowerCase().replace(/\s+/g, '-') === courseId)
      });
      
      setLoading(false);
    } catch (err) { 
      console.error("Fetch Error:", err); 
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
  }, [fetchData]);

  const getContrastColor = (hex) => {
    const map = { '#ff4d4d': '#00f2ff', '#2ecc71': '#ff4d4d', '#3498db': '#f1c40f', '#ff8c00': '#3498db' };
    return map[hex] || '#ffffff';
  };

  const dynamicTheme = {
    '--theme-glow': themeColor,
    '--theme-glow-soft': `${themeColor}4d`,
    '--score-contrast': getContrastColor(themeColor)
  };

  // Filter logic
  const filteredQuizzes = items.quizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFlashcards = items.flashcards.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // Slicing logic for "Initial 4" view
  const visibleQuizzes = showAllQuizzes ? filteredQuizzes : filteredQuizzes.slice(0, 4);
  const visibleFlashcards = showAllFlashcards ? filteredFlashcards : filteredFlashcards.slice(0, 4);

  if (loading) return <div className="loading-screen">SYNCING CURRICULUM...</div>;

  return (
    <div className="course-page-flat" style={dynamicTheme}>
      <header className="course-header-compact">
        <div className="header-left-group">
          <button className="back-btn-tiny" onClick={() => navigate('/')}>
            <ChevronLeft size={14} />
          </button>
          <h2 className="course-title-tiny">{courseId?.replace(/-/g, ' ')}</h2>
        </div>

        <div className="search-mini-wrapper search-visible-glow">
          <div className="snake-light-mini"></div>
          <div className="search-container-mini">
            <Search size={18} className="theme-icon-glow" />
            <input 
              type="text" 
              placeholder="SEARCH MODULES..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right-mini">
          {items.quizzes.length + items.flashcards.length} TOTAL UNITS
        </div>
      </header>

      <main className="course-content-flat">
        {/* QUIZZES SECTION */}
        <section className="flat-section">
          <div className="thin-section-header">
            <div className="label-group-mini">
              <BookOpen size={14} className="theme-icon-glow" />
              <span>RECENT QUIZZES</span>
            </div>
            {filteredQuizzes.length > 4 && (
              <button className="reveal-btn" onClick={() => setShowAllQuizzes(!showAllQuizzes)}>
                {showAllQuizzes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
          <div className="grid-layout-4-col">
            {visibleQuizzes.map((quiz) => (
              <div key={quiz.id} className="card-compact" onClick={() => navigate(`/${courseId}/quiz/${quiz.id}`)}>
                <div className="card-score-tag">
                  {Math.floor(quiz.user_score || 0)}%
                </div>
                <div className="card-top">
                  <span className="tag-tiny">EXAM</span>
                  <h3 className="name-tiny dynamic-theme-text">{quiz.title}</h3>
                </div>
                <div className="card-bottom-mini">
                  <span className="action-text">PRACTICE</span>
                  <PlayCircle size={14} className="theme-icon-glow" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FLASHCARDS SECTION */}
        <section className="flat-section section-gap">
          <div className="thin-section-header">
            <div className="label-group-mini">
              <GraduationCap size={14} className="theme-icon-glow" />
              <span>STUDY SETS</span>
            </div>
            {filteredFlashcards.length > 4 && (
              <button className="reveal-btn" onClick={() => setShowAllFlashcards(!showAllFlashcards)}>
                {showAllFlashcards ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
          <div className="grid-layout-4-col">
            {visibleFlashcards.map((set) => (
              <div key={set.id} className="card-compact" onClick={() => navigate(`/${courseId}/flashcards/${set.id}`)}>
                <div className="card-top">
                  <span className="tag-tiny">RECALL</span>
                  <h3 className="name-tiny dynamic-theme-text">{set.title}</h3>
                </div>
                <div className="card-bottom-mini">
                  <span className="action-text">OPEN SET</span>
                  <ArrowRight size={14} className="theme-icon-glow" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default CourseView;