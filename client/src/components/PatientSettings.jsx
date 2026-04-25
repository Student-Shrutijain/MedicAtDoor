import React from 'react';
import { Settings } from 'lucide-react';

const PatientSettings = ({ patientName, patientId, handleLogout }) => {
    return (
        <div className="fade-in">
            <div className="card" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2.5rem' }}>
                    <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '16px' }}>
                        <Settings size={32} color="var(--primary)" />
                    </div>
                    <h2 className="heading-md" style={{ marginBottom: 0 }}>Account Settings</h2>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Personal Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full Name</p>
                                <p style={{ fontWeight: '600' }}>{patientName}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Patient ID</p>
                                <p style={{ fontWeight: '600' }}>{patientId}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '1rem', color: '#d32f2f' }}>Danger Zone</h4>
                        <button
                            onClick={handleLogout}
                            className="btn-outline"
                            style={{ color: '#d32f2f', borderColor: '#d32f2f', width: '200px' }}
                        >
                            Sign Out Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientSettings;
