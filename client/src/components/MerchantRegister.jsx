import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, FileBadge, Phone, Home } from 'lucide-react';

const MerchantRegister = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        businessName: '',
        licenseNo: '',
        mobile: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Merchant Registered:", form);
        localStorage.setItem('userType', 'merchant');
        localStorage.setItem('userData', JSON.stringify(form));
        navigate('/merchant');
    };

    return (
        <div className="container" style={{ padding: '120px 0 60px' }}>
            <div className="card fade-in" style={{ maxWidth: '450px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Store size={30} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Merchant Registration</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Partner with us to deliver health.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Business Name</label>
                        <div style={{ position: 'relative' }}>
                            <Store size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                required
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                                placeholder="HealPlus Pharmacy"
                                value={form.businessName}
                                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>License Number</label>
                        <div style={{ position: 'relative' }}>
                            <FileBadge size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                required
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                                placeholder="LIC-9988-RX"
                                value={form.licenseNo}
                                onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Mobile Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="tel"
                                required
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
                                placeholder="+91 9876543210"
                                value={form.mobile}
                                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>
                        Register as Merchant
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MerchantRegister;
