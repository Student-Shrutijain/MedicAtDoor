import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { Heart, Activity, ShoppingCart, User, Stethoscope, Store, ShieldAlert, LogOut } from 'lucide-react'
import AITriageBot from './components/AITriageBot'
import SOSButton from './components/SOSButton'
import PatientPortal from './components/PatientPortal'
import DoctorPortal from './components/DoctorPortal'
import MerchantPortal from './components/MerchantPortal'
import Guidelines from './components/Guidelines'
import AdminLogin from './components/AdminLogin'
import DoctorMarketplace from './components/DoctorMarketplace'
import Home from './components/Home'
import Login from './components/Login'
import ProfessionalRegister from './components/ProfessionalRegister'
import { useLocation } from 'react-router-dom'

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
    const user = JSON.parse(localStorage.getItem('userData'));
    const token = localStorage.getItem('token');

    if (!token || !user) {
        return <Navigate to="/auth" replace />;
    }

    if (role && user.role.toLowerCase() !== role.toLowerCase()) {
        return <Navigate to="/" replace />;
    }

    return children;
};

const Navbar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userData'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/auth');
    };

    return (
        <nav className="glass" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, padding: '1rem 0' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '1.4rem' }}>
                    <Heart color="var(--primary)" fill="var(--primary)" size={28} />
                    <span style={{ fontWeight: '800' }}>MedicAtDoor</span>
                </Link>
                <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/doctors" className="nav-link">Find Doctors</Link>
                    <Link to="/guidelines" className="nav-link">Guidelines</Link>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {user ? (
                        <>
                            <Link
                                to={user.role.toLowerCase() === 'patient' ? '/patient-portal' : user.role.toLowerCase() === 'doctor' ? '/doctor-portal' : '/merchant-portal'}
                                className="nav-link"
                                style={{ fontWeight: '700', color: 'var(--primary)' }}
                            >
                                Dashboard
                            </Link>
                            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '600' }}>
                                <LogOut size={18} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/auth" className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>Sign In</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

const DoctorMarketplacePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const preSelectedSpecialty = location.state?.specialty || '';
    const user = JSON.parse(localStorage.getItem('userData'));

    return (
        <div className="container" style={{ padding: '120px 0 60px' }}>
            <div className="card" style={{ padding: '2rem' }}>
                <DoctorMarketplace
                    specialty={preSelectedSpecialty}
                    onSelect={(doc) => navigate(user ? '/patient-portal' : '/auth')}
                />
            </div>
        </div>
    )
}

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Login />} />
                <Route path="/guidelines" element={<Guidelines />} />
                <Route path="/login/admin" element={<AdminLogin />} />
                <Route path="/doctors" element={<DoctorMarketplacePage />} />

                {/* Protected Portals */}
                <Route path="/patient-portal" element={
                    <ProtectedRoute role="Patient">
                        <PatientPortal />
                    </ProtectedRoute>
                } />
                <Route path="/doctor-portal" element={
                    <ProtectedRoute role="Doctor">
                        <DoctorPortal />
                    </ProtectedRoute>
                } />
                <Route path="/merchant-portal" element={
                    <ProtectedRoute role="Merchant">
                        <MerchantPortal />
                    </ProtectedRoute>
                } />

                {/* Professional Registration Flow */}
                <Route path="/register/:role" element={<ProfessionalRegister />} />

                {/* Legacy Redirects */}
                <Route path="/patient" element={<Navigate to="/patient-portal" replace />} />
                <Route path="/doctor" element={<Navigate to="/doctor-portal" replace />} />
                <Route path="/merchant" element={<Navigate to="/merchant-portal" replace />} />
            </Routes>
            <SOSButton />
            <AITriageBot />
        </Router>
    )
}

export default App
