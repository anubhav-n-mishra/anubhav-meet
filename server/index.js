const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "https://anubhav-meet.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store active rooms and participants
const rooms = new Map();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Anubhav Meet Signaling Server',
    activeRooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

// Get room info
app.get('/rooms/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.json({ participants: [] });
  }
  
  res.json({
    participants: Array.from(room.participants.values()).map(p => ({
      id: p.id,
      name: p.name,
      joinedAt: p.joinedAt
    }))
  });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (data) => {
    const { roomId, userId, userName } = data;
    
    console.log(`User ${userName} (${userId}) joining room ${roomId}`);
    
    // Leave any previous rooms
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    
    // Join the new room
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        participants: new Map(),
        createdAt: new Date()
      });
    }
    
    const room = rooms.get(roomId);
    
    // Add participant to room
    room.participants.set(userId, {
      id: userId,
      name: userName,
      socketId: socket.id,
      joinedAt: new Date()
    });
    
    // Store user info in socket
    socket.userId = userId;
    socket.roomId = roomId;
    socket.userName = userName;
    
    // Notify others in the room about new participant
    socket.to(roomId).emit('user-joined', {
      userId,
      userName,
      participants: Array.from(room.participants.values()).map(p => ({
        id: p.id,
        name: p.name
      }))
    });
    
    // Send current participants to the new user
    socket.emit('room-joined', {
      roomId,
      participants: Array.from(room.participants.values())
        .filter(p => p.id !== userId)
        .map(p => ({
          id: p.id,
          name: p.name
        }))
    });
    
    console.log(`Room ${roomId} now has ${room.participants.size} participants`);
  });

  // Simplified WebRTC signaling - single event for all signal types
  socket.on('webrtc-signal', (data) => {
    const { targetUserId, signal } = data;
    console.log(`Relaying ${signal?.type || 'signal'} from ${socket.userId} to ${targetUserId}`);
    
    if (socket.roomId) {
      socket.to(socket.roomId).emit('webrtc-signal', {
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        targetUserId,
        signal
      });
    }
  });

  // WebRTC signaling - keep old handlers for compatibility
  socket.on('webrtc-offer', (data) => {
    const { targetUserId, offer } = data;
    console.log(`Relaying offer from ${socket.userId} to ${targetUserId}`);
    
    if (socket.roomId) {
      socket.to(socket.roomId).emit('webrtc-offer', {
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        targetUserId,
        offer
      });
    }
  });
  
  socket.on('webrtc-answer', (data) => {
    const { targetUserId, answer } = data;
    console.log(`Relaying answer from ${socket.userId} to ${targetUserId}`);
    
    if (socket.roomId) {
      socket.to(socket.roomId).emit('webrtc-answer', {
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        targetUserId,
        answer
      });
    }
  });
  
  socket.on('webrtc-ice-candidate', (data) => {
    const { targetUserId, candidate } = data;
    
    if (socket.roomId) {
      socket.to(socket.roomId).emit('webrtc-ice-candidate', {
        fromUserId: socket.userId,
        targetUserId,
        candidate
      });
    }
  });
  
  // Chat messages
  socket.on('chat-message', (data) => {
    const { message } = data;
    
    if (socket.roomId) {
      io.to(socket.roomId).emit('chat-message', {
        userId: socket.userId,
        userName: socket.userName,
        message,
        timestamp: new Date()
      });
    }
  });
  
  // Media state changes
  socket.on('media-state-change', (data) => {
    const { videoEnabled, audioEnabled } = data;
    
    if (socket.roomId) {
      socket.to(socket.roomId).emit('participant-media-change', {
        userId: socket.userId,
        videoEnabled,
        audioEnabled
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.roomId && socket.userId) {
      const room = rooms.get(socket.roomId);
      
      if (room) {
        // Remove participant from room
        room.participants.delete(socket.userId);
        
        // Notify others about user leaving
        socket.to(socket.roomId).emit('user-left', {
          userId: socket.userId,
          userName: socket.userName,
          participants: Array.from(room.participants.values()).map(p => ({
            id: p.id,
            name: p.name
          }))
        });
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(socket.roomId);
          console.log(`Room ${socket.roomId} deleted (empty)`);
        } else {
          console.log(`Room ${socket.roomId} now has ${room.participants.size} participants`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});