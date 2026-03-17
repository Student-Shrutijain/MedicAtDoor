import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home,
    Users,
    FileText,
    User as UserIcon,
    Settings,
    LogOut,
    Plus,
    Search,
    CheckCircle,
    Clock,
    MessageSquare,
    Linkedin,
    ExternalLink,
    Loader2,
    Stethoscope,
    Send,
    AlertCircle,
    History as HistoryIcon,
    ClipboardList,
    Video
} from 'lucide-react';
import VideoConsultation from './VideoConsultation';

const DoctorPortal = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(false);
    const [rxForm, setRxForm] = useState({
        patientId: '',
        patientEmail: '',
        patientName: '',
        problem: '', // Group by problem
        medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] // Multiple medicines
    });
    const [submitted, setSubmitted] = useState(false);
    const [pastPrescriptions, setPastPrescriptions] = useState([]);
    const [patientRequests, setPatientRequests] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [acceptedPatients, setAcceptedPatients] = useState([]);
    const [showRxModal, setShowRxModal] = useState(false);
    const [historyReviews, setHistoryReviews] = useState({}); // {patientId: true/false}
    const [showHistoryForm, setShowHistoryForm] = useState(false);
    const [selectedHistoryPatient, setSelectedHistoryPatient] = useState(null);
    const [selectedPatientHistory, setSelectedPatientHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [callRoomId, setCallRoomId] = useState(null);

    // Fetch registered doctor data from localStorage
    const doctorData = JSON.parse(localStorage.getItem('userData') || '{}');
    const doctorName = doctorData.name || 'Doctor';
    const doctorEmail = doctorData.email || 'doctor@example.com';
    const doctorSpecialization = doctorData.specialization || (doctorData.doctorProfile?.specialization) || 'General Physician';
    const doctorExp = doctorData.experience || (doctorData.doctorProfile?.experience) || '1';
    const doctorDegree = doctorData.degree || (doctorData.doctorProfile?.degree) || 'MBBS';
    const doctorProf = doctorData.doctorProfile || {};
    const API_BASE = 'http://localhost:5000/api';

    useEffect(() => {
        const loadDoctorDashboard = async () => {
            try {
                // Load Prescriptions
                const rxRes = await fetch(`${API_BASE}/prescriptions`);
                const allRx = await rxRes.json();
                setPastPrescriptions(allRx.filter(rx => rx.doctorName === doctorName));

                // Load Requests
                const apptRes = await fetch(`${API_BASE}/appointments?doctorName=${doctorName}`);
                const appts = await apptRes.json();
                setPatientRequests(appts);

                // Load Profile & Reviews (Dynamic Email)
                const profileRes = await fetch(`${API_BASE}/users/profile?email=${doctorEmail}&role=Doctor`);
                const profileData = await profileRes.json();
                if (profileData) {
                    if (profileData.userData) {
                        setHistoryReviews(profileData.userData.historyReviews || {});
                    }
                    // Sync localStorage
                    const updatedUserData = {
                        ...doctorData,
                        doctorProfile: profileData.doctorProfile,
                        isVerified: profileData.isVerified,
                        specialization: profileData.doctorProfile?.specialization || doctorData.specialization,
                        experience: profileData.doctorProfile?.experience || doctorData.experience,
                        degree: profileData.doctorProfile?.degree || doctorData.degree
                    };
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
                }
            } catch (err) {
                console.error('Doctor load error:', err);
            }
        };

        loadDoctorDashboard();
        const interval = setInterval(loadDoctorDashboard, 5000);
        return () => clearInterval(interval);
    }, [doctorName]);

    useEffect(() => {
        const fetchPatientHistory = async () => {
            if (!selectedHistoryPatient) return;
            setHistoryLoading(true);
            try {
                const res = await fetch(`${API_BASE}/health-records?patientId=${selectedHistoryPatient.id}`);
                const data = await res.json();
                setSelectedPatientHistory(data);
            } catch (err) {
                console.error("Error fetching patient history:", err);
            } finally {
                setHistoryLoading(false);
            }
        };
        fetchPatientHistory();
    }, [selectedHistoryPatient]);

    const acceptRequest = async (req) => {
        setCurrentSession(req);
        try {
            await fetch(`${API_BASE}/appointments/${req._id || req.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Processing' })
            });

            // Update local state immediately
            setPatientRequests(prev => prev.map(r => (r._id === req._id || r.id === req.id) ? { ...r, status: 'Processing' } : r));

            // Add to consulted patients (Simplified as session-based here)
            if (!acceptedPatients.some(p => p.patientName === req.patientName)) {
                setAcceptedPatients(prev => [...prev, { patientName: req.patientName, patientId: req.patientId, patientEmail: req.patientEmail, date: new Date().toLocaleDateString() }]);
            }

            setRxForm(prev => ({
                ...prev,
                patientId: req.patientId, // Store clinical ID
                patientEmail: req.patientEmail || req.patientId, // Account mapping
                patientName: req.patientName // Store display name
            }));

            // Start Video Call if mode is Video
            if (req.consultationDetails?.mode === 'Video Call') {
                setCallRoomId(req._id || req.id);
                setShowVideoCall(true);
                setShowRxModal(true); // Automatically open prescription form
            }

            alert(`Consultation started with ${req.patientName}.`);
        } catch (err) {
            alert('Failed to accept request');
        }
    };

    const toggleHistoryAcknowledge = async (pId) => {
        const activeAppt = patientRequests.find(r => r.patientId === pId && r.status !== 'Declined' && r.status !== 'Fulfilled');
        if (!activeAppt) {
            alert("No active appointment found for this patient to acknowledge.");
            return;
        }

        const isCurrentlyAcknowledged = activeAppt.historyAcknowledged;
        
        try {
            const res = await fetch(`${API_BASE}/appointments/${activeAppt._id || activeAppt.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    historyAcknowledged: !isCurrentlyAcknowledged
                })
            });
            
            if (res.ok) {
                setPatientRequests(prev => prev.map(r => 
                    (r._id === activeAppt._id || r.id === activeAppt.id) 
                    ? { ...r, historyAcknowledged: !isCurrentlyAcknowledged } 
                    : r
                ));
            }
        } catch (err) {
            console.error('Failed to save review status', err);
        }
    };

    const declineRequest = async (req) => {
        try {
            await fetch(`${API_BASE}/appointments/${req._id || req.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Declined' })
            });
            setPatientRequests(prev => prev.map(r => (r._id === req._id || r.id === req.id) ? { ...r, status: 'Declined' } : r));
            alert(`Request from ${req.patientName} declined.`);
        } catch (err) {
            alert('Failed to decline request');
        }
    };

    const isReturningPatient = (pName) => {
        return pastPrescriptions.some(rx => rx.patientName === pName);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/auth');
    };

    const handleRxSubmit = async (e) => {
        e.preventDefault();
        if (!rxForm.patientId || rxForm.medicines.some(m => !m.name || !m.dosage)) {
            alert("Please fill all medicine details.");
            return;
        }

        setLoading(true);

        try {
            const newRx = {
                doctorId: doctorEmail,
                doctorName: doctorName,
                patientId: rxForm.patientId,
                patientEmail: rxForm.patientEmail, // Account link
                patientName: rxForm.patientName,
                problem: rxForm.problem,
                medicines: rxForm.medicines.map(m => ({
                    name: m.name,
                    dosage: m.dosage,
                    duration: m.duration || "5 days",
                    instructions: m.instructions
                }))
            };

            const response = await fetch(`${API_BASE}/prescriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRx)
            });

            if (!response.ok) throw new Error('Failed to issue prescription');

            if (currentSession) {
                await fetch(`${API_BASE}/appointments/${currentSession._id || currentSession.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Fulfilled' })
                });
                setCurrentSession(null);
            }

            setSubmitted(true);
            setRxForm({ patientId: '', patientEmail: '', patientName: '', problem: '', medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] });
            setTimeout(() => setSubmitted(false), 3000);

            // Re-fetch prescriptions to update UI
            const rxRes = await fetch(`${API_BASE}/prescriptions`);
            const allRx = await rxRes.json();
            setPastPrescriptions(allRx.filter(rx => rx.doctorName === doctorName || rx.doctorId === doctorEmail));
        } catch (err) {
            alert('Error issuing prescription: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const SidebarItem = ({ icon: Icon, label, id }) => (
        <div
            onClick={() => {
                if (id === 'logout') {
                    handleLogout();
                    return;
                }
                setActiveTab(id);
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
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                        }}>
                            {doctorName.split(' ').filter(n => n.length > 2 || n.includes('.')).map(n => n.replace('.', ''))[0]?.[0] || 'D'}
                        </div>
                        <div>
                            <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{doctorName}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doctorSpecialization}</p>
                        </div>
                    </div>
                </div>

                <SidebarItem icon={Home} label="Home" id="home" />
                <SidebarItem icon={Users} label="Patient Requests" id="requests" />
                <SidebarItem icon={HistoryIcon} label="Patient History" id="history_review" />

                {acceptedPatients.length > 0 && (
                    <div style={{ marginTop: '1rem', padding: '0 0.5rem' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.7rem' }}>Consulted Patients</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {acceptedPatients.map((p, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        setRxForm(prev => ({
                                            ...prev,
                                            patientId: p.patientId,
                                            patientEmail: p.patientEmail || p.patientId,
                                            patientName: p.patientName
                                        }));
                                        setShowRxModal(true);
                                    }}
                                    style={{
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--text-main)',
                                        background: rxForm.patientId === p.patientName ? 'var(--primary-light)' : 'transparent'
                                    }}
                                >
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                    {p.patientName}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <SidebarItem icon={FileText} label="Rx History" id="history" />
                <SidebarItem icon={UserIcon} label="My Profile" id="profile" />

                <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <SidebarItem icon={Settings} label="Settings" id="settings" />
                    <SidebarItem icon={LogOut} label="Logout" id="logout" />
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, marginLeft: '280px', padding: '2rem 3rem' }}>
                {activeTab === 'home' && (
                    <div className="fade-in">
                        <section style={{
                            background: 'linear-gradient(135deg, var(--primary-light) 0%, #ffffff 100%)',
                            padding: '3rem',
                            borderRadius: '24px',
                            marginBottom: '2rem',
                            boxShadow: '0 10px 30px rgba(0, 137, 123, 0.05)',
                            position: 'relative'
                        }}>
                            <h2 style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--primary-dark)' }}>
                                Welcome back, {doctorName}.
                            </h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '600px' }}>
                                You have {patientRequests.filter(r => r.status === 'Pending').length} active consultation requests.
                            </p>

                            {currentSession && (
                                <div className="card" style={{ background: 'white', padding: '1.5rem', marginBottom: '1.5rem', border: '2px solid var(--primary)', borderRadius: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ color: 'var(--primary)', fontWeight: '800' }}>Clinical Memory: {currentSession.patientName}</h4>
                                        <button onClick={() => setCurrentSession(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Close Session</button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.9rem' }}>
                                        <div>
                                            <p style={{ marginBottom: '0.5rem' }}><strong>Symptoms:</strong> {currentSession.symptoms}</p>
                                            <p><strong>Reason for Visit:</strong> {currentSession.consultationDetails?.reason || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p style={{ marginBottom: '0.5rem' }}><strong>Duration:</strong> {currentSession.consultationDetails?.duration || 'N/A'}</p>
                                            <p><strong>Mode:</strong> {currentSession.consultationDetails?.mode || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="card glass" style={{ padding: '2rem', textAlign: 'center', maxWidth: '800px', border: '1px solid rgba(0, 137, 123, 0.2)' }}>
                                <Stethoscope size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                                <h3 style={{ marginBottom: '0.5rem' }}>Digital Prescription</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Issue a verified digital prescription for your patient.</p>
                                <button
                                    onClick={() => setShowRxModal(true)}
                                    className="btn-primary"
                                    style={{ padding: '1rem 2.5rem', borderRadius: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0 auto' }}
                                >
                                    <Plus size={20} /> Write New Prescription
                                </button>
                            </div>
                        </section>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
                            <div className="card" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem' }}>Recent Prescriptions</h3>
                                    <button onClick={() => setActiveTab('history')} style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}>View All</button>
                                </div>
                                {pastPrescriptions.length > 0 ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                                    <th style={{ padding: '1rem' }}>Patient</th>
                                                    <th style={{ padding: '1rem' }}>Diagnosis</th>
                                                    <th style={{ padding: '1rem' }}>Medicines</th>
                                                    <th style={{ padding: '1rem' }}>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pastPrescriptions.slice(0, 5).map(rx => (
                                                    <tr key={rx._id || rx.id} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td style={{ padding: '1rem', fontWeight: '600' }}>{rx.patientName}</td>
                                                        <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.6rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.8rem' }}>{rx.problem}</span></td>
                                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{rx.medicines?.length || 0} items</td>
                                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(rx.date).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <div style={{ textAlign: 'center', padding: '2rem', color: '#ccc' }}>No prescriptions issued yet.</div>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="card" style={{ padding: '1.5rem', background: 'var(--primary)', color: 'white' }}>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Total Consultations</p>
                                    <h2 style={{ fontSize: '2.5rem' }}>{pastPrescriptions.length}</h2>
                                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Till date</p>
                                </div>
                                <div className="card" style={{ padding: '1.5rem' }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pending Requests</p>
                                    <h2 style={{ fontSize: '2.5rem' }}>{patientRequests.filter(r => r.status === 'Pending').length}</h2>
                                    <button onClick={() => setActiveTab('requests')} style={{ width: '100%', marginTop: '1rem', padding: '0.6rem', borderRadius: '8px', border: '1px solid #eee', background: 'var(--bg-color)', cursor: 'pointer' }}>Manage Requests</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="fade-in card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Consultation Requests</h3>
                        {patientRequests.map(req => (
                            <div key={req.id} style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #eee', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.3rem' }}>
                                            {req.patientName} {isReturningPatient(req.patientName) && <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '0.5rem' }}>RETURNING</span>}
                                        </h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>{req.symptoms}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Requested {req.time}</p>
                                        <span style={{ fontSize: '0.75rem', background: req.consultationDetails?.severity === 'Severe' ? '#ffebee' : '#f0f0f0', color: req.consultationDetails?.severity === 'Severe' ? '#d32f2f' : '#666', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '700' }}>
                                            {req.consultationDetails?.severity || 'Normal'} Severity
                                        </span>
                                    </div>
                                </div>

                                {req.consultationDetails && (
                                    <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', border: '1px solid #f0f0f0' }}>
                                        <div>
                                            <p style={{ marginBottom: '0.4rem' }}><strong>Reason:</strong> {req.consultationDetails.reason}</p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><strong>Duration:</strong> {req.consultationDetails.duration}</p>
                                        </div>
                                        <div style={{ borderLeft: '1px solid #eee', paddingLeft: '1rem' }}>
                                            <p style={{ marginBottom: '0.4rem' }}><strong>Slot:</strong> {req.consultationDetails.slotDate} at {req.consultationDetails.slotTime}</p>
                                            <p style={{ color: 'var(--primary)', fontWeight: '600' }}><strong>Mode:</strong> {req.consultationDetails.mode}</p>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button
                                        onClick={() => acceptRequest(req)}
                                        disabled={req.status === 'Processing' || req.status === 'Fulfilled'}
                                        style={{
                                            padding: '0.8rem 1.5rem',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: req.status === 'Processing' ? '#fff3e0' : req.status === 'Fulfilled' ? '#e8f5e9' : 'var(--primary)',
                                            color: req.status === 'Processing' ? '#ef6c00' : req.status === 'Fulfilled' ? '#2e7d32' : 'white',
                                            fontWeight: '700',
                                            cursor: (req.status === 'Processing' || req.status === 'Fulfilled') ? 'not-allowed' : 'pointer',
                                            flex: 1
                                        }}
                                    >
                                        {req.status === 'Processing' ? 'In Session' : req.status === 'Fulfilled' ? 'Fulfilled' : 'Accept & Open clinical Memory'}
                                    </button>
                                    <button
                                        onClick={() => declineRequest(req)}
                                        disabled={req.status === 'Fulfilled' || req.status === 'Declined'}
                                        style={{
                                            padding: '0.8rem 1.5rem',
                                            borderRadius: '12px',
                                            border: '1px solid #ddd',
                                            background: req.status === 'Declined' ? '#ffebee' : 'white',
                                            color: req.status === 'Declined' ? '#c62828' : '#333',
                                            cursor: (req.status === 'Fulfilled' || req.status === 'Declined') ? 'not-allowed' : 'pointer',
                                            fontWeight: '600'
                                        }}>
                                        {req.status === 'Declined' ? 'Declined' : 'Decline'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'history_review' && (
                    <div className="fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Patients</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {[...new Set(patientRequests.map(r => JSON.stringify({ id: r.patientId, name: r.patientName })))].map(pStr => {
                                        const p = JSON.parse(pStr);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => setSelectedHistoryPatient(p)}
                                                style={{
                                                    padding: '1rem',
                                                    borderRadius: '12px',
                                                    background: selectedHistoryPatient?.id === p.id ? 'var(--primary-light)' : '#fcfcfc',
                                                    border: '1px solid #eee',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <span style={{ fontWeight: '600' }}>{p.name}</span>
                                                {historyReviews[p.id] && <CheckCircle size={14} color="var(--primary)" />}
                                            </div>
                                        );
                                    })}
                                    {patientRequests.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No patient links yet.</p>}
                                </div>
                            </div>

                            <div className="card" style={{ padding: '2rem' }}>
                                {selectedHistoryPatient ? (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.5rem' }}>{selectedHistoryPatient.name}'s Health History</h3>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ID: {selectedHistoryPatient.id}</p>
                                            </div>
                                                <button
                                                    onClick={() => toggleHistoryAcknowledge(selectedHistoryPatient.id)}
                                                    style={{
                                                        padding: '0.6rem 1.2rem',
                                                        borderRadius: '10px',
                                                        border: '1px solid var(--primary)',
                                                        background: (patientRequests.find(r => r.patientId === selectedHistoryPatient.id && r.status !== 'Declined' && r.status !== 'Fulfilled')?.historyAcknowledged) ? 'var(--primary)' : 'white',
                                                        color: (patientRequests.find(r => r.patientId === selectedHistoryPatient.id && r.status !== 'Declined' && r.status !== 'Fulfilled')?.historyAcknowledged) ? 'white' : 'var(--primary)',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                >
                                                    {(patientRequests.find(r => r.patientId === selectedHistoryPatient.id && r.status !== 'Declined' && r.status !== 'Fulfilled')?.historyAcknowledged) ? <><CheckCircle size={18} /> Understood</> : 'Acknowledge & Mark Understood'}
                                                </button>
                                            </div>

                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {historyLoading ? (
                                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                                    <Loader2 className="animate-spin" size={24} />
                                                </div>
                                            ) : selectedPatientHistory.length > 0 ? selectedPatientHistory.map((h, i) => (
                                                <div key={i} style={{ padding: '1.2rem', borderRadius: '12px', background: '#fafafa', border: '1px solid #eee' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <h4 style={{ fontWeight: '700' }}>{h.condition}</h4>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>{h.status}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Diagnosed in {h.diagnosed}</p>
                                                </div>
                                            )) : (
                                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No medical history profile provided yet.</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                                        <ClipboardList size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                                        <p style={{ color: 'var(--text-muted)' }}>Select a patient from the list to view their medical history.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="fade-in card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem' }}>Full Prescription History</h3>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{pastPrescriptions.length} Records found</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {Object.entries(pastPrescriptions.reduce((acc, rx) => {
                                const date = new Date(rx.date).toLocaleDateString();
                                if (!acc[date]) acc[date] = [];
                                acc[date].push(rx);
                                return acc;
                            }, {})).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, rxs]) => (
                                <div key={date}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ height: '1px', flex: 1, background: '#eee' }}></div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', background: '#f8fafc', padding: '0.2rem 0.8rem', borderRadius: '20px', border: '1px solid #eee' }}>{date}</span>
                                        <div style={{ height: '1px', flex: 1, background: '#eee' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {rxs.map(rx => (
                                            <div key={rx._id || rx.id} style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #f0f0f0', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{rx.patientName}</h4>
                                                        <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>{rx.problem}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ fontSize: '0.75rem', color: '#999' }}>ID: {rx.id}</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                                                    {rx.medicines?.map((med, idx) => (
                                                        <div key={idx} style={{ borderBottom: idx !== rx.medicines.length - 1 ? '1px solid #eee' : 'none', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                                            <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{med.name}</p>
                                                            <p style={{ fontSize: '0.8rem', color: '#555' }}>Dosage: {med.dosage} | Duration: {med.duration}</p>
                                                            {med.instructions && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Note: {med.instructions}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {pastPrescriptions.length === 0 && <div style={{ textAlign: 'center', padding: '5rem 0' }}>No records found.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="fade-in">
                        <div className="card" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2.5rem' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '16px' }}>
                                    <Settings size={32} color="var(--primary)" />
                                </div>
                                <h2 className="heading-md" style={{ marginBottom: 0 }}>Practice Settings</h2>
                            </div>

                            <div style={{ display: 'grid', gap: '2rem' }}>
                                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>Professional Profile</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name</p>
                                            <p style={{ fontWeight: '600' }}>{doctorName}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Degree</p>
                                            <p style={{ fontWeight: '600' }}>{doctorDegree}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Specialization</p>
                                            <p style={{ fontWeight: '600' }}>{doctorSpecialization}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Experience</p>
                                            <p style={{ fontWeight: '600' }}>{doctorExp} Years</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</p>
                                            <p style={{ fontWeight: '600' }}>{doctorEmail}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ marginBottom: '1rem', color: '#d32f2f' }}>Account Action</h4>
                                    <button
                                        onClick={handleLogout}
                                        className="btn-outline"
                                        style={{ color: '#d32f2f', borderColor: '#d32f2f', width: '200px' }}
                                    >
                                        Logout Practice
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'logout' && <div style={{ padding: '2rem', textAlign: 'center' }}>Logging out...</div>}

                {activeTab === 'profile' && (
                    <div className="fade-in card" style={{ padding: '3rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '150px', height: '150px', borderRadius: '32px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                                👨‍⚕️
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>{doctorName}</h3>
                                <p style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem' }}>{doctorSpecialization}</p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>DEGREE</p>
                                        <p style={{ fontWeight: '700' }}>{doctorDegree}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>EXPERIENCE</p>
                                        <p style={{ fontWeight: '700' }}>{doctorExp} Years</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>CONSULTATION FEE</p>
                                        <p style={{ fontWeight: '700', color: 'var(--primary)' }}>₹{doctorProf.fees || '0'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ACCOUNT STATUS</p>
                                        <p style={{ fontWeight: '700', color: '#2e7d32' }}>Verified Specialist</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Professional Bio</h4>
                                    <p style={{ lineHeight: '1.6', color: 'var(--text-main)' }}>{doctorProf.bio || 'Your professional bio will appear here after you complete your registration.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {showVideoCall && (
                <VideoConsultation
                    roomId={callRoomId}
                    userName={doctorName}
                    onEnd={async () => {
                        setShowVideoCall(false);
                        // Mark appointment as fulfilled when call ends
                        if (callRoomId) {
                            try {
                                await fetch(`${API_BASE}/appointments/${callRoomId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'Fulfilled' })
                                });
                                // Update local state for UI immediately
                                setPatientRequests(prev => prev.map(r => (r._id === callRoomId || r.id === callRoomId) ? { ...r, status: 'Fulfilled' } : r));
                            } catch (e) {
                                console.error("Error fulfilling appointment after call", e);
                            }
                        }
                    }}
                    initialNotes={rxForm.problem}
                    onNotesChange={(notes) => setRxForm(prev => ({ ...prev, problem: notes }))}
                    showNotepad={true}
                    autoStart={true}
                />
            )}

            {/* Prescription Modal */}
            {showRxModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card fade-in" style={{ width: '90%', maxWidth: '600px', padding: '2.5rem', position: 'relative' }}>
                        <button
                            onClick={() => setShowRxModal(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            &times;
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <FileText size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem' }}>Digital Prescription Form</h3>
                        </div>

                        <form onSubmit={(e) => { handleRxSubmit(e); setShowRxModal(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Patient Name</label>
                                    <input
                                        placeholder="Patient Name"
                                        required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' }}
                                        value={rxForm.patientName}
                                        onChange={e => setRxForm({ ...rxForm, patientName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Patient ID / Email</label>
                                    <input
                                        placeholder="Patient ID or Email"
                                        required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' }}
                                        value={rxForm.patientId}
                                        onChange={e => setRxForm({ ...rxForm, patientId: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Health Problem / Diagnosis</label>
                                <textarea
                                    placeholder="e.g. Severe Fever, Joint Pain..."
                                    required
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                                    value={rxForm.problem}
                                    onChange={e => setRxForm({ ...rxForm, problem: e.target.value })}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid #eee', marginTop: '0.5rem', paddingTop: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary)' }}>Medicines for this problem</label>
                                {rxForm.medicines.map((med, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '0.8rem', marginBottom: '1rem' }}>
                                        <input
                                            placeholder="Medicine Name"
                                            value={med.name}
                                            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem' }}
                                            onChange={e => {
                                                const newMeds = [...rxForm.medicines];
                                                newMeds[idx].name = e.target.value;
                                                setRxForm({ ...rxForm, medicines: newMeds });
                                            }}
                                        />
                                        <input
                                            placeholder="Dosage"
                                            value={med.dosage}
                                            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem' }}
                                            onChange={e => {
                                                const newMeds = [...rxForm.medicines];
                                                newMeds[idx].dosage = e.target.value;
                                                setRxForm({ ...rxForm, medicines: newMeds });
                                            }}
                                        />
                                        <input
                                            placeholder="Days"
                                            value={med.duration}
                                            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem' }}
                                            onChange={e => {
                                                const newMeds = [...rxForm.medicines];
                                                newMeds[idx].duration = e.target.value;
                                                setRxForm({ ...rxForm, medicines: newMeds });
                                            }}
                                        />
                                        <input
                                            placeholder="Instructions"
                                            value={med.instructions}
                                            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem' }}
                                            onChange={e => {
                                                const newMeds = [...rxForm.medicines];
                                                newMeds[idx].instructions = e.target.value;
                                                setRxForm({ ...rxForm, medicines: newMeds });
                                            }}
                                        />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setRxForm({ ...rxForm, medicines: [...rxForm.medicines, { name: '', dosage: '', instructions: '' }] })}
                                    style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    + Add Another Medicine
                                </button>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '1rem', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Complete & Issue Prescription</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorPortal;
