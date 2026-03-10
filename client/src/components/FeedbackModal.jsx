import React, { useState } from 'react';
import { Star, X, Check, ArrowRight } from 'lucide-react';

const FeedbackModal = ({ doctorName, onComplete }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (rating === 0) return;
        setSubmitted(true);
        setTimeout(onComplete, 2000);
    };

    return (
        <div className="card fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
            {!submitted ? (
                <>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>How was your session?</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Rate your experience with {doctorName}.</p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={32}
                                fill={(hover || rating) >= star ? "#ffb300" : "none"}
                                color={(hover || rating) >= star ? "#ffb300" : "#ddd"}
                                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>

                    <textarea
                        placeholder="Help us improve with a quick review..."
                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #ddd', minHeight: '100px', marginBottom: '1.5rem', outline: 'none' }}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <button
                        disabled={rating === 0}
                        onClick={handleSubmit}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: rating === 0 ? 0.6 : 1 }}
                    >
                        Submit Feedback <ArrowRight size={18} />
                    </button>
                </>
            ) : (
                <div className="fade-in" style={{ padding: '2rem' }}>
                    <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
                        <Check size={32} />
                    </div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Thank You!</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Your feedback helps us provide better care for everyone.</p>
                </div>
            )}
        </div>
    );
};

export default FeedbackModal;
