import React from 'react';
import { Zap } from 'lucide-react';
import '../styles/NavFooter.css'; // Reusing your brand styles

const NavFooter = ({ children }) => {
  return (
    <div className="dashboard-wrapper">
      {/* SIMPLE NAVBAR */}
      <nav className="simple-nav">
        <div className="nav-logo">
          <Zap size={20} className="icon-white-glow" />
          <span>QUIZAPP</span>
        </div>
      </nav>

      {/* MAIN CONTENT STAGE */}
      <div className="main-stage-wrapper">
        {children}
      </div>

      {/* SIMPLE FOOTER */}
      <footer className="simple-footer">
        <p>© 2025 All Rights Reserved by Shahed</p>
      </footer>
    </div>
  );
};

export default NavFooter;