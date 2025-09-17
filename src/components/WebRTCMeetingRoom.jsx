import React, { useState, useEffect, useRef } from 'react';
import WebRTCService from '../services/WebRTCService';

const WebRTCMeetingRoom = ({
  meetingId,
  localParticipant: initialLocalParticipant,
  remoteParticipants,
  onLeaveMeeting,
}) => {
  const [localParticipant, setLocalParticipant] = useState(initialLocalParticipant);
  const [participants, setParticipants] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  const webrtcService = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    initializeWebRTC();
    
    return () => {
      if (webrtcService.current) {
        webrtcService.current.leave();
      }
    };
  }, []);

  const initializeWebRTC = async () => {
    try {
      webrtcService.current = new WebRTCService();
      
      const localStream = await webrtcService.current.init(
        localParticipant.id,
        meetingId,
        {
          onPeerConnected: handlePeerConnected,
          onPeerDisconnected: handlePeerDisconnected,
          onRemoteStream: handleRemoteStream,
          onError: handleWebRTCError
        }
      );

      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      setLocalParticipant(prev => ({
        ...prev,
        stream: localStream
      }));

      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      setConnectionStatus('failed');
    }
  };

  const handlePeerConnected = (peerId) => {
    console.log('Peer connected:', peerId);
    setConnectionStatus('connected');
  };

  const handlePeerDisconnected = (peerId) => {
    console.log('Peer disconnected:', peerId);
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      newParticipants.delete(peerId);
      return newParticipants;
    });
  };

  const handleRemoteStream = (peerId, stream) => {
    console.log('Received remote stream from:', peerId);
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      newParticipants.set(peerId, {
        id: peerId,
        name: `User ${peerId.substring(0, 8)}`,
        stream: stream,
        videoEnabled: true,
        audioEnabled: true
      });
      return newParticipants;
    });
  };

  const handleWebRTCError = (error) => {
    console.error('WebRTC error:', error);
    setConnectionStatus('error');
  };

  const handleToggleVideo = () => {
    const newVideoState = !isVideoEnabled;
    setIsVideoEnabled(newVideoState);
    
    if (webrtcService.current) {
      webrtcService.current.toggleVideo(newVideoState);
    }
    
    setLocalParticipant(prev => ({
      ...prev,
      videoEnabled: newVideoState
    }));
  };

  const handleToggleAudio = () => {
    const newAudioState = !isAudioEnabled;
    setIsAudioEnabled(newAudioState);
    
    if (webrtcService.current) {
      webrtcService.current.toggleAudio(newAudioState);
    }
    
    setLocalParticipant(prev => ({
      ...prev,
      audioEnabled: newAudioState
    }));
  };

  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await webrtcService.current.shareScreen();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } else {
        const cameraStream = await webrtcService.current.stopScreenShare();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const handleLeaveMeeting = () => {
    if (webrtcService.current) {
      webrtcService.current.leave();
    }
    onLeaveMeeting();
  };

  // Styles
  const containerStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f1419'
  };

  const headerStyle = {
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
    padding: '16px 24px',
    color: 'white'
  };

  const mainStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    gap: '20px'
  };

  const videoGridStyle = {
    display: 'grid',
    gap: '16px',
    height: '100%',
    gridTemplateColumns: participants.size === 0 ? '1fr' : 
                        participants.size === 1 ? '1fr 1fr' :
                        participants.size <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
  };

  const videoTileStyle = {
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #333'
  };

  const videoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  const videoPlaceholderStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    color: 'white',
    backgroundColor: '#2a2a2a'
  };

  const participantNameStyle = {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px'
  };

  const statusIndicatorStyle = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    display: 'flex',
    gap: '6px'
  };

  const statusBadgeStyle = {
    padding: '4px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const controlsStyle = {
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #333',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '16px'
  };

  const buttonStyle = {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4285f4',
    color: 'white'
  };

  const toggleButtonStyle = (isActive) => ({
    ...buttonStyle,
    backgroundColor: isActive ? '#34a853' : '#ea4335',
    color: 'white'
  });

  const leaveButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ea4335',
    color: 'white'
  };

  const connectionStatusStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: connectionStatus === 'connected' ? '#34a853' : 
                    connectionStatus === 'connecting' ? '#ff9800' : '#ea4335',
    color: 'white'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
              Meeting Room - WebRTC Enabled
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#aaa', fontSize: '14px' }}>
              Room: {meetingId}
            </p>
          </div>
          <div style={connectionStatusStyle}>
            {connectionStatus === 'connected' && '🟢 Connected'}
            {connectionStatus === 'connecting' && '🟡 Connecting...'}
            {connectionStatus === 'failed' && '🔴 Connection Failed'}
            {connectionStatus === 'error' && '🔴 Error'}
          </div>
        </div>
      </div>

      {/* Main video area */}
      <div style={mainStyle}>
        <div style={videoGridStyle}>
          {/* Local participant */}
          <div style={videoTileStyle}>
            {isVideoEnabled && localParticipant.stream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={videoStyle}
              />
            ) : (
              <div style={videoPlaceholderStyle}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '12px',
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#4285f4',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {localParticipant.name.charAt(0).toUpperCase()}
                </div>
                <p style={{ margin: 0, fontSize: '16px' }}>Camera Off</p>
              </div>
            )}
            
            <div style={participantNameStyle}>
              {localParticipant.name} (You)
              {isScreenSharing && ' - Sharing Screen'}
            </div>
            
            <div style={statusIndicatorStyle}>
              {!isVideoEnabled && (
                <span style={{...statusBadgeStyle, backgroundColor: '#ea4335'}}>
                  📹❌
                </span>
              )}
              {!isAudioEnabled && (
                <span style={{...statusBadgeStyle, backgroundColor: '#ea4335'}}>
                  🎤❌
                </span>
              )}
            </div>
          </div>

          {/* Remote participants */}
          {Array.from(participants.values()).map((participant) => (
            <div key={participant.id} style={videoTileStyle}>
              {participant.stream ? (
                <video
                  autoPlay
                  playsInline
                  style={videoStyle}
                  ref={(el) => {
                    if (el && participant.stream) {
                      el.srcObject = participant.stream;
                    }
                  }}
                />
              ) : (
                <div style={videoPlaceholderStyle}>
                  <div style={{ 
                    fontSize: '48px', 
                    marginBottom: '12px',
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#34a853',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <p style={{ margin: 0, fontSize: '16px' }}>Loading...</p>
                </div>
              )}
              
              <div style={participantNameStyle}>
                {participant.name}
              </div>
            </div>
          ))}

          {/* Show waiting message if no participants */}
          {participants.size === 0 && connectionStatus === 'connected' && (
            <div style={{
              ...videoTileStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #555'
            }}>
              <div style={{ textAlign: 'center', color: '#aaa' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  👥
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', marginBottom: '8px' }}>
                  Waiting for others to join...
                </h3>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Share this meeting ID: <strong style={{ color: 'white' }}>{meetingId}</strong>
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.7 }}>
                  Open another browser window with the same meeting ID to test!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={controlsStyle}>
        <button 
          onClick={handleToggleAudio}
          style={toggleButtonStyle(isAudioEnabled)}
        >
          {isAudioEnabled ? '🎤' : '🎤❌'} {isAudioEnabled ? 'Mute' : 'Unmute'}
        </button>
        
        <button 
          onClick={handleToggleVideo}
          style={toggleButtonStyle(isVideoEnabled)}
        >
          {isVideoEnabled ? '📹' : '📹❌'} {isVideoEnabled ? 'Stop Video' : 'Start Video'}
        </button>
        
        <button 
          onClick={handleToggleScreenShare}
          style={{
            ...buttonStyle,
            backgroundColor: isScreenSharing ? '#ff9800' : '#6c757d',
            color: 'white'
          }}
        >
          🖥️ {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        </button>
        
        <button 
          onClick={handleLeaveMeeting}
          style={leaveButtonStyle}
        >
          📞❌ Leave Meeting
        </button>
      </div>
    </div>
  );
};

export default WebRTCMeetingRoom;