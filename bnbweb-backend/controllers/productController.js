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

// @desc    Create new product (Admin only)
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    originalPrice,
    category,
    subCategory,
    images,
    stock,
    sku,
    specifications,
    tags,
    isFeatured,
    isPopular,
    discount,
    weight,
    dimensions
  } = req.body;

  // Check if SKU already exists
  if (sku) {
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return sendError(res, 'SKU already exists', 400);
    }
  }

  // Validate discount dates
  if (discount && discount.startDate && discount.endDate) {
    const startDate = new Date(discount.startDate);
    const endDate = new Date(discount.endDate);
    
    if (startDate >= endDate) {
      return sendError(res, 'Discount start date must be before end date', 400);
    }
  }

  // Create product
  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    price,
    originalPrice: originalPrice || price,
    category,
    subCategory: subCategory?.trim(),
    images,
    stock,
    sku: sku?.trim(),
    specifications,
    tags: tags?.map(tag => tag.trim()),
    isFeatured: isFeatured || false,
    isPopular: isPopular || false,
    discount,
    weight,
    dimensions
  });

  sendSuccess(res, 'Product created successfully', { product }, 201);
});

// @desc    Update product (Admin only)
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return sendError(res, 'Product not found', 404);
  }

  const {
    name,
    description,
    price,
    originalPrice,
    category,
    subCategory,
    images,
    stock,
    sku,
    specifications,
    tags,
    isFeatured,
    isPopular,
    discount,
    weight,
    dimensions,
    isActive
  } = req.body;

  // Check if SKU already exists (excluding current product)
  if (sku && sku !== product.sku) {
    const existingProduct = await Product.findOne({ sku, _id: { $ne: req.params.id } });
    if (existingProduct) {
      return sendError(res, 'SKU already exists', 400);
    }
  }

  // Update product fields
  if (name !== undefined) product.name = name.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = price;
  if (originalPrice !== undefined) product.originalPrice = originalPrice;
  if (category !== undefined) product.category = category;
  if (subCategory !== undefined) product.subCategory = subCategory?.trim();
  if (images !== undefined) product.images = images;
  if (stock !== undefined) product.stock = stock;
  if (sku !== undefined) product.sku = sku?.trim();
  if (specifications !== undefined) product.specifications = specifications;
  if (tags !== undefined) product.tags = tags?.map(tag => tag.trim());
  if (isFeatured !== undefined) product.isFeatured = isFeatured;
  if (isPopular !== undefined) product.isPopular = isPopular;
  if (discount !== undefined) product.discount = discount;
  if (weight !== undefined) product.weight = weight;
  if (dimensions !== undefined) product.dimensions = dimensions;
  if (isActive !== undefined) product.isActive = isActive;

  await product.save();

  sendSuccess(res, 'Product updated successfully', { product });
});

// @desc    Delete product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return sendError(res, 'Product not found', 404);
  }

  // Soft delete - just mark as inactive
  product.isActive = false;
  await product.save();

  sendSuccess(res, 'Product deleted successfully');
});

// @desc    Get product statistics (Admin only)
// @route   GET /api/products/admin/stats
// @access  Private (Admin)
const getProductStats = asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        averagePrice: { $avg: '$price' },
        averageRating: { $avg: '$rating.average' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const totalProducts = await Product.countDocuments({ isActive: true });
  const outOfStock = await Product.countDocuments({ stock: 0, isActive: true });
  const lowStock = await Product.countDocuments({ stock: { $lte: 10, $gt: 0 }, isActive: true });
  const featuredProducts = await Product.countDocuments({ isFeatured: true, isActive: true });
  const popularProducts = await Product.countDocuments({ isPopular: true, isActive: true });

  const topRatedProducts = await Product.find({ isActive: true })
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(5)
    .select('name rating.average rating.count price');

  const recentProducts = await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name createdAt price stock');

  sendSuccess(res, 'Product statistics retrieved successfully', {
    categoryStats: stats,
    summary: {
      totalProducts,
      outOfStock,
      lowStock,
      featuredProducts,
      popularProducts
    },
    topRated: topRatedProducts,
    recent: recentProducts
  });
});

module.exports = {
  getProducts,
  getProduct,
  getProductsByCategory,
  getFeaturedProducts,
  getPopularProducts,
  addProductReview,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
};
