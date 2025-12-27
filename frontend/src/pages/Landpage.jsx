import React, { useState, useEffect } from 'react';
import { Search, BookOpen, RefreshCw, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Graphs from '../components/Graphs';
import '../styles/Landpage.css';

function Landpage() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/courses');
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = (courses || []).filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCourses = showAll ? filteredCourses : filteredCourses.slice(0, 4);
  const formatUrl = (name) => name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="dashboard-wrapper">
      {/* 1. SEARCH HEADER */}
      <header className="dash-header">
        <motion.div 
          className="search-glow-wrapper"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="snake-light"></div>
          <div className="search-container-dark">
            <Search className="search-icon-white-glow" size={22} />
            <input 
              type="text" 
              placeholder="Search enrolled courses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="dash-content">
        
        {/* GRAPHS AT THE TOP */}
        <div className="graphs-section top-graphs-spacing">
           {!loading && <Graphs coursesData={courses} />}
        </div>

        {/* SECTION HEADER */}
        <div className="section-header">
          <div className="label-group">
            <BookOpen size={20} className="icon-white-glow" />
            <span className="enrolled-label">ENROLLED COURSES</span>
          </div>
          
          <div className="header-actions">
            <button onClick={fetchCourses} className="sync-btn-glow" title="Refresh">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            
            {filteredCourses.length > 4 && (
              <button 
                onClick={() => setShowAll(!showAll)} 
                className={`sync-btn-glow dropdown-btn ${showAll ? 'active' : ''}`}
                title={showAll ? "Show Less" : "Show More"}
              >
                {showAll ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>

        {/* COURSE GRID */}
        <div className="course-grid-cream">
          {loading ? (
            <div className="status-text-dark">Synchronizing curriculum...</div>
          ) : (
            <div className="grid-layout">
              <AnimatePresence mode="popLayout">
                {displayedCourses.map((course) => (
                  <motion.div 
                    key={course}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="course-card-dark"
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/courses/${formatUrl(course)}`)}
                  >
                    <div className="card-inner">
                      <div className="card-header">
                        <span className="module-tag">MODULE</span>
                        <h3 className="course-name-dynamic">{course}</h3>
                      </div>
                      <div className="card-footer-action">
                        <span className="enter-text">Enter Course</span>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Landpage;