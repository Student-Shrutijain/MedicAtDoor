import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, TrendingUp, AlertCircle, Check, ArrowRight, Loader2, Bell, Send, Home, ClipboardList, LogOut, Plus, Search, Activity } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { API_BASE, SOCKET_URL } from '../config';

const socket = io(SOCKET_URL);

const MerchantPortal = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [selectedBroadcast, setSelectedBroadcast] = useState(null);
    const [quotedMeds, setQuotedMeds] = useState([]);
    const [notifications, setNotifications] = useState([]);
    
    // Add Stock Form State
    const [newStock, setNewStock] = useState({ name: '', category: 'General', price: '', inventory: '' });

    const merchantData = JSON.parse(localStorage.getItem('userData') || '{}');
    const businessName = merchantData.businessName || merchantData.name || 'Local Pharmacy';

    useEffect(() => {
        loadMerchantData();

        // Listen for new prescription broadcasts
        socket.on('new-merchant-request', (data) => {
            setBroadcasts(prev => [data, ...prev]);
            addNotification(`New patient requirement from ${data.patientName}!`);
        });

        // Listen for real-time orders directed to this merchant
        socket.on('new-order-received', (data) => {
            if (data.targetMerchant === businessName) {
                // Formatting data to match what the API returns
                const formattedOrder = {
                    id: data.id,
                    meds: data.meds,
                    total: data.total,
                    status: data.status,
                    patient: data.patientName,
                    patientId: data.patientId,
                    type: 'Prescription Order',
                    mongoId: data._id,
                    date: data.date
                };
                setOrders(prev => [formattedOrder, ...prev]);
                addNotification(`New Order ${data.id} Received from ${data.patientName}!`);
            }
        });

        const interval = setInterval(() => {
            fetchOrders();
        }, 10000);
        
        return () => {
            clearInterval(interval);
            socket.off('new-merchant-request');
            socket.off('new-order-received');
        };
    }, [businessName]);

    const addNotification = (msg) => {
        const id = Date.now();
        setNotifications(prev => [{ id, message: msg }, ...prev]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const loadMerchantData = async () => {
        try {
            await fetchInventory();
            await fetchOrders();
            await fetchBroadcasts();
        } catch (err) {
            console.error('Merchant load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBroadcasts = async () => {
        try {
            const res = await fetch(`${API_BASE}/broadcasts`);
            const data = await res.json();
            setBroadcasts(data);
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
        }
    };

    const fetchInventory = async () => {
        const medRes = await fetch(`${API_BASE}/inventory?merchantName=${encodeURIComponent(businessName)}`);
        const meds = await medRes.json();
        setInventory(meds.map(m => ({
            id: m._id || m.catalogId, // Use _id if it's a true inventory item, else use catalogId
            name: m.name,
            category: m.category,
            stock: m.inventory || 0,
            price: `Rs. ${m.price}`
        })));
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE}/orders?merchantName=${encodeURIComponent(businessName)}`);
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newStock.name,
                    category: newStock.category,
                    price: Number(newStock.price),
                    inventory: Number(newStock.inventory),
                    merchantName: businessName
                })
            });
            if(res.ok) {
                addNotification(`Successfully added ${newStock.name} to inventory!`);
                setShowAddStockModal(false);
                setNewStock({ name: '', category: 'General', price: '', inventory: '' });
                fetchInventory();
            } else {
                addNotification("Failed to add stock.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openAvailabilityModal = (req) => {
        setSelectedBroadcast(req);
        // Pre-fill prices from inventory if matched
        setQuotedMeds(req.medicines.map(m => {
            const invItem = inventory.find(i => i.name.toLowerCase() === m.name.toLowerCase());
            return {
                name: m.name,
                price: invItem ? invItem.price.replace('Rs. ', '') : '',
                stock: invItem && invItem.stock > 0 ? 'In Stock' : '',
                available: invItem ? (invItem.stock > 0) : true
            };
        }));
        setShowAvailabilityModal(true);
    };

    const handleBroadcastResponse = () => {
        if (!selectedBroadcast) return;

        socket.emit('merchant-response', {
            prescriptionId: selectedBroadcast.prescriptionId,
            patientId: selectedBroadcast.patientId,
            patientName: selectedBroadcast.patientName,
            patientEmail: selectedBroadcast.patientEmail,
            merchantName: businessName,
            status: 'Available',
            medsAvailable: quotedMeds.filter(m => m.available && m.price).map(m => ({
                name: m.name,
                price: m.price,
                stock: m.stock || 'In Stock'
            }))
        });

        // Remove from broadcasts once responded
        setBroadcasts(prev => prev.filter(b => b.prescriptionId !== selectedBroadcast.prescriptionId));
        setShowAvailabilityModal(false);
        addNotification(`Price quote sent to ${selectedBroadcast.patientName}!`);
    };

    const fulfillOrder = async (orderId, mongoId) => {
        try {
            const response = await fetch(`${API_BASE}/orders/${mongoId}/fulfill`, {
                method: 'PATCH'
            });
            if(response.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Completed' } : o));
                addNotification(`Order ${orderId} fulfilled successfully!`);
                // Stock was automatically deducted in backend, fetch updated inventory
                fetchInventory();
            }
        } catch (err) {
            alert('Failed to fulfill order');
        }
    };

    const updateStockManually = async (id, newStockAmount) => {
        const val = parseInt(newStockAmount);
        if (isNaN(val)) return;
        try {
            const item = inventory.find(i => i.id === id);
            await fetch(`${API_BASE}/inventory/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    inventory: val,
                    merchantName: businessName,
                    name: item ? item.name : undefined,
                    category: item ? item.category : undefined,
                    price: item ? item.price.replace('Rs. ', '') : undefined
                })
            });
            // Re-fetch inventory to ensure we get the true `_id` back if a new document was created
            fetchInventory();
            addNotification("Stock updated successfully.");
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/auth');
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
            {id === 'requirements' && broadcasts.length > 0 && (
                <span style={{ background: '#e53935', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: '800' }}>
                    {broadcasts.length}
                </span>
            )}
             {id === 'orders' && orders.filter(o => o.status === 'Pending').length > 0 && (
                <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: '800' }}>
                    {orders.filter(o => o.status === 'Pending').length}
                </span>
            )}
        </div>
    );

    const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
    const completedOrdersCount = orders.filter(o => o.status === 'Completed').length;
    const totalMedicineSold = orders.filter(o => o.status === 'Completed').reduce((acc, order) => acc + (order.meds ? order.meds.length : 0), 0);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', paddingTop: '80px' }}>
            
            {/* Sidebar */}
            <aside style={{ width: '280px', background: 'white', borderRight: '1px solid #eee', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'fixed', height: 'calc(100vh - 80px)', left: 0, zIndex: 50 }}>
                <div style={{ padding: '0 1.2rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            <Package size={20} />
                        </div>
                        <div>
                            <p style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{businessName}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Merchant Portal</p>
                        </div>
                    </div>
                </div>

                <SidebarItem icon={Home} label="Dashboard" id="dashboard" />
                <SidebarItem icon={Bell} label="Patient Requirements" id="requirements" />
                <SidebarItem icon={ClipboardList} label="Order History" id="orders" />
                <SidebarItem icon={TrendingUp} label="Inventory Stock" id="inventory" />

                <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <SidebarItem icon={LogOut} label="Logout" id="logout" />
                </div>
            </aside>

            {/* Notifications Overlay */}
            <div style={{ position: 'fixed', top: '100px', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '350px' }}>
                {notifications.map(n => (
                    <div key={n.id} className="card shake" style={{ background: 'white', borderLeft: '4px solid var(--primary)', padding: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'slideInRight 0.5s ease-out' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{n.message}</p>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <main style={{ flex: 1, marginLeft: '280px', padding: '2rem 3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            {activeTab === 'dashboard' ? 'Overview' : 
                             activeTab === 'requirements' ? 'Live Pharmacy Requirements' : 
                             activeTab === 'orders' ? 'Manage Orders' : 'Inventory Management'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>Real-time updates for {businessName}</p>
                    </div>
                    {activeTab === 'inventory' && (
                        <button onClick={() => setShowAddStockModal(true)} className="btn-primary" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', fontWeight: '700' }}>
                            <Plus size={18} /> Add New Stock
                        </button>
                    )}
                </div>

                {/* Dashboard View */}
                {activeTab === 'dashboard' && (
                    <div className="fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '14px', color: 'var(--primary)' }}>
                                    <ShoppingCart size={24} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pending Orders</p>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{pendingOrdersCount}</h3>
                                </div>
                            </div>
                            <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
                                <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '14px', color: '#1e88e5' }}>
                                    <Check size={24} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Orders Completed</p>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{completedOrdersCount}</h3>
                                </div>
                            </div>
                            <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
                                <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '14px', color: '#2e7d32' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Medicines Sold</p>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{totalMedicineSold}</h3>
                                </div>
                            </div>
                            <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
                                <div style={{ background: '#f3e5f5', padding: '1rem', borderRadius: '14px', color: '#8e24aa' }}>
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Inventory Items</p>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{inventory.length}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders Preview */}
                        <div className="card" style={{ background: 'white', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Recent Pending Orders</h3>
                                <button onClick={() => setActiveTab('orders')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                                    View All <ArrowRight size={16} />
                                </button>
                            </div>
                            {orders.filter(o => o.status === 'Pending').length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No fresh orders right now.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {orders.filter(o => o.status === 'Pending').slice(0, 3).map(order => (
                                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', border: '1px solid #f0f0f0', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Activity size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '700' }}>{order.patient}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.id} • Rs. {order.total}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => fulfillOrder(order.id, order.mongoId)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                                Fulfill Now
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Patient Requirements / Broadcasts View */}
                {activeTab === 'requirements' && (
                    <div className="fade-in">
                        <div className="card" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', marginBottom: '1.5rem', padding: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {broadcasts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                        <Bell size={40} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: '600' }}>No active broadcasts from patients right now.</p>
                                    </div>
                                ) : (
                                    broadcasts.map((req, idx) => (
                                        <div key={idx} className="card shake" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.3rem' }}>{req.patientName}</p>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <ClipboardList size={16} /> Needs: {req.medicines?.map(m => m.name).join(', ')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => openAvailabilityModal(req)}
                                                className="btn-primary"
                                                style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <Send size={18} /> Send Quote
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders View */}
                {activeTab === 'orders' && (
                    <div className="fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {orders.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '24px' }}>
                                    <ShoppingCart size={40} color="#ccc" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ color: 'var(--text-muted)' }}>No orders strictly found.</h3>
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <div key={order.id} className="card" style={{ 
                                        padding: '1.5rem', 
                                        background: 'white', 
                                        border: order.status === 'Completed' ? '2px solid #e8f5e9' : '1px solid #f0f0f0',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h5 style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{order.patient}</h5>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(order.date).toLocaleString()}</p>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', background: order.status === 'Completed' ? '#e8f5e9' : '#fff3e0', color: order.status === 'Completed' ? '#2e7d32' : '#ef6c00', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: '800' }}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Items Ordered</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                {order.meds?.map((m, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                        <span style={{ fontWeight: '600' }}>{m.name}</span>
                                                        <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Rs. {m.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.8rem', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem' }}>
                                                <span>Total</span>
                                                <span className="text-gradient">Rs. {order.total}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Ref: {order.id}</p>
                                            {order.status !== 'Completed' && (
                                                <button 
                                                    onClick={() => fulfillOrder(order.id, order.mongoId)}
                                                    className="btn-primary"
                                                    style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                >
                                                    <Check size={16} /> Fulfill & Update Stock
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Inventory View */}
                {activeTab === 'inventory' && (
                    <div className="fade-in card" style={{ background: 'white', padding: '2rem' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{ padding: '1.2rem', fontWeight: '700', color: 'var(--text-main)', borderBottom: '2px solid #eee' }}>Item Name</th>
                                        <th style={{ padding: '1.2rem', fontWeight: '700', color: 'var(--text-main)', borderBottom: '2px solid #eee' }}>Category</th>
                                        <th style={{ padding: '1.2rem', fontWeight: '700', color: 'var(--text-main)', borderBottom: '2px solid #eee' }}>Stock Level</th>
                                        <th style={{ padding: '1.2rem', fontWeight: '700', color: 'var(--text-main)', borderBottom: '2px solid #eee' }}>Price</th>
                                        <th style={{ padding: '1.2rem', fontWeight: '700', color: 'var(--text-main)', borderBottom: '2px solid #eee' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s', ':hover': { background: '#f8fafc'} }}>
                                            <td style={{ padding: '1.2rem', fontWeight: '600' }}>{item.name}</td>
                                            <td style={{ padding: '1.2rem', color: 'var(--text-muted)' }}>{item.category || 'General'}</td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '0.3rem 0.8rem',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    background: item.stock < 50 ? '#ffebee' : '#e8f5e9',
                                                    color: item.stock < 50 ? '#d32f2f' : '#2e7d32',
                                                    fontWeight: '700'
                                                }}>
                                                    {item.stock} Units
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem', fontWeight: '600' }}>{item.price}</td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <button
                                                    onClick={() => {
                                                        const val = prompt(`Update stock for ${item.name}:`, item.stock);
                                                        if (val !== null) updateStockManually(item.id, val);
                                                    }}
                                                    className="btn-outline"
                                                    style={{ padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
                                                >
                                                    Edit Stock
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {inventory.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    Your inventory is empty. Add new stock to begin.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Broadcast Availability Modal */}
            {showAvailabilityModal && selectedBroadcast && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card fade-in" style={{ maxWidth: '600px', width: '100%', padding: '2.5rem' }}>
                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '800' }}>Send Price Quote</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Patient: {selectedBroadcast.patientName}</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', paddingBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
                                <div style={{ flex: 2 }}>Medicine Required</div>
                                <div style={{ flex: 1 }}>Your Price</div>
                                <div style={{ flex: 1 }}>Availability</div>
                            </div>
                            {quotedMeds.map((med, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={med.available} 
                                            onChange={e => {
                                                const updated = [...quotedMeds];
                                                updated[idx].available = e.target.checked;
                                                setQuotedMeds(updated);
                                            }}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <p style={{ fontWeight: '600', fontSize: '1rem', color: med.available ? 'var(--text-main)' : '#ccc' }}>{med.name}</p>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: '0.9rem' }}>Rs.</span>
                                            <input 
                                                type="number" 
                                                placeholder="0.00"
                                                disabled={!med.available}
                                                value={med.price}
                                                onChange={e => {
                                                    const updated = [...quotedMeds];
                                                    updated[idx].price = e.target.value;
                                                    setQuotedMeds(updated);
                                                }}
                                                className="glass"
                                                style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2rem', borderRadius: '8px', border: '1px solid #ddd', background: med.available ? 'white' : '#f5f5f5' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input 
                                            type="text" 
                                            placeholder="In Stock"
                                            disabled={!med.available}
                                            value={med.stock}
                                            onChange={e => {
                                                const updated = [...quotedMeds];
                                                updated[idx].stock = e.target.value;
                                                setQuotedMeds(updated);
                                            }}
                                            className="glass"
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', background: med.available ? 'white' : '#f5f5f5' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={handleBroadcastResponse} className="btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}>Send Quote to Patient</button>
                            <button onClick={() => setShowAvailabilityModal(false)} className="btn-outline" style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Stock Modal */}
            {showAddStockModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card fade-in" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Add New Stock</h3>
                            <button onClick={() => setShowAddStockModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>&times;</button>
                        </div>
                        <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Medicine Name</label>
                                <input required type="text" className="glass" placeholder="E.g., Paracetamol 500mg" value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd', background: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Category</label>
                                <input required type="text" className="glass" placeholder="E.g., General, Antibiotic" value={newStock.category} onChange={e => setNewStock({...newStock, category: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd', background: 'white' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Price (Rs)</label>
                                    <input required type="number" step="0.01" className="glass" placeholder="0.00" value={newStock.price} onChange={e => setNewStock({...newStock, price: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd', background: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Initial Inventory</label>
                                    <input required type="number" className="glass" placeholder="Units" value={newStock.inventory} onChange={e => setNewStock({...newStock, inventory: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd', background: 'white' }} />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" style={{ padding: '1rem', marginTop: '1rem', borderRadius: '12px', fontSize: '1rem' }}>
                                Save Stock Item
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MerchantPortal;
