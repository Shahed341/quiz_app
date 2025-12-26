import React, { useState, useEffect } from 'react';
import { Search, LayoutGrid, ChevronRight, BookOpen, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Landpage.css';

function Landpage({ onSelectCourse }) {
  // Ensure initial state is an empty array to prevent .filter() crashes
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Pointing to the new courseController endpoint
      const res = await fetch('http://localhost:5000/api/courses');
      
      if (!res.ok) throw new Error("Server responded with an error");
      
      const data = await res.json();
      
      // Safety Check: Ensure the backend actually sent an array
      if (Array.isArray(data)) {
        setCourses(data);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setCourses([]); // Fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Use optional chaining or fallback to ensure filter doesn't break
  const filteredCourses = (courses || []).filter(c => 
    typeof c === 'string' && c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper">
      <header className="dash-header">
        <div className="header-content">
          <div className="brand">
            <LayoutGrid className="icon-red" size={28} />
            <h1>ACADEMIC<span>DASH</span></h1>
          </div>
          
          <div className="search-glass-container">
            <Search className="search-icon-ash" size={20} />
            <input 
              type="text" 
              placeholder="Search for a course..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="dash-content">
        <div className="content-inner">
          <div className="section-label">
            <BookOpen size={16} />
            <span>ENROLLED COURSES</span>
            <button onClick={fetchCourses} className="sync-btn" title="Refresh from Database">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="course-grid">
            {loading ? (
              <div className="loader-text">Fetching Courses from Database...</div>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course, index) => (
                <motion.div 
                  key={index}
                  className="glass-card"
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectCourse(course)}
                >
                  <div className="card-accent" />
                  <div className="card-body">
                    <span className="course-tag">MODULE</span>
                    <h3>{course}</h3>
                    <div className="card-footer">
                      <span className="status-green">Data Active</span>
                      <ChevronRight size={20} className="arrow-icon" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="empty-placeholder">
                {searchTerm ? "No courses match your search." : "No courses found. Ensure your JSON files have synced to the DB."}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Landpage;