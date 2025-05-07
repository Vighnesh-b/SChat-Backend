// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    refreshToken: { type: String, default: null }
}, { versionKey: false });

UserSchema.statics.searchUsers = async function(searchTerm) {
    try {
        if (!searchTerm || searchTerm.trim() === '') {
            return {
                success: false,
                message: 'Please provide a search term',
                results: []
            };
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(searchTerm);
        let results;

        if (isObjectId) {
            results = await this.findById(searchTerm).select('_id name email');
            results = results ? [results] : [];
        } else {
            results = await this.find({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } }
                ]
            }).select('_id name email');
        }

        return {
            success: true,
            message: results.length > 0 
                ? 'Users found' 
                : 'No users found matching your search',
            results
        };
    } catch (error) {
        console.error('Search error:', error);
        return {
            success: false,
            message: 'Error searching users',
            results: [],
            error: error.message
        };
    }
};

module.exports = mongoose.model('User', UserSchema, "User");