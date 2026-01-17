import React, { useEffect, useState } from 'react';
import { RotateCcw, Trash2, Archive, ArrowLeft, Loader2, BookOpen, Layers, GraduationCap, AlertTriangle } from 'lucide-react';
import { request } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function ArchiveVault() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchArchive = async () => {
        setLoading(true);
        try {
            const res = await request('/archive'); 
            // FIXED: Handle PowerShell/Wrapper style response { value: [], count: x }
            const data = Array.isArray(res) ? res : (res.value || []);
            setItems(data);
        } catch (err) {
            console.error("🔴 Failed to fetch archive:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchArchive(); }, []);

    const handleRestore = async (type, id) => {
        try {
            await request('/archive/restore', { 
                method: 'POST', 
                body: JSON.stringify({ type, id }) 
            });
            window.dispatchEvent(new Event('refreshData')); 
            fetchArchive();
        } catch (err) {
            alert("Failed to restore item.");
        }
    };

    const handlePermanentDelete = async (type, id) => {
        const warning = type === 'course' 
            ? "⚠️ CRITICAL: Deleting this course will permanently wipe all linked Quizzes and Flashcards from the database. This cannot be undone."
            : "⚠️ WARNING: This will permanently delete this record from the database.";

        if (window.confirm(warning)) {
            try {
                await request('/archive/permanent', { 
                    method: 'DELETE', 
                    body: JSON.stringify({ type, id }) 
                });
                fetchArchive();
            } catch (err) {
                alert("Failed to purge item.");
            }
        }
    };

    // Grouping Logic
    const courses = items.filter(i => i.type === 'course');
    const quizzes = items.filter(i => i.type === 'quiz');
    const flashcards = items.filter(i => i.type === 'flashcard');

    if (loading) return (
        <div style={centeredContainer}>
            <Loader2 className="spin" size={44} color="var(--accent-orange)" />
            <p style={{marginTop: '1rem', color: 'var(--text-soft)'}}>Accessing Secure Vault...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
            <button onClick={() => navigate(-1)} style={backBtn}><ArrowLeft size={18}/> Back</button>
            
            <header style={headerStyle}>
                <div style={iconCircle}>
                    <Archive size={40} color="var(--accent-orange)" />
                </div>
                <h1 style={titleStyle}>Archive Vault</h1>
                <p style={{ color: 'var(--text-soft)' }}>Restore records or purge them from the SQL database forever.</p>
            </header>

            {items.length === 0 ? (
                <div style={emptyState}>
                    <Archive size={48} style={{opacity: 0.1, marginBottom: '1rem'}}/>
                    <p>The vault is currently empty.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
                    {courses.length > 0 && (
                        <ArchiveSection title="Archived Courses" icon={<GraduationCap size={20} color="var(--accent-blue)" />} items={courses} onRestore={handleRestore} onPurge={handlePermanentDelete} />
                    )}
                    {quizzes.length > 0 && (
                        <ArchiveSection title="Archived Quizzes" icon={<BookOpen size={20} color="var(--accent-green)" />} items={quizzes} onRestore={handleRestore} onPurge={handlePermanentDelete} />
                    )}
                    {flashcards.length > 0 && (
                        <ArchiveSection title="Archived Flashcards" icon={<Layers size={20} color="var(--accent-orange)" />} items={flashcards} onRestore={handleRestore} onPurge={handlePermanentDelete} />
                    )}
                </div>
            )}
        </div>
    );
}

function ArchiveSection({ title, icon, items, onRestore, onPurge }) {
    return (
        <section>
            <div style={sectionHeader}>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    {icon}
                    <h2 style={sectionTitleStyle}>{title}</h2>
                    <span style={countBadge}>{items.length}</span>
                </div>
            </div>
            <div style={listStyle}>
                {items.map(item => (
                    <div key={`${item.type}-${item.id}`} style={itemCard}>
                        <div>
                            <h3 style={itemTitleStyle}>{item.title}</h3>
                            <span style={idTag}>ID: {item.id}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => onRestore(item.type, item.id)} style={undoBtn}>
                                <RotateCcw size={16} /> Undo
                            </button>
                            <button onClick={() => onPurge(item.type, item.id)} style={purgeBtn}>
                                <Trash2 size={16} /> Purge
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// --- Styles ---
const centeredContainer = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' };
const headerStyle = { textAlign: 'center', marginBottom: '4rem' };
const titleStyle = { fontSize: '2.8rem', margin: '10px 0', color: 'var(--text-bold)', fontWeight: '900', letterSpacing: '-1.5px' };
const sectionHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' };
const sectionTitleStyle = { fontSize: '1.1rem', margin: 0, color: 'var(--text-bold)', textTransform: 'uppercase', letterSpacing: '1px' };
const countBadge = { background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: '800' };
const listStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const emptyState = { textAlign: 'center', padding: '6rem', background: 'var(--bg-card)', borderRadius: '32px', border: '1px dashed var(--border)', color: 'var(--text-soft)' };
const iconCircle = { width: '80px', height: '80px', background: 'rgba(255, 140, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' };
const backBtn = { background:'none', border:'none', color:'var(--text-soft)', cursor:'pointer', display:'flex', gap:'8px', marginBottom:'2rem', fontWeight: '800' };
const itemCard = { background: 'var(--bg-card)', padding: '1.2rem 1.8rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' };
const itemTitleStyle = { margin: 0, color: 'var(--text-bold)', fontSize: '1.1rem', fontWeight: '700' };
const idTag = { fontSize: '0.65rem', color: 'var(--text-soft)', opacity: 0.5, textTransform: 'uppercase' };
const undoBtn = { background: 'rgba(46, 204, 113, 0.1)', color: 'var(--accent-green)', border: '1px solid rgba(46, 204, 113, 0.2)', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '700' };
const purgeBtn = { background: 'rgba(255, 77, 77, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '700' };