const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const http = require('http');
const cors = require('cors');
const {userinfo,sendFriendRequest,acceptFriendRequest,rejectFriendRequest,getUsername,getMessages,searchUsers}=require('./controllers/userInfoController');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Database connected'))
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });

app.use('/auth', authRoutes);

app.get('/userinfo/:userId',userinfo);
app.post('/sendFriendRequest',sendFriendRequest);
app.post('/acceptFriendRequest',acceptFriendRequest);
app.put('/rejectFriendRequest',rejectFriendRequest);
app.get('/getUsername/:userId',getUsername);
app.post('/getMessages',getMessages);
app.get('/search',searchUsers);

app.get('/', (req, res) => res.send('API is running'));

require('./socket')(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
