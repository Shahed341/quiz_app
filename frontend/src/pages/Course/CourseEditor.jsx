import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, FolderPlus, Palette, Layout } from 'lucide-react';
import { request } from '../../utils/api';

export default function CourseEditor() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color_code: '#3498db'
    });

    const colors = [
        { name: 'Blue', code: '#3498db' },
        { name: 'Green', code: '#2ecc71' },
        { name: 'Purple', code: '#9b59b6' },
        { name: 'Orange', code: '#e67e22' },
        { name: 'Red', code: '#e74c3c' },
        { name: 'Pink', code: '#fd79a8' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await request('/courses', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (res.success) {
                // Course created on I: Drive and DB
                window.dispatchEvent(new Event('refreshData'));
                navigate(`/course/${res.slug}`);
            }
        } catch (err) {
            alert("Materialization Failed: Check if Scholar Drive is connected.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="editor-page-container" style={containerStyle}>
            <button onClick={() => navigate('/')} style={backBtn}>
                <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <header style={headerStyle}>
                <div style={iconBox}><FolderPlus size={28} color="var(--accent-blue)" /></div>
                <div>
                    <h1 style={titleStyle}>Materialize New Course</h1>
                    <p style={subtitleStyle}>This will create a new directory structure on your Scholar Drive.</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} style={formStyle}>
                <div style={inputGroup}>
                    <label style={labelStyle}>Course Name</label>
                    <input 
                        style={inputStyle}
                        placeholder="e.g. Organic Chemistry II"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                    <p style={hintText}>Will be stored as: /Courses/{formData.name.toUpperCase().replace(/\s+/g, '') || '...'}</p>
                </div>

                <div style={inputGroup}>
                    <label style={labelStyle}>Description (Optional)</label>
                    <textarea 
                        style={{...inputStyle, height: '100px', resize: 'none'}}
                        placeholder="Core concepts and learning objectives..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div style={inputGroup}>
                    <label style={labelStyle}>Course Identity Color</label>
                    <div style={colorGrid}>
                        {colors.map(c => (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => setFormData({...formData, color_code: c.code})}
                                style={{
                                    ...colorCircle,
                                    background: c.code,
                                    border: formData.color_code === c.code ? '3px solid white' : 'none',
                                    transform: formData.color_code === c.code ? 'scale(1.1)' : 'scale(1)'
                                }}
                            />
                        ))}
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    style={{...submitBtn, background: formData.color_code}}
                >
                    {isSubmitting ? <Loader2 className="spin" size={20} /> : <Layout size={20} />}
                    {isSubmitting ? 'Materializing Drive Folders...' : 'Initialize Course Directory'}
                </button>
            </form>
        </div>
    );
}

// --- Internal Styles ---
const containerStyle = { maxWidth: '700px', margin: '0 auto', padding: '2rem' };
const headerStyle = { display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '3rem' };
const iconBox = { width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(52, 152, 219, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const titleStyle = { color: 'var(--text-bold)', fontSize: '2rem', margin: 0, fontWeight: '900' };
const subtitleStyle = { color: 'var(--text-soft)', margin: '5px 0 0 0', fontSize: '1rem' };
const backBtn = { background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', display: 'flex', gap: '8px', marginBottom: '1.5rem', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem' };
const formStyle = { background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '30px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' };
const inputGroup = { marginBottom: '2rem' };
const labelStyle = { display: 'block', color: 'var(--text-bold)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '15px', color: 'white', fontSize: '1rem', outline: 'none' };
const hintText = { fontSize: '0.7rem', color: 'var(--accent-blue)', marginTop: '8px', fontWeight: '700', opacity: 0.8 };
const colorGrid = { display: 'flex', gap: '15px', marginTop: '10px' };
const colorCircle = { width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', transition: '0.2s' };
const submitBtn = { width: '100%', padding: '18px', borderRadius: '16px', border: 'none', color: 'white', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '1rem' };