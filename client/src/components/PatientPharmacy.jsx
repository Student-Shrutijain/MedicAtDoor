import React from 'react';
import { ShoppingCart } from 'lucide-react';

const PatientPharmacy = ({ pharmacyOffers, toggleMedSelection, placeOrder }) => {
    return (
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
    );
};

export default PatientPharmacy;
