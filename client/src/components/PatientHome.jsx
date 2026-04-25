import React from 'react';
import { Search, User, FileText, CheckCircle } from 'lucide-react';
import MedicationReminders from './MedicationReminders';
import DoctorMarketplace from './DoctorMarketplace';

const PatientHome = ({
    bookingStep, setBookingStep, specialtySearch, setSpecialtySearch, specialties,
    selectedSpecialty, setSelectedSpecialty, prescriptions, setActiveTab, patientData,
    setSelectedDoc, setShowConsultModal
}) => {
    return (
        <div className="fade-in">
            {bookingStep === 'specialty' ? (
                <div className="fade-in">
                    <section style={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                        padding: '3rem',
                        borderRadius: '24px',
                        color: 'white',
                        marginBottom: '2rem',
                        boxShadow: '0 20px 40px rgba(0, 137, 123, 0.2)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                            Consult India's Top Doctors Online
                        </h2>
                        <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '600px', position: 'relative', zIndex: 1 }}>
                            Instant consultation starting at ₹149. Select a specialty to begin.
                        </p>

                        <div style={{ position: 'relative', maxWidth: '500px', zIndex: 1 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'white',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                color: 'var(--text-main)'
                            }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginRight: '0.8rem', borderRight: '1px solid #eee', paddingRight: '0.8rem' }}>Search For:</span>
                                <input
                                    type="text"
                                    placeholder="specialties, doctors..."
                                    style={{ border: 'none', outline: 'none', background: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-main)' }}
                                    value={specialtySearch}
                                    onChange={(e) => setSpecialtySearch(e.target.value)}
                                />
                                <Search color="#999" size={18} />
                            </div>
                        </div>
                    </section>

                    <div style={{ marginBottom: '3rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Select Specialty</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                            {specialties.filter(s => s.name.toLowerCase().includes(specialtySearch.toLowerCase())).map(spec => (
                                <div
                                    key={spec.id}
                                    onClick={() => {
                                        setSelectedSpecialty(spec.id);
                                        setBookingStep('marketplace');
                                    }}
                                    className="card glass"
                                    style={{
                                        padding: '2rem 1.5rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        background: 'white'
                                    }}
                                >
                                    <div style={{
                                        width: '70px',
                                        height: '70px',
                                        borderRadius: '20px',
                                        background: spec.color,
                                        fontSize: '2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1.2rem',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                                    }}>
                                        {spec.icon}
                                    </div>
                                    <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>{spec.name}</h4>
                                </div>
                            ))}
                            {specialties.filter(s => s.name.toLowerCase().includes(specialtySearch.toLowerCase())).length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No specialties found matching "{specialtySearch}"
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="card" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem' }}>Active Prescriptions</h3>
                                    <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => setActiveTab('prescriptions')}>View All</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {prescriptions.length > 0 ? prescriptions.slice(0, 2).map(rx => (
                                        <div key={rx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '12px', border: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ background: 'var(--primary-light)', padding: '0.8rem', borderRadius: '12px' }}>
                                                    <FileText size={20} color="var(--primary)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '600' }}>{rx.medicines?.[0]?.name || 'Medicine'} {rx.medicines?.length > 1 ? `+${rx.medicines.length - 1} more` : ''}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dr. {rx.doctorName || 'Specialist'} • {new Date(rx.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: '600' }}>{rx.status}</span>
                                        </div>
                                    )) : (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No active prescriptions.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <MedicationReminders />
                            <div className="card" style={{ padding: '2rem', background: 'var(--primary)', color: 'white', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={20} />
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>My Profile</h4>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>Age</span>
                                        <span style={{ fontWeight: '700' }}>{patientData.patientProfile?.age || 'N/A'} Yrs</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>Blood Group</span>
                                        <span style={{ fontWeight: '700' }}>{patientData.patientProfile?.bloodGroup || 'N/A'}</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                        <p style={{ opacity: 0.8, fontSize: '0.8rem', marginBottom: '0.4rem' }}>HEALTH SUMMARY</p>
                                        <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{patientData.patientProfile?.healthHistory || 'No history recorded yet.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <button
                            onClick={() => setBookingStep('specialty')}
                            style={{ background: '#f5f5f5', border: 'none', padding: '0.6rem 1rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}
                        >
                            &larr; Back
                        </button>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selectedSpecialty} Specialists</h3>
                    </div>
                    <DoctorMarketplace
                        specialty={selectedSpecialty}
                        searchQuery={specialtySearch}
                        onSelect={(doc) => {
                            setSelectedDoc(doc);
                            setShowConsultModal(true);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default PatientHome;
