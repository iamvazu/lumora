import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // 100 concurrent sockets
    { duration: '1m', target: 500 },   // 500 concurrent sockets
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ws_connecting: ['p(95)<500'],      // Connection handshake < 500ms
  },
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:4000/v1/ws';

export default function () {
  const url = `${WS_URL}?token=${__ENV.TEST_JWT_TOKEN || 'mock_jwt_token'}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // Join conversation room
      socket.send(JSON.stringify({
        event: 'join_conversation',
        data: { conversationId: 'conv-load-test-123' },
      }));

      // Send ping / heartbeat
      socket.setInterval(() => {
        socket.send(JSON.stringify({ event: 'typing', data: { conversationId: 'conv-load-test-123' } }));
      }, 5000);
    });

    socket.on('message', (data) => {
      check(data, {
        'message received': (d) => d.length > 0,
      });
    });

    socket.setTimeout(() => {
      socket.close();
    }, 30000);
  });

  check(res, { 'connected successfully': (r) => r && r.status === 101 });
  sleep(1);
}
