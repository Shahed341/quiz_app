import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  RefreshCw, 
  PanelLeftClose,
  PanelLeftOpen,
  Archive,
  Plus,
  TrendingUp // Added for the History Page link
} from 'lucide-react';
import { syncFiles, getCourses } from '../utils/api';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [dynamicCourses, setDynamicCourses] = useState([]);

  useEffect(() => {
    const fetchSidebarData = () => {
      getCourses().then(setDynamicCourses).catch(console.error);
    };
    fetchSidebarData();
    window.addEventListener('refreshData', fetchSidebarData);
    return () => window.removeEventListener('refreshData', fetchSidebarData);
  }, []);

  const getShortName = (name) => {
    const match = name.match(/\d+/);
    return match ? match[0] : name.substring(0, 3).toUpperCase();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncFiles();
      window.dispatchEvent(new Event('refreshData'));
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  return (
    <aside style={{
      width: isCollapsed ? '75px' : '260px',
      height: '100vh', 
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      padding: '1.5rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: 'var(--shadow-float)'
    }}>
      
      {/* 1. BRANDING & TOGGLE HUB */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '2.5rem', 
        padding: '0 20px',
        height: '40px',
        position: 'relative'
      }}>
        <div style={{
          opacity: isCollapsed ? 0 : 1,
          transition: 'opacity 0.3s ease',
          pointerEvents: isCollapsed ? 'none' : 'all',
          whiteSpace: 'nowrap',
          zIndex: 1
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-bold)', letterSpacing: '-0.5px' }}>
            My <span style={{color: 'var(--accent-blue)'}}>Quiz</span>
          </span>
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            ...toggleBtnStyle,
            position: 'absolute',
            right: isCollapsed ? '50%' : '20px',
            top: '50%',
            transform: isCollapsed ? 'translate(50%, -50%)' : 'translateY(-50%)',
            zIndex: 2,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'var(--glass)',
            borderColor: 'var(--border-glass)',
            color: 'var(--text-soft)'
          }}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* 2. CORE NAVIGATION */}
      <nav style={navGroupStyle}>
        <SidebarItem 
          icon={<LayoutDashboard size={18} />} 
          label="Dashboard" 
          active={location.pathname === '/'} 
          collapsed={isCollapsed} 
          onClick={() => navigate('/')} 
        />

        {/* LINK TO THE NEW HISTORY PAGE */}
        <SidebarItem 
          icon={<TrendingUp size={18} />} 
          label="Performance" 
          active={location.pathname === '/history'} 
          collapsed={isCollapsed} 
          onClick={() => navigate('/history')} 
        />

        <div style={{...dividerStyle, background: 'var(--border-glass)'}} />

        {/* 3. DYNAMIC SCHOLAR DRIVE LIST */}
        <div style={courseListContainer}>
          {!isCollapsed && <p style={{...sectionLabel, color: 'var(--text-soft)'}}>Scholar Drive</p>}
          
          {dynamicCourses.map((course) => (
            <SidebarItem 
              key={course.id}
              icon={<BookOpen size={18} />} 
              label={course.name} 
              shortLabel={getShortName(course.name)}
              active={location.pathname === `/course/${course.slug}`} 
              collapsed={isCollapsed} 
              onClick={() => navigate(`/course/${course.slug}`)} 
            />
          ))}

          <SidebarItem 
            icon={<Plus size={18} />} 
            label="Add Course" 
            collapsed={isCollapsed} 
            onClick={() => navigate('/course-editor')} 
            customStyle={{
              marginTop: '10px',
              border: '1px dashed var(--border-glass)',
              background: 'var(--glass)',
              color: 'var(--accent-blue)'
            }}
          />
        </div>
      </nav>

      {/* 4. UTILITIES */}
      <div style={{...footerStyle, borderTop: '1px solid var(--border-glass)'}}>
        <SidebarItem 
          icon={<Archive size={18} />} 
          label="Archive Vault" 
          active={location.pathname === '/archive'} 
          collapsed={isCollapsed} 
          onClick={() => navigate('/archive')} 
        />

        <button 
          onClick={handleSync}
          style={{
            ...btnBaseStyle,
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '12px',
            padding: '12px',
            borderRadius: '12px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(10px)',
            color: isSyncing ? 'var(--accent-blue)' : 'var(--text-soft)',
            border: `1px solid ${isSyncing ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
            boxShadow: isSyncing ? '0 0 15px rgba(52, 152, 219, 0.2)' : 'none'
          }}
        >
          <RefreshCw size={16} className={isSyncing ? 'spin' : ''} />
          {!isCollapsed && <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>Deep Sync</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, shortLabel, active, collapsed, onClick, customStyle = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: '12px',
        borderRadius: '12px',
        background: active ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
        border: '1px solid transparent',
        borderColor: active ? 'rgba(52, 152, 219, 0.3)' : 'transparent',
        color: active ? 'var(--accent-blue)' : 'var(--text-soft)',
        gap: collapsed ? '0' : '15px',
        width: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '4px',
        ...customStyle
      }}
    >
      {collapsed && shortLabel ? (
        <span style={{ fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.5px' }}>{shortLabel}</span>
      ) : (
        icon
      )}
      {!collapsed && (
        <span style={{ fontSize: '0.85rem', fontWeight: active ? '800' : '500', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
    </button>
  );
}

const btnBaseStyle = { display: 'flex', alignItems: 'center', border: 'none', cursor: 'pointer', outline: 'none', width: '100%' };
const toggleBtnStyle = { ...btnBaseStyle, borderRadius: '10px', width: '34px', height: '34px', justifyContent: 'center' };
const navGroupStyle = { flex: 1, display: 'flex', flexDirection: 'column', padding: '0 12px', overflowY: 'auto', overflowX: 'hidden' };
const courseListContainer = { display: 'flex', flexDirection: 'column' };
const sectionLabel = { fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', padding: '15px 12px 10px 12px', opacity: 0.6 };
const dividerStyle = { margin: '15px 12px', height: '1px', opacity: 0.3 };
const footerStyle = { padding: '1rem 12px', display: 'flex', flexDirection: 'column', gap: '8px' };