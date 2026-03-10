import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, ShieldCheck, Stethoscope, Store, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Patient'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            // Save user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('userData', JSON.stringify({
                id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                ...data.userData
            }));

            // Redirect based on role and verification status
            const userRole = data.role.toLowerCase();
            if (!data.isVerified) {
                navigate(`/register/${userRole}`);
                return;
            }

            if (userRole === 'patient') navigate('/patient-portal');
            else if (userRole === 'doctor') navigate('/doctor-portal');
            else if (userRole === 'merchant') navigate('/merchant-portal');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #f0fdfa 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            paddingTop: '100px'
        }}>
            <div className="card glass animate-fade-up" style={{
                maxWidth: '1000px',
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 450px',
                padding: '0',
                overflow: 'hidden',
                borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 25px 50px -12px rgba(0, 137, 123, 0.1)'
            }}>
                {/* Visual Side */}
                <div style={{
                    background: 'var(--primary-gradient)',
                    padding: '4rem',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-10%',
                        right: '-10%',
                        width: '300px',
                        height: '300px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        blur: '40px'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{
                            display: 'inline-flex',
                            padding: '0.8rem',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '16px',
                            marginBottom: '2rem'
                        }}>
                            <ShieldCheck size={40} strokeWidth={1.5} />
                        </div>
                        <h1 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem' }}>
                            Your Health,<br />Secured.
                        </h1>
                        <p style={{ fontSize: '1.2rem', opacity: '0.9', lineHeight: '1.6', maxWidth: '400px' }}>
                            Access India's most trusted telehealth platform for rapid consultation and genuine medicines.
                        </p>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', gap: '2rem' }}>
                        <div>
                            <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>20k+</p>
                            <p style={{ fontSize: '0.8rem', opacity: '0.7' }}>Patients Trusted</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>500+</p>
                            <p style={{ fontSize: '0.8rem', opacity: '0.7' }}>Expert Doctors</p>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div style={{ padding: '4rem', background: 'white' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            {isLogin ? 'Welcome Back' : 'Join MedicAtDoor'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {isLogin ? "Please enter your details to login" : "Start your healthcare journey today"}
                        </p>
                    </div>

                    {error && (
                        <div className="card" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '1rem', marginBottom: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <ShieldCheck size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {!isLogin && (
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        required
                                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', transition: 'all 0.3s ease' }}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none' }}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none' }}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.8rem' }}>I am a...</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    {[
                                        { id: 'Patient', icon: User },
                                        { id: 'Doctor', icon: Stethoscope },
                                        { id: 'Merchant', icon: Store }
                                    ].map(role => (
                                        <div
                                            key={role.id}
                                            onClick={() => setFormData({ ...formData, role: role.id })}
                                            style={{
                                                padding: '0.8rem',
                                                borderRadius: '12px',
                                                border: '2px solid',
                                                borderColor: formData.role === role.id ? 'var(--primary)' : '#e5e7eb',
                                                background: formData.role === role.id ? 'var(--primary-light)' : 'transparent',
                                                color: formData.role === role.id ? 'var(--primary)' : 'var(--text-muted)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <role.icon size={20} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{role.id}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? <><LogIn size={20} /> Sign In</> : <><UserPlus size={20} /> Create Account</>)}
                        </button>
                    </form>

                    <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', marginLeft: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                {isLogin ? "Join Now" : "Sign In"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
