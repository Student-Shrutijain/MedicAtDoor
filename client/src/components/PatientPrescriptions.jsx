import React from 'react';
import { FileText, Loader2, CheckCircle, Send } from 'lucide-react';

const PatientPrescriptions = ({ prescriptions, sendToMerchant, sendingOrderId, sendSuccess }) => {
    return (
        <div className="fade-in card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Digital Prescriptions</h3>
            {prescriptions.length > 0 ? (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {prescriptions.map(rx => (
                        <div key={rx.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f0f0f0' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h4 style={{ color: 'var(--primary)', marginBottom: '0.2rem', fontSize: '1.2rem', fontWeight: '800' }}>{rx.problem}</h4>
                                        <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Dr. {rx.doctorName}</p>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', background: '#e8f5e9', color: '#2e7d32', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: '700' }}>{rx.status}</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                    {rx.medicines?.map((med, idx) => (
                                        <div key={idx} style={{ borderBottom: idx !== rx.medicines.length - 1 ? '1px solid #e2e8f0' : 'none', paddingBottom: '0.5rem' }}>
                                            <p style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{med.name}</p>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <span>Dosage: {med.dosage}</span>
                                                <span>Duration: {med.duration}</span>
                                            </div>
                                            {med.instructions && <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontStyle: 'italic', marginTop: '0.2rem' }}>{med.instructions}</p>}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {rx.id} • {new Date(rx.date).toLocaleDateString()}</p>
                                    <button
                                        onClick={() => sendToMerchant(rx)}
                                        disabled={sendingOrderId === (rx._id || rx.id) || rx.status.includes('Available')}
                                        style={{
                                            color: 'white',
                                            fontWeight: '700',
                                            background: rx.status.includes('Available') ? '#2e7d32' : 'var(--primary)',
                                            border: 'none',
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '10px',
                                            cursor: (sendingOrderId === (rx._id || rx.id) || rx.status.includes('Available')) ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 4px 12px rgba(0, 137, 123, 0.1)'
                                        }}
                                    >
                                        {sendingOrderId === (rx._id || rx.id) ? <Loader2 className="animate-spin" size={16} /> : (rx.status.includes('Available') || sendSuccess === (rx._id || rx.id)) ? <CheckCircle size={16} /> : <Send size={16} />}
                                        {sendSuccess === (rx._id || rx.id) ? 'Successfully Sent to Merchant' : (rx.status.includes('Available') ? 'Available at Shop' : 'Broadcast to Merchants')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No prescriptions found in your vault.</p>
            )}
        </div>
    );
};

export default PatientPrescriptions;
