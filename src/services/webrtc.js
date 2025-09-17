import { Buffer } from 'buffer';
import SimplePeer from 'simple-peer';
import io from 'socket.io-client';

// Make Buffer available globally for simple-peer
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

class WebRTCService {
  constructor() {
    this.peers = new Map();
    this.localStream = null;
    this.socket = null;
    this.roomId = null;
    this.userId = null;
    this.userName = null;
    this.originalStream = null;
    this.callbacks = {
      onStreamReceived: null,
      onPeerLeft: null,
      onDataReceived: null,
      onRoomJoined: null,
      onUserJoined: null,
      onUserLeft: null
    };
  }

  async initializeMedia(constraints = { video: true, audio: true }) {
    try {
      // Stop existing stream if any
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Update all peer connections with new stream
      this.peers.forEach(peer => {
        if (peer && this.localStream) {
          try {
            // Use simple-peer's built-in stream replacement
            if (peer.streams && peer.streams[0]) {
              peer.removeStream(peer.streams[0]);
            }
            peer.addStream(this.localStream);
          } catch (error) {
            console.warn('Error updating peer stream:', error);
          }
        }
      });
      
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media:', error);
      throw error;
    }
  }

  connectToSignalingServer(url) {
    this.socket = io(url, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });

    this.socket.on('room-joined', (data) => {
      console.log('🏠 Room joined:', data);
      this.callbacks.onRoomJoined?.(data);
      
      // Create peer connections for existing users only if we have local stream
      if (this.localStream && data.participants) {
        data.participants.forEach(participant => {
          if (participant.id !== this.userId) {
            // New users do NOT initiate to existing users
            setTimeout(() => {
              console.log('🔄 Creating peer for existing participant:', participant.name, 'as non-initiator');
              this.createPeerConnection(participant.id, participant.name, false);
            }, 1000);
          }
        });
      } else if (!this.localStream) {
        console.warn('⚠️ Local stream not ready, delaying peer creation');
        setTimeout(() => {
          if (this.localStream && data.participants) {
            data.participants.forEach(participant => {
              if (participant.id !== this.userId) {
                this.createPeerConnection(participant.id, participant.name, false);
              }
            });
          }
        }, 2000);
      }
    });

    this.socket.on('user-joined', (data) => {
      console.log('👤 User joined:', data);
      this.callbacks.onUserJoined?.(data);
      
      // Only create peer connection if we have local stream
      if (this.localStream) {
        // Simple rule: existing users initiate to new users
        setTimeout(() => {
          console.log('🔄 Creating peer for new user:', data.userName, 'as initiator');
          this.createPeerConnection(data.userId, data.userName, true);
        }, 1000);
      } else {
        console.warn('⚠️ Local stream not ready for new user, will retry');
        setTimeout(() => {
          if (this.localStream) {
            this.createPeerConnection(data.userId, data.userName, true);
          }
        }, 2000);
      }
    });

    this.socket.on('user-left', (data) => {
      console.log('User left:', data);
      this.removePeer(data.userId);
      this.callbacks.onUserLeft?.(data);
    });

    this.socket.on('webrtc-signal', async (data) => {
      console.log('📨 Received signal from:', data.fromUserId, 'Type:', data.signal?.type);
      
      let peer = this.peers.get(data.fromUserId);
      if (!peer) {
        console.log('🔄 Creating peer for incoming signal');
        peer = this.createPeerConnection(data.fromUserId, data.fromUserName || 'Unknown', false);
      }
      
      if (peer && data.signal) {
        try {
          peer.signal(data.signal);
          console.log('✅ Processed signal from:', data.fromUserId);
        } catch (error) {
          console.error('❌ Error processing signal:', error);
        }
      }
    });

    // Keep old handlers for backward compatibility
    this.socket.on('webrtc-offer', async (data) => {
      console.log('📨 Received offer from:', data.fromUserId);
      let peer = this.peers.get(data.fromUserId);
      if (!peer) {
        console.log('🔄 Creating peer connection for incoming offer');
        peer = this.createPeerConnection(data.fromUserId, data.fromUserName || 'Unknown', false);
      }
      
      if (peer) {
        try {
          peer.signal(data.offer);
          console.log('✅ Processed offer from:', data.fromUserId);
        } catch (error) {
          console.error('❌ Error processing offer:', error);
        }
      }
    });

    this.socket.on('webrtc-answer', async (data) => {
      console.log('📨 Received answer from:', data.fromUserId);
      const peer = this.peers.get(data.fromUserId);
      if (peer) {
        try {
          peer.signal(data.answer);
          console.log('✅ Processed answer from:', data.fromUserId);
        } catch (error) {
          console.error('❌ Error processing answer:', error);
        }
      }
    });

