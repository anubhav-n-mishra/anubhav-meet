import React, { useState, useEffect } from 'react';

const SimpleMeetingRoom = ({
  meetingId,
  localParticipant: initialLocalParticipant,
  remoteParticipants,
  onLeaveMeeting,
}) => {
  const [localParticipant, setLocalParticipant] = useState(initialLocalParticipant);

  const containerStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa'
  };

  const headerStyle = {
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd',
    padding: '16px 24px'
  };

  const mainStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  };

  const videoStyle = {
    width: '100%',
    maxWidth: '800px',
    aspectRatio: '16/9',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '24px'
  };

  const controlsStyle = {
    backgroundColor: 'white',
    borderTop: '1px solid #ddd',
    padding: '16px',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  };

  const buttonStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500'
  };

  const leaveButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ea4335',
    color: 'white'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
          Meeting Room
        </h1>
        <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
          Meeting ID: {meetingId}
        </p>
      </div>

      {/* Main video area */}
      <div style={mainStyle}>
        <div style={videoStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px'
            }}>
              📹
            </div>
            <h2 style={{ margin: 0, fontSize: '24px' }}>
              Welcome to your meeting!
            </h2>
            <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>
              You're connected as {localParticipant.name}
            </p>
            <p style={{ margin: '16px 0 0 0', fontSize: '14px', opacity: 0.6 }}>
              🎉 Meeting functionality is ready!<br/>
              WebRTC integration can be added for real video calls.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={controlsStyle}>
        <button 
          style={{
            ...buttonStyle,
            backgroundColor: '#f5f5f5',
            color: '#333'
          }}
        >
          🎤 Mute
        </button>
        <button 
          style={{
            ...buttonStyle,
            backgroundColor: '#f5f5f5',
            color: '#333'
          }}
        >
          📹 Camera
        </button>
        <button 
          style={{
            ...buttonStyle,
            backgroundColor: '#f5f5f5',
            color: '#333'
          }}
        >
          💬 Chat
        </button>
        <button 
          onClick={onLeaveMeeting}
          style={leaveButtonStyle}
        >
          Leave Meeting
        </button>
      </div>
    </div>
  );
};

export default SimpleMeetingRoom;