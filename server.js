require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const connectDB = require('./src/utils/db');
const authRoutes = require('./src/routes/auth');
const roomRoutes = require('./src/routes/rooms');
const userRoutes = require('./src/routes/users');
const { setupSocketHandlers } = require('./src/socket/handlers');
const { globalRateLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['https://watch-together-frontend-lilac.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

connectDB();

app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', globalRateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

setupSocketHandlers(io);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🎬 WatchTogether Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});
