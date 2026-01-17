import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Layout & UI Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Style Imports - Ensure theme.css is loaded first
import './styles/theme.css'; 
import './styles/App.css';

// Core Dashboard Components
import CourseGrid from './components/CourseGrid';
import StatsSection from './components/StatsSection';
import ArchiveVault from './pages/ArchiveVault';

// Course Pages
import CourseDetail from './pages/Course/CourseDetail';
import CourseEditor from './pages/Course/CourseEditor';

// Quiz Pages
import QuizPlayer from './pages/Quiz/QuizPlayer';
import QuizEditor from './pages/Quiz/QuizEditor';
import HistoryPage from './pages/Quiz/HistoryPage';

// Flashcard Pages
import FlashcardPlayer from './pages/Flashcards/FlashcardPlayer';
import FlashcardEditor from './pages/Flashcards/FlashcardEditor';

/**
 * ScrollToTop: Forces window to top on route change.
 * Essential for the fixed-sidebar layout.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  // --- STATE & INITIALIZATION ---
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sync state with DOM attribute for CSS Variable switching
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Global Refresh Logic (triggered by API events or child components)
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    window.addEventListener('refreshData', triggerRefresh);
    return () => window.removeEventListener('refreshData', triggerRefresh);
  }, []);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  /**
   * Layout Logic:
   * 260px is the standard sidebar width.
   * 75px is the icon-only (collapsed) width.
   */
  const sidebarWidth = isSidebarCollapsed ? '75px' : '260px';

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      
      {/* The app-wrapper must be background: transparent so that 
        body texture from theme.css shows through.
      */}
      <div className="app-wrapper" style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        background: 'transparent' 
      }}>
        
        <Sidebar 
          key={`sidebar-${refreshKey}`} 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
        />

        {/* MAIN COLUMN
          Handles the dynamic push from the sidebar and flexes to fill space.
        */}
        <div className="main-column" style={{ 
          flex: 1,
          marginLeft: sidebarWidth, 
          transition: 'margin-left var(--theme-transition)', 
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: 'transparent'
        }}>
          
          <Navbar 
            theme={theme} 
            toggleTheme={toggleTheme} 
            isSidebarCollapsed={isSidebarCollapsed} 
          />

          {/* STAGE (Content Area)
            paddingTop: 100px ensures content clears the 80px fixed glass navbar.
          */}
          <main className="stage" style={{ 
            paddingTop: '100px', 
            paddingBottom: '3rem',
            paddingLeft: '2.5rem',
            paddingRight: '2.5rem',
            flex: 1,
            background: 'transparent'
          }}>
            <div className="content-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <Routes>
                {/* ROOT DASHBOARD */}
                <Route path="/" element={
                  <div className="fade-in">
                    <header className="dashboard-header" style={{ marginBottom: '3rem' }}>
                      <h1 style={{ 
                        fontSize: 'clamp(2rem, 5vw, 3rem)', 
                        fontWeight: '900', 
                        color: 'var(--text-bold)',
                        letterSpacing: '-2px'
                      }}>
                        Scholar Dashboard
                      </h1>
                      <p style={{ 
                        color: 'var(--text-soft)', 
                        marginTop: '0.8rem',
                        fontSize: '1.1rem',
                        fontWeight: '500'
                      }}>
                        Synchronized with local node: <strong style={{color: 'var(--accent-blue)'}}>I:/Scholar_Drive</strong>
                      </p>
                    </header>

                    <StatsSection key={`stats-${refreshKey}`} />
                    <CourseGrid key={`grid-${refreshKey}`} />
                  </div>
                } />
                
                {/* COURSE MANAGEMENT */}
                <Route path="/course/:slug" element={<CourseDetail key={`det-${refreshKey}`} />} />
                <Route path="/course-editor" element={<CourseEditor />} />

                {/* KNOWLEDGE MODULES (QUIZ) */}
                <Route path="/quiz/:uid" element={<QuizPlayer onComplete={triggerRefresh} />} />
                <Route path="/quiz-editor" element={<QuizEditor />} />
                <Route path="/history" element={<HistoryPage key={`history-${refreshKey}`} />} />

                {/* CONCEPT CLUSTERS (FLASHCARDS) */}
                <Route path="/flashcards/:uid" element={<FlashcardPlayer />} />
                <Route path="/flashcard-editor" element={<FlashcardEditor />} />

                {/* ARCHIVE & UTILS */}
                <Route path="/archive" element={<ArchiveVault key={`vault-${refreshKey}`} />} />
                
                {/* FALLBACK */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;