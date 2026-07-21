const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const zoomRoutes = require('./routes/zoom');
const aiRoutes = require('./routes/ai');
const emailRoutes = require('./routes/email');
const { verifyAuth } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

// Sentinel: Apply security headers via helmet
app.use(helmet());

// Sentinel: Basic rate limiting to protect against brute force / DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' }
});

app.use(cors());
app.use(express.json({ limit: '100kb' })); // Sentinel: Limit JSON payload size to prevent DoS

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/zoom', zoomRoutes);
// Apply auth middleware to protect these routes
app.use('/api/ai', verifyAuth, aiRoutes);
app.use('/api/email', verifyAuth, emailRoutes);

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message); // Sentinel: Don't log full stack trace to external monitoring, and definitely don't leak it in the response
  res.status(500).json({ error: 'Internal Server Error' }); // Sentinel: Safe error message that doesn't leak implementation details
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
