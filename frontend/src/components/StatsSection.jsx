import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Target, Zap, Loader2, RefreshCw, Activity } from 'lucide-react';
import { getStats } from '../utils/api';

export default function StatsSection() {
  const [data, setData] = useState({
    mastery: '0%',
    streak: '0 Days',
    recent: 'No Data',
    total_quizzes: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);

    try {
      const backendStats = await getStats();
      setData({
        mastery: backendStats.avg_mastery_percent ? `${Math.round(backendStats.avg_mastery_percent)}%` : '0%',
        streak: `${backendStats.study_streak || 0} Days`,
        recent: backendStats.last_quiz_score !== null ? `${backendStats.last_quiz_score}%` : 'No Data',
        total_quizzes: backendStats.total_quizzes || 0
      });
    } catch (err) {
      console.error("🔴 Backend Stats Sync Failed:", err);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setIsRefreshing(false);
      }, 500);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    window.addEventListener('refreshData', () => fetchStats(true));
    const handleFocus = () => fetchStats(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('refreshData', () => fetchStats(true));
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchStats]);

  const stats = [
    { 
      label: 'Overall Mastery', 
      value: data.mastery, 
      icon: <Target size={22} />, 
      color: '#3498db', // var(--accent-blue)
      sub: `${data.total_quizzes} Quizzes`
    },
    { 
      label: 'Study Streak', 
      value: data.streak, 
      icon: <Zap size={22} />, 
      color: '#f39c12', // var(--accent-orange)
      sub: 'Consecutive'
    },
    { 
      label: 'Recent Score', 
      value: data.recent, 
      icon: <BarChart3 size={22} />, 
      color: '#2ecc71', // var(--accent-green)
      sub: 'Last Attempt'
    },
  ];

  if (loading) {
    return (
      <div style={containerStyle}>
        {[1, 2, 3].map(i => (
          <div key={i} style={skeletonStyle}>
            <Loader2 className="spin" color="var(--border-glass)" size={24} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {stats.map((s, i) => (
        <div key={i} className="stat-card" style={cardStyle}>
          {/* Accent Glow */}
          <div style={glowStyle(s.color)} />
          
          <div style={contentStyle}>
            <div style={headerStyle}>
              <div style={iconBoxStyle(s.color)}>
                {isRefreshing ? <RefreshCw size={18} className="spin" /> : s.icon}
              </div>
              <div>
                <p style={labelStyle}>{s.label}</p>
                <p style={subTextStyle}>{s.sub}</p>
              </div>
            </div>

            <div style={valueWrapperStyle}>
              <h3 style={valueStyle}>{s.value}</h3>
              <Activity size={32} color={s.color} style={{ opacity: 0.2 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Rewritten Screen-Fit Styles ---

const containerStyle = { 
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5vw', // Scales with screen width
  width: '100%',
  marginBottom: '2.5rem',
  justifyContent: 'space-between'
};

const cardStyle = { 
  flex: '1 1 calc(33.333% - 1.5vw)', // Forces 3 per row on wide screens
  minWidth: '280px', // Prevents squeezing too much
  background: 'var(--bg-glass)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  padding: '1.5rem', 
  borderRadius: '20px', 
  border: '1px solid var(--border-glass)', 
  boxShadow: 'var(--shadow-float)', 
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease'
};

const skeletonStyle = { 
  flex: '1 1 calc(33.333% - 1.5vw)',
  minWidth: '280px',
  height: '160px', 
  borderRadius: '20px', 
  background: 'var(--bg-glass)', 
  border: '1px solid var(--border-glass)',
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center'
};

const contentStyle = {
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '100%'
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '1rem'
};

const iconBoxStyle = (color) => ({ 
  background: `${color}15`, 
  width: '48px', 
  height: '48px',
  borderRadius: '14px',
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  color: color,
  border: `1px solid ${color}30`
});

const valueWrapperStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between'
};

const valueStyle = { 
  margin: 0, 
  fontSize: 'clamp(1.8rem, 2.5vw, 2.4rem)', // Font size fluid based on screen
  color: 'var(--text-bold)',
  fontWeight: '900', 
  letterSpacing: '-1.5px' 
};

const labelStyle = { 
  margin: 0, 
  fontSize: '0.75rem', 
  fontWeight: '800',
  color: 'var(--text-soft)', 
  textTransform: 'uppercase', 
  letterSpacing: '1px' 
};

const subTextStyle = {
  margin: 0, 
  fontSize: '0.7rem', 
  color: 'var(--text-soft)', 
  opacity: 0.5,
  fontWeight: '500'
};

const glowStyle = (color) => ({
  position: 'absolute', 
  top: '-20px', 
  right: '-20px', 
  width: '120px', 
  height: '120px',
  background: `radial-gradient(circle at center, ${color}20, transparent 70%)`,
  zIndex: 1,
  filter: 'blur(20px)'
});