import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, X, Loader2, FilePlus, Sparkles, CheckCircle } from 'lucide-react';
import { request } from '../../utils/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function FlashcardCreator({ 
    mode = 'add', 
    setId, 
    courseId, 
    slug, 
    onCardAdded 
}) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const frontRef = useRef(null); // For auto-focusing after save
    
    // State Management
    const [internalSetId, setInternalSetId] = useState(setId);
    const [title, setTitle] = useState(''); 
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [isAdding, setIsAdding] = useState(mode === 'new' || !!setId);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Sync state when parent props change
    useEffect(() => {
        if (setId) {
            setInternalSetId(setId);
            setIsAdding(true);
        }
    }, [setId]);

    const handleSave = async () => {
        // 1. Validation: Files on the I: Drive must have an identity (Title)
        if (!internalSetId && !title.trim()) {
            alert("⚠️ Materialization Error: Provide a Set Title to initialize the I: Drive asset.");
            return;
        }

        if (!front.trim() || !back.trim()) {
            alert("⚠️ Logic Error: Both Front and Back fields must be populated to materialize a card.");
            return;
        }
        
        setLoading(true);
        setSuccess(false);

        try {
            const payload = {
                uid: `fc-${Date.now()}`,
                front, 
                back,
                hint: "", 
                courseId: courseId,
                slug: slug,
                title: title // Backend uses this only for the initial .json creation
            };

            // Sends 'new' if internalSetId is null to trigger file materialization
            const targetId = internalSetId || 'new';
            const res = await request(`/flashcards/${targetId}/save-card`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            // 2. State & URL Synchronization
            if (res.setId) {
                setInternalSetId(res.setId);
                
                // Update URL params so a refresh stays in "Add Mode" for this specific file
                if (res.setUid) {
                    setSearchParams({ courseId, slug, setUid: res.setUid }, { replace: true });
                }
            }

            // 3. UI Reset & Success Feedback
            setFront('');
            setBack('');
            setSuccess(true);
            
            // Auto-focus back to front for high-speed data entry
            frontRef.current?.focus();
            
            // Broadcast event to refresh sidebar/dashboard counts
            window.dispatchEvent(new Event('refreshData'));

            if (onCardAdded) onCardAdded(res);

            setTimeout(() => setSuccess(false), 2000);

        } catch (err) {
            console.error("🔴 Materialization Failure:", err);
            alert(`Scholar Drive Write Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isAdding && mode === 'add') {
        return (
            <button onClick={() => setIsAdding(true)} style={emptyStateBtnStyle}>
                <Plus size={20} /> 
                <span style={btnLabelStyle}>Materialize New Concept</span>
            </button>
        );
    }

    return (
        <div style={editorContainerStyle} className="fade-in">
            <div style={editorHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={internalSetId ? activeDot : newDot} />
                    <span style={labelStyle}>
                        {internalSetId ? 'Appending to Materialized Set' : 'Initialize New Scholar Asset'}
                    </span>
                </div>
                {mode === 'add' && (
                    <button onClick={() => setIsAdding(false)} style={closeBtnStyle} title="Close Editor">
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Title Input: Only visible before the file is materialized */}
            {!internalSetId && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={subLabelStyle}>Asset Identity (Filename)</p>
                    <input 
                        style={titleInputStyle}
                        placeholder="e.g., CMPT 360 - Algorithm Design"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                    <p style={driveHint}>I: DRIVE PATH: /Courses/{slug?.toUpperCase()}/[Title]-flashcards.json</p>
                </div>
            )}

            <div style={inputGrid}>
                <div style={{ flex: 1 }}>
                    <p style={subLabelStyle}>Front (Concept/Question)</p>
                    <textarea 
                        ref={frontRef}
                        placeholder="Define the term or prompt..."
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={subLabelStyle}>Back (Materialized Knowledge)</p>
                    <textarea 
                        placeholder="Enter the explanation or answer..."
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                        style={inputStyle}
                    />
                </div>
            </div>

            <div style={footerActionStyle}>
                <div style={syncBadge}>
                    <Sparkles size={12} />
                    <span>I: DRIVE SYNC ACTIVE</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {success && <span style={successTag}><CheckCircle size={14}/> Segment Written</span>}
                    
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        style={{ 
                            ...primaryBtn, 
                            background: internalSetId ? 'var(--accent-blue)' : 'var(--accent-green)',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? <Loader2 size={18} className="spin" /> : internalSetId ? <Plus size={18} /> : <FilePlus size={18} />}
                        {loading ? 'Writing...' : internalSetId ? 'Add Segment' : 'Materialize Asset'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Styles (Scholar Drive 2026 Theme) ---
const driveHint = { fontSize: '0.6rem', color: 'var(--accent-blue)', marginTop: '8px', fontWeight: '900', opacity: 0.8, letterSpacing: '1px' };
const editorContainerStyle = { background: 'var(--bg-card)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)', marginTop: '1rem' };
const titleInputStyle = { width: '100%', background: 'rgba(52, 152, 219, 0.05)', border: '1px solid var(--accent-blue)', borderRadius: '12px', padding: '14px 18px', color: 'white', fontSize: '1.1rem', fontWeight: '800', outline: 'none' };
const inputGrid = { display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' };
const inputStyle = { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.2rem', color: 'white', fontFamily: 'inherit', resize: 'none', height: '150px', outline: 'none', fontSize: '1rem', lineHeight: '1.6', transition: 'border-color 0.2s' };
const syncBadge = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: '900', color: 'var(--accent-green)', opacity: 0.8, letterSpacing: '1.5px' };
const primaryBtn = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', color: 'white', borderRadius: '14px', border: 'none', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', transition: '0.2s transform', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' };
const successTag = { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: '800' };
const activeDot = { width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 12px var(--accent-green)' };
const newDot = { width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-orange)', boxShadow: '0 0 12px var(--accent-orange)' };
const editorHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' };
const labelStyle = { color: 'white', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.5px' };
const subLabelStyle = { color: 'var(--text-soft)', fontSize: '0.7rem', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' };
const footerActionStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' };
const emptyStateBtnStyle = { width: '100%', padding: '3.5rem', background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: '24px', color: 'var(--text-soft)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: '0.3s all' };
const btnLabelStyle = { fontWeight: '900', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px' };
const closeBtnStyle = { background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', padding: '5px', opacity: 0.5 };