import React, { useState, useEffect } from 'react';
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
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(false);
    const [rxForm, setRxForm] = useState({
        patientId: '',
        problem: '', // Group by problem
        medicines: [{ name: '', dosage: '', instructions: '' }] // Multiple medicines
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
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [callRoomId, setCallRoomId] = useState(null);

    // Fetch registered doctor data from localStorage
    const doctorData = JSON.parse(localStorage.getItem('userData') || '{}');
    const doctorName = doctorData.name || 'Doctor';
    const doctorEmail = doctorData.email || 'doctor@example.com';
    const doctorProf = doctorData.doctorProfile || {};
    const doctorSpecialization = doctorProf.specialization || 'General Surgeon';
    const doctorExp = doctorProf.experience || '10+';
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
                if (profileData && profileData.userData) {
                    setHistoryReviews(profileData.userData.historyReviews || {});
                }
            } catch (err) {
                console.error('Doctor load error:', err);
            }
        };

        loadDoctorDashboard();
        const interval = setInterval(loadDoctorDashboard, 5000);
        return () => clearInterval(interval);
    }, [doctorName]);

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
                setAcceptedPatients(prev => [...prev, { patientName: req.patientName, patientId: req.patientId, date: new Date().toLocaleDateString() }]);
            }

            setRxForm(prev => ({ ...prev, patientId: req.patientName }));

            // Start Video Call if mode is Video
            if (req.consultationDetails?.mode === 'Video Call') {
                setCallRoomId(req._id || req.id);
                setShowVideoCall(true);
            }

            alert(`Consultation started with ${req.patientName}.`);
        } catch (err) {
            alert('Failed to accept request');
        }
    };

    const toggleHistoryAcknowledge = async (pId) => {
        const updated = { ...historyReviews, [pId]: !historyReviews[pId] };
        setHistoryReviews(updated);

        try {
            await fetch(`${API_BASE}/users/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: doctorEmail, role: 'Doctor', userData: { historyReviews: updated } })
            });
        } catch (err) {
            console.error('Failed to save review status');
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

    const handleRxSubmit = async (e) => {
        e.preventDefault();
        if (!rxForm.patientId || rxForm.medicines.length === 0) return;

        setLoading(true);
        // We link multiple medicines to one health problem in the DB
        // For simplicity in this mock-to-real transition, we'll store it as a single entry with concatenated text or an array if the backend supports it.
        // Let's assume we want to store it professionally.

        try {
            for (const med of rxForm.medicines) {
                const newRx = {
                    doctorId: doctorName,
                    patientName: rxForm.patientId,
                    medicineName: med.name,
                    dosage: med.dosage,
                    instructions: `${rxForm.problem}: ${med.instructions}`,
                    problem: rxForm.problem
                };

                await fetch(`${API_BASE}/prescriptions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newRx)
                });
            }

            if (currentSession) {
                await fetch(`${API_BASE}/appointments/${currentSession._id || currentSession.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Fulfilled' })
                });
                setCurrentSession(null);
            }

            setSubmitted(true);
            setRxForm({ patientId: '', problem: '', medicines: [{ name: '', dosage: '', instructions: '' }] });
            setTimeout(() => setSubmitted(false), 3000);
        } catch (err) {
            alert('Failed to issue prescription');
        } finally {
            setLoading(false);
        }
    };

    const SidebarItem = ({ icon: Icon, label, id }) => (
        <div
            onClick={() => setActiveTab(id)}
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
                                        setRxForm(prev => ({ ...prev, patientId: p.patientName }));
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                            <div className="card" style={{ padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Recent Prescriptions</h3>
                                {pastPrescriptions.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {pastPrescriptions.slice(0, 3).map(rx => (
                                                <tr key={rx.id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.8rem', fontWeight: '600' }}>{rx.patientName}</td>
                                                    <td style={{ padding: '0.8rem' }}>{rx.medicine}</td>
                                                    <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>{rx.date}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p>No prescriptions issued.</p>}
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
                                                    background: historyReviews[selectedHistoryPatient.id] ? 'var(--primary)' : 'white',
                                                    color: historyReviews[selectedHistoryPatient.id] ? 'white' : 'var(--primary)',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                {historyReviews[selectedHistoryPatient.id] ? <><CheckCircle size={18} /> Understood</> : 'Acknowledge & Mark Understood'}
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {(patientRequests.find(r => r.patientId === selectedHistoryPatient.id)?.medicalHistory || []).map((h, i) => (
                                                <div key={i} style={{ padding: '1.2rem', borderRadius: '12px', background: '#fafafa', border: '1px solid #eee' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <h4 style={{ fontWeight: '700' }}>{h.condition}</h4>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>{h.status}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Diagnosed in {h.diagnosed}</p>
                                                </div>
                                            ))}
                                            {(!patientRequests.find(r => r.patientId === selectedHistoryPatient.id)?.medicalHistory) && (
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
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Prescription History</h3>
                        {pastPrescriptions.map(rx => (
                            <div key={rx.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <p><strong>{rx.patientName}</strong> - {rx.medicine}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rx.date}</p>
                            </div>
                        ))}
                    </div>
                )}

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
                                        <p style={{ fontWeight: '700' }}>{doctorProf.degree || 'Not Provided'}</p>
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
                    onEnd={() => setShowVideoCall(false)}
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
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Patient Name</label>
                                <input
                                    placeholder="Patient ID or Name"
                                    required
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' }}
                                    value={rxForm.patientId}
                                    onChange={e => setRxForm({ ...rxForm, patientId: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Health Problem / Diagnosis</label>
                                <input
                                    placeholder="e.g. Severe Fever, Joint Pain"
                                    required
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' }}
                                    value={rxForm.problem}
                                    onChange={e => setRxForm({ ...rxForm, problem: e.target.value })}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid #eee', marginTop: '0.5rem', paddingTop: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary)' }}>Medicines for this problem</label>
                                {rxForm.medicines.map((med, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '0.8rem', marginBottom: '1rem' }}>
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