    this.socket.on('webrtc-ice-candidate', async (data) => {
      console.log('🧊 Received ICE candidate from:', data.fromUserId);
      const peer = this.peers.get(data.fromUserId);
      if (peer) {
        try {
          peer.signal(data.candidate);
          console.log('✅ Processed ICE candidate from:', data.fromUserId);
        } catch (error) {
          console.error('❌ Error processing ICE candidate:', error);
        }
      }
    });

    this.socket.on('chat-message', (data) => {
      this.callbacks.onDataReceived?.(data.userId, {
        type: 'chat',
        message: data.message,
        senderName: data.userName,
        timestamp: data.timestamp
      });
    });
  }

  joinRoom(roomId, userId, userName) {
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;
    
    if (this.socket) {
      this.socket.emit('join-room', { roomId, userId, userName });
    }
  }

  createPeerConnection(peerId, peerName, initiator) {
    console.log(`🔄 Creating peer connection to ${peerName} (${peerId}), initiator: ${initiator}`);
    
    // Ensure we don't create duplicate peers
    if (this.peers.has(peerId)) {
      console.log('Peer already exists, removing old one');
      this.removePeer(peerId);
    }

    // Ensure we have a local stream before creating peer
    if (!this.localStream) {
      console.error('❌ No local stream available for peer connection');
      return null;
    }

    try {
      console.log('🔍 Debug - SimplePeer constructor:', typeof SimplePeer, SimplePeer);
      
      if (!SimplePeer) {
        console.error('❌ SimplePeer is undefined - simple-peer import failed');
        return null;
      }

      const peer = new SimplePeer({
        initiator: initiator,
        stream: this.localStream, // Pass stream in constructor
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ]
        }
      });

      peer.on('signal', (data) => {
        console.log('📡 Sending signal to:', peerId, 'Type:', data.type);
        this.socket.emit('webrtc-signal', {
          targetUserId: peerId,
          fromUserId: this.userId,
          fromUserName: this.userName,
          signal: data
        });
      });

      peer.on('stream', (stream) => {
        console.log('🎥 ✅ Received stream from:', peerId, peerName);
        console.log('Stream details:', {
          id: stream.id,
          active: stream.active,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        });
        this.callbacks.onStreamReceived?.(peerId, stream, peerName);
      });

      peer.on('connect', () => {
        console.log('🔗 ✅ Peer connected:', peerId);
      });

      peer.on('data', (data) => {
        console.log('📨 Data received from peer:', peerId, data);
      });

      peer.on('error', (err) => {
        console.error('❌ Peer error:', peerId, err);
      });

      peer.on('close', () => {
        console.log('🔌 Peer closed:', peerId);
        this.removePeer(peerId);
      });

      this.peers.set(peerId, peer);
      console.log('✅ Peer connection created and stored for:', peerId);
      return peer;

    } catch (error) {
      console.error('❌ Error creating peer connection:', error);
      return null;
    }
  }

  removePeer(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.destroy();
      this.peers.delete(peerId);
      this.callbacks.onPeerLeft?.(peerId);
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  isVideoEnabled() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      return videoTrack ? videoTrack.enabled : false;
    }
    return false;
  }

  isAudioEnabled() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      return audioTrack ? audioTrack.enabled : false;
    }
    return false;
  }

  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Store original stream to restore later
      this.originalStream = this.localStream;
      this.localStream = screenStream;

      // Update all peer connections with screen share
      this.peers.forEach(peer => {
        if (peer && screenStream) {
          try {
            if (peer.streams && peer.streams[0]) {
              peer.removeStream(peer.streams[0]);
            }
            peer.addStream(screenStream);
          } catch (error) {
            console.warn('Error updating peer with screen share:', error);
          }
        }
      });

      // Listen for screen share end
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
      });

      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  async stopScreenShare() {
    try {
      if (this.localStream && this.originalStream) {
        // Stop screen share stream
        this.localStream.getTracks().forEach(track => track.stop());
        
        // Restore original camera stream
        this.localStream = this.originalStream;
        this.originalStream = null;

        // Update all peer connections back to camera
        this.peers.forEach(peer => {
          if (peer && this.localStream) {
            try {
              if (peer.streams && peer.streams[0]) {
                peer.removeStream(peer.streams[0]);
              }
              peer.addStream(this.localStream);
            } catch (error) {
              console.warn('Error restoring camera stream:', error);
            }
          }
        });

        return this.localStream;
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
      throw error;
    }
  }

  isScreenSharing() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      return videoTrack && videoTrack.label.includes('screen');
    }
    return false;
  }

  sendChatMessage(message) {
    if (this.socket) {
      this.socket.emit('chat-message', { message });
    }
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  disconnect() {
    // Close all peer connections
    this.peers.forEach(peer => peer.destroy());
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default WebRTCService;