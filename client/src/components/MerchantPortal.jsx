import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, TrendingUp, AlertCircle, Check, ArrowRight, Loader2 } from 'lucide-react';

const MerchantPortal = () => {
    const [inventory, setInventory] = useState([
        { id: 1, name: 'Paracetamol 500mg', stock: 450, price: 'Rs. 50' },
        { id: 2, name: 'Amoxicillin 250mg', stock: 120, price: 'Rs. 120' },
        { id: 3, name: 'Cough Syrup (100ml)', stock: 50, price: 'Rs. 180' },
        { id: 4, name: 'Vitamin D3 (60k UI)', stock: 300, price: 'Rs. 250' },
    ]);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_BASE = 'http://localhost:5000/api';

    useEffect(() => {
        const loadMerchantData = async () => {
            try {
                // Load Inventory from Medicines
                const medRes = await fetch(`${API_BASE}/medicines`);
                const meds = await medRes.json();
                setInventory(meds.map(m => ({
                    id: m._id,
                    name: m.name,
                    stock: m.inventory || 100,
                    price: `Rs. ${m.price}`
                })));

                fetchOrders();
            } catch (err) {
                console.error('Merchant load error:', err);
            }
        };

        loadMerchantData();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE}/orders`);
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fulfillOrder = async (orderId, medicineId, qty, mongoId) => {
        try {
            // Update Prescription Status
            await fetch(`${API_BASE}/prescriptions/${mongoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed' })
            });

            // Update Medicine Inventory
            // (In a real app, the server would handle this in one transaction)
            // For now, we update local state to reflect the change
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Completed' } : o));
            alert(`Order ${orderId} fulfilled successfully!`);
            fetchOrders();
        } catch (err) {
            alert('Failed to fulfill order');
        }
    };

    const updateStockManually = (id, newStock) => {
        const val = parseInt(newStock);
        if (isNaN(val)) return;
        setInventory(prev => prev.map(item => item.id === id ? { ...item, stock: val } : item));
    };

    const merchantData = JSON.parse(localStorage.getItem('userData') || '{}');
    const businessName = merchantData.businessName || 'Merchant Dashboard';

    return (
        <div className="container" style={{ padding: '120px 0 60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem' }}>{businessName}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Manage inventory and fulfill patient medicine orders.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={18} /> Add Stock
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} color="var(--primary)" /> Inventory Management
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: '1rem', fontWeight: '600' }}>Item Name</th>
                                    <th style={{ padding: '1rem', fontWeight: '600' }}>Stock Level</th>
                                    <th style={{ padding: '1rem', fontWeight: '600' }}>Price</th>
                                    <th style={{ padding: '1rem', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem' }}>{item.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                background: item.stock < 100 ? '#ffebee' : '#e8f5e9',
                                                color: item.stock < 100 ? '#d32f2f' : '#2e7d32'
                                            }}>
                                                {item.stock} in stock
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{item.price}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => {
                                                    const val = prompt(`Update stock for ${item.name}:`, item.stock);
                                                    if (val !== null) updateStockManually(item.id, val);
                                                }}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: '#f5f5f5', border: 'none' }}>
                        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShoppingCart size={18} /> Real-time Orders
                        </h4>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {orders.length === 0 ? (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>No active orders.</p>
                                ) : (
                                    orders.map(order => (
                                        <div key={order.id} className="fade-in" style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{order.id}</span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    background: order.status === 'Completed' ? '#e8f5e9' : '#fff3e0',
                                                    color: order.status === 'Completed' ? '#2e7d32' : '#ef6c00',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '20px',
                                                    fontWeight: '600'
                                                }}>{order.status}</span>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{order.meds} x {order.qty}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Patient: {order.patient}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'white', background: 'var(--primary)', display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.4rem' }}>{order.type}</p>
                                            {order.status === 'Pending' && (
                                                <button
                                                    onClick={() => fulfillOrder(order.id, order.medicineId, order.qty, order.mongoId)}
                                                    style={{ marginTop: '0.8rem', width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}
                                                >
                                                    <Check size={16} /> Fulfill Order
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <AlertCircle size={32} color="#fbc02d" style={{ marginBottom: '0.8rem' }} />
                        <h4 style={{ marginBottom: '0.5rem' }}>Low Stock Alert</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cough Syrup (100ml) is running low. Consider restocking soon.</p>
                    </div>
                </div>
            </div>

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

export default MerchantPortal;
