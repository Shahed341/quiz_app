import React, { useState, useEffect } from 'react';
import { Search, BookOpen, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Landpage.css';

function Landpage({ onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="dashboard-wrapper">
      {/* HEADER: Ash Background with Snake-Light Search Bar */}
      <header className="dash-header">
        <motion.div 
          className="search-glow-wrapper"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* The Sunset Red Rotating Snake */}
          <div className="snake-light"></div>
          
          <div className="search-container-dark">
            {/* White Search Icon with Big Glow */}
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

      <main className="dash-content">
        <div className="section-header">
          <div className="label-group">
            {/* White Glowing Book Icon */}
            <BookOpen size={20} className="icon-white-glow" />
            <span className="enrolled-label">ENROLLED COURSES</span>
          </div>
          
          {/* White Glowing Sync Button */}
          <button onClick={fetchCourses} className="sync-btn-glow">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* CREAM WHITE GRID STAGE */}
        <div className="course-grid-cream">
          {loading ? (
            <div className="status-text-dark">Synchronizing curriculum...</div>
          ) : (
            <div className="grid-layout">
              {filteredCourses.map((course, index) => (
                <motion.div 
                  key={index}
                  className="course-card-dark"
                  whileHover={{ y: -10, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectCourse(course)}
                >
                  <div className="card-inner">
                    <div className="card-header">
                      <span className="module-tag">MODULE</span>
                      {/* Course titles colored via CSS dynamic nth-child logic */}
                      <h3 className="course-name-dynamic">{course}</h3>
                    </div>
                    <div className="card-footer-action">
                      <span className="enter-text">Enter Course</span>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {!loading && filteredCourses.length === 0 && (
                <div className="empty-state-dark">
                  No courses found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Landpage;