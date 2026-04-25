import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    ShoppingCart,
    Send,
    Video
} from 'lucide-react';
import VideoConsultation from './VideoConsultation';
import PatientHome from './PatientHome';
import PatientAppointments from './PatientAppointments';
import PatientPrescriptions from './PatientPrescriptions';
import PatientPharmacy from './PatientPharmacy';
import PatientHistory from './PatientHistory';
import PatientSettings from './PatientSettings';
import { io } from 'socket.io-client';
import { API_BASE, SOCKET_URL } from '../config';
import { safeJson } from '../utils';

const socket = io(SOCKET_URL);

const PatientPortal = () => {
    const navigate = useNavigate();
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
        mode: 'Video Call',
        connectNow: true
    });
    const [patientRequests, setPatientRequests] = useState([]);
    const [pharmacyOffers, setPharmacyOffers] = useState([]);
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
    const [notifications, setNotifications] = useState([]);
    const [unreadOffers, setUnreadOffers] = useState(0);
    const [showBookingSuccess, setShowBookingSuccess] = useState(false);

    const patientData = JSON.parse(localStorage.getItem('userData') || '{}');
    const patientName = patientData.name || 'Patient';
    const patientId = patientData.id || patientData._id || 'P-000';
    const patientEmail = patientData.email || 'patient@example.com';

    useEffect(() => {
        const syncAndLoad = async () => {
            try {
                // 1. Sync & Load Profiles
                const profileRes = await fetch(`${API_BASE}/users/profile?email=${patientEmail}&role=Patient`);
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
                        body: JSON.stringify({ email: patientEmail, role: 'Patient', userData: { profiles: initial } })
                    });
                    const synced = await updateRes.json();
                    
                    if (synced && synced.userData && synced.userData.profiles) {
                        setPatientProfiles(synced.userData.profiles);
                        setSelectedProfile(synced.userData.profiles[0]);
                    }

                    // Sync localStorage
                    const updatedUserData = { ...patientData, patientProfile: synced?.patientProfile, isVerified: synced?.isVerified };
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
                } else {
                    if (profileData && profileData.userData && profileData.userData.profiles) {
                        setPatientProfiles(profileData.userData.profiles);
                        setSelectedProfile(profileData.userData.profiles[0]);
                    }

                    // Sync localStorage
                    const updatedUserData = { ...patientData, patientProfile: profileData?.patientProfile, isVerified: profileData?.isVerified };
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
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
                setPrescriptions(allRx.filter(rx => {
                    const matchesAccount = rx.patientEmail && patientEmail && rx.patientEmail.toLowerCase() === patientEmail.toLowerCase();
                    const matchesProfile = rx.patientName && selectedProfile?.name && rx.patientName.toLowerCase() === selectedProfile.name.toLowerCase();
                    return matchesAccount || matchesProfile;
                }));

                // Fetch Appointments
                const apptRes = await fetch(`${API_BASE}/appointments?patientId=${patientId}`);
                const appts = await apptRes.json();
                setPatientRequests(appts);

                // Fetch Quotes (Pharmacy Offers)
                if (patientEmail) {
                    const quoteRes = await fetch(`${API_BASE}/quotes?patientEmail=${encodeURIComponent(patientEmail)}`);
                    const quotes = await quoteRes.json();
                    setPharmacyOffers(quotes.map(q => ({
                        ...q,
                        // Ensure meds have a selection state for the UI
                        medsAvailable: (q.medsAvailable || []).map(m => ({ ...m, selected: true }))
                    })));
                }

                // ... check for video calls logic ...
            } catch (err) {
                console.error('Data load error:', err);
            }
        };

        syncAndLoad();

        // Socket listeners
        socket.on('patient-update', (data) => {
            if (data.patientEmail?.toLowerCase() === patientEmail.toLowerCase() || data.patientName?.toLowerCase() === selectedProfile?.name?.toLowerCase()) {
                // Add selection state to each medicine in the quote
                const offerWithSelection = {
                    ...data,
                    medsAvailable: data.medsAvailable.map(m => ({ ...m, selected: true }))
                };
                
                setPharmacyOffers(prev => [offerWithSelection, ...prev]);
                if (activeTab !== 'pharmacy') setUnreadOffers(prev => prev + 1);
                
                // Show notification
                setNotifications(prev => [{
                    id: Date.now(),
                    message: `New Price Quote received from ${data.merchantName}! Tap to view.`,
                    type: 'offer',
                    targetTab: 'pharmacy'
                }, ...prev]);

                // Also update prescription status locally
                setPrescriptions(prev => prev.map(rx => (rx._id === data.prescriptionId || rx.id === data.prescriptionId) ? { ...rx, status: `${data.merchantName}: Quote Received` } : rx));
            }
        });

        socket.on('appointment-update', (data) => {
            if (data.patientEmail?.toLowerCase() === patientEmail.toLowerCase()) {
                let message = '';
                if (data.type === 'HISTORY_ACKNOWLEDGED') {
                    message = `Dr. ${data.doctorName} has acknowledged and reviewed your medical history.`;
                } else if (data.type === 'ACCEPTED') {
                    message = `Dr. ${data.doctorName} has accepted your consultation request!`;
                    // Auto-join video call room if consultation is accepted
                    setCallRoomId(data.appointmentId);
                    setShowVideoCall(true);
                } else if (data.type === 'DECLINED') {
                    message = `Dr. ${data.doctorName} has declined your consultation request.`;
                } else if (data.type === 'STATUS_UPDATE' && data.status === 'Fulfilled') {
                    message = `Your consultation with Dr. ${data.doctorName} has been completed.`;
                    // Auto-close video call when doctor ends it and issues prescription
                    setShowVideoCall(false);
                }

                if (message) {
                    setNotifications(prev => [{
                        id: Date.now(),
                        message: message,
                        type: 'info',
                        targetTab: 'appointments'
                    }, ...prev]);
                    loadRequestsData();
                }
            }
        });

        socket.on('patient-order-status', (data) => {
            if (data.patientId === patientEmail) {
                setNotifications(prev => [{
                    id: Date.now(),
                    message: `Order Status for your medicine: ${data.status}`,
                    type: 'info',
                    targetTab: 'pharmacy'
                }, ...prev]);
            }
        });

        const interval = setInterval(loadRequestsData, 5000);
        return () => {
            clearInterval(interval);
            socket.off('patient-update');
            socket.off('appointment-update');
            socket.off('patient-order-status');
        };
    }, [patientName, patientId, patientEmail, selectedProfile, activeTab]);

    const handleAddHistory = async (e) => {
        e.preventDefault();
        try {
            const item = { patientId, ...newHistory };
            const res = await fetch(`${API_BASE}/health-records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            const saved = await safeJson(res);
            setMedicalHistory([saved, ...medicalHistory]);
            setNewHistory({ condition: '', diagnosed: '', status: 'Ongoing' });
            setShowHistoryForm(false);
        } catch (err) {
            alert('Failed to save health record');
        }
    };

    const placeOrder = (offer) => {
        const selectedMeds = offer.medsAvailable.filter(m => m.selected);
        if (selectedMeds.length === 0) {
            alert("Please select at least one medicine to order.");
            return;
        }

        const orderData = {
            prescriptionId: offer.prescriptionId,
            merchantName: offer.merchantName,
            meds: selectedMeds,
            total: selectedMeds.reduce((sum, m) => sum + parseFloat(m.price || 0), 0),
            patientName: patientName,
            patientId: patientEmail
        };

        socket.emit('place-order', orderData);
        alert(`Order placed with ${offer.merchantName}! Total: Rs. ${orderData.total}`);
        
        // Mark as ordered locally instead of removing
        setPharmacyOffers(prev => prev.map(o => o === offer ? { ...o, ordered: true } : o));
    };

    const toggleMedSelection = (offerIdx, medIdx) => {
        const updated = [...pharmacyOffers];
        updated[offerIdx].medsAvailable[medIdx].selected = !updated[offerIdx].medsAvailable[medIdx].selected;
        setPharmacyOffers(updated);
    };

    const sendToMerchant = (rx) => {
        setSendingOrderId(rx.id);

        // Emit socket event to notify merchants
        socket.emit('find-merchant', {
            prescriptionId: rx._id || rx.id,
            patientName: rx.patientName,
            patientId: patientEmail,
            patientEmail: patientEmail,
            medicines: rx.medicines,
            doctorName: rx.doctorName
        });

        // Sticky notification for broadcasting
        setNotifications(prev => [{
            id: Date.now(),
            message: `Broadcasting prescription for ${rx.problem} to nearby merchants...`,
            type: 'info'
        }, ...prev]);

        setTimeout(() => {
            setSendingOrderId(null);
            setSendSuccess(rx.id);
            setTimeout(() => setSendSuccess(null), 5000);
        }, 1200);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/auth');
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
        
        let finalSlotDate = consultForm.slotDate;
        let finalSlotTime = consultForm.slotTime;
        
        if (consultForm.connectNow) {
            const now = new Date();
            finalSlotDate = now.toISOString().split('T')[0];
            finalSlotTime = now.toTimeString().split(' ')[0].substring(0, 5);
        }

        const consultReq = {
            patientId: patientId, // Logged in patient
            patientEmail: patientEmail, // Account link
            patientName: patientName,
            doctorName: selectedDoc.name,
            consultationDetails: {
                ...consultForm,
                mode: 'Video Call',
                slotDate: finalSlotDate,
                slotTime: finalSlotTime,
                timestamp: new Date().toISOString()
            },
            status: 'Pending'
        };

        try {
            await fetch(`${API_BASE}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(consultReq)
            });
            setShowBookingSuccess(true);
            setShowConsultModal(false);
            setIsSearching(false);
            setSymptoms('');
            // Auto close after 3s
            setTimeout(() => {
                setShowBookingSuccess(false);
                if(activeTab !== 'appointments') setActiveTab('appointments');
            }, 3000);
        } catch (err) {
            alert('Failed to send consultation request');
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
                    if (id === 'pharmacy') setUnreadOffers(0);
                    if (id === 'home') setBookingStep('specialty');
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Icon size={20} />
                    <span>{label}</span>
                </div>
                {id === 'pharmacy' && unreadOffers > 0 && (
                    <span style={{ 
                        background: '#e53935', 
                        color: 'white', 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '10px',
                        fontWeight: '800'
                    }}>
                        {unreadOffers}
                    </span>
                )}
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
                <SidebarItem icon={ShoppingCart} label="Pharmacy Offers" id="pharmacy" />
                <SidebarItem icon={HistoryIcon} label="Health History" id="history" />

                <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <SidebarItem icon={Settings} label="Settings" id="settings" />
                    <SidebarItem icon={LogOut} label="Logout" id="logout" />
                </div>
            </aside>

            {/* Notifications Overlay */}
            <div style={{ position: 'fixed', top: '100px', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '350px' }}>
                {notifications.map(n => (
                    <div key={n.id} 
                        onClick={() => {
                            if (n.targetTab) setActiveTab(n.targetTab);
                            setNotifications(prev => prev.filter(x => x.id !== n.id));
                        }}
                        className="card shake" style={{ 
                        background: 'white', 
                        borderLeft: '4px solid var(--primary)', 
                        padding: '1rem', 
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: n.targetTab ? 'pointer' : 'default',
                        animation: 'slideInRight 0.5s ease-out'
                    }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{n.message}</p>
                        <button onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter(x => x.id !== n.id)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>&times;</button>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <main style={{ flex: 1, marginLeft: '280px', padding: '2rem 3rem' }}>
                {activeTab === 'home' && (
                    <PatientHome
                        bookingStep={bookingStep}
                        setBookingStep={setBookingStep}
                        specialtySearch={specialtySearch}
                        setSpecialtySearch={setSpecialtySearch}
                        specialties={specialties}
                        selectedSpecialty={selectedSpecialty}
                        setSelectedSpecialty={setSelectedSpecialty}
                        prescriptions={prescriptions}
                        setActiveTab={setActiveTab}
                        patientData={patientData}
                        setSelectedDoc={setSelectedDoc}
                        setShowConsultModal={setShowConsultModal}
                    />
                )}
                {activeTab === 'appointments' && (
                    <PatientAppointments 
                        patientRequests={patientRequests} 
                        setActiveTab={setActiveTab} 
                        setBookingStep={setBookingStep} 
                    />
                )}
                {activeTab === 'prescriptions' && (
                    <PatientPrescriptions 
                        prescriptions={prescriptions} 
                        sendToMerchant={sendToMerchant} 
                        sendingOrderId={sendingOrderId} 
                        sendSuccess={sendSuccess} 
                    />
                )}
                {activeTab === 'pharmacy' && (
                    <PatientPharmacy 
                        pharmacyOffers={pharmacyOffers} 
                        toggleMedSelection={toggleMedSelection} 
                        placeOrder={placeOrder} 
                    />
                )}
                {activeTab === 'history' && (
                    <PatientHistory 
                        medicalHistory={medicalHistory} 
                        showHistoryForm={showHistoryForm} 
                        setShowHistoryForm={setShowHistoryForm} 
                        newHistory={newHistory} 
                        setNewHistory={setNewHistory} 
                        handleAddHistory={handleAddHistory} 
                    />
                )}
                {(activeTab === 'settings' || activeTab === 'logout') && (
                    <PatientSettings 
                        patientName={patientName} 
                        patientId={patientId} 
                        handleLogout={handleLogout} 
                    />
                )}
            </main>

            {showVideoCall && (
                <VideoConsultation
                    roomId={callRoomId}
                    userName={patientName}
                    autoStart={true}
                    onEnd={() => setShowVideoCall(false)}
                />
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

                            <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', marginBottom: '1rem' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={consultForm.connectNow} 
                                        onChange={(e) => setConsultForm({ ...consultForm, connectNow: e.target.checked })} 
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                    />
                                    <span style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>Connect Right Now</span>
                                </label>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', opacity: consultForm.connectNow ? 0.5 : 1 }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Scheduled Date</label>
                                        <input
                                            type="date"
                                            required={!consultForm.connectNow}
                                            disabled={consultForm.connectNow}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                            value={consultForm.slotDate}
                                            onChange={(e) => setConsultForm({ ...consultForm, slotDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Scheduled Time</label>
                                        <input
                                            type="time"
                                            required={!consultForm.connectNow}
                                            disabled={consultForm.connectNow}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd' }}
                                            value={consultForm.slotTime}
                                            onChange={(e) => setConsultForm({ ...consultForm, slotTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>


                            <button type="submit" className="btn-primary" style={{ padding: '1rem', marginTop: '1rem' }}>
                                Send Consultation Request
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Success Modal */}
            {showBookingSuccess && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card scale-up" style={{ background: 'white', padding: '3rem', borderRadius: '24px', textAlign: 'center', maxWidth: '400px' }}>
                        <div style={{ width: '80px', height: '80px', background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <CheckCircle size={40} color="#2e7d32" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Appointment Booked!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Your consultation request has been sent successfully. You can track its status in the Appointments tab.
                        </p>
                        <button className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px' }} onClick={() => { setShowBookingSuccess(false); setActiveTab('appointments'); }}>
                            View Appointments
                        </button>
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
