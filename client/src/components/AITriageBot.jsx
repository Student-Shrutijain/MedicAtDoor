import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

const AITriageBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hello! I'm your MedicAtDoor assistant. How can I help you today?", isBot: true }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { text: input, isBot: false }];
        setMessages(newMessages);
        setInput('');

        // Mock bot response
        setTimeout(() => {
            let botResponse = "I understand. Based on your symptoms, it sounds like you might need to speak with a General Physician. Would you like to start the registration process?";
            if (input.toLowerCase().includes('heart') || input.toLowerCase().includes('chest')) {
                botResponse = "I've noted symptoms related to the heart. I recommend consulting a Cardiologist. Please register to book a slot.";
            }
            setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
        }, 1000);
    };

    return (
        <div style={{ position: 'fixed', bottom: '6rem', right: '2rem', zIndex: 1000 }}>
            {isOpen ? (
                <div className="card glass" style={{ width: '350px', height: '450px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bot size={20} />
                            <span style={{ fontWeight: '600' }}>AI Triage Bot</span>
                        </div>
                        <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
                    </div>

                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.isBot ? 'flex-start' : 'flex-end',
                                background: msg.isBot ? 'var(--primary-light)' : 'var(--primary)',
                                color: msg.isBot ? 'var(--text-main)' : 'white',
                                padding: '0.8rem 1rem',
                                borderRadius: '12px',
                                maxWidth: '85%',
                                fontSize: '0.9rem',
                                borderBottomLeftRadius: msg.isBot ? '2px' : '12px',
                                borderBottomRightRadius: msg.isBot ? '12px' : '2px'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your symptoms..."
                            style={{ flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '0.5rem 1rem', outline: 'none' }}
                        />
                        <button
                            onClick={handleSend}
                            style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{ background: 'var(--primary)', color: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0, 137, 123, 0.3)' }}
                >
                    <Bot size={30} />
                </button>
            )}
        </div>
    );
};

export default AITriageBot;
