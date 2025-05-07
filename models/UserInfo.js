const mongoose = require('mongoose');

const UserInfoSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  friendsList: [{
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    friendName: { type: String, required: true }
  }],
  incomingFriendRequests: [{
    Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    Name: { type: String, required: true },
  }], outgoingFriendRequests: [{
    Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    Name: { type: String, required: true },
  }]

});

module.exports = mongoose.model('UserInfo', UserInfoSchema, "UserInfo");

