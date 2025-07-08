const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError, getPagination, getPaginationInfo } = require('../utils/helpers');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    paymentDetails
  } = req.body;

  if (!items || items.length === 0) {
    return sendError(res, 'No order items provided', 400);
  }

  if (!shippingAddress) {
    return sendError(res, 'Shipping address is required', 400);
  }

  let orderItems = [];
  let subtotal = 0;

  // Validate and process each item
  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product || !product.isActive) {
      return sendError(res, `Product ${item.product} not found`, 404);
    }

    if (product.stock < item.quantity) {
      return sendError(res, `Insufficient stock for ${product.name}`, 400);
    }

    const itemSubtotal = product.price * item.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      product: item.product,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: itemSubtotal
    });

    // Update product stock
    product.stock -= item.quantity;
    await product.save();
  }

  // Calculate totals
  const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
  const shipping = subtotal >= 500 ? 0 : 50; // Free shipping above ₹500
  const totalAmount = subtotal + tax + shipping;

  // Create order
  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    subtotal,
    tax,
    shipping,
    totalAmount,
    shippingAddress,
    paymentMethod,
    paymentDetails
  });

  // Clear user's cart
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [], totalItems: 0, totalAmount: 0 }
  );

  // Populate order for response
  const populatedOrder = await Order.findById(order._id)
    .populate('items.product', 'name images')
    .populate('user', 'name email');

  sendSuccess(res, 'Order created successfully', { order: populatedOrder }, 201);
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status
  } = req.query;

  const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);
  
  const filter = { user: req.user.id };
  
  if (status) {
    filter.orderStatus = status;
  }

  const totalItems = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(itemsPerPage);

  const pagination = getPaginationInfo(totalItems, currentPage, itemsPerPage);

  sendSuccess(res, 'Orders retrieved successfully', {
    orders,
    pagination
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('items.product', 'name images')
    .populate('user', 'name email phone');

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Check if order belongs to user or user is admin
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return sendError(res, 'Not authorized to access this order', 403);
  }

  sendSuccess(res, 'Order retrieved successfully', { order });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Add to status history
  order.statusHistory.push({
    status,
    note,
    timestamp: new Date()
  });

  order.orderStatus = status;

  // Update delivery date if delivered
  if (status === 'delivered') {
    order.actualDelivery = new Date();
  }

  await order.save();

  const updatedOrder = await Order.findById(order._id)
    .populate('items.product', 'name images')
    .populate('user', 'name email');

  sendSuccess(res, 'Order status updated successfully', { order: updatedOrder });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Check if order belongs to user
  if (order.user.toString() !== req.user.id) {
    return sendError(res, 'Not authorized to cancel this order', 403);
  }

  // Check if order can be cancelled
  if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
    return sendError(res, 'Order cannot be cancelled at this stage', 400);
  }

  // Restore product stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  order.orderStatus = 'cancelled';
  order.cancellationReason = reason;
  
  order.statusHistory.push({
    status: 'cancelled',
    note: `Cancelled by customer. Reason: ${reason}`,
    timestamp: new Date()
  });

  await order.save();

  sendSuccess(res, 'Order cancelled successfully', { order });
});

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/stats
// @access  Private (Admin)
const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    {
      $match: { orderStatus: { $ne: 'cancelled' } }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }
      }
    }
  ]);

  sendSuccess(res, 'Order statistics retrieved successfully', {
    stats,
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0
  });
});

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
};
