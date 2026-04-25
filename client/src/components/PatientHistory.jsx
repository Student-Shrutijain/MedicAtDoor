import React from 'react';
import { Plus } from 'lucide-react';

const PatientHistory = ({ medicalHistory, showHistoryForm, setShowHistoryForm, newHistory, setNewHistory, handleAddHistory }) => {
    return (
        <>
            <div className="fade-in card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem' }}>Complete Health History</h3>
                    <button className="btn-primary" onClick={() => setShowHistoryForm(true)} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Add History
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {medicalHistory.length > 0 ? medicalHistory.map(item => (
                        <div key={item.id} style={{ padding: '1.5rem', borderRadius: '12px', background: '#fafafa', border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h4 style={{ marginBottom: '0.5rem' }}>{item.condition}</h4>
                                <span style={{
                                    fontSize: '0.8rem',
                                    background: item.status === 'Ongoing' ? '#fff3e0' : item.status === 'Resolved' ? '#e8f5e9' : '#f5f5f5',
                                    color: item.status === 'Ongoing' ? '#ef6c00' : item.status === 'Resolved' ? '#2e7d32' : '#757575',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '20px',
                                    fontWeight: '700'
                                }}>{item.status}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Diagnosed in {item.diagnosed}</p>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No health history records found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Health History Modal */}
            {showHistoryForm && (
                <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Add Health History</h3>
                            <button onClick={() => setShowHistoryForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleAddHistory} style={{ display: 'grid', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Condition / Surgery</label>
                                <input
                                    type="text"
                                    required
                                    className="glass"
                                    placeholder="e.g. Laser Eye Surgery, Diabetes"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                    value={newHistory.condition}
                                    onChange={e => setNewHistory({ ...newHistory, condition: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Year of Diagnosis</label>
                                <input
                                    type="number"
                                    required
                                    className="glass"
                                    placeholder="e.g. 2023"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                    value={newHistory.diagnosed}
                                    onChange={e => setNewHistory({ ...newHistory, diagnosed: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Current Status</label>
                                <select
                                    className="glass"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                    value={newHistory.status}
                                    onChange={e => setNewHistory({ ...newHistory, status: e.target.value })}
                                >
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Managed">Managed</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>
                                Save History
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default PatientHistory;
