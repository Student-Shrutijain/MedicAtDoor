import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, User, Lock, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '',
        password: ''
    });

    const handleLogin = (e) => {
        e.preventDefault();
        console.log("Admin Logged In:", form);
        localStorage.setItem('userType', 'admin');
        navigate('/');
        alert("Admin Login Successful!");
    };

    return (
        <div className="container" style={{ padding: '120px 0 60px' }}>
            <div className="card fade-in" style={{ maxWidth: '400px', margin: '0 auto', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: '#f5f5f5', color: '#333', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <ShieldAlert size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Admin Portal</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Secure access for system administrators.</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                required
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                                placeholder="admin_id"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                required
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem', background: '#333' }}>
                        Enter Admin Dashboard <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
