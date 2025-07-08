# ☕ Brew&Bean Coffee Company - E-commerce Platform

<div align="center">

![Brew&Bean Logo](https://img.shields.io/badge/Brew%26Bean-Coffee%20Company-8B4513?style=for-the-badge&logo=coffee&logoColor=white)

**Premium Coffee Experience Since 2000**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

## 🌟 Overview

Brew&Bean Coffee Company is a **full-stack e-commerce platform** for India's second-largest coffee chain. This modern web application features a complete backend API, user authentication, shopping cart functionality, and a responsive frontend showcasing coffee, tea, chocolates, cookies, equipment, and merchandise.

### 🎯 Key Features

- **🔐 User Authentication** - Secure registration and login system
- **🛒 Shopping Cart** - Multi-category cart with server synchronization  
- **📱 Responsive Design** - Mobile-first approach with beautiful UI
- **🚀 REST API** - Complete backend with MongoDB integration
- **⚡ Demo Mode** - Works without database for easy testing
- **🎨 Modern UI/UX** - Smooth animations and interactive elements
- **📊 Product Management** - Category-based product organization
- **🔄 Real-time Updates** - Live cart synchronization and notifications

## 🏗️ Architecture

### Frontend
- **Vanilla HTML/CSS/JavaScript** - No framework dependencies
- **Responsive Design** - Mobile-first CSS Grid and Flexbox
- **API Integration** - Seamless backend communication
- **Shared Components** - Reusable authentication and cart functionality

### Backend
- **Node.js & Express.js** - RESTful API server
- **MongoDB & Mongoose** - Document database with ODM
- **JWT Authentication** - Secure token-based auth
- **Security Middleware** - CORS, rate limiting, input validation
- **Demo Mode** - In-memory fallback without database

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (optional - demo mode available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bnbweb
   ```

2. **Install backend dependencies**
   ```bash
   cd bnbweb-backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI (optional for demo mode)
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

5. **Open the frontend**
   - Open any HTML file in your browser
   - Or use a local server like Live Server in VS Code

### 🎮 Using VS Code (Recommended)

1. **Open the project in VS Code**
2. **Install recommended extensions** (Live Server, etc.)
3. **Use the built-in task**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Brew&Bean Backend Server"
4. **Right-click any HTML file** → "Open with Live Server"

## 📁 Project Structure

```
bnbweb/
├── 📄 README.md                    # Project documentation
├── 📄 SETUP-COMPLETE.md           # Detailed setup guide
├── 📄 package.json                # Frontend dependencies
├── 🎨 index.html                  # Home page
├── 🛒 Enhanced Product Pages/
│   ├── ☕ coffee.html             # Coffee products (API integrated)
│   ├── 🍵 tea.html                # Tea products (API integrated)
│   ├── 🍫 chocolate.html          # Chocolate products (API integrated)
│   ├── 🍪 cookies.html            # Cookie products (API integrated)
│   ├── ⚙️ equipments.html         # Coffee equipment (API integrated)
│   └── 👕 merchandise.html        # Branded merchandise (API integrated)
├── 📄 Static Pages/
│   ├── about.html                 # About page
│   ├── contact.html               # Contact page
│   └── cart.html                  # Legacy cart page
├── 🖼️ images/                     # Product and UI images
├── 💻 js/                         # Frontend JavaScript
│   ├── api-integration.js         # Backend API communication
│   └── auth-cart-shared.js        # Shared functionality
└── 🔧 bnbweb-backend/             # Complete backend application
    ├── 🚀 server.js               # Main server file
    ├── 📊 models/                 # Database models
    │   ├── User.js
    │   ├── Product.js
    │   ├── Cart.js
    │   ├── Order.js
    │   └── Category.js
    ├── 🎮 controllers/             # Business logic
    │   ├── authController.js
    │   ├── productController.js
    │   ├── cartController.js
    │   └── orderController.js
    ├── 🛣️ routes/                  # API endpoints
    │   ├── authRoutes.js
    │   ├── productRoutes.js
    │   ├── cartRoutes.js
    │   └── orderRoutes.js
    ├── 🔒 middleware/              # Security & validation
    │   ├── auth.js
    │   ├── errorHandler.js
    │   └── validation.js
    ├── 🛠️ utils/                   # Helper functions
    │   ├── helpers.js
    │   ├── demoData.js
    │   └── demoControllers.js
    ├── ⚙️ config/
    │   └── database.js
    ├── 📝 scripts/
    │   └── seedDatabase.js
    ├── 📄 package.json
    ├── 🔒 .env
    └── 📖 README.md
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/:id` - Get single product

### Shopping Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove/:productId` - Remove item from cart

### Orders
- `POST /api/orders/create` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order

### System
- `GET /api/health` - Health check
- `GET /api` - API documentation

## 🎨 Pages & Features

### 🏠 Home Page (`index.html`)
- **Hero Section** with animated background
- **About Section** with company information
- **Product Categories** with navigation links
- **Location Information** across 5 countries
- **Contact Information** and social links

### 🛍️ Enhanced Product Pages
All product pages include:
- **User Authentication** - Login/Register modals
- **Product Browsing** - Beautiful product displays
- **Shopping Cart** - Add to cart with animations
- **Server Sync** - Cart data syncs with backend
- **Category-Specific** - Separate carts for each category
- **Responsive Design** - Works on all devices

| Page | Category | Products | Status |
|------|----------|----------|---------|
| `coffee.html` | ☕ Coffee | Espresso, Americano, Latte, etc. | ✅ Enhanced |
| `tea.html` | 🍵 Tea | Masala, Green, Earl Grey, etc. | ✅ Enhanced |
| `chocolate.html` | 🍫 Chocolate | Dark, Milk, Nuts, etc. | ✅ Enhanced |
| `cookies.html` | 🍪 Cookies | Ginger, Chocolate Chip, etc. | ✅ Enhanced |
| `equipments.html` | ⚙️ Equipment | Machines, Filters, Pots, etc. | ✅ Enhanced |
| `merchandise.html` | 👕 Merchandise | T-shirts, Mugs, Bottles, etc. | ✅ Enhanced |

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `bnbweb-backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Optional - Demo mode available)
MONGODB_URI=mongodb://localhost:27017/brewbean

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Frontend URLs (for CORS)
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://127.0.0.1:5500
```

### Demo Mode vs Production

#### 🎭 Demo Mode (Default)
- ✅ Works without MongoDB
- ✅ Uses in-memory sample data
- ✅ All features functional
- ⚠️ Data resets on server restart

#### 🚀 Production Mode
- ✅ MongoDB database persistence
- ✅ Real user accounts
- ✅ Persistent cart data
- ✅ Order history
- ✅ Admin capabilities

## 🛠️ Development

### Running in Development Mode

1. **Start the backend**
   ```bash
   cd bnbweb-backend
   npm run dev
   ```

2. **Open frontend with Live Server**
   - Use VS Code Live Server extension
   - Or any local development server

3. **Test the features**
   - Visit `http://localhost:5000/health` for backend status
   - Open any HTML file to test frontend
   - Try login/register functionality
   - Add items to cart and test synchronization

### Database Setup (Optional)

1. **Install MongoDB**
   ```bash
   # Using Homebrew (macOS)
   brew install mongodb-community
   
   # Using apt (Ubuntu)
   sudo apt install mongodb
   
   # Or use MongoDB Atlas (cloud)
   ```

2. **Start MongoDB**
   ```bash
   mongod
   ```

3. **Seed the database**
   ```bash
   cd bnbweb-backend
   npm run seed
   ```

### Available Scripts

#### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Populate database with sample data
- `npm test` - Run tests (if available)

#### VS Code Tasks
- **Start Brew&Bean Backend Server** - Starts the backend in development mode

## 🚀 Deployment

### Backend Deployment (Heroku Example)

1. **Prepare for deployment**
   ```bash
   cd bnbweb-backend
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Deploy to Heroku**
   ```bash
   heroku create brewbean-api
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   git push heroku main
   ```

3. **Update frontend API URL**
   ```javascript
   // In js/api-integration.js
   const API_BASE_URL = 'https://brewbean-api.herokuapp.com';
   ```

### Frontend Deployment

Deploy the frontend to any static hosting service:
- **Netlify** - Drag and drop deployment
- **Vercel** - Git integration
- **GitHub Pages** - Free static hosting
- **Firebase Hosting** - Google's hosting platform

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] Session persistence works
- [ ] Logout clears session

#### Shopping Cart
- [ ] Add items to cart
- [ ] Cart count updates
- [ ] Cart persists across pages
- [ ] Remove items from cart
- [ ] Checkout process works

#### Product Pages
- [ ] Products display correctly
- [ ] Category filtering works
- [ ] Search functionality works
- [ ] Responsive design works

#### API Integration
- [ ] Backend server starts successfully
- [ ] API endpoints respond correctly
- [ ] Demo mode works without database
- [ ] Error handling works properly

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

## 📋 TODO / Roadmap

### Short Term
- [ ] Add product reviews and ratings
- [ ] Implement order tracking
- [ ] Add payment gateway integration
- [ ] Create admin dashboard
- [ ] Add product search filters

### Long Term
- [ ] Mobile app development
- [ ] Loyalty program integration
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] AI-powered recommendations

## 🐛 Troubleshooting

### Common Issues

#### Backend not starting
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill existing process
kill -9 <PID>

# Restart the server
npm run dev
```

#### Database connection issues
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Try demo mode (comment out MONGODB_URI)

#### Frontend not connecting to backend
- Check if backend is running on port 5000
- Verify CORS settings in server.js
- Check browser console for errors

#### Cart not syncing
- Ensure user is logged in
- Check network tab for API calls
- Verify JWT token in localStorage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team** - Full-stack development
- **Design Team** - UI/UX design
- **QA Team** - Testing and quality assurance

## 📞 Support

For support and questions:
- **Email**: support@brewbean.co.in
- **Phone**: +91-11-4567-8900
- **Address**: Gurugram, India

## 🙏 Acknowledgments

- **Font Awesome** for beautiful icons
- **MongoDB** for the database
- **Express.js** for the web framework
- **Node.js** for the runtime environment
- All contributors and testers

---

<div align="center">

**Made with ☕ and ❤️ by the Brew&Bean Team**

[![Website](https://img.shields.io/badge/Website-brewbean.co.in-8B4513?style=flat-square)](http://localhost:5000)
[![Demo](https://img.shields.io/badge/Demo-Live%20Demo-orange?style=flat-square)](file:///c:/Users/ALI%20HASSAN/OneDrive/Desktop/bnbweb/index.html)

</div>
