const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const config = require('./config');
const { cache } = require('./utils/cache');

// Load environment variables
dotenv.config();

// Routes
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const apartmentRoutes = require('./routes/apartmentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const siteNoteRoutes = require('./routes/siteNoteRoutes');
const fieldInstructionRoutes = require('./routes/fieldInstructionRoutes');

// Initialize Express app
const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance middleware - Add response time header
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/site-notes', siteNoteRoutes);
app.use('/api/field-instructions', fieldInstructionRoutes);

// Home route
app.get('/', (req, res) => {
  res.send('Project Management API is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Cache statistics endpoint (for monitoring)
app.get('/cache-stats', (req, res) => {
  const stats = cache.getStats();
  res.json({
    ...stats,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mongoose configuration for performance
mongoose.set('strictQuery', false);

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Gracefully shutting down...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

// Connect to MongoDB with optimized settings and start server
mongoose
  .connect(config.MONGODB_URI, config.MONGODB_OPTIONS)
  .then(() => {
    console.log('🚀 Connected to MongoDB Atlas with optimized settings');
    console.log('📊 Connection pool size:', config.MONGODB_OPTIONS.maxPoolSize);
    
    app.listen(PORT, () => {
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`💾 Database: ${config.NODE_ENV} environment`);
      console.log(`🚀 Cache system initialized`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }); 