const UserInfo = require('../models/UserInfo');
const User = require('../models/User');
const mongoose = require('mongoose');
const Message = require('../models/Message');

const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid ID format');
  }
};

const checkUserExists = async (userId) => {
  const user = await UserInfo.findById(userId);
  if (!user) throw new Error('User not found');
  return user;
};

exports.getUsername = async (req, res) => {
  try {
    const { userId } = req.params;
    
    validateObjectId(userId);
    const user = await checkUserExists(userId);

    res.status(200).json({ 
      success: true,
      username: user.name 
    });
  } catch (err) {
    console.error('Get username error:', err);
    res.status(err.message === 'User not found' ? 404 : 400).json({ 
      success: false,
      error: err.message || 'Server error' 
    });
  }
};

exports.userinfo = async (req, res) => {
  try {
    const { userId } = req.params;
    
    validateObjectId(userId);
    const userInformation = await checkUserExists(userId);

    res.status(200).json({ 
      success: true,
      userInformation 
    });
  } catch (err) {
    console.error('User info error:', err);
    res.status(err.message === 'User not found' ? 404 : 400).json({ 
      success: false,
      error: err.message || 'Server error' 
    });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    validateObjectId(senderId);
    validateObjectId(receiverId);
    if (senderId === receiverId) throw new Error('Cannot send request to yourself');

    const [sender, receiver] = await Promise.all([
      checkUserExists(senderId),
      checkUserExists(receiverId)
    ]);

    const isAlreadyFriend = sender.friendsList.some(friend => 
      friend.friendId.toString() === receiverId
    );
    if (isAlreadyFriend) throw new Error('Already friends');

    const hasPendingRequest = sender.outgoingFriendRequests.some(req => 
      req.Id.toString() === receiverId
    ) || receiver.incomingFriendRequests.some(req => 
      req.Id.toString() === senderId
    );
    if (hasPendingRequest) throw new Error('Friend request already exists');

    sender.outgoingFriendRequests.push({ 
      Id: receiver._id, 
      Name: receiver.name,
      createdAt: new Date()
    });
    receiver.incomingFriendRequests.push({ 
      Id: sender._id, 
      Name: sender.name,
      createdAt: new Date()
    });

    await Promise.all([sender.save(), receiver.save()]);

    res.status(200).json({ 
      success: true,
      message: 'Friend request sent'
    });
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(400).json({ 
      success: false,
      error: err.message || 'Server error' 
    });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId, accepterId } = req.body;
    
    if (!requestId || !accepterId) {
      throw new Error('Both requestId and accepterId are required');
    }

    const isValidRequestId = mongoose.Types.ObjectId.isValid(requestId);
    const isValidAccepterId = mongoose.Types.ObjectId.isValid(accepterId);
    
    if (!isValidRequestId || !isValidAccepterId) {
      throw new Error('Invalid ID format');
    }

    const [requester, accepter] = await Promise.all([
      UserInfo.findById(requestId),
      UserInfo.findById(accepterId)
    ]);

    if (!requester || !accepter) {
      throw new Error('User not found');
    }

    const requestIndex = accepter.incomingFriendRequests.findIndex(
      req => req.Id.toString() === requestId.toString()
    );

    if (requestIndex === -1) {
      throw new Error('Friend request not found');
    }

    requester.friendsList.push({ 
      friendId: accepter._id, 
      friendName: accepter.name,
      since: new Date()
    });
    
    accepter.friendsList.push({ 
      friendId: requester._id, 
      friendName: requester.name,
      since: new Date()
    });

    accepter.incomingFriendRequests.splice(requestIndex, 1);
    
    requester.outgoingFriendRequests = requester.outgoingFriendRequests.filter(
      req => req.Id.toString() !== accepterId.toString()
    );

    await Promise.all([requester.save(), accepter.save()]);

    res.status(200).json({ 
      success: true,
      message: 'Friend request accepted',
      friend: {
        id: accepter._id,
        name: accepter.name
      }
    });
  } catch (err) {
    console.error('Accept friend request error:', err);
    res.status(400).json({ 
      success: false,
      error: err.message || 'Server error' 
    });
  }
};

exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId, receiverId } = req.body;
    
    validateObjectId(requestId);
    validateObjectId(receiverId);

    const [sender, receiver] = await Promise.all([
      checkUserExists(requestId),
      checkUserExists(receiverId)
    ]);

    receiver.incomingFriendRequests = receiver.incomingFriendRequests.filter(
      req => req.Id.toString() !== requestId
    );
    sender.outgoingFriendRequests = sender.outgoingFriendRequests.filter(
      req => req.Id.toString() !== receiverId
    );

    await Promise.all([sender.save(), receiver.save()]);

    res.status(200).json({ 
      success: true,
      message: 'Friend request rejected'
    });
  } catch (err) {
    console.error('Reject friend request error:', err);
    res.status(400).json({ 
      success: false,
      error: err.message || 'Server error' 
    });
  }
};

exports.cancelFriendRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    validateObjectId(senderId);
    validateObjectId(receiverId);

    const [sender, receiver] = await Promise.all([
      checkUserExists(senderId),
      checkUserExists(receiverId)
    ]);

    sender.outgoingFriendRequests = sender.outgoingFriendRequests.filter(
      req => req.Id.toString() !== receiverId
    );
    receiver.incomingFriendRequests = receiver.incomingFriendRequests.filter(
      req => req.Id.toString() !== senderId
    );

    await Promise.all([sender.save(), receiver.save()]);

    res.status(200).json({ 
      success: true,
      message: 'Friend request canceled'
    });
  } catch (err) {
    console.error('Cancel friend request error:', err);
    res.status(400).json({ 
      success: false,
      error: err.message || 'Server error' 
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    validateObjectId(senderId);
    validateObjectId(receiverId);

    const conversation = await Message.findOne({
      $or: [
        { user1: senderId, user2: receiverId },
        { user1: receiverId, user2: senderId }
      ]
    }).sort({ 'messages.timestamp': 1 });

    res.status(200).json({ 
      success: true,
      messages: conversation?.messages || []
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(400).json({ 
      success: false,
      error: err.message || 'Server error' 
    });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search term is required',
        results: []
      });
    }

    const results = await User.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('_id name email');

    res.status(200).json({
      success: true,
      message: results.length > 0 
        ? 'Search results found' 
        : 'No users found',
      results
    });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while searching',
      results: [],
      error: err.message
    });
  }
};