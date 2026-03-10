import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    User, Stethoscope, Store, Calendar, Heart, Droplets,
    FileText, ShieldCheck, Upload, ChevronRight, CheckCircle,
    Smartphone, Mail, Lock, Loader2, Award, Briefcase, MapPin
} from 'lucide-react';

const ProfessionalRegister = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const [formData, setFormData] = useState({
        // Common
        phoneNumber: '',

        // Patient
        dob: '',
        bloodGroup: '',
        age: '',
        healthHistory: '',
        pastReports: [],

        // Doctor
        degree: '',
        specialization: '',
        experience: '',
        fees: '',
        bio: '',
        licenseCopy: '',

        // Merchant
        businessName: '',
        licenseNo: '',
        address: '',
        storeImage: ''
    });

    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) navigate('/auth');
    }, [token]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadData
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Upload failed');

                if (role === 'patient') {
                    setFormData(prev => ({ ...prev, pastReports: [...prev.pastReports, data.filePath] }));
                } else if (role === 'merchant') {
                    setFormData(prev => ({ ...prev, storeImage: data.filePath }));
                } else if (role === 'doctor') {
                    setFormData(prev => ({ ...prev, licenseCopy: data.filePath }));
                }
            } else {
                const text = await res.text();
                console.error('Non-JSON Response:', text);
                throw new Error(`Server error (${res.status}): Please check if the server is running correctly.`);
            }
        } catch (err) {
            console.error('File Upload Error:', err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleFinalSubmit = async () => {

        setLoading(true);
        try {
            const profileData = {};
            if (role === 'patient') {
                profileData.dob = formData.dob;
                profileData.bloodGroup = formData.bloodGroup;
                profileData.age = formData.age;
                profileData.healthHistory = formData.healthHistory;
                profileData.pastReports = formData.pastReports;
                profileData.phoneNumber = formData.phoneNumber;
            } else if (role === 'doctor') {
                profileData.degree = formData.degree;
                profileData.specialization = formData.specialization;
                profileData.experience = formData.experience;
                profileData.fees = formData.fees;
                profileData.bio = formData.bio;
                profileData.phoneNumber = formData.phoneNumber;
                profileData.licenseCopy = formData.licenseCopy;
            } else if (role === 'merchant') {
                profileData.businessName = formData.businessName;
                profileData.licenseNo = formData.licenseNo;
                profileData.address = formData.address;
                profileData.storeImage = formData.storeImage;
                profileData.phoneNumber = formData.phoneNumber;
            } else if (role === 'doctor') {
                profileData.phoneNumber = formData.phoneNumber;
            }

            const res = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ profileData, role: role.charAt(0).toUpperCase() + role.slice(1) })
            });

            if (res.ok) {
                // Update local storage
                const updatedUser = { ...user, isVerified: true, ...profileData };
                localStorage.setItem('userData', JSON.stringify(updatedUser));
                navigate(`/${role}-portal`);
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Registration Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="animate-fade-up">
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '800' }}>Professional Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {role === 'patient' && (
                                <>
                                    <FormInput label="Age" icon={Calendar} type="number" value={formData.age} onChange={v => setFormData({ ...formData, age: v })} placeholder="25" />
                                    <FormInput label="Blood Group" icon={Droplets} value={formData.bloodGroup} onChange={v => setFormData({ ...formData, bloodGroup: v })} placeholder="O+ve" />
                                    <FormInput label="Mobile Number" icon={Smartphone} value={formData.phoneNumber} onChange={v => setFormData({ ...formData, phoneNumber: v })} placeholder="+91 99XXXXXX00" />
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <FormInput label="Date of Birth" icon={Calendar} type="date" value={formData.dob} onChange={v => setFormData({ ...formData, dob: v })} />
                                        <label style={{ display: 'block', margin: '1rem 0 0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Health History</label>
                                        <textarea
                                            placeholder="Mention any past surgeries, chronic illnesses, or allergies..."
                                            style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e5e7eb', outline: 'none', minHeight: '100px' }}
                                            value={formData.healthHistory}
                                            onChange={e => setFormData({ ...formData, healthHistory: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            {role === 'doctor' && (
                                <>
                                    <FormInput label="Primary Degree" icon={Award} value={formData.degree} onChange={v => setFormData({ ...formData, degree: v })} placeholder="MBBS, MD" />
                                    <FormInput label="Specialization" icon={Stethoscope} value={formData.specialization} onChange={v => setFormData({ ...formData, specialization: v })} placeholder="Cardiologist" />
                                    <FormInput label="Experience (Years)" icon={Briefcase} type="number" value={formData.experience} onChange={v => setFormData({ ...formData, experience: v })} placeholder="10" />
                                    <FormInput label="Consultation Fee (₹)" icon={Droplets} type="number" value={formData.fees} onChange={v => setFormData({ ...formData, fees: v })} placeholder="500" />
                                    <FormInput label="Mobile Number" icon={Smartphone} value={formData.phoneNumber} onChange={v => setFormData({ ...formData, phoneNumber: v })} placeholder="+91 99XXXXXX00" />
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Professional Bio</label>
                                        <textarea
                                            placeholder="Write a brief professional summary..."
                                            style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e5e7eb', outline: 'none', minHeight: '100px' }}
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            {role === 'merchant' && (
                                <>
                                    <FormInput label="Business Name" icon={Store} value={formData.businessName} onChange={v => setFormData({ ...formData, businessName: v })} placeholder="HealPlus Pharmacy" />
                                    <FormInput label="License Number" icon={FileText} value={formData.licenseNo} onChange={v => setFormData({ ...formData, licenseNo: v })} placeholder="LIC-9988-RX" />
                                    <FormInput label="Mobile Number" icon={Smartphone} value={formData.phoneNumber} onChange={v => setFormData({ ...formData, phoneNumber: v })} placeholder="+91 99XXXXXX00" />
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <FormInput label="Physical Address" icon={MapPin} value={formData.address} onChange={v => setFormData({ ...formData, address: v })} placeholder="Plot 45, Sector 12, New Delhi" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-fade-up">
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '800' }}>Verification Step</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>We've simplified our onboarding. Please upload your supporting documents to complete your profile.</p>

                        <div style={{
                            border: '2px dashed #e5e7eb',
                            padding: '3rem',
                            borderRadius: '24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: uploading ? '#f9fafb' : 'white'
                        }}
                            onDragOver={e => e.preventDefault()}
                            onClick={() => document.getElementById('file-upload').click()}
                        >
                            <input id="file-upload" type="file" hidden onChange={handleFileUpload} />
                            {uploading ? <Loader2 size={48} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto' }} /> : <Upload size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />}
                            <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{uploading ? 'Uploading...' : 'Click or Drag files to upload'}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>PDF, JPG, PNG (Max 5MB)</p>
                        </div>

                        {((role === 'patient' && formData.pastReports.length > 0) || (role === 'merchant' && formData.storeImage) || (role === 'doctor' && formData.licenseCopy)) && (
                            <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                                {role === 'patient' && formData.pastReports.map((p, i) => (
                                    <div key={i} style={{ padding: '0.8rem 1.2rem', background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                        <FileText size={18} /> Report-{i + 1}
                                        <CheckCircle size={16} />
                                    </div>
                                ))}
                                {role === 'merchant' && formData.storeImage && (
                                    <div style={{ padding: '0.8rem 1.2rem', background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                        <Store size={18} /> Business License Uploaded
                                        <CheckCircle size={16} />
                                    </div>
                                )}
                                {role === 'doctor' && formData.licenseCopy && (
                                    <div style={{ padding: '0.8rem 1.2rem', background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                        <Award size={18} /> Medical License Uploaded
                                        <CheckCircle size={16} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #f0fdfa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', paddingTop: '100px' }}>
            <div className="card glass" style={{ maxWidth: '800px', width: '100%', padding: '4rem', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 137, 123, 0.1)' }}>

                {/* Progress Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '0', height: '2px', background: '#e5e7eb', width: '100%', zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '0', height: '2px', background: 'var(--primary)', width: `${(step - 1) * 100}%`, zIndex: 2, transition: 'all 0.5s ease' }}></div>
                    {[1, 2].map(s => (
                        <div key={s} style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: step >= s ? 'var(--primary)' : 'white',
                            color: step >= s ? 'white' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 3,
                            border: '2px solid',
                            borderColor: step >= s ? 'var(--primary)' : '#e5e7eb',
                            fontWeight: '800',
                            transition: 'all 0.3s ease'
                        }}>
                            {step > s ? <CheckCircle size={20} /> : s}
                        </div>
                    ))}
                </div>

                {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={18} /> {error}</div>}

                {renderStepContent()}

                <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        disabled={step === 1 || loading}
                        onClick={() => setStep(step - 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', visibility: step === 1 ? 'hidden' : 'visible' }}
                    >
                        Back
                    </button>

                    {step < 2 ? (
                        <button
                            className="btn-primary"
                            style={{ padding: '1rem 3rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                            onClick={() => {
                                setStep(step + 1);
                            }}
                        >
                            Continue <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            className="btn-primary"
                            style={{ padding: '1rem 3rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                            onClick={handleFinalSubmit}
                            disabled={loading || uploading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Complete Registration</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, icon: Icon, type = "text", value, onChange, placeholder }) => (
    <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            <Icon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
                type={type}
                placeholder={placeholder}
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '16px', border: '1px solid #e5e7eb', outline: 'none' }}
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    </div>
);

export default ProfessionalRegister;
