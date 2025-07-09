# MongoDB Setup and Database Configuration Guide

## 🗄️ MongoDB Installation and Setup

### Option 1: MongoDB Atlas (Cloud - Recommended for Production)

1. **Create MongoDB Atlas Account**

   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account
   - Create a new cluster (free tier available)

2. **Get Connection String**

   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

3. **Update Environment Variables**
   ```bash
   # In your .env file
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/brewbean?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB Installation

#### Windows Installation:

1. **Download MongoDB Community Server**

   - Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Download the Windows installer
   - Run the installer with default settings

2. **Install as Windows Service**

   - During installation, check "Install MongoDB as a Service"
   - Choose "Run service as Network Service user"

3. **Verify Installation**

   ```powershell
   # Check if MongoDB service is running
   Get-Service -Name MongoDB

   # Start MongoDB service if not running
   Start-Service -Name MongoDB
   ```

4. **Test Connection**
   ```powershell
   # Connect to MongoDB shell
   mongosh
   # or if older version
   mongo
   ```

#### Alternative: MongoDB with Docker

1. **Install Docker Desktop**

   - Download and install Docker Desktop for Windows

2. **Run MongoDB Container**

   ```bash
   # Pull and run MongoDB container
   docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo:latest

   # Update .env file
   MONGODB_URI=mongodb://admin:password@localhost:27017/brewbean?authSource=admin
   ```

## 🚀 Quick Start with Any Database Option

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database configuration
# For Atlas: MONGODB_URI=mongodb+srv://...
# For Local: MONGODB_URI=mongodb://localhost:27017/brewbean
# For Docker: MONGODB_URI=mongodb://admin:password@localhost:27017/brewbean?authSource=admin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Test Database Connection

```bash
# Test the connection
npm run dev

# You should see:
# ✅ Database connected successfully
# 🚀 Brew&Bean Backend Server is running!
```

### 4. Seed Database (Optional)

```bash
# Populate with sample data
npm run seed

# This creates:
# - Admin user: admin@brewbean.com / Admin@123
# - Sample products, categories, and test users
```

## 🎯 No Database? No Problem!

The backend is designed to work in **Demo Mode** if no database is available:

1. **Start Server Without Database**

   ```bash
   npm run dev
   ```

2. **Demo Mode Features**

   - ✅ All API endpoints work
   - ✅ In-memory data storage
   - ✅ Full authentication simulation
   - ✅ Complete shopping cart functionality
   - ⚠️ Data doesn't persist between restarts

3. **Demo Mode Indicators**
   - Server logs show: "🎭 Setting up demo routes without database"
   - Health endpoint shows: `"database": "Demo Mode"`
   - Welcome page shows: `"mode": "demo"`

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Connection Refused Error**

   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```

   **Solution**: MongoDB is not running

   - Windows: `Start-Service -Name MongoDB`
   - Docker: `docker start mongodb`
   - Or use MongoDB Atlas instead

2. **Authentication Failed**

   ```
   Error: Authentication failed
   ```

   **Solution**: Check username/password in connection string

3. **Network Timeout**

   ```
   Error: Server selection timed out
   ```

   **Solution**: Check firewall settings or use local MongoDB

4. **Module Not Found**
   ```
   Error: Cannot find module 'mongoose'
   ```
   **Solution**: Run `npm install`

## 📊 Database Schema Overview

The backend automatically creates these collections:

### Users Collection

- User authentication and profiles
- Addresses and preferences
- Order history and cart data

### Products Collection

- Product catalog with images
- Categories and specifications
- Reviews and ratings
- Inventory management

### Orders Collection

- Complete order lifecycle
- Payment and shipping tracking
- Status history and auditing

### Categories Collection

- Product categorization
- SEO and navigation data

### Carts Collection

- User shopping carts
- Real-time inventory checking
- Automatic calculations

## 🎉 Success Verification

Once everything is set up, verify your installation:

1. **Health Check**

   ```bash
   curl http://localhost:5000/health
   ```

   Should return status "operational" with database connection info

2. **API Welcome**

   ```bash
   curl http://localhost:5000/api
   ```

   Should return API information and available endpoints

3. **Test Authentication**
   ```bash
   # Register a test user
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"Password@123"}'
   ```

## 🌐 Production Deployment

For production deployment:

1. **Use MongoDB Atlas** (recommended)
2. **Set environment variables**:
   ```bash
   NODE_ENV=production
   MONGODB_URI=your-atlas-connection-string
   JWT_SECRET=your-super-secret-key
   ```
3. **Enable SSL/HTTPS**
4. **Configure domain and CORS**
5. **Set up monitoring and backups**

## 📞 Support

If you encounter any issues:

1. Check the server logs for detailed error messages
2. Verify your `.env` file configuration
3. Test database connectivity separately
4. Use demo mode as a fallback for development

The backend is production-ready and will work with or without a database connection!
