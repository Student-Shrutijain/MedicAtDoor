import React, { useState } from 'react';
import { Bell, Clock, Check, X } from 'lucide-react';

const MedicationReminders = () => {
    const [reminders, setReminders] = useState([
        { id: 1, med: 'Paracetamol 500mg', time: '02:00 PM', taken: false },
        { id: 2, med: 'Vitamin D3', time: '08:00 PM', taken: false },
    ]);

    const markTaken = (id) => {
        setReminders(reminders.map(r => r.id === id ? { ...r, taken: true } : r));
    };

    return (
        <div className="card fade-in" style={{ padding: '1.5rem', background: 'var(--primary-light)', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                <Bell size={20} color="var(--primary)" />
                <h4 style={{ fontWeight: '700' }}>Medication Reminders</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {reminders.filter(r => !r.taken).length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', textAlign: 'center' }}>All caught up! Stay healthy.</p>
                ) : (
                    reminders.map(r => (
                        !r.taken && (
                            <div key={r.id} style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                <div>
                                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{r.med}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Clock size={12} /> {r.time}
                                    </p>
                                </div>
                                <button
                                    onClick={() => markTaken(r.id)}
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <Check size={16} />
                                </button>
                            </div>
                        )
                    ))
                )}
            </div>

            {reminders.some(r => r.taken) && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Taken today:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {reminders.filter(r => r.taken).map(r => (
                            <span key={r.id} style={{ background: 'rgba(0, 137, 123, 0.1)', color: 'var(--primary)', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Check size={10} /> {r.med}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicationReminders;
