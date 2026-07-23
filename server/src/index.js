const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const zoomRoutes = require('./routes/zoom');
const aiRoutes = require('./routes/ai');
const emailRoutes = require('./routes/email');
const trackingRoutes = require('./routes/tracking');
const billingRoutes = require('./routes/billing');
const { verifyAuth } = require('./middleware/auth');
const requestId = require('./middleware/requestId');
const sanitize = require('./middleware/sanitize');
const bufferService = require('./services/buffer-service');
const log = require('./utils/logger');

const isProd = process.env.NODE_ENV === 'production';
const requiredInProd = ['CLIENT_URL', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET', 'RESEND_API_KEY'];
if (isProd) {
  const missing = requiredInProd.filter((k) => !process.env[k]);
  if (missing.length) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const app = express();
const server = http.createServer(app);

const allowedOrigin = isProd
  ? process.env.CLIENT_URL
  : (process.env.CLIENT_URL || true);

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 3000;

app.use(helmet());
app.use(requestId);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());

// Stripe webhook needs raw body before JSON parser
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '100kb' }));
app.use(sanitize);
app.use('/api', apiLimiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Please wait before making another request.' }
});

const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Email rate limit exceeded. Please wait before sending another email.' }
});

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    log.info('Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
    });
  });
  next();
};
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/billing', billingRoutes);

app.use('/api/ai', verifyAuth, aiLimiter, aiRoutes);
app.use('/api/email', verifyAuth, emailLimiter, emailRoutes);

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API is running', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

try {
  const swaggerDocument = require('./swagger.json');
  app.get('/api/docs', (req, res) => {
    res.json(swaggerDocument);
  });
} catch (e) {
  // Swagger doc not generated yet
}

app.use((err, req, res, next) => {
  log.error('Unhandled error', { message: err.message, requestId: req.requestId });
  res.status(500).json({ error: 'Internal Server Error' });
});

app.set('io', io);

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    log.warn('Socket connection rejected: no token', { socketId: socket.id });
    socket.disconnect(true);
    return;
  }

  const admin = require('./services/firebase-admin');
  admin.auth().verifyIdToken(token)
    .then((decodedToken) => {
      socket.user = decodedToken;
      log.info('Client connected', { socketId: socket.id, uid: decodedToken.uid });

      socket.on('join_meeting', (meetingId) => {
        socket.join(`meeting:${meetingId}`);
        log.info('Socket joined meeting room', { socketId: socket.id, meetingId, uid: decodedToken.uid });
      });

      socket.on('save_note', (note) => {
        log.info('Note received via WS', { socketId: socket.id, uid: decodedToken.uid });
      });

      socket.on('disconnect', () => {
        log.info('Client disconnected', { socketId: socket.id, uid: decodedToken.uid });
      });
    })
    .catch((err) => {
      log.warn('Socket authentication failed', { socketId: socket.id, error: err.message });
      socket.disconnect(true);
    });
});

const gracefulShutdown = (signal) => {
  log.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    log.info('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(port, () => {
  log.info(`Server listening on port ${port}`);
});

module.exports = { app, server, io };
