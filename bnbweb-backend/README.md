# Brew&Bean Coffee Company - Backend API

## Overview
This is the backend API for the Brew&Bean Coffee Company e-commerce website. It provides comprehensive functionality for managing products, users, shopping carts, and orders.

## Features
- **User Authentication & Authorization** (JWT-based)
- **Product Management** with categories, search, and filtering
- **Shopping Cart** functionality
- **Order Management** system
- **Role-based Access Control** (Customer/Admin)
- **RESTful API** with proper error handling
- **Input Validation** and sanitization
- **Security Middleware** (Helmet, CORS, Rate Limiting)
- **Database Integration** with MongoDB

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation
1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Seed the database with sample data:
```bash
npm run seed
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/featured` - Get featured products
- `GET /api/products/popular` - Get popular products
- `GET /api/products/search/:query` - Search products
- `POST /api/products/:id/reviews` - Add product review

### Shopping Cart
- `GET /api/cart` - Get user cart
- `GET /api/cart/count` - Get cart item count
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove/:productId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/stats` - Get order statistics (Admin)

## Environment Variables

```env
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/bnbweb_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://127.0.0.1:5500
```

## Database Schema

### User
- Authentication and profile information
- Address details
- Order history
- Shopping cart
- Role-based permissions

### Product
- Product details and specifications
- Category and subcategory
- Pricing and stock information
- Images and ratings
- Reviews and ratings

### Order
- Order items and quantities
- Shipping and billing information
- Payment details
- Order status tracking
- Status history

### Cart
- User's shopping cart items
- Quantities and pricing
- Automatic total calculations

### Category
- Product categories
- Category metadata
- Product counts

## Sample Data
The database seeder creates:
- **2 Users**: 1 Admin, 1 Customer
- **6 Categories**: Coffee, Tea, Chocolate, Cookies, Equipment, Merchandise
- **40+ Products**: Distributed across all categories

### Login Credentials
- **Admin**: admin@brewbean.com / admin123
- **Customer**: customer@example.com / customer123

## Security Features
- **JWT Authentication** with secure token generation
- **Password Hashing** using bcryptjs
- **Input Validation** with express-validator
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for cross-origin requests
- **Helmet** for security headers
- **Error Handling** without exposing sensitive information

## Product Categories
1. **Coffee** - Espresso, Cappuccino, Americano, Latte, etc.
2. **Tea** - Masala Chai, Black Tea, Oolong, Matcha, etc.
3. **Chocolate** - Dark, Milk, Nuts, Desserts
4. **Cookies** - Various baked goods and snacks
5. **Equipment** - Coffee makers, Tea kettles, Filters, etc.
6. **Merchandise** - Branded items, Mugs, T-shirts, etc.

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data

### Testing
The API can be tested using tools like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)
- curl commands

### API Response Format
All API responses follow a consistent format:
```json
{
  "success": true|false,
  "message": "Description of the result",
  "data": { /* Response data */ },
  "pagination": { /* Pagination info for list endpoints */ }
}
```

## Production Deployment
1. Set `NODE_ENV=production`
2. Use MongoDB Atlas for database
3. Configure proper CORS origins
4. Set secure JWT secret
5. Use HTTPS
6. Set up proper logging
7. Configure rate limiting appropriately

## Support
For support and questions, contact the development team or refer to the API documentation.

---

**Brew&Bean Coffee Company** - Delivering premium coffee experiences since 2000.
