import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Copy, Plus, Users } from 'lucide-react';

const HomePageFixed = ({ onJoinMeeting, onCreateMeeting }) => {
  const [userName, setUserName] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [stream, setStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedMeetingLink, setGeneratedMeetingLink] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    if (isVideoEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: isAudioEnabled })
        .then(mediaStream => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch(err => {
          console.error('Error accessing camera:', err);
          setIsVideoEnabled(false);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoEnabled, isAudioEnabled]);

  const handleJoinMeeting = () => {
    if (meetingId.trim() && userName.trim()) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      onJoinMeeting(meetingId.trim(), userName.trim());
    }
  };

  const handleCreateMeeting = () => {
    if (userName.trim()) {
      const uniqueId = generateUniqueMeetingId();
      const meetingLink = `${window.location.origin}?meet=${uniqueId}`;
      setGeneratedMeetingLink(meetingLink);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      onCreateMeeting(userName.trim(), uniqueId);
    }
  };

  const generateUniqueMeetingId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
  };

  const copyMeetingLink = () => {
    if (generatedMeetingLink) {
      navigator.clipboard.writeText(generatedMeetingLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Google Sans', sans-serif",
      padding: '20px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '32px',
        width: '100%',
        maxWidth: '1200px'
      }}>
        
        {/* Left Panel - Welcome & Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Anubhav Meet
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#6b7280',
              fontWeight: '400',
              lineHeight: '1.6'
            }}>
              Secure video conferencing for everyone
            </p>
          </div>

          {/* User Name Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Your Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
                backgroundColor: '#f9fafb'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Meeting Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Create New Meeting */}
            <button
              onClick={handleCreateMeeting}
              disabled={!userName.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '18px 32px',
                backgroundColor: userName.trim() ? '#667eea' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: userName.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: userName.trim() ? '0 8px 25px rgba(102, 126, 234, 0.4)' : 'none',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (userName.trim()) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = userName.trim() ? '0 8px 25px rgba(102, 126, 234, 0.4)' : 'none';
              }}
            >
              <Plus size={20} />
              Start New Meeting
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              margin: '8px 0'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              <span style={{ color: '#6b7280', fontSize: '14px' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* Join Meeting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Enter meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                  backgroundColor: '#f9fafb'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                onClick={handleJoinMeeting}
                disabled={!meetingId.trim() || !userName.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '16px 32px',
                  backgroundColor: (meetingId.trim() && userName.trim()) ? 'white' : '#f3f4f6',
                  color: (meetingId.trim() && userName.trim()) ? '#667eea' : '#9ca3af',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: (meetingId.trim() && userName.trim()) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                <Users size={20} />
                Join Meeting
              </button>
            </div>
          </div>

          {/* Generated Meeting Link */}
          {generatedMeetingLink && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px',
              border: '1px solid #bae6fd'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#0369a1',
                marginBottom: '8px'
              }}>
                Share this meeting link:
              </h3>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={generatedMeetingLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151'
                  }}
                />
                <button
                  onClick={copyMeetingLink}
                  style={{
                    padding: '12px',
                    backgroundColor: copiedLink ? '#10b981' : '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Copy size={16} />
                </button>
              </div>
              {copiedLink && (
                <p style={{
                  fontSize: '12px',
                  color: '#10b981',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                  Link copied to clipboard!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Video Preview */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Camera Preview
          </h2>
          
          <div style={{
            position: 'relative',
            backgroundColor: '#1f2937',
            borderRadius: '16px',
            overflow: 'hidden',
            aspectRatio: '16/9',
            marginBottom: '24px',
            border: '3px solid #f3f4f6'
          }}>
            {isVideoEnabled && stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#667eea',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: '600'
                }}>
                  {userName.charAt(0).toUpperCase() || 'U'}
                </div>
                <p style={{ fontSize: '16px', fontWeight: '500' }}>
                  Camera is off
                </p>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <button
              onClick={toggleVideo}
              style={{
                padding: '16px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isVideoEnabled ? '#10b981' : '#ef4444',
                color: 'white',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
            
            <button
              onClick={toggleAudio}
              style={{
                padding: '16px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isAudioEnabled ? '#10b981' : '#ef4444',
                color: 'white',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageFixed;