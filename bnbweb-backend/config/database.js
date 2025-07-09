const mongoose = require('mongoose');

// Enhanced database configuration with production-ready features
const connectDB = async () => {
  try {
    // Environment check
    const environment = process.env.NODE_ENV || 'development';
    
    // Check if MongoDB URI is provided
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  No MongoDB URI found in environment variables');
      console.log('💡 Set MONGODB_URI in your .env file to connect to MongoDB');
      console.log('🎭 Switching to demo mode with in-memory data');
      return false;
    }

    // Connection options - production ready
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
      retryWrites: true, // Enable retryable writes
      retryReads: true, // Enable retryable reads
      autoIndex: environment === 'development', // Build indexes only in development
    };

    console.log('🔄 Attempting to connect to MongoDB...');
    console.log(`📍 URI: ${process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    console.log(`📊 Connection state: ${conn.connection.readyState}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    mongoose.connection.on('timeout', () => {
      console.warn('⏰ MongoDB connection timeout');
    });

    mongoose.connection.on('close', () => {
      console.log('🔌 MongoDB connection closed');
    });

    // Connection state monitoring
    setInterval(() => {
      const state = mongoose.connection.readyState;
      if (state === 0) {
        console.warn('⚠️  MongoDB connection state: Disconnected');
      } else if (state === 2) {
        console.warn('🔄 MongoDB connection state: Connecting');
      } else if (state === 3) {
        console.warn('❌ MongoDB connection state: Disconnecting');
      }
      // State 1 is connected, which is normal
    }, 30000); // Check every 30 seconds

    // Graceful shutdown handlers
    const gracefulClose = async (signal) => {
      console.log(`\n🔄 Received ${signal}. Closing MongoDB connection...`);
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulClose('SIGINT'));
    process.on('SIGTERM', () => gracefulClose('SIGTERM'));

    // Database health check function
    mongoose.connection.db.admin().ping((err, result) => {
      if (err) {
        console.error('❌ Database ping failed:', err);
      } else {
        console.log('🏓 Database ping successful');
      }
    });

    return true;

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('📝 Error message:', error.message);
    
    // Specific error handling
    if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 Network error: Cannot resolve MongoDB host');
      console.error('💡 Check your internet connection and MongoDB URI');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔌 Connection refused: MongoDB server is not running');
      console.error('💡 Make sure MongoDB is running and accessible');
    } else if (error.message.includes('Authentication failed')) {
      console.error('🔐 Authentication error: Invalid credentials');
      console.error('💡 Check your MongoDB username and password');
    } else if (error.message.includes('bad auth')) {
      console.error('🔐 Authentication error: Bad authentication');
      console.error('💡 Check your MongoDB credentials and database name');
    }
    
    console.log('🎭 Falling back to demo mode with in-memory data');
    console.log('💡 Demo mode allows you to test the API without a database');
    
    return false;
  }
};

// Database utility functions
const getDatabaseInfo = () => {
  if (mongoose.connection.readyState === 1) {
    return {
      connected: true,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      state: mongoose.connection.readyState,
      collections: Object.keys(mongoose.connection.collections)
    };
  }
  return {
    connected: false,
    state: mongoose.connection.readyState
  };
};

const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  getDatabaseInfo,
  isConnected
};
