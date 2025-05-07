const WebSocket = require('ws');
const mongoose = require('mongoose');
const socket = new WebSocket('ws://localhost:3000');

const fromId = '67fa76ffae966666e8033cb0';
const toId = '67fbdf4787a385883289327d';
try{
socket.on('open', () => {
  console.log('Connected');

  socket.send(JSON.stringify({ type: "register", userId: fromId }));

  socket.send(JSON.stringify({
    type: "chat",
    from: fromId,
    to: toId,
    messageText: "Hey there!"
  }));
});

socket.on('message', (data) => {
  console.log("Received:", JSON.parse(data).messageText);
});
}catch(err){
    console.error('Error:', err);
}

