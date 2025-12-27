import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import '../styles/Graphs.css';

const Graphs = ({ coursesData }) => {
  const [dbData, setDbData] = useState({ quizzes: [], flashcards: [] });
  const history = JSON.parse(localStorage.getItem('quiz_history')) || [];

  // Fetch real data from DB to ensure counts are accurate
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [qRes, fRes] = await Promise.all([
          fetch('http://localhost:5000/api/quizzes'),
          fetch('http://localhost:5000/api/flashcards')
        ]);
        const quizzes = await qRes.json();
        const flashcards = await fRes.json();
        setDbData({ quizzes, flashcards });
      } catch (err) { 
        console.error("Fetch error in Graphs:", err); 
      }
    };
    fetchStats();
  }, []);

  // Strict Color Mapping
  const COURSE_COLORS = {
    'chem-112': '#ff4d4d', // Red
    'cmpt-215': '#2ecc71', // Green
    'cmpt-263': '#3498db', // Blue
    'stat-245': '#ff8c00', // Orange
    'other': '#555555'
  };

  const getCourseKey = (name) => {
    const n = name?.toLowerCase() || "";
    if (n.includes('chem')) return 'chem-112';
    if (n.includes('215')) return 'cmpt-215';
    if (n.includes('263')) return 'cmpt-263';
    if (n.includes('stat')) return 'stat-245';
    return 'other';
  };

  // Logic for Chart 1: Accuracy (Calculated from LocalStorage History)
  const rightAnswers = history.reduce((acc, curr) => acc + Math.round((curr.score / 100) * 20), 0);
  const totalAttempted = history.length * 20;
  const performanceData = [{ name: 'Results', right: rightAnswers, wrong: totalAttempted - rightAnswers }];

  // Logic for Chart 2: Pie (Quiz Distribution from DB)
  const quizDist = dbData.quizzes.reduce((acc, q) => {
    const key = getCourseKey(q.category);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(quizDist).map(key => ({
    name: key.toUpperCase(), 
    value: quizDist[key], 
    color: COURSE_COLORS[key]
  }));

  // Logic for Chart 3: Flashcards (Count sets in DB matching the coursesData keys)
  const flashcardData = coursesData.map(courseName => {
    const key = getCourseKey(courseName);
    const count = dbData.flashcards.filter(f => getCourseKey(f.category) === key).length;
    return { name: courseName, count: count, fill: COURSE_COLORS[key] };
  });

  return (
    <div className="stats-container-flat">
      <div className="stats-grid">
        
        {/* CHART 1: ACCURACY */}
        <div className="stats-wrapper">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stats-card-dark">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#444" fontSize={10} />
                <Bar dataKey="right" fill="#2ecc71" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wrong" fill="#ff4d4d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          <span className="stats-external-label">OVERALL ACCURACY</span>
        </div>

        {/* CHART 2: PIE DISTRIBUTION */}
        <div className="stats-wrapper">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stats-card-dark pie-card">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  innerRadius="65%" 
                  outerRadius="95%" 
                  dataKey="value" 
                  stroke="none"
                  paddingAngle={5}
                >
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend with Counts */}
            <div className="custom-pie-legend">
              {pieData.map((entry, index) => (
                <div key={index} className="legend-item">
                  <div className="color-box" style={{ background: entry.color }}></div>
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <span className="stats-external-label">QUIZ DISTRIBUTION</span>
        </div>

        {/* CHART 3: FLASHCARDS */}
        <div className="stats-wrapper">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stats-card-dark">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flashcardData} layout="vertical" margin={{ left: 5, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#666" fontSize={9} width={80} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {flashcardData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          <span className="stats-external-label">FLASHCARD RECALL SETS</span>
        </div>

      </div>
    </div>
  );
};

export default Graphs;