import React, { useState, useEffect } from 'react';
import { 
    Users, Activity, DollarSign, Calendar, Star, AlertCircle, CheckCircle, 
    XCircle, FileText, Settings, Shield, UserX, LayoutDashboard, Clock, LogOut
} from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE, SOCKET_URL } from '../config';

const socket = io(SOCKET_URL);

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const adminData = JSON.parse(localStorage.getItem('userData') || '{}');
    const [stats, setStats] = useState({
        totalPatients: 0,
        activeDoctors: 0,
        pendingMerchants: 0,
        todayRevenue: 0,
        totalAppointmentsCount: 0
    });
    const [users, setUsers] = useState([]);
    const [grievances, setGrievances] = useState([]);
    
    // Fetch Data
    useEffect(() => {
        fetchAdminStats();
        if(activeTab === 'users' || activeTab === 'dashboard') fetchUsers();
        if(activeTab === 'reports') fetchGrievances();

        socket.on('appointment-update', () => fetchAdminStats());
        socket.on('new-prescription', () => fetchAdminStats());

        return () => {
            socket.off('appointment-update');
            socket.off('new-prescription');
        };
    }, [activeTab]);

    const fetchAdminStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/stats`);
            const data = await res.json();
            setStats(data);
        } catch(err) {
            console.error("Failed to fetch admin stats", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/users`);
            const data = await res.json();
            setUsers(data);
        } catch(err) {
            console.error("Failed to fetch users", err);
        }
    };

    const fetchGrievances = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/grievances`);
            const data = await res.json();
            setGrievances(data);
        } catch(err) {
            console.error("Failed to fetch grievances", err);
        }
    };

    const handleVerify = async (id) => {
        try {
            await fetch(`${API_BASE}/admin/users/${id}/verify`, { method: 'PATCH' });
            fetchUsers();
            fetchAdminStats();
        } catch(err) {
            console.error(err);
        }
    };

    const handleBan = async (id) => {
        try {
            await fetch(`${API_BASE}/admin/users/${id}/ban`, { method: 'PATCH' });
            fetchUsers();
            fetchAdminStats();
        } catch(err) {
            console.error(err);
        }
    };

    const handleResolveTicket = async (id) => {
        try {
            await fetch(`${API_BASE}/admin/grievances/${id}/resolve`, { method: 'PATCH' });
            fetchGrievances();
        } catch(err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/auth';
    };

    const renderSidebar = () => (
        <div className="glass" style={{ width: '280px', height: 'calc(100vh - 100px)', position: 'sticky', top: '90px', padding: '2rem 1rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 
                onClick={() => setActiveTab('dashboard')}
                style={{ cursor: 'pointer', padding: '0 1rem', marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <Shield size={24} /> {adminData.name || 'System Admin'}
            </h3>
            
            <SidebarItem icon={LayoutDashboard} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Users} label="User Management" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={AlertCircle} label="Grievance Reports" isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
            <SidebarItem icon={Settings} label="System Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            
            <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <SidebarItem icon={LogOut} label="Logout" isActive={false} onClick={handleLogout} />
            </div>
        </div>
    );

    const pendingQueue = users.filter(u => !u.isVerified && (u.role === 'Doctor' || u.role === 'Merchant'));

    const renderDashboard = () => (
        <div className="animate-fade-up">
            <h2 className="heading-ld" style={{ marginBottom: '2rem' }}>Administration Overview</h2>
            
            {/* Stat Cards */}
            <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard icon={Users} title="Total Patients" value={stats.totalPatients} color="#1e88e5" />
                <StatCard icon={Star} title="Active Doctors" value={stats.activeDoctors} color="#00897b" />
                <StatCard icon={Clock} title="Pending Approvals" value={stats.pendingMerchants} color="#f4511e" />
                <StatCard icon={DollarSign} title="Today's Revenue" value={`₹${stats.todayRevenue}`} color="#8e24aa" />
                <StatCard icon={Calendar} title="Total Appointments" value={stats.totalAppointmentsCount} color="#3949ab" />
            </div>

            {/* Verification Queue Section on Dashboard */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <FileText size={24} color="var(--primary)" /> Pending Approvals Queue
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review identity and medical credentials for newly registered Doctors and Merchants.</p>
                    </div>
                    <span style={{ background: 'var(--primary-light)', padding: '0.3rem 1rem', borderRadius: '12px', fontWeight: 'bold' }}>
                        {pendingQueue.length} Pending
                    </span>
                </div>
                
                {pendingQueue.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>All professionals are verified!</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Name</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Role</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Email</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingQueue.map((u) => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.name}</td>
                                        <td style={{ padding: '1rem' }}><Badge role={u.role} /></td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => alert("Simulating document viewing: " + (u.doctorProfile?.licenseCopy || u.merchantProfile?.storeImage || "No document provided"))}>
                                                View Docs
                                            </button>
                                            <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleVerify(u._id)}>
                                                Approve
                                            </button>
                                            <button className="btn" style={{ background: '#ffebee', color: '#c62828', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleBan(u._id)}>
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderUserManagement = () => (
        <div className="animate-fade-up card">
            <h2 className="heading-ld" style={{ marginBottom: '2rem' }}>User Management</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem' }}>User</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.filter(u => u.role !== 'Admin').map((u) => (
                            <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                </td>
                                <td style={{ padding: '1rem' }}><Badge role={u.role} /></td>
                                <td style={{ padding: '1rem' }}>
                                    {u.isBanned ? (
                                        <span style={{ color: '#d32f2f', background: '#ffebee', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Banned</span>
                                    ) : u.isVerified ? (
                                        <span style={{ color: '#2e7d32', background: '#e8f5e9', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Verified</span>
                                    ) : (
                                        <span style={{ color: '#ed6c02', background: '#fff3e0', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pending</span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    {u.isBanned || !u.isVerified ? (
                                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleVerify(u._id)}>
                                            <CheckCircle size={14} style={{ marginRight: '0.3rem' }}/> Verify
                                        </button>
                                    ) : (
                                        <button className="btn" style={{ background: '#ffebee', color: '#c62828', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }} onClick={() => handleBan(u._id)}>
                                            <UserX size={14} style={{ marginRight: '0.3rem' }}/> Ban
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="animate-fade-up card">
            <h2 className="heading-ld" style={{ marginBottom: '2rem' }}>Grievance Reports</h2>
            {grievances.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No grievances found. Everything is calm.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '1rem' }}>User Name</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Issue Category</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grievances.map((g) => (
                                <tr key={g._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{g.userName}</td>
                                    <td style={{ padding: '1rem' }}><Badge role={g.userRole} /></td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '500' }}>{g.issueCategory}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{g.description.substring(0, 40)}...</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            background: g.status === 'Resolved' ? '#e8f5e9' : '#fff3e0',
                                            color: g.status === 'Resolved' ? '#2e7d32' : '#ed6c02',
                                            padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold'
                                        }}>
                                            {g.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {g.status !== 'Resolved' && (
                                            <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleResolveTicket(g._id)}>
                                                Mark Resolved
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderSettings = () => (
        <div className="animate-fade-up card" style={{ padding: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '16px' }}>
                    <Settings size={32} color="var(--primary)" />
                </div>
                <div>
                   <h2 className="heading-md" style={{ marginBottom: '0.2rem' }}>Platform Settings</h2>
                   <p style={{ color: 'var(--text-muted)' }}>Manage global configurations.</p>
                </div>
            </div>
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                   <h4 style={{ marginBottom: '1rem' }}>Maintenance Mode</h4>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Temporarily disable new registrations and orders.</p>
                       <button className="btn-outline" style={{ color: '#d32f2f', borderColor: '#d32f2f' }}>Enable Maintenance</button>
                   </div>
                </div>
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                   <h4 style={{ marginBottom: '1rem' }}>Data Backup</h4>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Export all patient and prescription records securely.</p>
                       <button className="btn-primary" onClick={() => alert("Initiating secure backup...")}>Download Backup</button>
                   </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container" style={{ padding: '120px 0 60px', display: 'flex', gap: '2rem' }}>
            {renderSidebar()}
            <div style={{ flex: 1, minWidth: 0 }}>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'users' && renderUserManagement()}
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

// UI Helpers
const SidebarItem = ({ icon: Icon, label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
            width: '100%', border: 'none', background: isActive ? 'var(--primary)' : 'transparent',
            color: isActive ? 'white' : 'var(--text-main)', borderRadius: '16px',
            fontSize: '1rem', fontWeight: isActive ? '600' : '500', 
            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
        }}
    >
        <Icon size={20} /> {label}
    </button>
);

const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: `4px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>{title}</span>
            <div style={{ background: `${color}15`, padding: '0.5rem', borderRadius: '12px' }}>
                <Icon size={20} color={color} />
            </div>
        </div>
        <h3 style={{ fontSize: '2rem', margin: 0 }}>{value}</h3>
    </div>
);

const Badge = ({ role }) => {
    const colors = {
        'Patient': { bg: '#e3f2fd', text: '#1565c0' },
        'Doctor': { bg: '#e8f5e9', text: '#2e7d32' },
        'Merchant': { bg: '#f3e5f5', text: '#6a1b9a' }
    };
    const style = colors[role] || { bg: '#eee', text: '#333' };
    return (
        <span style={{ background: style.bg, color: style.text, padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            {role}
        </span>
    );
};

export default AdminDashboard;
