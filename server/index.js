const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const rawOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:8081,http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

console.log('[Server] Initializing Signaling Server on port', PORT);
console.log('[Server] Allowed Origins:', allowedOrigins);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// In-Memory Room Registry
const rooms = new Map();

// REST Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    totalPlayers: Array.from(rooms.values()).reduce((sum, r) => sum + r.players.length, 0)
  });
});

// REST Rooms List Endpoint
app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    hostName: r.hostName,
    playerCount: r.players.length,
    maxPlayers: r.maxPlayers,
    status: r.status,
    createdAt: r.createdAt
  }));
  res.json({ rooms: roomList });
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Latency Ping-Pong
  socket.on('client_ping', (timestamp) => {
    socket.emit('server_pong', timestamp);
  });

  // Create Room
  socket.on('create_room', ({ roomName, hostName, maxPlayers = 4 }, callback) => {
    const roomId = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const player = { id: socket.id, name: hostName || 'Host', isHost: true, isReady: false };

    const newRoom = {
      id: roomId,
      name: roomName || `${player.name}'s Room`,
      hostId: socket.id,
      hostName: player.name,
      maxPlayers,
      status: 'waiting', // 'waiting' | 'in_game' | 'finished'
      players: [player],
      gameState: null,
      createdAt: Date.now()
    };

    rooms.set(roomId, newRoom);
    socket.join(roomId);
    socket.data.roomId = roomId;

    console.log(`[Room] Created ${roomId} by ${player.name} (${socket.id})`);
    if (typeof callback === 'function') callback({ success: true, room: newRoom });
    io.emit('room_list_updated');
  });

  // Join Room
  socket.on('join_room', ({ roomId, playerName }, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      if (typeof callback === 'function') callback({ success: false, error: 'Room is full' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName || `Player ${room.players.length + 1}`,
      isHost: false,
      isReady: false
    };

    room.players.push(player);
    socket.join(roomId);
    socket.data.roomId = roomId;

    console.log(`[Room] ${player.name} joined ${roomId}`);
    io.to(roomId).emit('room_updated', room);
    if (typeof callback === 'function') callback({ success: true, room });
    io.emit('room_list_updated');
  });

  // Toggle Ready Status
  socket.on('toggle_ready', () => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.isReady = !player.isReady;
      io.to(roomId).emit('room_updated', room);
    }
  });

  // Relay Game Action / State Update
  socket.on('game_action', (payload) => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms.has(roomId)) return;

    // Relay action to other clients in the room
    socket.to(roomId).emit('game_action_received', {
      senderId: socket.id,
      action: payload,
      timestamp: Date.now()
    });
  });

  // Leave Room
  socket.on('leave_room', () => {
    handlePlayerLeave(socket);
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    handlePlayerLeave(socket);
  });
});

function handlePlayerLeave(socket) {
  const roomId = socket.data.roomId;
  if (!roomId || !rooms.has(roomId)) return;

  const room = rooms.get(roomId);
  room.players = room.players.filter(p => p.id !== socket.id);

  if (room.players.length === 0) {
    rooms.delete(roomId);
    console.log(`[Room] Deleted empty room: ${roomId}`);
  } else {
    // If host left, reassign host
    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
      room.hostName = room.players[0].name;
      room.players[0].isHost = true;
      console.log(`[Room] New host for ${roomId}: ${room.hostName}`);
    }
    io.to(roomId).emit('room_updated', room);
  }

  socket.leave(roomId);
  delete socket.data.roomId;
  io.emit('room_list_updated');
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Running and listening on http://0.0.0.0:${PORT}`);
});
