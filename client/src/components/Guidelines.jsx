import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

const Guidelines = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ padding: '120px 0 60px' }}>
            <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800' }}>Guidelines & Precautions</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Please read these important instructions before proceeding with your health intake.</p>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: '#d32f2f' }}>
                            <AlertTriangle size={20} /> Emergency Notice
                        </h3>
                        <p style={{ background: '#fff5f5', padding: '1.2rem', borderRadius: '12px', border: '1px solid #ffebee', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            If you are experiencing severe chest pain, difficulty breathing, sudden weakness, or any life-threatening emergency, please <strong>STOP</strong> and use the <strong>SOS Button</strong> or call emergency services immediately.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                            <CheckCircle size={20} color="var(--primary)" /> Pre-Intake Checklist
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', marginTop: '0.6rem', flexShrink: 0 }} />
                                <span>Ensure you are in a quiet, private environment.</span>
                            </li>
                            <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', marginTop: '0.6rem', flexShrink: 0 }} />
                                <span>Have your basic medical history and current medication names ready.</span>
                            </li>
                            <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', marginTop: '0.6rem', flexShrink: 0 }} />
                                <span>Be as specific as possible about the duration and severity of your symptoms.</span>
                            </li>
                        </ul>
                    </section>
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <button
                        className="btn-primary"
                        style={{ padding: '1rem 3rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 auto' }}
                        onClick={() => navigate('/register/patient')}
                    >
                        I Understand, Continue <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Guidelines;
