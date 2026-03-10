import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff,
    Maximize, Minimize, Settings, MessageSquare, Shield
} from 'lucide-react';

const socket = io('http://localhost:5000');

const VideoConsultation = ({ roomId, userName, onEnd }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callStarted, setCallStarted] = useState(false);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const pc = useRef();

    const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    useEffect(() => {
        const initCall = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            socket.emit('join-room', roomId);

            socket.on('offer', async (offer) => {
                if (!pc.current) createPeerConnection();
                await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);
                socket.emit('answer', { roomId, answer });
            });

            socket.on('answer', async (answer) => {
                await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
            });

            socket.on('ice-candidate', async (candidate) => {
                if (pc.current) {
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            });
        };

        initCall();

        return () => {
            if (localStream) localStream.getTracks().forEach(track => track.stop());
            if (pc.current) pc.current.close();
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
        };
    }, [roomId]);

    const createPeerConnection = () => {
        pc.current = new RTCPeerConnection(configuration);

        localStream.getTracks().forEach(track => {
            pc.current.addTrack(track, localStream);
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

    const startCall = async () => {
        createPeerConnection();
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
    };

    const toggleMute = () => {
        localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
        setIsMuted(!isMuted);
    };

    const toggleCamera = () => {
        localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
        setIsCameraOff(!isCameraOff);
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

            {/* Video Grid */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '2rem' }}>
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
                </div>

                {/* Local Video (Floating) */}
                <div style={{ position: 'absolute', bottom: '100px', right: '40px', width: '280px', height: '180px', borderRadius: '20px', overflow: 'hidden', background: '#334155', border: '3px solid rgba(255,255,255,0.1)', boxShadow: 'var(--shadow-lg)', zIndex: 10 }}>
                    <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {isCameraOff && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <VideoOff color="white" opacity={0.5} size={32} />
                        </div>
                    )}
                </div>
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

                {!callStarted && (
                    <button
                        onClick={startCall}
                        className="btn-primary"
                        style={{ padding: '0 2rem', height: '56px', borderRadius: '28px', fontWeight: '700', fontSize: '1rem' }}
                    >
                        Start Consultation
                    </button>
                )}

                <button
                    onClick={onEnd}
                    style={{ width: '120px', height: '56px', borderRadius: '28px', background: '#ef4444', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                >
                    <PhoneOff size={20} /> End
                </button>

                <div style={{ marginLeft: '2rem', display: 'flex', gap: '1rem' }}>
                    <button style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' }}><MessageSquare size={20} /></button>
                    <button style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' }}><Settings size={20} /></button>
                </div>
            </div>
        </div>
    );
};

export default VideoConsultation;
