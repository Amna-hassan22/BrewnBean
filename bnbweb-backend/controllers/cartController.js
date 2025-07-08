const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/helpers');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'name price images stock isActive');
  
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }
  
  // Filter out inactive products
  cart.items = cart.items.filter(item => 
    item.product && item.product.isActive
  );
  
  // Recalculate totals after filtering
  cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
  cart.totalAmount = cart.items.reduce((total, item) => 
    total + (item.product.price * item.quantity), 0
  );
  
  await cart.save();
  
  sendSuccess(res, 'Cart retrieved successfully', { cart });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  // Check if product exists and is active
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return sendError(res, 'Product not found', 404);
  }
  
  // Check stock
  if (product.stock < quantity) {
    return sendError(res, 'Insufficient stock', 400);
  }
  
  let cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }
  
  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
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
      price: product.price
    });
  }
  
  await cart.save();
  
  // Populate cart for response
  cart = await Cart.findById(cart._id)
    .populate('items.product', 'name price images stock');
  
  sendSuccess(res, 'Item added to cart successfully', { cart });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  
  if (quantity < 1) {
    return sendError(res, 'Quantity must be at least 1', 400);
  }
  
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return sendError(res, 'Cart not found', 404);
  }
  
  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );
  
  if (itemIndex === -1) {
    return sendError(res, 'Item not found in cart', 404);
  }
  
  // Check product stock
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return sendError(res, 'Product not found', 404);
  }
  
  if (product.stock < quantity) {
    return sendError(res, 'Insufficient stock', 400);
  }
  
  cart.items[itemIndex].quantity = quantity;
  cart.items[itemIndex].price = product.price;
  
  await cart.save();
  
  // Populate cart for response
  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name price images stock');
  
  sendSuccess(res, 'Cart updated successfully', { cart: updatedCart });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return sendError(res, 'Cart not found', 404);
  }
  
  cart.items = cart.items.filter(
    item => item.product.toString() !== productId
  );
  
  await cart.save();
  
  // Populate cart for response
  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name price images stock');
  
  sendSuccess(res, 'Item removed from cart successfully', { cart: updatedCart });
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return sendError(res, 'Cart not found', 404);
  }
  
  cart.items = [];
  cart.totalItems = 0;
  cart.totalAmount = 0;
  
  await cart.save();
  
  sendSuccess(res, 'Cart cleared successfully', { cart });
});

// @desc    Get cart count
// @route   GET /api/cart/count
// @access  Private
const getCartCount = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  
  const count = cart ? cart.totalItems : 0;
  
  sendSuccess(res, 'Cart count retrieved successfully', { count });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
};
