import React, { useState, useEffect, useRef } from 'react';
import WebRTCService from '../services/webrtc';

const WebRTCMeetingRoom = ({
  meetingId,
  localParticipant: initialLocalParticipant,
  remoteParticipants,
  onLeaveMeeting,
}) => {
  const [localParticipant, setLocalParticipant] = useState(initialLocalParticipant);
  const [participants, setParticipants] = useState([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const localVideoRef = useRef(null);
  const webrtcService = useRef(new WebRTCService());

  // Initialize WebRTC with signaling server
  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        // Connect to signaling server
        const signalingUrl = import.meta.env.VITE_SIGNALING_URL || 'https://anubhav-meet-server.onrender.com';
        webrtcService.current.connectToSignalingServer(signalingUrl);

        // Initialize media with fallback constraints for mobile
        let stream;
        try {
          // Try with high quality first
          stream = await webrtcService.current.initializeMedia({
            video: {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              facingMode: 'user'
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch (error) {
          console.warn('High quality video failed, trying basic constraints:', error);
          try {
            // Fallback for mobile/older devices
            stream = await webrtcService.current.initializeMedia({
              video: {
                width: { ideal: 640, max: 1280 },
                height: { ideal: 480, max: 720 },
                facingMode: 'user'
              },
              audio: true
            });
          } catch (error2) {
            console.warn('Basic video failed, trying audio only:', error2);
            try {
              // Audio only fallback
              stream = await webrtcService.current.initializeMedia({
                video: false,
                audio: true
              });
              setIsVideoEnabled(false);
            } catch (error3) {
              console.error('All media access failed:', error3);
              throw error3;
            }
          }
        }

        // Set local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Set up WebRTC callbacks
        webrtcService.current.setCallbacks({
          onStreamReceived: (peerId, stream, peerName) => {
            console.log('Stream received from:', peerName, peerId);
            setParticipants(prev => {
              const updated = [...prev];
              const existingIndex = updated.findIndex(p => p.id === peerId);
              if (existingIndex >= 0) {
                updated[existingIndex] = { 
                  ...updated[existingIndex], 
                  stream,
                  name: peerName,
                  videoEnabled: true,
                  audioEnabled: true
                };
              } else {
                updated.push({
                  id: peerId,
                  name: peerName,
                  stream,
                  videoEnabled: true,
                  audioEnabled: true
                });
              }
              return updated;
            });
          },
          onPeerLeft: (peerId) => {
            console.log('Peer left:', peerId);
            setParticipants(prev => prev.filter(p => p.id !== peerId));
          },
          onDataReceived: (peerId, data) => {
            if (data.type === 'chat') {
              setChatMessages(prev => [...prev, {
                id: Date.now().toString(),
                senderId: peerId,
                senderName: data.senderName,
                message: data.message,
                timestamp: new Date(data.timestamp)
              }]);
            }
          },
          onRoomJoined: (data) => {
            console.log('Room joined with existing participants:', data);
            // Add existing participants to the list
            if (data.participants && data.participants.length > 0) {
              setParticipants(prev => {
                const newParticipants = [...prev];
                data.participants.forEach(participant => {
                  const existingIndex = newParticipants.findIndex(p => p.id === participant.id);
                  if (existingIndex === -1) {
                    newParticipants.push({
                      id: participant.id,
                      name: participant.name,
                      stream: null,
                      videoEnabled: false,
                      audioEnabled: false
                    });
                  }
                });
                return newParticipants;
              });
            }
          },
          onUserJoined: (data) => {
            console.log('New user joined:', data);
            // Add participant immediately when they join (even before stream)
            setParticipants(prev => {
              const existingIndex = prev.findIndex(p => p.id === data.userId);
              if (existingIndex === -1) {
                return [...prev, {
                  id: data.userId,
                  name: data.userName,
                  stream: null,
                  videoEnabled: false,
                  audioEnabled: false
                }];
              }
              return prev;
            });
          },
          onUserLeft: (data) => {
            console.log('User left room:', data);
            setParticipants(prev => prev.filter(p => p.id !== data.userId));
          }
        });

        // Join the room
        const userId = localParticipant.id;
        const userName = localParticipant.name;
        webrtcService.current.joinRoom(meetingId, userId, userName);

      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
      }
    };

    initializeWebRTC();

    return () => {
      webrtcService.current.disconnect();
    };
  }, []);

  const handleToggleVideo = async () => {
    if (isVideoEnabled) {
      // Turn off video
      webrtcService.current.toggleVideo();
      setIsVideoEnabled(false);
      setLocalParticipant(prev => ({ ...prev, videoEnabled: false }));
    } else {
      // Turn on video - need to get new stream
      try {
        const newStream = await webrtcService.current.initializeMedia({
          video: true,
          audio: isAudioEnabled
        });
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }
        
        setIsVideoEnabled(true);
        setLocalParticipant(prev => ({ ...prev, videoEnabled: true }));
      } catch (error) {
        console.error('Failed to restart video:', error);
        // Keep video disabled if we can't access camera
        setIsVideoEnabled(false);
      }
    }
  };

  const handleToggleAudio = () => {
    const newAudioState = webrtcService.current.toggleAudio();
    setIsAudioEnabled(newAudioState);
    setLocalParticipant(prev => ({ ...prev, audioEnabled: newAudioState }));
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        await webrtcService.current.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        await webrtcService.current.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      // Reset state on error
      setIsScreenSharing(webrtcService.current.isScreenSharing());
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Send via signaling server
      webrtcService.current.sendChatMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  // Enhanced styles
  const containerStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f172a',
    fontFamily: "'Inter', 'Google Sans', sans-serif"
  };

  const headerStyle = {
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const mainStyle = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  };

  const videoGridStyle = {
    flex: 1,
    padding: '20px',
    display: 'grid',
    gridTemplateColumns: participants.length > 0 ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
    gap: '20px',
    alignContent: 'start',
    backgroundColor: '#0f172a'
  };

  const videoTileStyle = {
    position: 'relative',
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    overflow: 'hidden',
    aspectRatio: '16/9',
    border: '2px solid #334155',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
  };

  const videoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  const videoOverlayStyle = {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    backdropFilter: 'blur(10px)'
  };

  const chatStyle = {
    width: isChatOpen ? '360px' : '0',
    backgroundColor: '#1e293b',
    borderLeft: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    boxShadow: isChatOpen ? '-4px 0 15px rgba(0, 0, 0, 0.2)' : 'none'
  };

  const chatHeaderStyle = {
    padding: '20px',
    borderBottom: '1px solid #334155',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#334155'
  };

  const chatMessagesStyle = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    maxHeight: '400px',
    backgroundColor: '#1e293b'
  };

  const chatInputStyle = {
    padding: '20px',
    borderTop: '1px solid #334155',
    backgroundColor: '#334155'
  };

  const controlsStyle = {
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)'
  };

  const buttonStyle = {
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  };

  const controlButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#475569',
    color: 'white'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: 'white'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: 'white'
  };

  const disabledButtonStyle = {
    ...controlButtonStyle,
    backgroundColor: '#ef4444',
    color: 'white'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            WebRTC Meeting Room
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
            Meeting ID: {meetingId}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#666' }}>
          <span>{participants.length + 1} participants</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#34a853', borderRadius: '50%' }}></div>
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={mainStyle}>
        {/* Video grid */}
        <div style={videoGridStyle}>
          {/* Local video */}
          <div style={videoTileStyle}>
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
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
                  width: '60px', 
                  height: '60px', 
                  backgroundColor: '#1976d2', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '24px', 
                  fontWeight: '600' 
                }}>
                  {localParticipant.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <div style={videoOverlayStyle}>
              {localParticipant.name} (You) {!isAudioEnabled && '🔇'} {!isVideoEnabled && '📹'}
            </div>
          </div>

          {/* Remote participants */}
          {participants.map((participant) => (
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
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#333',
                  color: 'white',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    backgroundColor: '#6c757d', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '24px', 
                    fontWeight: '600' 
                  }}>
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    Connecting...
                  </div>
                </div>
              )}
              <div style={videoOverlayStyle}>
                {participant.name}
              </div>
            </div>
          ))}
        </div>

        {/* Chat panel */}
        <div style={chatStyle}>
          {isChatOpen && (
            <>
              <div style={chatHeaderStyle}>
                Chat ({chatMessages.length} messages)
              </div>
              <div style={chatMessagesStyle}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '500', fontSize: '14px', color: '#1976d2' }}>
                      {msg.senderId === localParticipant.id ? 'You' : msg.senderName}
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '2px' }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={chatInputStyle}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Send a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    style={{
                      ...buttonStyle,
                      backgroundColor: newMessage.trim() ? '#1976d2' : '#ddd',
                      color: newMessage.trim() ? 'white' : '#666',
                      cursor: newMessage.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={controlsStyle}>
        <button
          onClick={handleToggleAudio}
          style={isAudioEnabled ? controlButtonStyle : disabledButtonStyle}
        >
          {isAudioEnabled ? '🎤' : '🔇'} {isAudioEnabled ? 'Mute' : 'Unmute'}
        </button>
        
        <button
          onClick={handleToggleVideo}
          style={isVideoEnabled ? controlButtonStyle : disabledButtonStyle}
        >
          {isVideoEnabled ? '📹' : '📹'} {isVideoEnabled ? 'Stop Video' : 'Start Video'}
        </button>

        <button
          onClick={handleToggleScreenShare}
          style={isScreenSharing ? activeButtonStyle : controlButtonStyle}
        >
          {isScreenSharing ? '🔲' : '🖥️'} {isScreenSharing ? 'Stop Share' : 'Share Screen'}
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={isChatOpen ? activeButtonStyle : controlButtonStyle}
        >
          💬 Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
        </button>

        <button
          onClick={onLeaveMeeting}
          style={dangerButtonStyle}
        >
          📞 Leave Meeting
        </button>
      </div>
    </div>
  );
};

export default WebRTCMeetingRoom;