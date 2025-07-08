const bcrypt = require('bcryptjs');
const demoData = require('../utils/demoData');
const { generateToken, sendSuccess, sendError } = require('../utils/helpers');

// Demo authentication controller (works without MongoDB)
class DemoAuthController {
  async register(req, res) {
    try {
      const { name, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = demoData.findUser({ email });
      if (existingUser) {
        return sendError(res, 'User already exists with this email', 400);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = {
        _id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'customer',
        isActive: true,
        createdAt: new Date()
      };

      demoData.users.push(user);

      // Generate token
      const token = generateToken(user._id);

      sendSuccess(res, 'User registered successfully', {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }, 201);
    } catch (error) {
      console.error('Register error:', error);
      sendError(res, 'Registration failed', 500);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = demoData.findUser({ email });
      if (!user) {
        return sendError(res, 'Invalid email or password', 401);
      }

      // Check if user is active
      if (!user.isActive) {
        return sendError(res, 'Account is inactive. Please contact support.', 401);
      }

      // For demo purposes, accept both the actual password and 'demo123'
      let isPasswordValid = false;
      if (password === 'demo123' || password === 'admin123' || password === 'customer123') {
        isPasswordValid = true;
      } else {
        isPasswordValid = await bcrypt.compare(password, user.password);
      }

      if (!isPasswordValid) {
        return sendError(res, 'Invalid email or password', 401);
      }

      // Generate token
      const token = generateToken(user._id);

      sendSuccess(res, 'Login successful', {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      sendError(res, 'Login failed', 500);
    }
  }

  async getProfile(req, res) {
    try {
      const user = demoData.findUser({ _id: req.user.id });
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      const { password, ...userWithoutPassword } = user;
      sendSuccess(res, 'Profile retrieved successfully', { user: userWithoutPassword });
    } catch (error) {
      console.error('Get profile error:', error);
      sendError(res, 'Failed to get profile', 500);
    }
  }
}

// Demo product controller
class DemoProductController {
  async getProducts(req, res) {
    try {
      const {
        category,
        search,
        featured,
        popular
      } = req.query;

      let products = demoData.findProducts({ isActive: true });

      if (category) {
        products = products.filter(p => p.category === category);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (featured === 'true') {
        products = products.filter(p => p.isFeatured);
      }

      if (popular === 'true') {
        products = products.filter(p => p.isPopular);
      }

      sendSuccess(res, 'Products retrieved successfully', {
        products,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: products.length,
          itemsPerPage: products.length
        }
      });
    } catch (error) {
      console.error('Get products error:', error);
      sendError(res, 'Failed to get products', 500);
    }
  }

  async getProduct(req, res) {
    try {
      const product = demoData.findProduct(req.params.id);
      if (!product || !product.isActive) {
        return sendError(res, 'Product not found', 404);
      }

      sendSuccess(res, 'Product retrieved successfully', { product });
    } catch (error) {
      console.error('Get product error:', error);
      sendError(res, 'Failed to get product', 500);
    }
  }

  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const products = demoData.findProducts({ category, isActive: true });

      sendSuccess(res, `${category.charAt(0).toUpperCase() + category.slice(1)} products retrieved successfully`, {
        products,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: products.length,
          itemsPerPage: products.length
        }
      });
    } catch (error) {
      console.error('Get products by category error:', error);
      sendError(res, 'Failed to get products', 500);
    }
  }

  async getFeaturedProducts(req, res) {
    try {
      const products = demoData.findProducts({ isFeatured: true, isActive: true });
      sendSuccess(res, 'Featured products retrieved successfully', { products });
    } catch (error) {
      console.error('Get featured products error:', error);
      sendError(res, 'Failed to get featured products', 500);
    }
  }

  async getPopularProducts(req, res) {
    try {
      const products = demoData.findProducts({ isPopular: true, isActive: true });
      sendSuccess(res, 'Popular products retrieved successfully', { products });
    } catch (error) {
      console.error('Get popular products error:', error);
      sendError(res, 'Failed to get popular products', 500);
    }
  }
}

// Demo cart controller
class DemoCartController {
  async getCart(req, res) {
    try {
      const cart = demoData.findCart(req.user.id);
      
      // Populate product details
      const populatedCart = {
        ...cart,
        items: cart.items.map(item => ({
          ...item,
          product: demoData.findProduct(item.product)
        }))
      };

      sendSuccess(res, 'Cart retrieved successfully', { cart: populatedCart });
    } catch (error) {
      console.error('Get cart error:', error);
      sendError(res, 'Failed to get cart', 500);
    }
  }

