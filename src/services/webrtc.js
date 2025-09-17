// WebRTC service for handling peer-to-peer connections
// Browser polyfill for Node.js global
if (typeof global === 'undefined') {
  window.global = window;
}

import Peer from 'simple-peer';

class WebRTCService {
  constructor() {
    this.peers = new Map();
    this.localStream = null;
    this.callbacks = {
      onPeerJoined: null,
      onPeerLeft: null,
      onStreamReceived: null,
      onDataReceived: null,
    };
  }

  // Set callback functions
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Initialize local media stream
  async initializeMedia(constraints = { video: true, audio: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Create a new peer connection
  createPeer(initiator = false, targetPeerId) {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream: this.localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    // Store peer reference
    this.peers.set(targetPeerId, peer);

    // Handle peer events
    peer.on('signal', (data) => {
      // Send signal data to remote peer through signaling server
      this.sendSignal(targetPeerId, data);
    });

    peer.on('stream', (stream) => {
      console.log('Received remote stream from:', targetPeerId);
      if (this.callbacks.onStreamReceived) {
        this.callbacks.onStreamReceived(targetPeerId, stream);
      }
    });

    peer.on('data', (data) => {
      const message = JSON.parse(data.toString());
      if (this.callbacks.onDataReceived) {
        this.callbacks.onDataReceived(targetPeerId, message);
      }
    });

    peer.on('connect', () => {
      console.log('Connected to peer:', targetPeerId);
      if (this.callbacks.onPeerJoined) {
        this.callbacks.onPeerJoined(targetPeerId);
      }
    });

    peer.on('close', () => {
      console.log('Peer disconnected:', targetPeerId);
      this.peers.delete(targetPeerId);
      if (this.callbacks.onPeerLeft) {
        this.callbacks.onPeerLeft(targetPeerId);
      }
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
      this.peers.delete(targetPeerId);
    });

    return peer;
  }

  // Toggle video track
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

  // Toggle audio track
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

  // Get local stream
  getLocalStream() {
    return this.localStream;
  }

  // Cleanup
  disconnect() {
    // Close all peer connections
    this.peers.forEach((peer) => {
      peer.destroy();
    });
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}

export default WebRTCService;