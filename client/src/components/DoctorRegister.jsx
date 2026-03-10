import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Award, FileText, Briefcase, Linkedin, ExternalLink } from 'lucide-react';

const DoctorRegister = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        degree: '',
        specialization: '',
        experience: '',
        linkedin: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Doctor Registered:", form);
        localStorage.setItem('userType', 'doctor');
        localStorage.setItem('userData', JSON.stringify(form));
        navigate('/doctor');
    };

    return (
        <div className="container" style={{ padding: '120px 0 60px' }}>
            <div className="card fade-in" style={{ maxWidth: '450px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Stethoscope size={30} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Doctor Registration</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Help us provide expert care.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Full Name</label>
                        <input
                            type="text"
                            required
                            className="glass"
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                            placeholder="Dr. Sarah Wilson"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Degree</label>
                        <div style={{ position: 'relative' }}>
                            <Award size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                required
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                                placeholder="MBBS, MD"
                                value={form.degree}
                                onChange={(e) => setForm({ ...form, degree: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Specialization</label>
                        <div style={{ position: 'relative' }}>
                            <FileText size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                required
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                                placeholder="Cardiologist"
                                value={form.specialization}
                                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Experience (Years)</label>
                        <div style={{ position: 'relative' }}>
                            <Briefcase size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="number"
                                required
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                                placeholder="10"
                                value={form.experience}
                                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>
                        Register as Doctor
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DoctorRegister;
