require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import configurations and middleware
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { setupDemoRoutes } = require('./utils/demoControllers');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Create Express app
const app = express();

// Global variable to track database connection status
let isDatabaseConnected = false;

// Attempt to connect to database
async function initializeDatabase() {
  try {
    const connectionResult = await connectDB();
    if (connectionResult) {
      isDatabaseConnected = true;
      console.log('✅ Database connected successfully');
    } else {
      isDatabaseConnected = false;
      console.log('⚠️  Database connection failed, switching to demo mode');
      console.log('📝 Demo mode uses in-memory data for testing purposes');
    }
  } catch (error) {
    console.log('⚠️  Database connection failed, switching to demo mode');
    console.log('📝 Demo mode uses in-memory data for testing purposes');
    console.log('Error details:', error.message);
    isDatabaseConnected = false;
  }
}

// Initialize database connection
initializeDatabase();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:5500',
      'http://localhost:5500'
    ];
    
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    database: isDatabaseConnected ? 'Connected' : 'Demo Mode',
    mode: isDatabaseConnected ? 'production' : 'demo'
  });
});

// API routes - use demo routes if database is not connected
if (isDatabaseConnected) {
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
} else {
  setupDemoRoutes(app);
}

// Welcome route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Brew&Bean Coffee Company API',
    version: '1.0.0',
    mode: isDatabaseConnected ? 'production' : 'demo',
    database: isDatabaseConnected ? 'MongoDB Connected' : 'Demo Mode (In-Memory)',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders'
    }
  });
});

// Static file serving for images (if needed)
app.use('/images', express.static('public/images'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🚀 Brew&Bean Backend Server is running!
📱 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
📡 API Endpoint: http://localhost:${PORT}/api
🗄️  Database: ${isDatabaseConnected ? 'MongoDB Connected' : 'Demo Mode (In-Memory)'}
${isDatabaseConnected ? '' : '⚠️  Note: Running in demo mode - data will not persist'}
⏰ Started at: ${new Date().toLocaleString()}
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});
