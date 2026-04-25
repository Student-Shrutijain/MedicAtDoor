import React from 'react';
import { Calendar, CheckCircle, Loader2, AlertTriangle, Clock } from 'lucide-react';

const PatientAppointments = ({ patientRequests, setActiveTab, setBookingStep }) => {
    return (
        <div className="fade-in card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem' }}>My Appointments</h3>
                <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem' }} onClick={() => { setActiveTab('home'); setBookingStep('specialty'); }}>Book New Consultation</button>
            </div>

            {patientRequests.length > 0 ? (
                <div style={{ display: 'grid', gap: '1.2rem' }}>
                    {patientRequests.map(req => (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', borderRadius: '16px', background: 'white', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>{req.doctorName}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{req.consultationDetails?.slotDate} at {req.consultationDetails?.slotTime}</p>
                                    <p style={{ fontSize: '0.75rem', background: '#f5f5f5', padding: '0.1rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.3rem' }}>{req.consultationDetails?.mode}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                {req.historyAcknowledged && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600', marginBottom: '0.2rem' }}>
                                        History Reviewed
                                    </div>
                                )}
                                <div style={{
                                    fontSize: '0.75rem',
                                    background: req.status === 'Fulfilled' ? '#e8f5e9' :
                                        req.status === 'Processing' ? '#fff3e0' :
                                            req.status === 'Declined' ? '#ffebee' :
                                                req.status === 'Pending' ? '#f5f5f5' : '#f5f5f5',
                                    color: req.status === 'Fulfilled' ? '#2e7d32' :
                                        req.status === 'Processing' ? '#ef6c00' :
                                            req.status === 'Declined' ? '#c62828' :
                                                req.status === 'Pending' ? '#757575' : '#757575',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '20px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}>
                                    {req.status === 'Fulfilled' && <CheckCircle size={12} />}
                                    {req.status === 'Processing' && <Loader2 className="animate-spin" size={12} />}
                                    {req.status === 'Declined' && <AlertTriangle size={12} />}
                                    {req.status === 'Pending' && <Clock size={12} />}
                                    {req.status === 'Fulfilled' ? 'Success' : req.status === 'Processing' ? 'Doctor Reviewing' : req.status}
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {req.id}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <div style={{ background: '#f8f9fa', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Calendar size={40} color="#ccc" />
                    </div>
                    <h4 style={{ marginBottom: '0.5rem' }}>No Appointments Found</h4>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You haven't booked any consultations yet.</p>
                    <button className="btn-primary" onClick={() => { setActiveTab('home'); setBookingStep('specialty'); }}>Start Booking</button>
                </div>
            )}
        </div>
    );
};

export default PatientAppointments;
