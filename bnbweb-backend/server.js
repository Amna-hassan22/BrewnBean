require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import configurations and middleware
const connectDB = require('./config/database');
const { errorHandler, notFound, asyncHandler } = require('./middleware/errorHandler');
const { setupDemoRoutes } = require('./utils/demoControllers');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Create Express app
const app = express();

// Global variables
let isDatabaseConnected = false;
let server;

// Environment variables validation
const requiredEnvVars = ['NODE_ENV'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('📝 Setting default values for missing variables');
  
  // Set default values
  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
}

// Database initialization with retry logic
async function initializeDatabase() {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`🔄 Database connection attempt ${retryCount + 1}/${maxRetries}`);
      
      const connectionResult = await connectDB();
      if (connectionResult) {
        isDatabaseConnected = true;
        console.log('✅ Database connected successfully');
        return true;
      } else {
        throw new Error('Database connection returned false');
      }
    } catch (error) {
      retryCount++;
      console.log(`❌ Database connection attempt ${retryCount} failed:`, error.message);
      
      if (retryCount < maxRetries) {
        console.log(`⏳ Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('⚠️  All database connection attempts failed, switching to demo mode');
        console.log('📝 Demo mode uses in-memory data for testing purposes');
        isDatabaseConnected = false;
        return false;
      }
    }
  }
}

// Security middleware - Enhanced
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting - Enhanced with different limits for different endpoints
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: {
    success: false,
    message: message || 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests');
const authLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts');
const strictLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many requests to this endpoint');

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/admin', strictLimiter);

// CORS configuration - Enhanced
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5500',
      'http://localhost:5501',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
      'https://localhost:3000',
      'https://localhost:5000',
      'https://localhost:5500',
      'https://localhost:5501'
    ];
    
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development mode, allow all origins
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware - Enhanced
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// Logging middleware - Enhanced
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request ID middleware for better debugging
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Health check route - Enhanced
app.get('/health', asyncHandler(async (req, res) => {
  const healthInfo = {
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0',
    database: isDatabaseConnected ? 'Connected' : 'Demo Mode',
    mode: isDatabaseConnected ? 'production' : 'demo',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    status: 'operational'
  };

  res.status(200).json(healthInfo);
}));

// API routes - Enhanced routing logic
async function setupRoutes() {
  if (isDatabaseConnected) {
    console.log('🔌 Setting up production routes with database');
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/orders', orderRoutes);
  } else {
    console.log('🎭 Setting up demo routes without database');
    setupDemoRoutes(app);
  }
}

// Welcome route - Enhanced
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Brew&Bean Coffee Company API',
    version: '2.0.0',
    mode: isDatabaseConnected ? 'production' : 'demo',
    database: isDatabaseConnected ? 'MongoDB Connected' : 'Demo Mode (In-Memory)',
    timestamp: new Date().toISOString(),
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders'
    },
    features: {
      authentication: true,
      rateLimit: true,
      cors: true,
      security: true,
      logging: true
    }
  });
});

// Static file serving - Enhanced
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// 404 handler for undefined routes
app.use(notFound);

// Global error handling middleware
app.use(errorHandler);

// Server startup function
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Setup routes after database initialization
    await setupRoutes();
    
    // Start server
    const PORT = process.env.PORT || 5000;
    
    server = app.listen(PORT, () => {
      console.log(`
🚀 Brew&Bean Backend Server is running!
📱 Environment: ${process.env.NODE_ENV}
🌐 Server: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
📡 API Endpoint: http://localhost:${PORT}/api
🗄️  Database: ${isDatabaseConnected ? 'MongoDB Connected' : 'Demo Mode (In-Memory)'}
🔒 Security: Rate limiting, CORS, Helmet enabled
🔍 Logging: ${process.env.NODE_ENV === 'development' ? 'Development' : 'Production'} mode
${isDatabaseConnected ? '' : '⚠️  Note: Running in demo mode - data will not persist'}
⏰ Started at: ${new Date().toLocaleString()}
      `);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      console.log('🔌 HTTP server closed');
      
      // Close database connection
      if (isDatabaseConnected) {
        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          console.log('🗄️  Database connection closed');
        } catch (error) {
          console.error('❌ Error closing database connection:', error);
        }
      }
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Rejection:', err.message);
  console.error('Stack:', err.stack);
  
  // Close server gracefully
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  
  // Close server gracefully
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start the server
startServer();

module.exports = app;
