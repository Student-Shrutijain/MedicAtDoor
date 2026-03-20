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
import MedicationReminders from './MedicationReminders';
import DoctorMarketplace from './DoctorMarketplace';
import VideoConsultation from './VideoConsultation';
import { io } from 'socket.io-client';
import { API_BASE, SOCKET_URL } from '../config';

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
            const saved = await res.json();
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
                                                                <p style={{ fontWeight: '600' }}>{rx.medicines?.[0]?.name || 'Medicine'} {rx.medicines?.length > 1 ? `+${rx.medicines.length - 1} more` : ''}</p>
                                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dr. {rx.doctorName || 'Specialist'} • {new Date(rx.date).toLocaleDateString()}</p>
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
                                        setShowConsultModal(true); // Directly open consult modal
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
                                                {req.historyAcknowledged && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600', marginBottom: '0.2rem' }}>
                                                        History Reviewed
                                                    </div>
                                                )}
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
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div>
                                                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.2rem', fontSize: '1.2rem', fontWeight: '800' }}>{rx.problem}</h4>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Dr. {rx.doctorName}</p>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', background: '#e8f5e9', color: '#2e7d32', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: '700' }}>{rx.status}</span>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                                {rx.medicines?.map((med, idx) => (
                                                    <div key={idx} style={{ borderBottom: idx !== rx.medicines.length - 1 ? '1px solid #e2e8f0' : 'none', paddingBottom: '0.5rem' }}>
                                                        <p style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{med.name}</p>
                                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            <span>Dosage: {med.dosage}</span>
                                                            <span>Duration: {med.duration}</span>
                                                        </div>
                                                        {med.instructions && <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontStyle: 'italic', marginTop: '0.2rem' }}>{med.instructions}</p>}
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {rx.id} • {new Date(rx.date).toLocaleDateString()}</p>
                                                <button
                                                    onClick={() => sendToMerchant(rx)}
                                                    disabled={sendingOrderId === (rx._id || rx.id) || rx.status.includes('Available')}
                                                    style={{
                                                        color: 'white',
                                                        fontWeight: '700',
                                                        background: rx.status.includes('Available') ? '#2e7d32' : 'var(--primary)',
                                                        border: 'none',
                                                        padding: '0.6rem 1.2rem',
                                                        borderRadius: '10px',
                                                        cursor: (sendingOrderId === (rx._id || rx.id) || rx.status.includes('Available')) ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        transition: 'all 0.3s ease',
                                                        boxShadow: '0 4px 12px rgba(0, 137, 123, 0.1)'
                                                    }}
                                                >
                                                    {sendingOrderId === (rx._id || rx.id) ? <Loader2 className="animate-spin" size={16} /> : (rx.status.includes('Available') || sendSuccess === (rx._id || rx.id)) ? <CheckCircle size={16} /> : <Send size={16} />}
                                                    {sendSuccess === (rx._id || rx.id) ? 'Successfully Sent to Merchant' : (rx.status.includes('Available') ? 'Available at Shop' : 'Broadcast to Merchants')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No prescriptions found in your vault.</p>
                        )}
                    </div>
                )}

                {activeTab === 'pharmacy' && (
                    <div className="fade-in card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Merchant Quotes & Offers</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Compare prices from local pharmacies and place your order.</p>
                        
                        {pharmacyOffers.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                                {pharmacyOffers.map((offer, idx) => (
                                    <div key={idx} className="card pharmacy-offer-card" style={{ padding: '1.5rem', border: '1px solid #f0f0f0', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                                            <div>
                                                <h4 style={{ fontWeight: '800', color: 'var(--primary)' }}>{offer.merchantName}</h4>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Response to Rx ID: {offer.prescriptionId.slice(-6)}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                                    Rs. {offer.medsAvailable.filter(m => m.selected).reduce((sum, m) => sum + parseFloat(m.price || 0), 0)}
                                                </p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{offer.ordered ? 'Total Ordered' : 'Selected Total'}</p>
                                            </div>
                                        </div>

                                        {offer.ordered && (
                                            <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: '#e8f5e9', color: '#2e7d32', padding: '0.3rem 1rem', borderRadius: '20px', fontWeight: '800', fontSize: '0.75rem', zIndex: 5 }}>
                                                ORDERED
                                            </div>
                                        )}

                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>AVAILABLE MEDICINES</p>
                                            {offer.medsAvailable.map((med, midx) => (
                                                <div key={midx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0', borderBottom: midx === offer.medsAvailable.length - 1 ? 'none' : '1px solid #eee' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={med.selected} 
                                                        onChange={() => toggleMedSelection(idx, midx)}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{med.name}</span>
                                                        <p style={{ fontSize: '0.75rem', color: '#6d7278' }}>Stock: <span style={{ color: '#2e7d32', fontWeight: '700' }}>{med.stock || 'Available'}</span></p>
                                                    </div>
                                                    <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--primary)' }}>Rs. {med.price}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={() => placeOrder(offer)}
                                            disabled={offer.ordered}
                                            className={offer.ordered ? "btn-outline" : "btn-primary"} 
                                            style={{ 
                                                width: '100%', 
                                                padding: '0.8rem', 
                                                borderRadius: '10px',
                                                cursor: offer.ordered ? 'not-allowed' : 'pointer',
                                                opacity: offer.ordered ? 0.7 : 1
                                            }}
                                        >
                                            {offer.ordered ? 'Order Placed' : 'Order Selected Medicines'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <div style={{ background: '#f8f9fa', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <ShoppingCart size={40} color="#ccc" />
                                </div>
                                <h4 style={{ marginBottom: '0.5rem' }}>No Active Offers</h4>
                                <p style={{ color: 'var(--text-muted)' }}>Broadcast your prescriptions to receive real-time price quotes from pharmacies.</p>
                            </div>
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
                    <div className="fade-in">
                        <div className="card" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2.5rem' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '16px' }}>
                                    <Settings size={32} color="var(--primary)" />
                                </div>
                                <h2 className="heading-md" style={{ marginBottom: 0 }}>Account Settings</h2>
                            </div>

                            <div style={{ display: 'grid', gap: '2rem' }}>
                                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>Personal Information</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full Name</p>
                                            <p style={{ fontWeight: '600' }}>{patientName}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Patient ID</p>
                                            <p style={{ fontWeight: '600' }}>{patientId}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ marginBottom: '1rem', color: '#d32f2f' }}>Danger Zone</h4>
                                    <button
                                        onClick={handleLogout}
                                        className="btn-outline"
                                        style={{ color: '#d32f2f', borderColor: '#d32f2f', width: '200px' }}
                                    >
                                        Sign Out Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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
