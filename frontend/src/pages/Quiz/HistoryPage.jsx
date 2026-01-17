import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  History, Trophy, BookOpen, Search, Loader2, ArrowRight, ArrowLeft, 
  TrendingUp, BarChart3, PieChart as PieIcon, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { request } from '../../utils/api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const fetchRegistryData = () => {
    setLoading(true);
    request(`/stats/full-history?t=${Date.now()}`)
      .then(data => {
        setHistory(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRegistryData();
  }, []);

  // --- DATA AGGREGATION ENGINE ---
  const courseStats = useMemo(() => {
    const groups = history.reduce((acc, item) => {
      if (!acc[item.course_name]) {
        acc[item.course_name] = { name: item.course_name, totalScore: 0, count: 0 };
      }
      acc[item.course_name].totalScore += item.score;
      acc[item.course_name].count += 1;
      return acc;
    }, {});

    return Object.values(groups).map(g => ({
      name: g.name.split('-')[0].split(' ')[0], 
      fullName: g.name,
      average: Math.round(g.totalScore / g.count),
      count: g.count
    }));
  }, [history]);

  const filteredHistory = history.filter(item => 
    item.quiz_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={centerScreen}>
      <Loader2 className="spin" color="var(--accent-blue)" size={48} />
      <p style={syncText}>SYNCHRONIZING REAL-TIME REGISTRY...</p>
    </div>
  );

  return (
    <div style={container} className="fade-in">
      <div style={topNav}>
        <button onClick={() => navigate(-1)} style={glassCapsuleBtn}>
          <ArrowLeft size={18} /> Pathway
        </button>
        <div style={glassSearchBox}>
          <Search size={18} color="var(--accent-blue)" />
          <input 
            style={input}
            placeholder="Search attempt logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <header style={header}>
        <h1 style={title}>Performance Registry <Activity size={32} color="var(--accent-blue)" /></h1>
        <p style={sub}>Live synchronization with your Scholar Drive attempt logs.</p>
      </header>

      {/* --- ANALYTICS DASHBOARD --- */}
      <div style={chartGrid}>
        <div style={glassChartCard}>
          <div style={chartHeader}>
            <BarChart3 size={18} color="var(--accent-blue)" />
            <span>Aggregate Mastery (%)</span>
          </div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseStats} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-soft)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-soft)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Bar dataKey="average" radius={[6, 6, 0, 0]} barSize={35} isAnimationActive={false}>
                  {courseStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.average >= 80 ? 'var(--accent-green)' : 'var(--accent-blue)'} />
                  ))}
                  <LabelList dataKey="average" position="top" fill="var(--text-bold)" style={{ fontSize: '10px', fontWeight: '900' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={glassChartCard}>
          <div style={chartHeader}>
            <PieIcon size={18} color="var(--accent-orange)" />
            <span>Registry Stats</span>
          </div>
          <div style={velocityStats}>
            <div style={vItem}>
              <span style={vLabel}>Total Attempts</span>
              <span style={vVal}>{history.length}</span>
            </div>
            <div style={vItem}>
              <span style={vLabel}>Global Average</span>
              <span style={vVal}>
                {courseStats.length > 0 ? Math.round(courseStats.reduce((a,b) => a + b.average, 0) / courseStats.length) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <h2 style={sectionTitle}>Attempt Ledger</h2>
      <div style={glassTableCard}>
        {filteredHistory.length > 0 ? filteredHistory.map((item, idx) => (
          <div key={idx} style={row}>
            <div style={moduleCol}>
              <div style={dot(item.score >= 80)} />
              <div>
                <span style={qTitle}>{item.quiz_title}</span>
                <button onClick={() => navigate(`/course/${item.course_slug}`)} style={cLink}>
                  <BookOpen size={12} /> {item.course_name}
                </button>
              </div>
            </div>
            <div style={scoreCol}>
              <span style={scoreText(item.score >= 60)}>{item.score}%</span>
              <span style={dateText}>{new Date(item.attempted_at).toLocaleDateString()}</span>
            </div>
            <button onClick={() => navigate(`/quiz/${item.quiz_uid}`)} style={retryGlassBtn}>
              <ArrowRight size={18} />
            </button>
          </div>
        )) : <div style={empty}>No records found in current registry context.</div>}
      </div>
    </div>
  );
}

// --- Styles Sync'd with Paper/Glass Theme ---
const container = { maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' };
const centerScreen = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' };
const syncText = { color: 'var(--text-soft)', fontWeight: '900', letterSpacing: '2px', fontSize: '0.8rem', marginTop: '1rem' };
const topNav = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' };

const glassCapsuleBtn = { 
  background: 'var(--bg-glass)', 
  border: '1px solid var(--border)', 
  color: 'var(--text-bold)', 
  padding: '10px 24px', 
  borderRadius: '50px', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  fontWeight: '800',
  backdropFilter: 'blur(10px)',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const header = { marginBottom: '4rem' };
const title = { fontSize: '3rem', fontWeight: '900', color: 'var(--text-bold)', margin: 0, display: 'flex', alignItems: 'center', gap: '20px', letterSpacing: '-2px' };
const sub = { color: 'var(--text-soft)', fontSize: '1.1rem', marginTop: '10px', fontWeight: '500' };

const glassSearchBox = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  background: 'var(--bg-glass)', 
  padding: '12px 24px', 
  borderRadius: '50px', 
  border: '1px solid var(--border)', 
  width: '380px',
  backdropFilter: 'blur(10px)'
};

const input = { background: 'none', border: 'none', color: 'var(--text-bold)', outline: 'none', width: '100%', fontWeight: '700' };

const chartGrid = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '4rem' };

const glassChartCard = { 
  background: 'var(--bg-glass)', 
  border: '1px solid var(--border)', 
  borderRadius: '32px', 
  padding: '2.5rem', 
  boxShadow: 'var(--shadow-premium)',
  backdropFilter: 'blur(20px) saturate(180%)'
};

const chartHeader = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  color: 'var(--text-soft)', 
  fontWeight: '900', 
  textTransform: 'uppercase', 
  fontSize: '0.75rem', 
  letterSpacing: '1.5px', 
  marginBottom: '2.5rem' 
};

