import React, { useState, useEffect } from 'react';
import { Zap, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/NavFooter.css';

const NavFooter = ({ children }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    // Apply theme to the <html> tag globally
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="simple-nav">
        {/* LEFT SIDE: LOGO */}
        <div className="nav-logo" onClick={() => navigate('/')}>
          <Zap size={20} className="icon-white-glow" />
          <span>QUIZAPP</span>
        </div>

        {/* RIGHT SIDE: TOGGLE BUTTON */}
        <div className="nav-controls">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="sun-icon" />
            ) : (
              <Moon size={20} className="moon-icon" />
            )}
          </button>
        </div>
      </nav>

      <main className="main-stage-wrapper">
        {children}
      </main>

      <footer className="simple-footer">
        <p>© 2025 All Rights Reserved by Shahed</p>
      </footer>
    </div>
  );
};

export default NavFooter;