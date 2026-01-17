import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, FileUp, Folder, Type, Hash, 
  Loader2, Zap, ChevronLeft, CheckCircle2, 
  AlertCircle, X, Terminal, FileText, Activity
} from 'lucide-react';
import { request } from '../../utils/api';

export default function AIStudio({ mode = 'quiz' }) {
  const navigate = useNavigate();
  const logEndRef = useRef(null);
  
  // Data State
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [logs, setLogs] = useState([]);

  // Form State
  const [selectedCourse, setSelectedCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(mode === 'quiz' ? 5 : 10);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Load courses from MySQL
  useEffect(() => {
    request('/courses')
      .then(data => setCourses(data || []))
      .catch(() => setErrorMsg("Void Connection Failed: Check Scholar Backend status."));
  }, []);

  const addLog = (msg) => setLogs(prev => [...prev, `> ${msg}`]);

  const handleMaterialize = async () => {
    if (!selectedCourse) return setErrorMsg("Target Course is required.");
    if (!topic) return setErrorMsg("Topic Folder Name is required.");
    if (!file && !text.trim()) return setErrorMsg("Provide source material (PDF or Text).");

    setLoading(true);
    setStatus('processing');
    setErrorMsg('');
    setLogs(["Initializing Scholar AI Pipeline..."]);

    const formData = new FormData();
    formData.append('courseId', selectedCourse);
    formData.append('topic', topic.trim()); 
    formData.append('type', mode);
    formData.append('count', parseInt(count)); // Ensure Integer
    
    if (file) {
      formData.append('file', file);
      addLog(`Uploading: ${file.name}`);
    } else {
      formData.append('text', text);
      addLog("Analyzing raw text buffer...");
    }

    addLog("Handshaking with Gemini-1.5-Flash...");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/generate-v2`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addLog("AI Generation Successful.");
        addLog(`Materializing assets to: ${result.path}`);
        addLog("Synchronizing MySQL Registry...");
        setStatus('success');
        
        setTimeout(() => {
          navigate(mode === 'quiz' ? `/quiz/${result.uid}` : `/flashcards/${result.uid}`);
        }, 2500);
      } else {
        throw new Error(result.details || result.error || "Materialization Interrupted.");
      }
    } catch (err) {
      console.error("Pipeline Failure:", err);
      addLog(`ERROR: ${err.message}`);
      setStatus('error');
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={pageWrapper}>
      <div style={glassCard} className="fade-in">
        
        {/* Header */}
        <div style={headerSection}>
          <button onClick={() => navigate('/')} style={backBtn}>
            <ChevronLeft size={18} />
          </button>
          <div style={titleGroup}>
            <h2 style={titleStyle}>
              {mode === 'quiz' ? <Zap size={24} color="#f1c40f" /> : <FileText size={24} color="#3498db" />}
              {mode === 'quiz' ? 'Quiz Architect' : 'Concept Lab'}
            </h2>
            <p style={subtitleStyle}>Academic Void • {mode.toUpperCase()} Engine</p>
          </div>
        </div>

        {/* Configuration */}
        <div style={formGrid}>
          <div style={inputGroup}>
            <label style={labelStyle}><Folder size={12}/> Target Course</label>
            <select 
              style={selectStyle} 
              disabled={loading}
              value={selectedCourse} 
              onChange={e => setSelectedCourse(e.target.value)}
            >
              <option value="">Select Registry...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}><Terminal size={12}/> Topic Slug</label>
            <input 
              style={inputStyle} 
              disabled={loading}
              placeholder="e.g. C_Pointers_Lec" 
              value={topic} 
              onChange={e => setTopic(e.target.value.replace(/[^a-z0-9_-]/gi, '_'))} 
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}><Hash size={12}/> Count</label>
            <input 
              type="number" 
              style={inputStyle} 
              disabled={loading}
              min="1" max="50"
              value={count} 
              onChange={e => setCount(e.target.value)} 
            />
          </div>
        </div>

        {/* Source Material */}
        <div style={sourceSection}>
          <div style={uploadZone(!!file, loading)}>
            <FileUp size={24} />
            <span style={{fontWeight: 700}}>{file ? file.name : "Drop PDF Document"}</span>
            <input 
              type="file" 
              hidden 
              disabled={loading}
              onChange={e => { setFile(e.target.files[0]); setText(''); }} 
              accept=".pdf" 
            />
            {file && <X size={14} style={clearFile} onClick={() => setFile(null)} />}
          </div>
          
          {!file && (
            <textarea 
              style={textAreaStyle} 
              disabled={loading}
              placeholder="Paste Academic Notes or Code Snippets here..." 
              value={text} 
              onChange={e => setText(e.target.value)} 
            />
          )}
        </div>

        {/* Terminal Logs (Only visible during/after processing) */}
        {(status !== 'idle') && (
          <div style={terminalContainer}>
            <div style={terminalHeader}><Activity size={12} /> Materialization Log</div>
            <div style={terminalBody}>
              {logs.map((log, i) => <div key={i} style={logLine}>{log}</div>)}
              <div ref={logEndRef} />
            </div>
          </div>
        )}

        {/* Status Messaging */}
        {errorMsg && (
          <div style={errorBanner}>
            <AlertCircle size={16} /> <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <button 
          onClick={handleMaterialize} 
          disabled={loading || status === 'success'} 
          style={actionButtonStyle(loading, status)}
        >
          {status === 'idle' && <><Sparkles size={20} /> Begin Materialization</>}
          {status === 'processing' && <><Loader2 className="spin" size={20} /> AI Synthesis...</>}
          {status === 'success' && <><CheckCircle2 size={20} /> Materialization Complete</>}
          {status === 'error' && <><AlertCircle size={20} /> Retry Handshake</>}
        </button>
      </div>
    </div>
  );
}

// --- STYLES ---
const pageWrapper = { display: 'flex', justifyContent: 'center', minHeight: '80vh', padding: '40px 0' };
const glassCard = { width: '100%', maxWidth: '800px', background: 'var(--bg-glass)', backdropFilter: 'blur(30px)', border: '1px solid var(--border-glass)', borderRadius: '28px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)' };
const headerSection = { display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' };
const titleGroup = { display: 'flex', flexDirection: 'column' };
const titleStyle = { fontSize: '1.6rem', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 };
const subtitleStyle = { fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-soft)', fontWeight: '800', marginTop: '4px' };
const backBtn = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-soft)' };
const formGrid = { display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px', gap: '15px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' };
const inputStyle = { background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '0.9rem', outline: 'none' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const sourceSection = { display: 'flex', flexDirection: 'column', gap: '15px' };
const clearFile = { position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', opacity: 0.6 };
const uploadZone = (hasFile, loading) => ({ height: '90px', border: `2px dashed ${hasFile ? '#3498db' : 'var(--border)'}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', background: hasFile ? 'rgba(52,152,219,0.1)' : 'transparent', position: 'relative', color: hasFile ? '#3498db' : 'var(--text-soft)' });
const textAreaStyle = { ...inputStyle, minHeight: '120px', resize: 'none', lineHeight: '1.6' };
const terminalContainer = { background: '#0a0a0a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' };
const terminalHeader = { background: '#1a1a1a', padding: '6px 12px', fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #333' };
const terminalBody = { padding: '12px', maxHeight: '120px', overflowY: 'auto', fontFamily: '"Fira Code", monospace' };
const logLine = { fontSize: '0.75rem', color: '#2ecc71', marginBottom: '4px', opacity: 0.9 };
const errorBanner = { background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c', color: '#ff7675', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' };
const actionButtonStyle = (loading, status) => {
  let bg = '#3498db';
  if (status === 'success') bg = '#2ecc71';
  if (status === 'error') bg = '#e74c3c';
  return { 
    width: '100%', padding: '20px', borderRadius: '16px', border: 'none', background: bg, color: 'white', fontSize: '1rem', fontWeight: '900', 
    cursor: (loading || status === 'success') ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: '0.3s'
  };
};