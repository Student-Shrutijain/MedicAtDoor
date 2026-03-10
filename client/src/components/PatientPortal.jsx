import React, { useState, useEffect } from 'react';
import {
    Home,
    Calendar,
    FileText,
    History as HistoryIcon,
    Settings,
    LogOut,
    Search,
    Bell,
    User,
    MapPin,
    Phone,
    Clock,
    ArrowRight,
    ShieldCheck,
    Plus,
    Loader2,
    CheckCircle,
    MessageSquare,
    AlertTriangle,
    Send,
    Video
} from 'lucide-react';
import MedicationReminders from './MedicationReminders';
import DoctorMarketplace from './DoctorMarketplace';
import VideoConsultation from './VideoConsultation';

const PatientPortal = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [symptoms, setSymptoms] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [matchedDoctors, setMatchedDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [sendingOrderId, setSendingOrderId] = useState(null);
    const [sendSuccess, setSendSuccess] = useState(null);
    const [showConsultModal, setShowConsultModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [consultForm, setConsultForm] = useState({
        reason: '',
        duration: '',
        severity: 'Moderate',
        slotDate: '',
        slotTime: '',
        mode: 'Video Call'
    });
    const [patientRequests, setPatientRequests] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState(null);
    const [bookingStep, setBookingStep] = useState('specialty'); // 'specialty' or 'marketplace'
    const [specialtySearch, setSpecialtySearch] = useState('');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showAddProfileForm, setShowAddProfileForm] = useState(false);
    const [patientProfiles, setPatientProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [newProfile, setNewProfile] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        dob: '',
        age: '',
        relation: 'Self'
    });
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [showHistoryForm, setShowHistoryForm] = useState(false);
    const [newHistory, setNewHistory] = useState({ condition: '', diagnosed: '', status: 'Ongoing' });
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [callRoomId, setCallRoomId] = useState(null);

    const patientData = JSON.parse(localStorage.getItem('userData') || '{}');
    const patientName = patientData.name || 'Alex Johnson';
    const patientId = patientData.id || 'P-4492';
    const API_BASE = 'http://localhost:5000/api';

    useEffect(() => {
        const syncAndLoad = async () => {
            try {
                // 1. Sync & Load Profiles
                const profileRes = await fetch(`${API_BASE}/users/profile?email=alex@example.com&role=Patient`);
                let profileData = await profileRes.json();

                if (!profileData || !profileData.userData) {
                    // Migration from LocalStorage
                    const localProfiles = JSON.parse(localStorage.getItem('patientProfiles') || '[]');
                    const initial = localProfiles.length > 0 ? localProfiles : [{
                        id: 'prof-1', name: patientName, gender: 'Male', dob: '1995-05-15', age: '28', relation: 'Self'
                    }];

                    const updateRes = await fetch(`${API_BASE}/users/profile`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: 'alex@example.com', role: 'Patient', userData: { profiles: initial } })
                    });
                    const synced = await updateRes.json();
                    setPatientProfiles(synced.userData.profiles);
                    setSelectedProfile(synced.userData.profiles[0]);
                } else {
                    setPatientProfiles(profileData.userData.profiles);
                    setSelectedProfile(profileData.userData.profiles[0]);
                }

                // 2. Load Appointments & Rx
                loadRequestsData();
            } catch (err) {
                console.error('Initial load error:', err);
            }
        };

        const loadRequestsData = async () => {
            try {
                // Fetch Prescriptions
                const rxRes = await fetch(`${API_BASE}/prescriptions`);
                const allRx = await rxRes.json();
                setPrescriptions(allRx.filter(rx =>
                    rx.patientName.toLowerCase().includes(patientName.toLowerCase())
                ));

                // Fetch Appointments
                const apptRes = await fetch(`${API_BASE}/appointments?patientId=${patientId}`);
                const appts = await apptRes.json();
                setPatientRequests(appts);

                // Check for active video calls (status 'Processing' and mode 'Video Call')
                const activeCall = appts.find(a => a.status === 'Processing' && a.consultationDetails?.mode === 'Video Call');
                if (activeCall && !showVideoCall) {
                    setCallRoomId(activeCall._id || activeCall.id);
                    setShowVideoCall(true);
                }

                // Fetch Health History
                const historyRes = await fetch(`${API_BASE}/health-records?patientId=${patientId}`);
                const history = await historyRes.json();
                if (history.length === 0) {
                    // Initial seed for mock look if DB is empty
                    const initial = [
                        { patientId, condition: 'Seasonal Allergies', diagnosed: '2024', status: 'Ongoing' },
                        { patientId, condition: 'Mild Asthama', diagnosed: '2022', status: 'Managed' }
                    ];
                    for (const item of initial) {
                        await fetch(`${API_BASE}/health-records`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item)
                        });
                    }
                    setMedicalHistory(initial);
                } else {
                    setMedicalHistory(history);
                }
            } catch (err) {
                console.error('Data load error:', err);
            }
        };

        syncAndLoad();
        const interval = setInterval(loadRequestsData, 5000);
        return () => clearInterval(interval);
    }, [patientName, patientId]);

    const handleAddHistory = async (e) => {
        e.preventDefault();
        try {
            const item = { patientId, ...newHistory };
            const res = await fetch(`${API_BASE}/health-records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            const saved = await res.json();
            setMedicalHistory([saved, ...medicalHistory]);
            setNewHistory({ condition: '', diagnosed: '', status: 'Ongoing' });
            setShowHistoryForm(false);
        } catch (err) {
            alert('Failed to save health record');
        }
    };

    const sendToMerchant = (rx) => {
        setSendingOrderId(rx.id);
        // This still uses a mock timeout but the data originates from DB
        setTimeout(() => {
            setSendingOrderId(null);
            setSendSuccess(rx.id);
            setTimeout(() => setSendSuccess(null), 3000);
        }, 1500);
    };

    const handleSymptomSearch = async (e) => {
        e.preventDefault();
        if (!symptoms) return;
        setLoading(true);
        setIsSearching(true);
        setTimeout(() => setLoading(false), 800);
    };

    const handleAddProfile = async (e) => {
        e.preventDefault();
        const profile = {
            id: `prof-${Date.now()}`,
            name: `${newProfile.firstName} ${newProfile.lastName}`,
            ...newProfile
        };
        const updated = [...patientProfiles, profile];

        try {
            await fetch(`${API_BASE}/users/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'alex@example.com', role: 'Patient', userData: { profiles: updated } })
            });
            setPatientProfiles(updated);
            setShowAddProfileForm(false);
            setNewProfile({ firstName: '', lastName: '', gender: '', dob: '', age: '', relation: 'Self' });
        } catch (err) {
            alert('Failed to add profile to database');
        }
    };

    const handleSubmitConsult = async (e) => {
        e.preventDefault();
        const newRequest = {
            patientId: patientId,
            patientName: selectedProfile.name,
            doctorName: selectedDoc.name,
            symptoms: symptoms,
            medicalHistory: medicalHistory,
            consultationDetails: {
                ...consultForm,
                timestamp: new Date().toISOString()
            }
        };

        try {
            await fetch(`${API_BASE}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRequest)
            });
            alert(`Consultation request sent for ${selectedProfile.name} to ${selectedDoc.name}!`);
            setShowConsultModal(false);
            setIsSearching(false);
            setSymptoms('');
        } catch (err) {
            alert('Failed to send consultation request');
        }
    };

    const SidebarItem = ({ icon: Icon, label, id }) => (
        <div
            onClick={() => {
                setActiveTab(id);
                if (id === 'home') setBookingStep('specialty');
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.2rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: activeTab === id ? 'var(--primary-light)' : 'transparent',
                color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === id ? '600' : '400'
            }}
        >
            <Icon size={20} />
            <span>{label}</span>
        </div>
    );

    const specialties = [
        { id: 'Physician', name: 'Physician', icon: '👨‍⚕️', color: '#E3F2FD' },
        { id: 'Pediatrician', name: 'Pediatrician', icon: '👶', color: '#FCE4EC' },
        { id: 'Gynaecologist', name: 'Gynaecologist', icon: '🤰', color: '#F3E5F5' },
        { id: 'Dermatologist', name: 'Dermatologist', icon: '🧴', color: '#E8F5E9' },
        { id: 'Cardiologist', name: 'Cardiologist', icon: '❤️', color: '#FFEBEE' },
        { id: 'Dietitian', name: 'Dietitian', icon: '🥗', color: '#F1F8E9' },
        { id: 'Orthopedician', name: 'Orthopedician', icon: '🦴', color: '#EFEBE9' },
        { id: 'Surgeon', name: 'General Surgeon', icon: '🔪', color: '#ECEFF1' },
    ];

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'var(--bg-color)',
            paddingTop: '80px'
        }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                background: 'white',
                borderRight: '1px solid #eee',
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                position: 'fixed',
                height: 'calc(100vh - 80px)',
                left: 0,
                zIndex: 50
            }}>
                <div style={{ padding: '0 1.2rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{patientName}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient ID: P-4492</p>
                        </div>
                    </div>
                </div>

                <SidebarItem icon={Home} label="Dashboard" id="home" />
                <SidebarItem icon={Calendar} label="Appointments" id="appointments" />
                <SidebarItem icon={FileText} label="Prescriptions" id="prescriptions" />
                <SidebarItem icon={HistoryIcon} label="Health History" id="history" />

                <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <SidebarItem icon={Settings} label="Settings" id="settings" />
                    <SidebarItem icon={LogOut} label="Logout" id="logout" />
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, marginLeft: '280px', padding: '2rem 3rem' }}>
                {activeTab === 'home' && (
                    <div className="fade-in">
                        {bookingStep === 'specialty' ? (
                            <div className="fade-in">
                                <section style={{
                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                    padding: '3rem',
                                    borderRadius: '24px',
                                    color: 'white',
                                    marginBottom: '2rem',
                                    boxShadow: '0 20px 40px rgba(0, 137, 123, 0.2)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                                        Consult India's Top Doctors Online
                                    </h2>
                                    <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '600px', position: 'relative', zIndex: 1 }}>
                                        Instant consultation starting at ₹149. Select a specialty to begin.
                                    </p>

                                    <div style={{ position: 'relative', maxWidth: '500px', zIndex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            background: 'white',
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            color: 'var(--text-main)'
                                        }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginRight: '0.8rem', borderRight: '1px solid #eee', paddingRight: '0.8rem' }}>Search For:</span>
                                            <input
                                                type="text"
                                                placeholder="specialties, doctors..."
                                                style={{ border: 'none', outline: 'none', background: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-main)' }}
                                                value={specialtySearch}
                                                onChange={(e) => setSpecialtySearch(e.target.value)}
                                            />
                                            <Search color="#999" size={18} />
                                        </div>
                                    </div>
                                </section>

                                <div style={{ marginBottom: '3rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Select Specialty</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                        {specialties.filter(s => s.name.toLowerCase().includes(specialtySearch.toLowerCase())).map(spec => (
                                            <div
                                                key={spec.id}
                                                onClick={() => {
                                                    setSelectedSpecialty(spec.id);
                                                    setBookingStep('marketplace');
                                                }}
                                                className="card glass"
                                                style={{
                                                    padding: '2rem 1.5rem',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    border: '1px solid rgba(0,0,0,0.05)',
                                                    background: 'white'
                                                }}
                                            >
                                                <div style={{
                                                    width: '70px',
                                                    height: '70px',
                                                    borderRadius: '20px',
                                                    background: spec.color,
                                                    fontSize: '2rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    margin: '0 auto 1.2rem',
                                                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                                                }}>
                                                    {spec.icon}
                                                </div>
                                                <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>{spec.name}</h4>
                                            </div>
                                        ))}
                                        {specialties.filter(s => s.name.toLowerCase().includes(specialtySearch.toLowerCase())).length === 0 && (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                                No specialties found matching "{specialtySearch}"
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Body Weight</p>
                                                <h4 style={{ fontSize: '1.5rem' }}>68 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kg</span></h4>
                                            </div>
                                            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Blood Pressure</p>
                                                <h4 style={{ fontSize: '1.5rem' }}>120/80</h4>
                                            </div>
                                            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Heart Rate</p>
                                                <h4 style={{ fontSize: '1.5rem' }}>72 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>bpm</span></h4>
                                            </div>
                                        </div>

                                        <div className="card" style={{ padding: '2rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                                <h3 style={{ fontSize: '1.2rem' }}>Active Prescriptions</h3>
                                                <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => setActiveTab('prescriptions')}>View All</button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {prescriptions.length > 0 ? prescriptions.slice(0, 2).map(rx => (
                                                    <div key={rx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '12px', border: '1px solid #eee' }}>
                                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                            <div style={{ background: 'var(--primary-light)', padding: '0.8rem', borderRadius: '12px' }}>
                                                                <FileText size={20} color="var(--primary)" />
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: '600' }}>{rx.medicine}</p>
                                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rx.doctorName} • {rx.date}</p>
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: '600' }}>{rx.status}</span>
                                                    </div>
                                                )) : (
                                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No active prescriptions.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <MedicationReminders />
                                        <div className="card" style={{ padding: '2rem', background: 'var(--primary)', color: 'white', borderRadius: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={20} />
                                                </div>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>My Profile</h4>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>Age</span>
                                                    <span style={{ fontWeight: '700' }}>{patientData.patientProfile?.age || 'N/A'} Yrs</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>Blood Group</span>
                                                    <span style={{ fontWeight: '700' }}>{patientData.patientProfile?.bloodGroup || 'N/A'}</span>
                                                </div>
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                                    <p style={{ opacity: 0.8, fontSize: '0.8rem', marginBottom: '0.4rem' }}>HEALTH SUMMARY</p>
                                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{patientData.patientProfile?.healthHistory || 'No history recorded yet.'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="fade-in">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                    <button
                                        onClick={() => setBookingStep('specialty')}
                                        style={{ background: '#f5f5f5', border: 'none', padding: '0.6rem 1rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}
                                    >
                                        &larr; Back
                                    </button>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selectedSpecialty} Specialists</h3>
                                </div>
                                <DoctorMarketplace
                                    specialty={selectedSpecialty}
                                    searchQuery={specialtySearch} // Pass search query to marketplace
                                    onSelect={(doc) => {
                                        setSelectedDoc(doc);
                                        setShowProfileModal(true); // Open profile selection first
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'appointments' && (
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
                                <button className="btn-primary" onClick={() => setActiveTab('home')}>Start Booking</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'prescriptions' && (
                    <div className="fade-in card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Digital Prescriptions</h3>
                        {prescriptions.length > 0 ? (
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {prescriptions.map(rx => (
                                    <div key={rx.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f0f0f0' }}>
                                        <div>
                                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{rx.medicine}</h4>
                                            <p style={{ fontSize: '0.9rem' }}><strong>Dosage:</strong> {rx.dosage}</p>
                                            <p style={{ fontSize: '0.9rem' }}><strong>Doctor:</strong> {rx.doctorName}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Issued on {rx.date}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.75rem', background: '#e8f5e9', color: '#2e7d32', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: '700' }}>{rx.status}</span>
                                            <button
                                                onClick={() => sendToMerchant(rx)}
                                                disabled={sendingOrderId === rx.id || sendSuccess === rx.id}
                                                style={{
                                                    marginTop: '1rem',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    background: sendSuccess === rx.id ? '#2e7d32' : 'var(--primary)',
                                                    border: 'none',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    cursor: (sendingOrderId === rx.id || sendSuccess === rx.id) ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                {sendingOrderId === rx.id ? <Loader2 className="animate-spin" size={14} /> : (sendSuccess === rx.id ? <CheckCircle size={14} /> : <Send size={14} />)}
                                                {sendSuccess === rx.id ? 'Sent to Merchant' : 'Send to Nearest Merchant'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No prescriptions found in your vault.</p>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="fade-in card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem' }}>Complete Health History</h3>
                            <button className="btn-primary" onClick={() => setShowHistoryForm(true)} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={18} /> Add History
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {medicalHistory.length > 0 ? medicalHistory.map(item => (
                                <div key={item.id} style={{ padding: '1.5rem', borderRadius: '12px', background: '#fafafa', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h4 style={{ marginBottom: '0.5rem' }}>{item.condition}</h4>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            background: item.status === 'Ongoing' ? '#fff3e0' : item.status === 'Resolved' ? '#e8f5e9' : '#f5f5f5',
                                            color: item.status === 'Ongoing' ? '#ef6c00' : item.status === 'Resolved' ? '#2e7d32' : '#757575',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '20px',
                                            fontWeight: '700'
                                        }}>{item.status}</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Diagnosed in {item.diagnosed}</p>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>No health history records found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Health History Modal */}
                {showHistoryForm && (
                    <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Add Health History</h3>
                                <button onClick={() => setShowHistoryForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                            </div>
                            <form onSubmit={handleAddHistory} style={{ display: 'grid', gap: '1.2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Condition / Surgery</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass"
                                        placeholder="e.g. Laser Eye Surgery, Diabetes"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                        value={newHistory.condition}
                                        onChange={e => setNewHistory({ ...newHistory, condition: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Year of Diagnosis</label>
                                    <input
                                        type="number"
                                        required
                                        className="glass"
                                        placeholder="e.g. 2023"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                        value={newHistory.diagnosed}
                                        onChange={e => setNewHistory({ ...newHistory, diagnosed: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Current Status</label>
                                    <select
                                        className="glass"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                        value={newHistory.status}
                                        onChange={e => setNewHistory({ ...newHistory, status: e.target.value })}
                                    >
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Managed">Managed</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>
                                    Save History
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {(activeTab === 'settings' || activeTab === 'logout') && (
                    <div style={{ textAlign: 'center', padding: '4rem' }} className="fade-in">
                        <h3 style={{ color: 'var(--text-muted)' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module coming soon...</h3>
                        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('home')}>Back to Dashboard</button>
                    </div>
                )}
            </main>

            {showVideoCall && (
                <VideoConsultation
                    roomId={callRoomId}
                    userName={patientName}
                    onEnd={() => setShowVideoCall(false)}
                />
            )}

            {/* Profile Selection Modal */}
            {showProfileModal && (
                <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!showAddProfileForm ? (
                        <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', textAlign: 'center', borderRadius: '24px' }}>
                            <h3 style={{ marginBottom: '2.5rem', fontSize: '1.25rem', fontWeight: '800' }}>Who is this consultation for?</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
                                {patientProfiles.map(profile => (
                                    <div key={profile.id} onClick={() => { setSelectedProfile(profile); setShowProfileModal(false); setShowConsultModal(true); }} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                        <div style={{
                                            width: '80px', height: '80px', borderRadius: '50%', background: '#f0fbff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                                            border: selectedProfile?.id === profile.id ? '3px solid #4fc3f7' : '3px solid transparent',
                                            transition: 'all 0.2s ease',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: '50px', height: '50px', background: '#4fc3f7', borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
                                            }}>
                                                <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '10px' }} />
                                                <div style={{ width: '40px', height: '30px', background: 'white', borderRadius: '20px 20px 0 0', position: 'absolute', bottom: '-5px' }} />
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>{profile.name.toLowerCase()}</p>
                                    </div>
                                ))}
                                <div onClick={() => setShowAddProfileForm(true)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', border: '3px solid #f0fbff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                        <Plus size={35} color="#4fc3f7" strokeWidth={3} />
                                    </div>
                                    <p style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>Add Profile</p>
                                </div>
                            </div>
                            <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', color: '#999', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}>Cancel</button>
                        </div>
                    ) : (
                        <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Add Patient Details</h3>
                                <button onClick={() => setShowAddProfileForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <form onSubmit={handleAddProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>First Name</label>
                                        <input required type="text" placeholder="First Name" value={newProfile.firstName} onChange={e => setNewProfile({ ...newProfile, firstName: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Last Name</label>
                                        <input required type="text" placeholder="Last Name" value={newProfile.lastName} onChange={e => setNewProfile({ ...newProfile, lastName: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Gender</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {['Male', 'Female', 'Others'].map(g => (
                                            <button key={g} type="button" onClick={() => setNewProfile({ ...newProfile, gender: g })} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd', background: newProfile.gender === g ? 'var(--primary-light)' : 'white', color: newProfile.gender === g ? 'var(--primary)' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}>{g}</button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>DOB*</label>
                                        <input required type="date" value={newProfile.dob} onChange={e => setNewProfile({ ...newProfile, dob: e.target.value, age: Math.floor((new Date() - new Date(e.target.value)) / 31557600000) })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Age*</label>
                                        <input required type="number" placeholder="-" value={newProfile.age} onChange={e => setNewProfile({ ...newProfile, age: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Relation</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {['Wife', 'Husband', 'Son', 'Daughter', 'Others'].map(r => (
                                            <button key={r} type="button" onClick={() => setNewProfile({ ...newProfile, relation: r })} style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #ddd', background: newProfile.relation === r ? 'var(--primary-light)' : 'white', color: newProfile.relation === r ? 'var(--primary)' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.8rem' }}>{r}</button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ padding: '1rem', marginTop: '1rem', background: '#ff7043' }}>Create</button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* Consultation Form Modal */}
            {showConsultModal && selectedDoc && (
                <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Consultation Details</h2>
                            <button onClick={() => setShowConsultModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '12px' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {selectedDoc.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <p style={{ fontWeight: '700' }}>{selectedDoc.name}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{selectedDoc.specialization}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitConsult} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Reason for Visit</label>
                                <textarea
                                    required
                                    placeholder="Briefly describe your current problem..."
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #ddd', minHeight: '100px', outline: 'none' }}
                                    value={consultForm.reason}
                                    onChange={(e) => setConsultForm({ ...consultForm, reason: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Duration</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., 3 days"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                        value={consultForm.duration}
                                        onChange={(e) => setConsultForm({ ...consultForm, duration: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Severity</label>
                                    <select
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                        value={consultForm.severity}
                                        onChange={(e) => setConsultForm({ ...consultForm, severity: e.target.value })}
                                    >
                                        <option value="Mild">Mild</option>
                                        <option value="Moderate">Moderate</option>
                                        <option value="Severe">Severe</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Preferred Date</label>
                                    <input
                                        type="date"
                                        required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                        value={consultForm.slotDate}
                                        onChange={(e) => setConsultForm({ ...consultForm, slotDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Preferred Time</label>
                                    <input
                                        type="time"
                                        required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                        value={consultForm.slotTime}
                                        onChange={(e) => setConsultForm({ ...consultForm, slotTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Mode of Consult</label>
                                <select
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                    value={consultForm.mode}
                                    onChange={(e) => setConsultForm({ ...consultForm, mode: e.target.value })}
                                >
                                    <option value="Video Call">Video Call</option>
                                    <option value="Audio">Audio</option>
                                    <option value="In-person">In-person</option>
                                </select>
                            </div>

                            <button type="submit" className="btn-primary" style={{ padding: '1rem', marginTop: '1rem' }}>
                                Send Consultation Request
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .animate-spin {
                  animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default PatientPortal;
