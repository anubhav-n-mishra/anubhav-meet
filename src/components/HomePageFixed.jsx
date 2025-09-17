import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Settings, Camera } from 'lucide-react';

const HomePage = ({ onJoinMeeting, onCreateMeeting }) => {
  const [meetingId, setMeetingId] = useState('');
  const [userName, setUserName] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  // Initialize preview camera
  useEffect(() => {
    const initializePreview = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    initializePreview();
  }, []);

  // Update video preview when video is toggled
  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoEnabled;
      }
    }
  }, [isVideoEnabled, stream]);

  // Update audio when audio is toggled
  useEffect(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioEnabled;
      }
    }
  }, [isAudioEnabled, stream]);

  const handleJoinMeeting = () => {
    if (meetingId.trim() && userName.trim()) {
      // Clean up preview stream before joining
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      onJoinMeeting(meetingId.trim(), userName.trim());
    }
  };

  const handleCreateMeeting = () => {
    if (userName.trim()) {
      // Clean up preview stream before creating
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      onCreateMeeting(userName.trim());
    }
  };

  const generateMeetingId = () => {
    const randomId = Math.random().toString(36).substring(2, 15);
    setMeetingId(randomId);
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    margin: '16px',
    maxWidth: '400px',
    width: '100%'
  };

  const titleStyle = {
    textAlign: 'center',
    marginBottom: '32px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '16px',
    outline: 'none'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '12px'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#34a853'
  };

  const videoContainerStyle = {
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    overflow: 'hidden',
    aspectRatio: '16/9',
    marginBottom: '16px'
  };

  const videoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  const controlsStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  };

  const controlButtonStyle = {
    padding: '12px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#f5f5f5',
    color: '#333'
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        <div style={titleStyle}>
          <h1 style={{ fontSize: '42px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>
            Welcome to Meet
          </h1>
          <p style={{ fontSize: '18px', color: '#666' }}>
            Premium video meetings. Now free for everyone.
          </p>
        </div>

        {/* Video Preview */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Camera Preview</h2>
          
          <div style={videoContainerStyle}>
            {isVideoEnabled && stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={videoStyle}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#333'
              }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#1976d2', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '32px', 
                  fontWeight: '600' 
                }}>
                  {userName.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            )}
          </div>

          <div style={controlsStyle}>
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              style={{
                ...controlButtonStyle,
                backgroundColor: isAudioEnabled ? '#f5f5f5' : '#ea4335',
                color: isAudioEnabled ? '#333' : 'white'
              }}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              style={{
                ...controlButtonStyle,
                backgroundColor: isVideoEnabled ? '#f5f5f5' : '#ea4335',
                color: isVideoEnabled ? '#333' : 'white'
              }}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button style={controlButtonStyle}>
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Meeting Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* User name input */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Your Name</h3>
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Create meeting */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Start a Meeting</h3>
            <button
              onClick={handleCreateMeeting}
              disabled={!userName.trim()}
              style={{
                ...buttonStyle,
                opacity: userName.trim() ? 1 : 0.5,
                cursor: userName.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Camera size={20} />
                <span>New Meeting</span>
              </div>
            </button>
          </div>

          {/* Join meeting */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Join a Meeting</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Enter meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
              />
              <button
                onClick={generateMeetingId}
                style={{
                  ...controlButtonStyle,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#f5f5f5'
                }}
              >
                Random
              </button>
            </div>
            <button
              onClick={handleJoinMeeting}
              disabled={!meetingId.trim() || !userName.trim()}
              style={{
                ...secondaryButtonStyle,
                opacity: (meetingId.trim() && userName.trim()) ? 1 : 0.5,
                cursor: (meetingId.trim() && userName.trim()) ? 'pointer' : 'not-allowed'
              }}
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;