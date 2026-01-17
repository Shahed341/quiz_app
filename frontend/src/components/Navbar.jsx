import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, RefreshCw, User, Search, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { syncFiles } from '../utils/api';
import GlobalSearch from './Search/GlobalSearch';

export default function Navbar({ theme, toggleTheme, isSidebarCollapsed }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const searchContainerRef = useRef(null);

  // Sync with Sidebar transition timing (0.4s)
  const sidebarWidth = isSidebarCollapsed ? '75px' : '260px';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncFiles();
      window.dispatchEvent(new Event('refreshData'));
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path.includes('/course/')) return 'Course View';
    if (path === '/archive') return 'Archive Vault';
    return 'Scholar Drive';
  };

  return (
    <nav style={{
      ...navWrapperStyle,
      left: sidebarWidth,
      width: `calc(100% - ${sidebarWidth})`,
    }}>
      
      {/* 1. LEFT: Floating Breadcrumbs */}
      <div style={sideContainerStyle}>
        <div style={{
          ...breadcrumbStyle,
          opacity: isSearchOpen ? 0 : 1,
          transform: isSearchOpen ? 'translateX(-20px)' : 'translateX(0)',
        }}>
          <div style={activeIndicator} />
          <span style={pathContextText}>{getPageTitle()}</span>
        </div>
      </div>

      {/* 2. MIDDLE: Expanding Search (Single-Layer Design) */}
      <div style={centerContainerStyle} ref={searchContainerRef}>
        <div style={{
          ...searchPillStyle,
          width: isSearchOpen ? '100%' : '42px',
          border: isSearchOpen ? '1.5px solid var(--accent-blue)' : '1px solid var(--border-glass)',
        }}>
          
          {/* Unified Search Icon */}
          <div style={iconWrapper}>
            <Search 
              size={18} 
              color={isSearchOpen ? 'var(--accent-blue)' : 'var(--text-soft)'} 
              style={{ transition: 'color 0.3s ease' }}
            />
          </div>

          {isSearchOpen ? (
            <div style={searchInnerContent}>
              <div style={{ flex: 1 }}>
                <GlobalSearch 
                  autoFocus 
                  hideInternalIcon={true} 
                  // Pass a prop to GlobalSearch to ensure its own background is transparent
                  transparentMode={true} 
                />
              </div>
              <button onClick={() => setIsSearchOpen(false)} style={closeBtnStyle}>
                <X size={16} />
              </button>
            </div>
          ) : (
            /* Invisible trigger area for the icon */
            <button 
              onClick={() => setIsSearchOpen(true)} 
              style={searchTriggerOverlay} 
            />
          )}
        </div>
      </div>
      
      {/* 3. RIGHT: Floating Actions */}
      <div style={{ ...sideContainerStyle, justifyContent: 'flex-end', gap: '10px' }}>
        <button onClick={handleSync} disabled={isSyncing} style={actionButtonStyle}>
          <RefreshCw size={18} className={isSyncing ? "spin" : ""} color={isSyncing ? 'var(--accent-blue)' : 'currentColor'} />
        </button>

        <button onClick={toggleTheme} style={actionButtonStyle}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div style={profileCircle}>
          <User size={18} strokeWidth={2.5} />
        </div>
      </div>
    </nav>
  );
}

// --- Style Objects ---

const navWrapperStyle = { 
  height: '80px',
  display: 'flex', 
  alignItems: 'center',
  padding: '0 30px', 
  background: 'transparent',
  zIndex: 1100,
  position: 'fixed',
  top: 0,
  pointerEvents: 'none', // Critical: clicks pass through to content
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
};

const sideContainerStyle = { 
  flex: '1', 
  display: 'flex', 
  alignItems: 'center', 
  height: '100%',
  pointerEvents: 'none'
};

const centerContainerStyle = {
  flex: '0 1 500px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  margin: '0 20px',
  pointerEvents: 'none'
};

const searchPillStyle = {
  pointerEvents: 'all',
  height: '42px',
  borderRadius: '14px',
  background: 'var(--bg-glass)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  overflow: 'visible' // Changed to visible so dropdown results aren't cut off
};

const iconWrapper = {
  width: '42px',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const searchInnerContent = {
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  height: '100%',
  paddingRight: '8px'
};

const searchTriggerOverlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  borderRadius: '14px'
};

const actionButtonStyle = {
  pointerEvents: 'all',
  background: 'var(--bg-glass)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border-glass)',
  borderRadius: '12px',
  height: '42px',
  width: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-soft)',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s ease'
};

const profileCircle = {
  pointerEvents: 'all',
  background: 'var(--accent-blue)', 
  borderRadius: '12px',
  width: '42px',
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
};

const closeBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-soft)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center'
};

const breadcrumbStyle = {
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px',
  transition: 'all 0.3s ease',
  pointerEvents: 'all'
};

const activeIndicator = { width: '3px', height: '16px', background: 'var(--accent-blue)', borderRadius: '10px' };

const pathContextText = { 
  fontSize: '0.7rem', 
  fontWeight: '800', 
  color: 'var(--text-soft)', 
  textTransform: 'uppercase', 
  letterSpacing: '1px' 
};