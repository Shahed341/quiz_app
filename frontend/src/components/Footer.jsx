import React from 'react';
import { Github, ShieldCheck, Database, Zap } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerItemStyle = {
    fontSize: '0.65rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-soft)',
    transition: 'var(--theme-transition)'
  };

  const interactiveLink = {
    ...footerItemStyle,
    cursor: 'pointer',
    textDecoration: 'none',
    borderBottom: '1px solid transparent',
  };

  return (
    <footer style={{ 
      height: '45px', 
      padding: '0 2.5rem', 
      borderTop: '1px solid var(--border-glass)', 
      background: 'var(--bg-glass)', 
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      zIndex: 100,
      boxShadow: 'var(--shadow-float)'
    }}>
      
      {/* 1. LEFT: SYSTEM INTEGRITY STATUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: 'var(--accent-green)', 
            boxShadow: '0 0 10px var(--accent-green)' 
          }} />
          <span style={{ ...footerItemStyle, color: 'var(--text-bold)', letterSpacing: '2px' }}>
            Scholar OS v2.0
          </span>
        </div>
        <span style={{ color: 'var(--border-glass)', fontWeight: '300' }}>|</span>
        <span style={{ ...footerItemStyle, opacity: 0.5 }}>
          © {currentYear} Registry
        </span>
      </div>

      {/* 2. RIGHT: CORE ENGINE LINKS */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '30px'
      }}>
        <div style={footerItemStyle}>
          <Database size={12} color="var(--accent-blue)" strokeWidth={3} />
          Sync: Operational
        </div>

        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer" 
          style={interactiveLink}
          className="nav-btn-hover" // Uses your global hover logic
        >
          <Github size={12} strokeWidth={2.5} />
          Void_Source
        </a>

        <div style={{ ...footerItemStyle, color: 'var(--accent-orange)' }}>
          <Zap size={12} fill="var(--accent-orange)" />
          Latency: 12ms
        </div>
      </div>
    </footer>
  );
}