const WebSocket = require('ws');
const socket = new WebSocket('ws://localhost:3000');

const fromId = '67fa76ffae966666e8033cb0';
const toId = '67fbdf4787a385883289327d';

async function connectAndSend() {
  try {
    socket.on('open', () => {
      console.log('Connected');

      socket.send(JSON.stringify({ type: "register", userId: toId}));

      socket.send(JSON.stringify({
        type: "chat",
        from: toId,
        to: fromId,
        messageText: "Hey there!"
      }));
    });

    socket.on('message', (data) => {
      const parsed = JSON.parse(data);
      console.log("Received:", parsed.messageText);
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

connectAndSend();
