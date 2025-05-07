const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        messageText: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
    }]

})
module.exports = mongoose.model("Message", MessageSchema, "Message")