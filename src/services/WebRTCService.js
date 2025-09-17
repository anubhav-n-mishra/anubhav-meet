// WebRTC service for peer-to-peer video communication
import Peer from 'simple-peer';
import io from 'socket.io-client';

class WebRTCService {
  constructor() {
    this.socket = null;
    this.peers = new Map(); // Map of peer connections
    this.localStream = null;
    this.roomId = null;
    this.userId = null;
    this.onPeerConnected = null;
    this.onPeerDisconnected = null;
    this.onRemoteStream = null;
    this.onError = null;
  }

  // Initialize the service
  async init(userId, roomId, callbacks = {}) {
    this.userId = userId;
    this.roomId = roomId;
    this.onPeerConnected = callbacks.onPeerConnected;
    this.onPeerDisconnected = callbacks.onPeerDisconnected;
    this.onRemoteStream = callbacks.onRemoteStream;
    this.onError = callbacks.onError;

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // For development, we'll simulate the signaling server
      // In production, you'd connect to a real Socket.IO server
      this.initMockSignaling();
      
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      this.onError?.(error);
      throw error;
    }
  }

  // Mock signaling for development (replace with real server in production)
  initMockSignaling() {
    // Store reference to this service globally for cross-instance communication
    if (!window.webrtcInstances) {
      window.webrtcInstances = new Map();
    }
    window.webrtcInstances.set(this.userId, this);

    // Simulate joining a room
    setTimeout(() => {
      this.handleRoomJoined();
    }, 1000);
  }

  // Handle when user joins a room
  handleRoomJoined() {
    // Find other peers in the same room
    const otherPeers = Array.from(window.webrtcInstances.entries())
      .filter(([id, instance]) => 
        id !== this.userId && 
        instance.roomId === this.roomId
      );

    // Create peer connections with existing users
    otherPeers.forEach(([peerId, _]) => {
      this.createPeerConnection(peerId, true); // This user initiates
    });

    // Listen for new users joining
    this.listenForNewPeers();
  }

  // Listen for new peers joining the room
  listenForNewPeers() {
    const checkInterval = setInterval(() => {
      if (!window.webrtcInstances.has(this.userId)) {
        clearInterval(checkInterval);
        return;
      }

      const allPeers = Array.from(window.webrtcInstances.entries())
        .filter(([id, instance]) => 
          id !== this.userId && 
          instance.roomId === this.roomId
        );

      allPeers.forEach(([peerId, _]) => {
        if (!this.peers.has(peerId)) {
          // New peer detected, but don't initiate if they have a higher ID (to avoid duplicate connections)
          if (peerId > this.userId) {
            this.createPeerConnection(peerId, false); // Don't initiate, wait for their call
          }
        }
      });
    }, 2000);

    // Store interval for cleanup
    this.checkInterval = checkInterval;
  }

  // Create a peer connection
  createPeerConnection(peerId, initiator) {
    try {
      const peer = new Peer({
        initiator,
        trickle: false,
        stream: this.localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      // Store peer connection
      this.peers.set(peerId, peer);

      // Handle signaling data
      peer.on('signal', (data) => {
        this.sendSignalToPeer(peerId, data);
      });

      // Handle incoming stream
      peer.on('stream', (stream) => {
        console.log('Received remote stream from', peerId);
        this.onRemoteStream?.(peerId, stream);
      });

      // Handle connection
      peer.on('connect', () => {
        console.log('Connected to peer', peerId);
        this.onPeerConnected?.(peerId);
      });

      // Handle errors
      peer.on('error', (err) => {
        console.error('Peer error:', err);
        this.onError?.(err);
      });

      // Handle peer disconnect
      peer.on('close', () => {
        console.log('Peer disconnected:', peerId);
        this.peers.delete(peerId);
        this.onPeerDisconnected?.(peerId);
      });

    } catch (error) {
      console.error('Error creating peer connection:', error);
      this.onError?.(error);
    }
  }

  // Send signaling data to peer (mock implementation)
  sendSignalToPeer(peerId, signalData) {
    // In a real app, this would go through your signaling server
    // For now, we'll simulate it by directly calling the other peer
    setTimeout(() => {
      const otherPeer = window.webrtcInstances.get(peerId);
      if (otherPeer) {
        otherPeer.receiveSignalFromPeer(this.userId, signalData);
      }
    }, 100 + Math.random() * 200); // Simulate network delay
  }

  // Receive signaling data from peer
  receiveSignalFromPeer(fromPeerId, signalData) {
    let peer = this.peers.get(fromPeerId);
    
    if (!peer) {
      // Create peer connection if it doesn't exist
      this.createPeerConnection(fromPeerId, false);
      peer = this.peers.get(fromPeerId);
    }

    if (peer && !peer.destroyed) {
      try {
        peer.signal(signalData);
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    }
  }

  // Toggle local video
  toggleVideo(enabled) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  // Toggle local audio
  toggleAudio(enabled) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  // Share screen
  async shareScreen() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      this.peers.forEach((peer) => {
        if (peer && !peer.destroyed) {
          peer.replaceTrack(
            this.localStream.getVideoTracks()[0],
            videoTrack,
            this.localStream
          );
        }
      });

      // Update local stream
      const audioTrack = this.localStream.getAudioTracks()[0];
      this.localStream = new MediaStream([videoTrack, audioTrack]);

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      console.error('Error sharing screen:', error);
      this.onError?.(error);
      throw error;
    }
  }

  // Stop screen sharing
  async stopScreenShare() {
    try {
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      const videoTrack = cameraStream.getVideoTracks()[0];
      
      // Replace screen track with camera track in all peer connections
      this.peers.forEach((peer) => {
        if (peer && !peer.destroyed) {
          peer.replaceTrack(
            this.localStream.getVideoTracks()[0],
            videoTrack,
            this.localStream
          );
        }
      });

      // Update local stream
      const audioTrack = this.localStream.getAudioTracks()[0];
      this.localStream = new MediaStream([videoTrack, audioTrack]);

      return this.localStream;
    } catch (error) {
      console.error('Error stopping screen share:', error);
      this.onError?.(error);
      throw error;
    }
  }

  // Leave the room and cleanup
  leave() {
    // Destroy all peer connections
    this.peers.forEach((peer) => {
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
    });
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Remove from global instances
    if (window.webrtcInstances) {
      window.webrtcInstances.delete(this.userId);
    }

    // Clear interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Disconnect socket (if using real signaling server)
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Get current local stream
  getLocalStream() {
    return this.localStream;
  }

  // Get all connected peers
  getConnectedPeers() {
    return Array.from(this.peers.keys());
  }
}

export default WebRTCService;