import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Stethoscope,
    ChevronRight,
    Search,
    CheckCircle,
    Clock,
    ShieldCheck,
    User,
    Store,
    Heart,
    ExternalLink,
    Mail,
    Phone,
    MapPin,
    ArrowRight
} from 'lucide-react';
import AITriageBot from './AITriageBot';
import SOSButton from './SOSButton';
import { API_BASE } from '../config';

const Home = () => {
    const navigate = useNavigate();
    const [activeHeroTab, setActiveHeroTab] = useState('symptoms');
    const [showSymptomModal, setShowSymptomModal] = useState(false);
    const [symptomSearch, setSymptomSearch] = useState('');
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    
    // Dynamic data state
    const [symptoms, setSymptoms] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [allSymptomsCategorized, setAllSymptomsCategorized] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sympRes, specRes] = await Promise.all([
                fetch(`${API_BASE}/symptoms`),
                fetch(`${API_BASE}/specialties`)
            ]);
            
            const sympData = await sympRes.json();
            const specData = await specRes.json();

            setSymptoms(sympData.filter(s => s.category === 'Most Selected Issues'));
            setSpecialties(specData);

            // Group symptoms by category
            const categorized = sympData.reduce((acc, curr) => {
                if (!acc[curr.category]) acc[curr.category] = [];
                acc[curr.category].push(curr);
                return acc;
            }, {});
            setAllSymptomsCategorized(categorized);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleSelectSpecialty = (spec) => {
        // We can navigate to doctors page with specialty filter
        navigate('/doctors', { state: { specialty: spec } });
    };

    const handleSelectSymptom = (symbolName) => {
        setSelectedSymptoms(prev => {
            if (prev.includes(symbolName)) {
                return prev.filter(s => s !== symbolName);
            }
            return [...prev, symbolName];
        });
    };

    const handleConsultNow = () => {
        if (selectedSymptoms.length === 0) {
            alert("Please select at least one symptom.");
            return;
        }

        // Map first selected symptom to specialty (industry standard for initial triage)
        const primarySymptomName = selectedSymptoms[0];
        let mappedSpec = "Physician";

        Object.values(allSymptomsCategorized).flat().forEach(sym => {
            if (sym.name === primarySymptomName) mappedSpec = sym.specialty;
        });

        // Hero mapping overrides
        const heroMapping = {
            "Diabetes": "Physician",
            "Depression": "Psychiatrist",
            "Gastritis": "Physician",
            "Body Pain": "Orthopedician",
            "Acne / Pimples": "Dermatologist",
            "Stomach Ache": "Physician"
        };
        if (heroMapping[primarySymptomName]) mappedSpec = heroMapping[primarySymptomName];

        navigate('/doctors', { state: { specialty: mappedSpec, selectedSymptoms } });
    };

    return (
        <main>
            {/* New Hero Section */}
            <section className="hero-wrapper">
                <div className="container">
                    <div className="hero-card animate-fade-up">
                        <div style={{ flex: 1, zIndex: 1 }}>
                            <h1 className="heading-xl">
                                Consult India's Top <br />
                                <span className="text-gradient">Doctors Online</span>
                            </h1>
                            <div className="grid-responsive" style={{ maxWidth: '500px', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.2rem' }}>
                                <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', borderRadius: '16px' }}>
                                    <div style={{ background: 'var(--white)', padding: '0.5rem', borderRadius: '10px', color: 'var(--primary)', display: 'flex' }}><Stethoscope size={18} /></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>35+ specialties</span>
                                </div>
                                <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', borderRadius: '16px' }}>
                                    <div style={{ background: 'var(--white)', padding: '0.5rem', borderRadius: '10px', color: 'var(--primary)', display: 'flex' }}><Users size={18} /></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>10L+ Users</span>
                                </div>
                                <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', borderRadius: '16px' }}>
                                    <div style={{ background: 'var(--white)', padding: '0.5rem', borderRadius: '10px', color: 'var(--primary)', display: 'flex' }}><Clock size={18} /></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>10 mins wait</span>
                                </div>
                                <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', borderRadius: '16px' }}>
                                    <div style={{ background: 'var(--white)', padding: '0.5rem', borderRadius: '10px', color: 'var(--primary)', display: 'flex' }}><ShieldCheck size={18} /></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Free follow-ups</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ flex: 0.8, position: 'relative' }} className="animate-float">
                            <img
                                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"
                                alt="Doctors"
                                style={{ width: '100%', borderRadius: '24px', boxShadow: 'var(--shadow-lg)' }}
                            />
                        </div>
                    </div>

                    {/* Selector Tabs */}
                    <div style={{ marginTop: '-40px', position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center' }}>
                        <div className="glass" style={{ display: 'flex', padding: '0.6rem', borderRadius: '20px', gap: '0.6rem', boxShadow: 'var(--shadow-md)' }}>
                            <button
                                onClick={() => setActiveHeroTab('symptoms')}
                                className={activeHeroTab === 'symptoms' ? 'btn-primary' : 'btn'}
                                style={{
                                    padding: '0.8rem 2.5rem',
                                    borderRadius: '16px',
                                    background: activeHeroTab === 'symptoms' ? '' : 'transparent',
                                    color: activeHeroTab === 'symptoms' ? '' : 'var(--text-main)',
                                }}
                            >
                                Symptoms
                            </button>
                            <button
                                onClick={() => setActiveHeroTab('specialties')}
                                className={activeHeroTab === 'specialties' ? 'btn-primary' : 'btn'}
                                style={{
                                    padding: '0.8rem 2.5rem',
                                    borderRadius: '16px',
                                    background: activeHeroTab === 'specialties' ? '' : 'transparent',
                                    color: activeHeroTab === 'specialties' ? '' : 'var(--text-main)',
                                }}
                            >
                                Specialities
                            </button>
                        </div>
                    </div>

                    {/* Grid Preview */}
                    <div style={{ marginTop: '4rem' }}>
                        <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            {(activeHeroTab === 'symptoms' ? symptoms : specialties).map((item, idx) => {
                                const isSelected = activeHeroTab === 'symptoms' && selectedSymptoms.includes(item.name);
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => activeHeroTab === 'symptoms' ? handleSelectSymptom(item.name) : handleSelectSpecialty(item.name)}
                                        className={`card card-hover ${isSelected ? 'selected-symptom' : ''}`}
                                        style={{
                                            padding: '1.5rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            border: isSelected ? '2px solid var(--primary)' : '1px solid transparent',
                                            background: isSelected ? 'var(--primary-light)' : ''
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            {isSelected && <CheckCircle size={16} color="var(--primary)" />}
                                            <span style={{ fontWeight: '700', fontSize: '1rem' }}>{item.name}</span>
                                        </div>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            background: isSelected ? 'var(--white)' : 'var(--primary-light)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.4rem'
                                        }}>
                                            {item.icon}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {activeHeroTab === 'symptoms' && selectedSymptoms.length > 0 && (
                            <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                                <button className="btn-primary" style={{ padding: '1rem 3rem', borderRadius: '16px', boxShadow: '0 10px 20px rgba(0, 137, 123, 0.2)' }} onClick={handleConsultNow}>
                                    Consult Now for {selectedSymptoms.length} Symptoms <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                            <button
                                className="btn-outline"
                                style={{ padding: '0.8rem 2.5rem', borderRadius: '16px' }}
                                onClick={() => setShowSymptomModal(true)}
                            >
                                View all {activeHeroTab} <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Portal Paths Section */}
            <section style={{ padding: '100px 0', background: 'var(--white)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="heading-lg">Trusted <span className="text-gradient">Care Ecosystem</span></h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Seamless healthcare connectivity for everyone.</p>
                    </div>
                    <div className="grid-responsive" style={{ gap: '2rem' }}>
                        <PortalCard
                            title="Patients"
                            description="Book top-tier consultations and manage your health family's records easily."
                            icon={User}
                            color="#00897b"
                            path="/register/patient"
                        />
                        <PortalCard
                            title="Doctors"
                            description="Streamline your practice with digital history and smart prescription tools."
                            icon={Stethoscope}
                            color="#1e88e5"
                            path="/register/doctor"
                        />
                        <PortalCard
                            title="Merchants"
                            description="Fulfill verified prescriptions and manage your pharmacy inventory."
                            icon={Store}
                            color="#8e24aa"
                            path="/register/merchant"
                        />
                    </div>
                </div>
            </section>

            {/* Government-Style Footer */}
            <footer style={{ background: '#1a232e', color: 'white', padding: '100px 0 50px' }}>
                <div className="container">
                    <div className="grid-responsive" style={{ gap: '4rem', marginBottom: '5rem' }}>
                        <div style={{ maxWidth: '300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                                <Heart color="var(--primary)" fill="var(--primary)" size={32} />
                                <span style={{ fontSize: '1.8rem', fontWeight: '800' }}>MedicAtDoor</span>
                            </div>
                            <p style={{ color: '#b0bec5', fontSize: '0.95rem', lineHeight: '1.8' }}>
                                Empowering health through digital connectivity. Certified telehealth guidelines following NHM standards.
                            </p>
                        </div>
                        <div>
                            <h4 className="heading-md" style={{ color: 'var(--white)', fontSize: '1.2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block' }}>For Patients</h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: '#b0bec5', marginTop: '1.5rem' }}>
                                <li className="nav-link" style={{ cursor: 'pointer', color: '#b0bec5' }} onClick={() => navigate('/doctors')}>Search Top Doctors</li>
                                <li className="nav-link" style={{ cursor: 'pointer', color: '#b0bec5' }} onClick={() => navigate(localStorage.getItem('token') ? '/patient-portal' : '/auth')}>Patient Health Vault</li>
                                <li className="nav-link" style={{ cursor: 'pointer', color: '#b0bec5' }} onClick={() => navigate(localStorage.getItem('token') ? '/merchant-portal' : '/auth')}>Order Medicines</li>
                                <li className="nav-link" style={{ cursor: 'pointer', color: '#b0bec5' }} onClick={() => navigate('/guidelines')}>SOS Emergency Guidelines</li>
                                <li className="nav-link" style={{ cursor: 'pointer', color: '#b0bec5' }} onClick={() => navigate('/about')}>About MedicAtDoor</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="heading-md" style={{ color: 'var(--white)', fontSize: '1.2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block' }}>Governance</h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: '#b0bec5', marginTop: '1.5rem' }}>
                                <li className="nav-link" style={{ cursor: 'pointer', color: '#b0bec5', transition: 'color 0.3s ease' }} onClick={() => navigate('/guidelines')}>Telemedicine Guidelines</li>
                                <li className="nav-link" style={{ cursor: 'pointer', color: '#b0bec5', transition: 'color 0.3s ease' }} onClick={() => navigate('/guidelines')}>Data Privacy & Policy</li>
                                <li className="nav-link" style={{ cursor: 'pointer', color: '#b0bec5', transition: 'color 0.3s ease' }} onClick={() => navigate('/guidelines')}>Terms of Service</li>
                                <li className="nav-link" style={{ cursor: 'pointer', color: '#b0bec5', transition: 'color 0.3s ease' }} onClick={() => navigate('/login/admin')}>Grievance Redressal</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="heading-md" style={{ color: 'var(--white)', fontSize: '1.2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block' }}>Contact Support</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: '#b0bec5', fontSize: '0.9rem', marginTop: '1.5rem' }}>
                                <div className="nav-link" style={{ display: 'flex', gap: '0.8rem', cursor: 'pointer', color: '#b0bec5' }} onClick={() => window.location.href = 'tel:18004442222'}><Phone size={18} color="var(--primary)" /> <span>1800-444-2222 (Toll Free)</span></div>
                                <div className="nav-link" style={{ display: 'flex', gap: '0.8rem', cursor: 'pointer', color: '#b0bec5' }} onClick={() => window.location.href = 'mailto:help@medicatdoor.gov.in'}><Mail size={18} color="var(--primary)" /> <span>help@medicatdoor.gov.in</span></div>
                                <div className="nav-link" style={{ display: 'flex', gap: '0.8rem', cursor: 'pointer', color: '#b0bec5' }} onClick={() => window.open('https://www.google.com/maps?q=Ministry+of+Health+New+Delhi', '_blank')}><MapPin size={18} color="var(--primary)" /> <span>Digital Cell, New Delhi</span></div>
                            </div>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3rem', textAlign: 'center', fontSize: '0.9rem', color: '#90a4ae' }}>
                        <p>© 2026 MedicAtDoor - National Tele-Health Initiative. All rights reserved.</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '1.5rem' }}>
                            <span className="nav-link" style={{ cursor: 'pointer', color: '#90a4ae' }}>Accessibility</span>
                            <span className="nav-link" style={{ cursor: 'pointer', color: '#90a4ae' }}>Site Map</span>
                            <span className="nav-link" style={{ cursor: 'pointer', color: '#90a4ae' }}>Help Center</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* View All Modal */}
            {showSymptomModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-up" style={{ width: '100%', maxWidth: '500px', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '28px', overflow: 'hidden' }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <button onClick={() => setShowSymptomModal(false)} className="btn" style={{ background: '#f5f5f5', borderRadius: '50%', width: '44px', height: '44px' }}>&larr;</button>
                                <h3 className="heading-md" style={{ marginBottom: 0 }}>{activeHeroTab === 'symptoms' ? 'Select Symptoms' : 'Select Specialty'}</h3>
                            </div>
                        </div>

                        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                            <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderRadius: '18px', marginBottom: '2.5rem', border: '1px solid #eee' }}>
                                <Search size={20} color="var(--text-muted)" />
                                <input
                                    type="text"
                                    placeholder={`Search for ${activeHeroTab}...`}
                                    style={{ border: 'none', background: 'none', width: '100%', marginLeft: '1rem', outline: 'none', fontSize: '1rem' }}
                                    value={symptomSearch}
                                    onChange={(e) => setSymptomSearch(e.target.value)}
                                />
                            </div>

                            {activeHeroTab === 'symptoms' ? (
                                Object.entries(allSymptomsCategorized).map(([category, items]) => (
                                    <div key={category} style={{ marginBottom: '2.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>{category}</h4>
                                            <div style={{ flex: 1, height: '1px', background: 'var(--primary)', opacity: 0.15 }} />
                                        </div>
                                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {items.filter(i => i.name.toLowerCase().includes(symptomSearch.toLowerCase())).map((item, idx) => {
                                                const isSelected = selectedSymptoms.includes(item.name);
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleSelectSymptom(item.name)}
                                                        className="card-hover"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '1rem',
                                                            padding: '1rem',
                                                            background: isSelected ? 'var(--primary)' : 'var(--primary-light)',
                                                            color: isSelected ? 'white' : 'inherit',
                                                            borderRadius: '16px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                                            {isSelected ? <CheckCircle size={16} color="var(--primary)" /> : item.icon}
                                                        </div>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                                    {specialties.map((s, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelectSpecialty(s.name)}
                                            className="card card-hover"
                                            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', alignItems: 'center', textAlign: 'center' }}
                                        >
                                            <span style={{ fontSize: '2rem' }}>{s.icon}</span>
                                            <span style={{ fontWeight: '700' }}>{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AITriageBot />
            <SOSButton />
        </main>
    );
};

const PortalCard = ({ title, description, icon: Icon, color, path }) => {
    const navigate = useNavigate();
    return (
        <div className="card card-hover" style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', padding: '3rem 2rem' }}>
            <div style={{ background: color + '15', padding: '2rem', borderRadius: '50%', display: 'flex' }}>
                <Icon color={color} size={48} />
            </div>
            <h3 className="heading-md" style={{ marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>{description}</p>
            <button
                onClick={() => navigate(path)}
                className="btn-primary"
                style={{ marginTop: 'auto', width: '100%', borderRadius: '14px', padding: '1rem' }}
            >
                Enter {title} Portal
            </button>
        </div>
    );
};

export default Home;
