const WebSocket = require('ws');
const MessageModel = require('./models/Message');
const connectedUsers = new Map();
const UserModel = require('./models/User');
module.exports = function (server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (socket) => {

        socket.on('message', async (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'register') {
                    socket.userId = parsed.userId;
                    connectedUsers.set(parsed.userId, socket);
                    const user = await UserModel.findById(socket.userId);
                    if (!user) {
                          console.error('User not found');
                          return;
                    }
                    socket.username=user.name
                    console.log(`User ${socket.username} registered`);
                }
                if (parsed.type === 'chat') {
                    const { from, to, messageText } = parsed;
                    const newMessage = {
                        sender: from,
                        messageText,
                        timestamp: new Date()
                    };
                    let conversation = await MessageModel.findOne({
                        $or: [{ user1: from, user2: to }, { user2: from, user1: to }]
                    });
                    if (conversation) {
                        conversation.messages.push(newMessage);
                        await conversation.save();
                    } else {
                        await MessageModel.create({
                            user1: from,
                            user2: to,
                            messages: [newMessage]
                        });
                    }

                    const recipientSocket = connectedUsers.get(to);
                    if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
                        recipientSocket.send(JSON.stringify({
                            type:'newMessageAlert',
                            from:from,
                            messageText:messageText,
                            timestamp: Date.now()
                        }));
                    }
                }
            } catch (err) {
                console.log('WebSocket error:', err.message);
            }
        }
        );

        socket.on('close', () => {
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
                console.log(`User ${socket.username} disconnected`);
            }
        });
    });
};