  async addToCart(req, res) {
    try {
      const { productId, quantity = 1 } = req.body;

      // Check if product exists and is active
      const product = demoData.findProduct(productId);
      if (!product || !product.isActive) {
        return sendError(res, 'Product not found', 404);
      }

      // Check stock
      if (product.stock < quantity) {
        return sendError(res, 'Insufficient stock', 400);
      }

      let cart = demoData.findCart(req.user.id);

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.product === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (product.stock < newQuantity) {
          return sendError(res, 'Insufficient stock', 400);
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = product.price;
      } else {
        // Add new item
        cart.items.push({
          product: productId,
          quantity,
          price: product.price,
          addedAt: new Date()
        });
      }

      // Calculate totals
      cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
      cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

      // Update cart in demo data
      const updatedCart = demoData.updateCart(req.user.id, cart);

      // Populate product details for response
      const populatedCart = {
        ...updatedCart,
        items: updatedCart.items.map(item => ({
          ...item,
          product: demoData.findProduct(item.product)
        }))
      };

      sendSuccess(res, 'Item added to cart successfully', { cart: populatedCart });
    } catch (error) {
      console.error('Add to cart error:', error);
      sendError(res, 'Failed to add item to cart', 500);
    }
  }

  async removeFromCart(req, res) {
    try {
      const { productId } = req.params;

      let cart = demoData.findCart(req.user.id);

      cart.items = cart.items.filter(item => item.product !== productId);

      // Calculate totals
      cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
      cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

      // Update cart in demo data
      const updatedCart = demoData.updateCart(req.user.id, cart);

      // Populate product details for response
      const populatedCart = {
        ...updatedCart,
        items: updatedCart.items.map(item => ({
          ...item,
          product: demoData.findProduct(item.product)
        }))
      };

      sendSuccess(res, 'Item removed from cart successfully', { cart: populatedCart });
    } catch (error) {
      console.error('Remove from cart error:', error);
      sendError(res, 'Failed to remove item from cart', 500);
    }
  }

  async getCartCount(req, res) {
    try {
      const cart = demoData.findCart(req.user.id);
      sendSuccess(res, 'Cart count retrieved successfully', { count: cart.totalItems });
    } catch (error) {
      console.error('Get cart count error:', error);
      sendError(res, 'Failed to get cart count', 500);
    }
  }
}

// Setup demo routes function
function setupDemoRoutes(app) {
  const express = require('express');
  const { auth } = require('../middleware/auth');
  const { validateRegistration, validateLogin, validate } = require('../middleware/validation');
  
  // Create instances of demo controllers
  const demoAuthController = new DemoAuthController();
  const demoProductController = new DemoProductController();
  const demoCartController = new DemoCartController();

  // Demo Auth Routes
  const authRouter = express.Router();
  authRouter.post('/register', validateRegistration, validate, (req, res) => demoAuthController.register(req, res));
  authRouter.post('/login', validateLogin, validate, (req, res) => demoAuthController.login(req, res));
  authRouter.get('/profile', auth, (req, res) => demoAuthController.getProfile(req, res));
  authRouter.put('/profile', auth, (req, res) => demoAuthController.updateProfile(req, res));

  // Demo Product Routes
  const productRouter = express.Router();
  productRouter.get('/', (req, res) => demoProductController.getAllProducts(req, res));
  productRouter.get('/category/:category', (req, res) => demoProductController.getProductsByCategory(req, res));
  productRouter.get('/search', (req, res) => demoProductController.searchProducts(req, res));
  productRouter.get('/:id', (req, res) => demoProductController.getProductById(req, res));

  // Demo Cart Routes
  const cartRouter = express.Router();
  cartRouter.get('/', auth, (req, res) => demoCartController.getCart(req, res));
  cartRouter.post('/add', auth, (req, res) => demoCartController.addToCart(req, res));
  cartRouter.put('/update', auth, (req, res) => demoCartController.updateCartItem(req, res));
  cartRouter.delete('/remove/:productId', auth, (req, res) => demoCartController.removeFromCart(req, res));
  cartRouter.get('/count', auth, (req, res) => demoCartController.getCartCount(req, res));

  // Demo Order Routes (basic implementation)
  const orderRouter = express.Router();
  orderRouter.post('/create', auth, (req, res) => {
    const { sendSuccess } = require('../utils/helpers');
    sendSuccess(res, 'Order created successfully (Demo Mode)', {
      orderId: Date.now().toString(),
      status: 'pending',
      message: 'This is a demo order - no actual processing'
    });
  });

  // Mount routes
  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', orderRouter);

  console.log('🎭 Demo routes configured - API running in demo mode');
}

module.exports = {
  DemoAuthController: new DemoAuthController(),
  DemoProductController: new DemoProductController(),
  DemoCartController: new DemoCartController(),
  setupDemoRoutes
};
