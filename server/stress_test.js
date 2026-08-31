const { io } = require('socket.io-client');

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3001';
const NUM_CLIENTS = parseInt(process.env.NUM_CLIENTS || '20', 10);
const clients = [];

console.log(`[StressTest] Connecting ${NUM_CLIENTS} simulated clients to ${SERVER_URL}...`);

let connectedCount = 0;
let latencies = [];

for (let i = 0; i < NUM_CLIENTS; i++) {
  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false
  });

  socket.on('connect', () => {
    connectedCount++;
    const sendTime = Date.now();
    socket.emit('client_ping', sendTime);

    socket.on('server_pong', (origTime) => {
      const rtt = Date.now() - origTime;
      latencies.push(rtt);
    });
  });

  socket.on('connect_error', (err) => {
    console.error(`Client ${i} connection failed:`, err.message);
  });

  clients.push(socket);
}

setTimeout(() => {
  console.log('--- Stress Test Results ---');
  console.log(`Total Connected Clients: ${connectedCount} / ${NUM_CLIENTS}`);
  if (latencies.length > 0) {
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    console.log(`Ping Latency: Avg = ${avg}ms | Min = ${min}ms | Max = ${max}ms`);
  }
  clients.forEach(c => c.disconnect());
  process.exit(0);
}, 4000);
