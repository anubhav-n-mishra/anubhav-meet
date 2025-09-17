// Browser polyfill for Node.js global
if (typeof global === 'undefined') {
  window.global = window;
}

import Peer from 'simple-peer';
import io from 'socket.io-client';

class WebRTCService {
  constructor() {
    this.peers = new Map();
    this.localStream = null;
    this.socket = null;
    this.roomId = null;
    this.userId = null;
    this.userName = null;
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
          // Remove old tracks
          const senders = peer._pc?.getSenders?.() || [];
          senders.forEach(sender => {
            if (sender.track) {
              peer._pc.removeTrack(sender);
            }
          });
          
          // Add new tracks
          this.localStream.getTracks().forEach(track => {
            peer.addTrack(track, this.localStream);
          });
        }
      });
      
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media:', error);
      throw error;
    }
  }

  connectToSignalingServer(serverUrl) {
    const socketUrl = serverUrl || process.env.VITE_SIGNALING_URL || 'http://localhost:3001';
    console.log('Connecting to signaling server:', socketUrl);
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('room-joined', (data) => {
      console.log('Room joined:', data);
      this.callbacks.onRoomJoined?.(data);
      
      // Initiate connections to existing participants
      data.participants.forEach(participant => {
        this.createPeerConnection(participant.id, participant.name, true);
      });
    });

    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data);
      this.callbacks.onUserJoined?.(data);
      
      // Create peer connection for new user (they will initiate)
      this.createPeerConnection(data.userId, data.userName, false);
    });

    this.socket.on('user-left', (data) => {
      console.log('User left:', data);
      this.removePeer(data.userId);
      this.callbacks.onUserLeft?.(data);
    });

    this.socket.on('webrtc-offer', async (data) => {
      console.log('Received offer from:', data.fromUserId);
      const peer = this.peers.get(data.fromUserId);
      if (peer) {
        await peer.signal(data.offer);
      }
    });

    this.socket.on('webrtc-answer', async (data) => {
      console.log('Received answer from:', data.fromUserId);
      const peer = this.peers.get(data.fromUserId);
      if (peer) {
        await peer.signal(data.answer);
      }
    });

    this.socket.on('webrtc-ice-candidate', async (data) => {
      const peer = this.peers.get(data.fromUserId);
      if (peer) {
        await peer.signal(data.candidate);
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

    this.socket.on('participant-media-change', (data) => {
      // Handle media state changes from other participants
      console.log('Participant media change:', data);
    });

    return this.socket;
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
    console.log(`Creating peer connection to ${peerName} (${peerId}), initiator: ${initiator}`);
    
    const peer = new Peer({
      initiator,
      stream: this.localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      console.log('Sending signal to:', peerId);
      if (signal.type === 'offer') {
        this.socket?.emit('webrtc-offer', {
          targetUserId: peerId,
          offer: signal
        });
      } else if (signal.type === 'answer') {
        this.socket?.emit('webrtc-answer', {
          targetUserId: peerId,
          answer: signal
        });
      } else {
        this.socket?.emit('webrtc-ice-candidate', {
          targetUserId: peerId,
          candidate: signal
        });
      }
    });

    peer.on('stream', (stream) => {
      console.log('Received stream from:', peerId);
      this.callbacks.onStreamReceived?.(peerId, stream, peerName);
    });

    peer.on('connect', () => {
      console.log('Peer connected:', peerId);
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', peerId);
      this.removePeer(peerId);
    });

    this.peers.set(peerId, peer);
    return peer;
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
        
        // Notify signaling server
        this.socket?.emit('media-state-change', {
          videoEnabled: videoTrack.enabled,
          audioEnabled: this.isAudioEnabled()
        });
        
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
        
        // Notify signaling server
        this.socket?.emit('media-state-change', {
          videoEnabled: this.isVideoEnabled(),
          audioEnabled: audioTrack.enabled
        });
        
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

    // Disconnect from signaling server
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.roomId = null;
    this.userId = null;
    this.userName = null;
  }
}

export default WebRTCService;