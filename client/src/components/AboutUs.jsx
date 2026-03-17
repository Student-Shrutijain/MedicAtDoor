import React from 'react';
import { ShieldCheck, Users, Stethoscope, Heart, Globe, Award, Target, Zap } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="fade-in" style={{ paddingTop: '100px' }}>
            {/* Mission Hero */}
            <section style={{
                background: 'linear-gradient(135deg, #00897b 0%, #004d40 100%)',
                color: 'white',
                padding: '120px 0',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
                    <Heart size={400} fill="white" />
                </div>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <h1 className="heading-xl" style={{ marginBottom: '1.5rem', color: 'white' }}>
                        Healthcare Without <span style={{ color: '#4db6ac' }}>Boundaries</span>
                    </h1>
                    <p style={{ fontSize: '1.4rem', opacity: 0.9, maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
                        MedicAtDoor is India's leading digital health ecosystem, connecting patients, doctors, and pharmacies through a seamless, smart, and secure platform.
                    </p>
                </div>
            </section>

            {/* What We Do */}
            <section style={{ padding: '100px 0', background: 'var(--white)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 className="heading-lg" style={{ marginBottom: '1rem' }}>
                            Our <span className="text-gradient">Impact</span>
                        </h2>
                        <div style={{ width: '80px', height: '4px', background: 'var(--primary)', margin: '0 auto', borderRadius: '2px' }} />
                    </div>

                    <div className="grid-responsive" style={{ gap: '3rem' }}>
                        <ImpactCard
                            icon={Globe}
                            title="Universal Access"
                            description="Bridging the gap between urban specialists and rural patients through high-quality video consultations."
                        />
                        <ImpactCard
                            icon={ShieldCheck}
                            title="Certified Ethics"
                            description="Strictly following NHM and Telemedicine Practice Guidelines to ensure patient safety and data privacy."
                        />
                        <ImpactCard
                            icon={Zap}
                            title="Instant Triage"
                            description="Smart symptoms analysis that routes you to the right specialist in under 10 minutes."
                        />
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section style={{ padding: '100px 0', background: '#f8f9fa' }}>
                <div className="container">
                    <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                        <div className="card card-hover" style={{ padding: '4rem', borderRadius: '32px', boxShadow: 'var(--shadow-lg)' }}>
                            <div style={{ background: 'var(--primary-light)', padding: '1.2rem', borderRadius: '16px', display: 'inline-flex', marginBottom: '2rem' }}>
                                <Target size={32} color="var(--primary)" />
                            </div>
                            <h3 className="heading-md" style={{ marginBottom: '1.5rem' }}>Our Mission</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                                To democratize world-class healthcare by building a digital-first infrastructure that makes medical advice, history management, and medicine fulfillment accessible to every citizen, regardless of their location.
                            </p>
                        </div>
                        <div className="card card-hover" style={{ padding: '4rem', borderRadius: '32px', boxShadow: 'var(--shadow-lg)', background: 'var(--primary)', color: 'white' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.2rem', borderRadius: '16px', display: 'inline-flex', marginBottom: '2rem' }}>
                                <Award size={32} color="white" />
                            </div>
                            <h3 className="heading-md" style={{ marginBottom: '1.5rem', color: 'white' }}>Our Vision</h3>
                            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                                To become the digital backbone of the healthcare industry where data-driven insights empower doctors to provide personalized care and patients to own their health records securely.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services */}
            <section style={{ padding: '100px 0', background: 'var(--white)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 className="heading-lg" style={{ marginBottom: '4rem' }}>Services We <span className="text-gradient">Provide</span></h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        <ServiceItem icon={Stethoscope} title="Video Consultations" description="HD Video consultations with top-rated certified specialists." />
                        <ServiceItem icon={Users} title="Health Vault" description="Securely store and manage your entire family's medical history." />
                        <ServiceItem icon={Heart} title="Emergency SOS" description="One-tap emergency assistance and ambulance coordination." />
                    </div>
                </div>
            </section>
        </div>
    );
};

const ImpactCard = ({ icon: Icon, title, description }) => (
    <div className="card-hover" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ background: 'var(--primary-light)', padding: '1.5rem', borderRadius: '50%', display: 'inline-flex', marginBottom: '1.5rem' }}>
            <Icon size={32} color="var(--primary)" />
        </div>
        <h4 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '1rem' }}>{title}</h4>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{description}</p>
    </div>
);

const ServiceItem = ({ icon: Icon, title, description }) => (
    <div className="card card-hover" style={{ padding: '2.5rem', borderRadius: '32px', textAlign: 'left', border: '1px solid #f0f0f0' }}>
        <Icon size={32} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
        <h4 style={{ fontWeight: '800', marginBottom: '0.8rem' }}>{title}</h4>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{description}</p>
    </div>
);

export default AboutUs;
