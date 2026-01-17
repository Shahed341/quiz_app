import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, FileText, Sparkles, X, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../utils/api';

export default function GlobalSearch({ localData = [], autoFocus = false, hideInternalIcon = false, transparentMode = false }) {
  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Auto-focus logic for the expanding Navbar search
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle Global Database Fetch (20% Logic)
  useEffect(() => {
    if (query.length < 2) {
      setDbResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await request(`/search?q=${query}`);
        setDbResults(results || []);
      } catch (err) {
        console.error("Global search failed", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Instant Filter (80% Logic)
  const localMatches = Array.isArray(localData) ? localData.filter(item => 
    (item.title || item.name || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5) : [];

  const handleNavigate = (path) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* 1. INPUT AREA: Stripped for Navbar integration */}
      <div style={transparentMode ? transparentWrapper : internalWrapper(isOpen)}>
        {!hideInternalIcon && (
          <Search size={18} color={isOpen ? 'var(--accent-blue)' : 'var(--text-soft)'} />
        )}
        
        <input 
          ref={inputRef}
          style={inputStyle}
          placeholder="Search modules, topics..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        />

        {query && (
          <X 
            size={16} 
            onClick={() => { setQuery(''); setDbResults([]); }} 
            style={{ cursor: 'pointer', color: 'var(--text-soft)', marginLeft: '8px' }} 
          />
        )}
      </div>

      {/* 2. RESULTS HUB: Floating Dropdown */}
      {isOpen && query.length > 0 && (
        <div style={dropdownStyle}>
          {/* Local Modules Section */}
          <div style={{ padding: '1.25rem' }}>
            <div style={sectionHeaderStyle('var(--accent-blue)')}>
              <FileText size={12} /> Local Modules
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {localMatches.length > 0 ? (
                localMatches.map(item => (
                  <div key={item.uid} className="search-item" style={resultItemStyle} onClick={() => handleNavigate(`/quiz/${item.uid}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--text-bold)', fontSize: '0.9rem' }}>{item.title || item.name}</span>
                      {item.is_ai_generated === 1 && <Sparkles size={12} color="var(--accent-orange)" />}
                    </div>
                    <ArrowRight size={14} color="var(--border)" />
                  </div>
                ))
              ) : (
                <div style={emptyTextStyle}>No matches in current course.</div>
              )}
            </div>
          </div>

          {/* Global Discovery Section */}
          <div style={globalSectionStyle}>
            <div style={sectionHeaderStyle('var(--text-soft)')}>
              <Globe size={12} /> Global Discovery
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {loading ? (
                <div style={{ padding: '10px' }}><Loader2 size={16} className="spin" color="var(--accent-blue)" /></div>
              ) : dbResults.length > 0 ? (
                dbResults.map(res => (
                  <div key={res.uid || res.slug} className="search-item-mini" style={miniResultStyle} onClick={() => handleNavigate(res.type === 'course' ? `/course/${res.slug}` : `/quiz/${res.uid}`)}>
                    <span style={{ fontSize: '0.85rem' }}>{res.title}</span>
                    <span style={typeBadgeStyle}>{res.type}</span>
                  </div>
                ))
              ) : (
                <div style={emptyTextStyle}>No global matches.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---

const internalWrapper = (active) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  background: 'rgba(20, 20, 20, 0.4)',
  border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`,
  borderRadius: '12px',
  transition: '0.3s'
});

const transparentWrapper = {
  display: 'flex',
  alignItems: 'center',
  background: 'transparent',
  border: 'none',
  width: '100%'
};

const inputStyle = {
  background: 'transparent',
  border: 'none',
  color: 'white',
  padding: '10px 4px',
  width: '100%',
  outline: 'none',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const dropdownStyle = {
  position: 'absolute',
  top: 'calc(100% + 15px)', // Positioned below the Navbar pill
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  minWidth: '400px',
  background: 'var(--bg-card)',
  borderRadius: '20px',
  border: '1px solid var(--border)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
  zIndex: 10000,
  overflow: 'hidden',
  animation: 'slideDown 0.2s ease-out'
};

const globalSectionStyle = {
  background: 'rgba(255, 255, 255, 0.03)',
  padding: '1.25rem',
  borderTop: '1px solid var(--border)'
};

const sectionHeaderStyle = (color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.65rem',
  fontWeight: '900',
  color: color,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  marginBottom: '12px'
});

const resultItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: '0.2s',
  background: 'rgba(255,255,255,0.02)',
};

const miniResultStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: 'var(--text-soft)',
  padding: '8px 14px',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: '0.2s',
};

const typeBadgeStyle = {
  fontSize: '0.55rem',
  padding: '2px 6px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '4px',
  border: '1px solid var(--border)',
  textTransform: 'uppercase',
  fontWeight: '800'
};

const emptyTextStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-soft)',
  padding: '8px',
  fontStyle: 'italic',
  opacity: 0.5
};