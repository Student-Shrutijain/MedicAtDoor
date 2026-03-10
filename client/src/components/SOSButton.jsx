import React, { useState } from 'react';
import { ShieldAlert, Phone, X, MapPin } from 'lucide-react';

const SOSButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
            {isOpen ? (
                <div className="card fade-in" style={{
                    background: '#e53935',
                    color: 'white',
                    borderRadius: '20px',
                    width: '300px',
                    padding: '1.5rem',
                    boxShadow: '0 10px 30px rgba(229, 57, 53, 0.4)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldAlert size={20} />
                            <span style={{ fontWeight: '700' }}>EMERGENCY SOS</span>
                        </div>
                        <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
                    </div>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1.2rem', opacity: 0.9 }}>
                        Connecting you to the nearest ambulance and emergency contact.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <button style={{
                            background: 'white',
                            color: '#e53935',
                            padding: '0.8rem',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontWeight: '700'
                        }}>
                            <Phone size={18} /> Call Ambulance (102)
                        </button>
                        <button style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            padding: '0.8rem',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontWeight: '600'
                        }}>
                            <MapPin size={18} /> Share Live Location
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        background: '#e53935',
                        color: 'white',
                        padding: '1rem 1.5rem',
                        borderRadius: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 20px rgba(229, 57, 53, 0.3)',
                        animation: 'pulse 2s infinite'
                    }}
                >
                    <ShieldAlert size={20} />
                    <span style={{ fontWeight: '700' }}>SOS Emergency</span>
                </button>
            )}

            <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 4px 15px rgba(229, 57, 53, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 4px 25px rgba(229, 57, 53, 0.5); }
          100% { transform: scale(1); box-shadow: 0 4px 15px rgba(229, 57, 53, 0.3); }
        }
      `}</style>
        </div>
    );
};

export default SOSButton;
