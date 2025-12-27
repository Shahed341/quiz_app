import React, { useState, useEffect } from 'react';
import { Search, BookOpen, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Graphs from '../components/Graphs'; // Import the new component
import '../styles/Landpage.css';

function Landpage() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
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

  const formatUrl = (name) => name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="dashboard-wrapper">
      <header className="dash-header">
        <motion.div 
          className="search-glow-wrapper"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
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

      {/* Main Content Area */}
      <main className="dash-content">
        <div className="section-header">
          <div className="label-group">
            <BookOpen size={20} className="icon-white-glow" />
            <span className="enrolled-label">ENROLLED COURSES</span>
          </div>
          
          <button onClick={fetchCourses} className="sync-btn-glow">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Course Grid */}
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
            </div>
          )}
        </div>

        {/* --- STATS SECTION --- */}
        {/* We pass the courses array so the bar graph can list them */}
        {!loading && (
           <Graphs coursesData={courses} />
        )}
      </main>
    </div>
  );
}

export default Landpage;