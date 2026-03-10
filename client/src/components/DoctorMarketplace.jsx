import React, { useState, useEffect } from 'react';
import { Star, Clock, Calendar, CheckCircle, Loader2, Info, Search, MessageSquare } from 'lucide-react';

const DoctorMarketplace = ({ onSelect, specialty, searchQuery: externalSearchQuery }) => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');

    useEffect(() => {
        if (externalSearchQuery) setSearchQuery(externalSearchQuery);
    }, [externalSearchQuery]);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await fetch('/api/doctors');
            const data = await response.json();
            setDoctors(data);
        } catch (error) {
            console.error("Error fetching doctors:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDoctors = doctors.filter(doc => {
        const matchesSpecialty = specialty ? doc.specialization.toLowerCase().includes(specialty.toLowerCase()) : true;
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSpecialty && matchesSearch;
    });

    return (
        <div className="fade-in">
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid #eee'
                }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginRight: '0.8rem', borderRight: '1px solid #eee', paddingRight: '0.8rem' }}>Search For:</span>
                    <input
                        type="text"
                        placeholder="doctors, languages..."
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-main)' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search color="#999" size={18} />
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Showing earliest available doctors near you</p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {filteredDoctors.map(doc => (
                        <div key={doc.id} className="card fade-in" style={{
                            padding: '1.5rem',
                            background: 'white',
                            borderRadius: '20px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                            border: '1px solid #f0f0f0',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(120px, 150px) 1fr',
                            gap: '2rem',
                            position: 'relative'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    background: '#f8f9fa',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1rem',
                                    overflow: 'hidden',
                                    border: '1px solid #eee'
                                }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)' }}>
                                        {doc.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                </div>
                                <div style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    display: 'inline-block'
                                }}>
                                    {doc.experience} exp
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{doc.name}</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.2rem' }}>MBBS, MD (Verifed Specialist)</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doc.specialization}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)' }}>MedicAtDoor SELECT</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Near You</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        <MessageSquare size={14} color="var(--primary)" />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>English, Hindi, Bengali</span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>₹ {doc.fees}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => setViewingDoc(doc)}
                                        style={{
                                            flex: 1,
                                            background: 'none',
                                            border: '1px solid #eee',
                                            color: 'var(--primary)',
                                            padding: '0.8rem',
                                            borderRadius: '12px',
                                            fontSize: '0.9rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Know More
                                    </button>
                                    <button
                                        onClick={() => onSelect(doc)}
                                        style={{
                                            flex: 1,
                                            background: '#ff7043',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.8rem',
                                            borderRadius: '12px',
                                            fontSize: '0.9rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(255, 112, 67, 0.3)'
                                        }}
                                    >
                                        Consult Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Doctor Detail Modal */}
            {viewingDoc && (
                <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '1.8rem', maxHeight: '85vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>
                                    {viewingDoc.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{viewingDoc.name}</h2>
                                    <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem' }}>{viewingDoc.specialization}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                            <div style={{ background: '#f5f5f5', padding: '0.8rem', borderRadius: '12px' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Experience</p>
                                <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{viewingDoc.experience}</p>
                            </div>
                            <div style={{ background: '#f5f5f5', padding: '0.8rem', borderRadius: '12px' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fee</p>
                                <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>Rs. {viewingDoc.fees}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>About Practitioner</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                {viewingDoc.name} is a highly regarded specialist with over {viewingDoc.experience} of clinical experience.
                                known for an empathetic approach and precision in diagnostics.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button onClick={() => { onSelect(viewingDoc); setViewingDoc(null); }} className="btn-primary" style={{ flex: 1, padding: '0.8rem', fontSize: '0.9rem' }}>Book Now</button>
                            <button onClick={() => setViewingDoc(null)} style={{ flex: 1, padding: '0.8rem', background: '#eee', color: '#666', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>Back</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '2rem', background: 'var(--primary-light)', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                <Info size={20} color="var(--primary)" style={{ marginTop: '2px' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--primary-dark)' }}>
                    <strong>Trust Guarantee:</strong> All doctors on MedicAtDoor are verified medical professionals with at least 5 years of clinical experience.
                </p>
            </div>
        </div>
    );
};

export default DoctorMarketplace;
