import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, BookOpen, GraduationCap, PlayCircle, ArrowRight, Search } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/CourseView.css';

function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [items, setItems] = useState({ quizzes: [], flashcards: [] });
  const [themeColor, setThemeColor] = useState('#ffffff');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Memoized fetch function so it can be called from multiple places
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

      // Theme logic based on Dashboard order
      const courseIndex = allCourses.findIndex(c => c.toLowerCase().replace(/\s+/g, '-') === courseId);
      const colors = ['#ff4d4d', '#2ecc71', '#3498db', '#ff8c00'];
      const selectedColor = courseIndex !== -1 ? colors[courseIndex % 4] : '#ffffff';
      setThemeColor(selectedColor);

      // Filter by category
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

  // Trigger fetch on mount AND when the window regains focus 
  // (Helpful if user finishes quiz in another tab or returns via navigate)
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

  const filteredQuizzes = items.quizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFlashcards = items.flashcards.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()));

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
        <section className="flat-section">
          <div className="thin-section-header">
            <div className="label-group-mini">
              <BookOpen size={14} className="theme-icon-glow" />
              <span>RECENT QUIZZES</span>
            </div>
          </div>
          <div className="grid-layout-4-col">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz.id} className="card-compact" onClick={() => navigate(`/${courseId}/quiz/${quiz.id}`)}>
                {/* Score Pull: We force the user_score to display as an integer */}
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

        <section className="flat-section section-gap">
          <div className="thin-section-header">
            <div className="label-group-mini">
              <GraduationCap size={14} className="theme-icon-glow" />
              <span>STUDY SETS</span>
            </div>
          </div>
          <div className="grid-layout-4-col">
            {filteredFlashcards.map((set) => (
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