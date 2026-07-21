const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const zoomRoutes = require('./routes/zoom');
const aiRoutes = require('./routes/ai');
const emailRoutes = require('./routes/email');
const trackingRoutes = require('./routes/tracking');
const { verifyAuth } = require('./middleware/auth');
const bufferService = require('./services/buffer-service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/tracking', trackingRoutes);

// Protected routes
app.use('/api/ai', verifyAuth, aiRoutes);
app.use('/api/email', verifyAuth, emailRoutes);

// Health check
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API is running', version: '1.0.0' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Store io instance on app for route access
app.set('io', io);

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a meeting room for targeted broadcasts
  socket.on('join_meeting', (meetingId) => {
    socket.join(`meeting:${meetingId}`);
    console.log(`Socket ${socket.id} joined meeting:${meetingId}`);
  });

  // Handle quick notes from Zoom panel
  socket.on('save_note', (note) => {
    console.log('Note received:', note);
    // Could buffer here or forward to a specific meeting room
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = { app, server, io };
