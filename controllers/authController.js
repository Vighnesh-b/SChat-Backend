const User = require('../models/User');
const UserInfo = require('../models/UserInfo');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function generateTokens(user) {
    const accessToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
    );

    return { accessToken, refreshToken };
}

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Fields are missing' });
        }

        const exist = await User.findOne({ email });
        if (exist) {
            return res.status(400).json({ error: 'Email is already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        const userInfo=await UserInfo.create({_id:user._id,name:user.name,friendsList:[{friendId:'68132669f73cbb81f4a95291',friendName:'bob'}],outgoingFriendRequests:[],incomingFriendRequests:[]});
        
        res.status(201).json({ message: 'User registered', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Fields are missing' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Email is not registered' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Password is incorrect' });
        }

        const tokens = generateTokens(user);

        user.refreshToken = tokens.refreshToken;
        await user.save();

        console.log(`${email} has logged in`);
        res.status(200).json({
            message: 'Logged in',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err || user.email !== decoded.email) {
                return res.status(403).json({ error: 'Token verification failed' });
            }

            const tokens = generateTokens(user);
            user.refreshToken = tokens.refreshToken;
            user.save();

            res.json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        user.refreshToken = null;
        await user.save();
        console.log(`${user.email} has logged out`);
        res.status(200).json({ message: 'Logged out' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