const velocityStats = { display: 'flex', flexDirection: 'column', gap: '30px', justifyContent: 'center', height: '80%' };
const vItem = { display: 'flex', flexDirection: 'column', borderLeft: '4px solid var(--accent-blue)', paddingLeft: '25px' };
const vLabel = { color: 'var(--text-soft)', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' };
const vVal = { color: 'var(--text-bold)', fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1px' };

const sectionTitle = { fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-bold)', marginBottom: '1.8rem', textTransform: 'uppercase', letterSpacing: '1.5px' };

const glassTableCard = { 
  background: 'var(--bg-glass)', 
  borderRadius: '32px', 
  border: '1px solid var(--border)', 
  overflow: 'hidden',
  backdropFilter: 'blur(20px)',
  boxShadow: 'var(--shadow-premium)'
};

const row = { display: 'flex', alignItems: 'center', padding: '1.8rem 3rem', borderBottom: '1px solid var(--border)', gap: '25px' };
const moduleCol = { flex: 2, display: 'flex', alignItems: 'center', gap: '18px' };
const dot = (p) => ({ width: '12px', height: '12px', borderRadius: '50%', background: p ? 'var(--accent-green)' : 'var(--accent-red)' });
const qTitle = { fontWeight: '900', color: 'var(--text-bold)', display: 'block', fontSize: '1.1rem', letterSpacing: '-0.2px' };

const cLink = { background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: 0 };
const scoreCol = { flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column' };
const scoreText = (p) => ({ fontSize: '1.8rem', fontWeight: '900', color: p ? 'var(--text-bold)' : 'var(--accent-red)' });
const dateText = { fontSize: '0.75rem', color: 'var(--text-soft)', fontWeight: '800' };

const retryGlassBtn = { 
  background: 'rgba(255,255,255,0.05)', 
  border: '1px solid var(--border)', 
  color: 'var(--text-bold)', 
  width: '44px', 
  height: '44px', 
  borderRadius: '14px', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  transition: 'transform 0.2s ease'
};

const empty = { padding: '6rem', textAlign: 'center', color: 'var(--text-soft)', fontWeight: '800', fontSize: '1.1rem' };