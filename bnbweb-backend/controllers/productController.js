const Product = require('../models/Product');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError, getPagination, getPaginationInfo } = require('../utils/helpers');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    search,
    minPrice,
    maxPrice,
    sort = 'createdAt',
    order = 'desc',
    featured,
    popular
  } = req.query;

  const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);
  
  // Build filter object
  const filter = { isActive: true };
  
  if (category) {
    filter.category = category;
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  
  if (featured === 'true') {
    filter.isFeatured = true;
  }
  
  if (popular === 'true') {
    filter.isPopular = true;
  }
  
  // Build sort object
  const sortObject = {};
  const sortOrder = order === 'desc' ? -1 : 1;
  
  switch (sort) {
    case 'price':
      sortObject.price = sortOrder;
      break;
    case 'rating':
      sortObject['rating.average'] = sortOrder;
      break;
    case 'name':
      sortObject.name = sortOrder;
      break;
    case 'newest':
      sortObject.createdAt = -1;
      break;
    case 'oldest':
      sortObject.createdAt = 1;
      break;
    default:
      sortObject.createdAt = sortOrder;
  }
  
  // Get total count for pagination
  const totalItems = await Product.countDocuments(filter);
  
  // Get products
  const products = await Product.find(filter)
    .sort(sortObject)
    .skip(skip)
    .limit(itemsPerPage)
    .select('-reviews');
  
  const pagination = getPaginationInfo(totalItems, currentPage, itemsPerPage);
  
  sendSuccess(res, 'Products retrieved successfully', {
    products,
    pagination
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('reviews.user', 'name');
  
  if (!product || !product.isActive) {
    return sendError(res, 'Product not found', 404);
  }
  
  sendSuccess(res, 'Product retrieved successfully', { product });
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const {
    page = 1,
    limit = 12,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;

  const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);
  
  const filter = { category, isActive: true };
  
  const sortObject = {};
  sortObject[sort] = order === 'desc' ? -1 : 1;
  
  const totalItems = await Product.countDocuments(filter);
  
  const products = await Product.find(filter)
    .sort(sortObject)
    .skip(skip)
    .limit(itemsPerPage)
    .select('-reviews');
  
  const pagination = getPaginationInfo(totalItems, currentPage, itemsPerPage);
  
  sendSuccess(res, `${category.charAt(0).toUpperCase() + category.slice(1)} products retrieved successfully`, {
    products,
    pagination
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  
  const products = await Product.find({ 
    isFeatured: true, 
    isActive: true 
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('-reviews');
  
  sendSuccess(res, 'Featured products retrieved successfully', { products });
});

// @desc    Get popular products
// @route   GET /api/products/popular
// @access  Public
const getPopularProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  
  const products = await Product.find({ 
    isPopular: true, 
    isActive: true 
  })
    .sort({ 'rating.average': -1 })
    .limit(parseInt(limit))
    .select('-reviews');
  
  sendSuccess(res, 'Popular products retrieved successfully', { products });
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
const addProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return sendError(res, 'Product not found', 404);
  }
  
  // Check if user already reviewed this product
  const existingReview = product.reviews.find(
    review => review.user.toString() === req.user.id.toString()
  );
  
  if (existingReview) {
    return sendError(res, 'You have already reviewed this product', 400);
  }
  
  // Add review
  const review = {
    user: req.user.id,
    name: req.user.name,
    rating: Number(rating),
    comment
  };
  
  product.reviews.push(review);
  
  // Update product rating
  const totalReviews = product.reviews.length;
  const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
  
  product.rating.count = totalReviews;
  product.rating.average = totalRating / totalReviews;
  
  await product.save();
  
  sendSuccess(res, 'Review added successfully', { review }, 201);
});

// @desc    Search products
// @route   GET /api/products/search/:query
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
  const { query } = req.params;
  const {
    page = 1,
    limit = 12,
    category,
    minPrice,
    maxPrice,
    sort = 'relevance'
  } = req.query;

  const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);
  
  const filter = {
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  
  let sortObject = {};
  switch (sort) {
    case 'price_low':
      sortObject.price = 1;
      break;
    case 'price_high':
      sortObject.price = -1;
      break;
    case 'rating':
      sortObject['rating.average'] = -1;
      break;
    case 'newest':
      sortObject.createdAt = -1;
      break;
    default:
      sortObject = { score: { $meta: 'textScore' } };
  }
  
  const totalItems = await Product.countDocuments(filter);
  
  let products;
  if (sort === 'relevance') {
    products = await Product.find(filter, { score: { $meta: 'textScore' } })
      .sort(sortObject)
      .skip(skip)
      .limit(itemsPerPage)
      .select('-reviews');
  } else {
    products = await Product.find(filter)
      .sort(sortObject)
      .skip(skip)
      .limit(itemsPerPage)
      .select('-reviews');
  }
  
  const pagination = getPaginationInfo(totalItems, currentPage, itemsPerPage);
  
  sendSuccess(res, `Search results for "${query}"`, {
    query,
    products,
    pagination
  });
});

module.exports = {
  getProducts,
  getProduct,
  getProductsByCategory,
  getFeaturedProducts,
  getPopularProducts,
  addProductReview,
  searchProducts
};
