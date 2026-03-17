import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff,
    Maximize, Minimize, Settings, MessageSquare, Shield, ClipboardList
} from 'lucide-react';

const socket = io('http://localhost:5000');

const VideoConsultation = ({ roomId, userName, onEnd, onNotesChange, initialNotes = '', showNotepad = false, autoStart = false }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callStarted, setCallStarted] = useState(false);
    const [notes, setNotes] = useState(initialNotes);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const chatEndRef = useRef(null);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const pc = useRef();

    const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    useEffect(() => {
        let currentStream = null;

        const initCall = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                currentStream = stream;
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                socket.emit('join-room', roomId);

                // Wait for other user to join to start call, or auto-start if they are already there
                socket.on('user-joined', () => {
                    console.log('Other user joined, starting call...');
                    if (autoStart) startCallInternal(stream);
                });

                // Fallback autoStart if user is already in room
                if (autoStart) {
                    setTimeout(() => {
                        if (!pc.current || pc.current.connectionState === 'new') {
                            startCallInternal(stream);
                        }
                    }, 3000);
                }

                socket.on('offer', async (offer) => {
                    if (!pc.current) createPeerConnectionInternal(stream);
                    await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await pc.current.createAnswer();
                    await pc.current.setLocalDescription(answer);
                    socket.emit('answer', { roomId, answer });
                });

                socket.on('answer', async (answer) => {
                    if (pc.current) {
                        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
                    }
                });

                socket.on('ice-candidate', async (candidate) => {
                    if (pc.current) {
                        await pc.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
                    }
                });
            } catch (err) {
                console.error('Media access error:', err);
                alert('Could not access camera or microphone. Please check permissions.');
            }
        };

        initCall();

        socket.on('chat-message', (data) => {
            setMessages(prev => [...prev, data]);
        });
        
        socket.on('end-call', () => {
             // The other person ended the call
             if(onEnd) {
                 onEnd();
             }
        });

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            if (pc.current) {
                pc.current.close();
                pc.current = null;
            }
            socket.off('user-joined');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            socket.off('chat-message');
            socket.off('end-call');
        };
    }, [roomId, autoStart]);

    const createPeerConnectionInternal = (stream) => {
        if (!stream) return;
        pc.current = new RTCPeerConnection(configuration);

        stream.getTracks().forEach(track => {
            pc.current.addTrack(track, stream);
        });

        pc.current.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { roomId, candidate: event.candidate });
            }
        };

        setCallStarted(true);
    };

    const startCallInternal = async (stream) => {
        if (!stream || (pc.current && pc.current.signalingState !== 'stable')) return;
        createPeerConnectionInternal(stream);
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
    };

    const startCall = () => startCallInternal(localStream);

    const toggleMute = () => {
        if (!localStream) return;
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const toggleCamera = () => {
        if (!localStream) return;
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOff(!videoTrack.enabled);
        }
    };

    const handleNotesChange = (e) => {
        const val = e.target.value;
        setNotes(val);
        if (onNotesChange) onNotesChange(val);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const msgData = {
            roomId,
            sender: userName,
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        socket.emit('chat-message', msgData);
        setMessages(prev => [...prev, msgData]);
        setNewMessage('');
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showChat]);

    const handleEndCall = () => {
        socket.emit('end-call', { roomId });
        if(onEnd) onEnd();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0f172a', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '12px' }}>
                        <Shield color="white" size={20} />
                    </div>
                    <div>
                        <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: '700' }}>Secure Consultation</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Room ID: {roomId} • End-to-end Encrypted</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '600' }}>{userName}</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Video Grid */}
                <div style={{ flex: 3, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    {/* Remote Video (Large) */}
                    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', background: '#1e293b', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {!remoteStream && (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translateY(-50%) translateX(-50%)', textAlign: 'center' }}>
                                <div className="animate-pulse" style={{ background: 'var(--primary-light)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <Video color="var(--primary)" size={48} />
                                </div>
                                <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: '600' }}>Waiting for other participant...</p>
                            </div>
                        )}

                        {/* Local Video (Floating inside Remote Video) */}
                        <div style={{ position: 'absolute', bottom: '30px', right: '30px', width: '220px', height: '140px', borderRadius: '16px', overflow: 'hidden', background: '#334155', border: '2px solid rgba(255,255,255,0.2)', boxShadow: 'var(--shadow-lg)', zIndex: 10 }}>
                            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {isCameraOff && (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <VideoOff color="white" opacity={0.5} size={28} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notepad Side Panel */}
                {showNotepad && (
                    <div style={{ flex: 1, minWidth: '350px', background: 'white', margin: '2rem 2rem 2rem 0', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px' }}>
                                <ClipboardList color="var(--primary)" size={18} />
                            </div>
                            <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>Clinical Notepad</h4>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <textarea
                                value={notes}
                                onChange={handleNotesChange}
                                placeholder="Type symptoms and preliminary diagnosis here... It will automatically sync to the prescription form."
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    padding: '1.5rem',
                                    border: 'none',
                                    resize: 'none',
                                    outline: 'none',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    color: '#334155'
                                }}
                            />
                        </div>
                        <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #eee', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            Auto-syncing with Prescription Form
                        </div>
                    </div>
                )}

                {/* Chat Side Panel */}
                {showChat && (
                    <div style={{ flex: 1, minWidth: '350px', background: 'white', margin: '2rem 2rem 2rem 0', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <MessageSquare color="var(--primary)" size={18} />
                                </div>
                                <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>In-Call Chat</h4>
                            </div>
                            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#999' }}>&times;</button>
                        </div>
                        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
                            {messages.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>No messages yet. Say hi!</p>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} style={{ alignSelf: msg.sender === userName ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                        <div style={{ background: msg.sender === userName ? 'var(--primary)' : 'white', color: msg.sender === userName ? 'white' : 'var(--text-main)', padding: '0.8rem 1rem', borderRadius: '12px', borderBottomRightRadius: msg.sender === userName ? 0 : '12px', borderBottomLeftRadius: msg.sender === userName ? '12px' : 0, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                            <p style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>{msg.text}</p>
                                        </div>
                                        <p style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.3rem', textAlign: msg.sender === userName ? 'right' : 'left' }}>
                                            {msg.sender !== userName ? `${msg.sender} • ` : ''}{msg.time}
                                        </p>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={sendMessage} style={{ padding: '1rem', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' }}>
                            <input 
                                type="text" 
                                value={newMessage} 
                                onChange={(e) => setNewMessage(e.target.value)} 
                                placeholder="Type a message..." 
                                style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' }} 
                            />
                            <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MessageSquare size={16} />
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)' }}>
                <button
                    onClick={toggleMute}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <button
                    onClick={toggleCamera}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', background: isCameraOff ? '#ef4444' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                    {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                {!callStarted && !autoStart && (
                    <button
                        onClick={startCall}
                        className="btn-primary"
                        style={{ padding: '0 2rem', height: '56px', borderRadius: '28px', fontWeight: '700', fontSize: '1rem' }}
                    >
                        Start Consultation
                    </button>
                )}

                <button
                    onClick={handleEndCall}
                    style={{ width: '120px', height: '56px', borderRadius: '28px', background: '#ef4444', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                >
                    <PhoneOff size={20} /> End
                </button>

                <div style={{ marginLeft: '2rem', display: 'flex', gap: '1rem' }}>
                    <button onClick={() => { setShowChat(!showChat); setShowNotepad(false); }} style={{ width: '48px', height: '48px', borderRadius: '12px', background: showChat ? 'white' : 'rgba(255,255,255,0.05)', border: 'none', color: showChat ? 'var(--primary)' : 'white', cursor: 'pointer', transition: '0.2s' }}>
                        <MessageSquare size={20} />
                    </button>
                    {showNotepad !== undefined && (
                        <button onClick={() => { setShowNotepad(!showNotepad); setShowChat(false); }} style={{ width: '48px', height: '48px', borderRadius: '12px', background: showNotepad ? 'white' : 'rgba(255,255,255,0.05)', border: 'none', color: showNotepad ? 'var(--primary)' : 'white', cursor: 'pointer', transition: '0.2s' }}>
                            <ClipboardList size={20} />
                        </button>
                    )}
                    <button onClick={() => setShowSettings(true)} style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ background: 'white', padding: '2rem', width: '400px', borderRadius: '20px' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={20} /> Device Settings</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Microphone Status</label>
                            <div style={{ padding: '0.8rem', background: isMuted ? '#ffebee' : '#e8f5e9', color: isMuted ? '#c62828' : '#2e7d32', borderRadius: '8px', fontWeight: 'bold' }}>
                                {isMuted ? 'Muted' : 'Active & Permitted'}
                            </div>
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Camera Status</label>
                            <div style={{ padding: '0.8rem', background: isCameraOff ? '#ffebee' : '#e8f5e9', color: isCameraOff ? '#c62828' : '#2e7d32', borderRadius: '8px', fontWeight: 'bold' }}>
                                {isCameraOff ? 'Turned Off' : 'Active & Permitted'}
                            </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: '1.5rem' }}>Note: To change physical devices, please use your browser's site settings menu.</p>
                        <button onClick={() => setShowSettings(false)} className="btn-primary" style={{ width: '100%', padding: '0.8rem' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoConsultation;
