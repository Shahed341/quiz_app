import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Loader2, Layers, History, Sparkles, 
    BookOpen, ExternalLink, Info 
} from 'lucide-react';
import FlashcardCreator from '../../components/Flashcards/FlashcardCreator';
import { getFlashcards } from '../../utils/api';

export default function FlashcardEditor() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Contextual Navigation Data
    const courseId = searchParams.get('courseId');
    const slug = searchParams.get('slug');
    const setUid = searchParams.get('setUid');

    const [existingData, setExistingData] = useState(null);
    const [loading, setLoading] = useState(!!setUid);

    /**
     * EFFECT: Materialization Recovery
     * If a setUid is present, we pull the existing JSON schema from the drive.
     */
    useEffect(() => {
        if (setUid) {
            setLoading(true);
            getFlashcards(setUid)
                .then(data => {
                    setExistingData(data);
                })
                .catch(err => {
                    console.error("🔴 Asset Discovery Failed:", err);
                })
                .finally(() => setLoading(false));
        } else {
            setExistingData(null);
            setLoading(false);
        }
    }, [setUid]);

    /**
     * CALLBACK: State Locking
     * Once the first card is saved in a 'new' set, we update the URL
     * to lock the editor into 'add' mode for that specific file.
     */
    const handleSetMaterialized = (newSetId, newUid) => {
        if (!setUid && newUid) {
            setSearchParams({ 
                courseId, 
                slug, 
                setUid: newUid 
            }, { replace: true });
        }
    };

    if (loading) {
        return (
            <div style={loaderStyle}>
                <Loader2 className="spin" size={44} />
                <p style={loadingText}>SYNCING SCHOLAR DRIVE...</p>
            </div>
        );
    }

    return (
        <div style={pageContainer} className="fade-in">
            
            {/* TOP NAVIGATION HUD */}
            <div style={navRow}>
                <button onClick={() => navigate(-1)} style={backBtn}>
                    <ArrowLeft size={18} /> Back to Library
                </button>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    {existingData && (
                        <div style={statusBadge}>
                            <History size={14} /> 
                            <span>{existingData.cards?.length || 0} Concepts</span>
                        </div>
                    )}
                    <div style={pathBadge}>
                        <BookOpen size={14} />
                        <span>/Courses/{slug?.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* HEADER SECTION: DYNAMIC CONTEXT */}
            <div style={headerSection} className="glass-island">
                <div style={{
                    ...iconBox, 
                    background: setUid ? 'rgba(52, 152, 219, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                    borderColor: setUid ? 'var(--accent-blue)' : 'var(--accent-green)'
                }}>
                    {setUid ? (
                        <Layers size={28} color="var(--accent-blue)" />
                    ) : (
                        <Sparkles size={28} color="var(--accent-green)" />
                    )}
                </div>
                
                <div style={{ flex: 1 }}>
                    <h1 style={titleStyle}>
                        {setUid ? `Expanding: ${existingData?.title || 'Concept Set'}` : 'Materialize New Asset'}
                    </h1>
                    <p style={subtitleStyle}>
                        {setUid 
                            ? 'Adding individual knowledge segments to the existing Scholar Drive JSON structure.' 
                            : `Initializing a new synchronized concept map for the ${slug?.toUpperCase()} registry.`}
                    </p>
                </div>

                {setUid && (
                    <button 
                        onClick={() => navigate(`/flashcards/${setUid}`)} 
                        style={previewBtn}
                    >
                        <ExternalLink size={16} /> Review Deck
                    </button>
                )}
            </div>

            {/* INFO BANNER */}
            <div style={infoBanner}>
                <Info size={18} color="var(--accent-blue)" />
                <p>Changes are written directly to your <strong>I: Scholar Drive</strong> and synchronized with MySQL in real-time.</p>
            </div>

            {/* THE MATERIALIZATION ENGINE */}
            <div style={creatorWrapper}>
                <FlashcardCreator 
                    mode={setUid ? 'add' : 'new'}
                    setId={existingData?.id} 
                    courseId={courseId}
                    slug={slug}
                    onCardAdded={(res) => {
                        if (res?.setId || res?.uid) {
                            handleSetMaterialized(res.setId, res.uid);
                        }
                    }}
                />
            </div>
        </div>
    );
}

// --- Styles Manifest ---

const pageContainer = { 
    maxWidth: '1000px', 
    margin: '0 auto', 
    padding: '4rem 2rem',
    minHeight: '100vh' 
};

const navRow = { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '2.5rem' 
};

const backBtn = { 
    background: 'none', 
    border: 'none', 
    color: 'var(--text-soft)', 
    cursor: 'pointer', 
    display: 'flex', 
    gap: '10px', 
    alignItems: 'center', 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    fontSize: '0.75rem', 
    letterSpacing: '1.5px' 
};

const statusBadge = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '8px 16px', 
    background: 'rgba(255,255,255,0.03)', 
    borderRadius: '100px', 
    fontSize: '0.7rem', 
    color: 'var(--text-soft)', 
    fontWeight: '800', 
    border: '1px solid var(--border)', 
    textTransform: 'uppercase' 
};

const pathBadge = { 
    ...statusBadge, 
    background: 'rgba(59, 130, 246, 0.05)', 
    color: 'var(--accent-blue)', 
    borderColor: 'rgba(59, 130, 246, 0.2)' 
};

const headerSection = { 
    display: 'flex', 
    gap: '30px', 
    alignItems: 'center', 
    marginBottom: '2rem', 
    padding: '3rem', 
    background: 'var(--bg-glass)', 
    borderRadius: '32px', 
    border: '1px solid var(--border)',
    backdropFilter: 'blur(20px)'
};

const iconBox = { 
    width: '80px', 
    height: '80px', 
    borderRadius: '24px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    boxShadow: 'var(--shadow-premium)', 
    border: '2px solid transparent' 
};

const titleStyle = { 
    color: 'var(--text-bold)', 
    fontSize: '2.8rem', 
    margin: 0, 
    letterSpacing: '-2px', 
    fontWeight: '900',
    lineHeight: 1.1
};

const subtitleStyle = { 
    color: 'var(--text-soft)', 
    margin: '12px 0 0 0', 
    fontSize: '1.15rem', 
    lineHeight: '1.5', 
    fontWeight: '500',
    maxWidth: '600px'
};

const previewBtn = {
    padding: '12px 24px',
    borderRadius: '16px',
    background: 'var(--bg-main)',
    border: '1px solid var(--border)',
    color: 'var(--text-bold)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '800',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const infoBanner = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    background: 'rgba(59, 130, 246, 0.03)',
    padding: '15px 25px',
    borderRadius: '18px',
    border: '1px solid rgba(59, 130, 246, 0.1)',
    marginBottom: '3rem',
    color: 'var(--text-soft)',
    fontSize: '0.9rem'
};

const creatorWrapper = {
    background: 'var(--bg-glass)',
    borderRadius: '32px',
    border: '1px solid var(--border)',
    padding: '1rem',
    backdropFilter: 'blur(10px)'
};

const loaderStyle = { 
    height: '80vh', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    color: 'var(--accent-blue)' 
};

const loadingText = {
    marginTop: '1.5rem', 
    fontWeight: '900', 
    color: 'var(--text-soft)', 
    letterSpacing: '2px',
    fontSize: '0.8rem'
};