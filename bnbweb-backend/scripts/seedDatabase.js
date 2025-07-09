require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brewbean', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const sampleProducts = [
  // Coffee Products
  {
    name: 'Classic Espresso',
    description: 'Rich, bold espresso with a perfect crema. Single-origin beans roasted to perfection.',
    price: 120,
    category: 'coffee',
    images: [{ url: '/images/espresso.jpg', alt: 'Classic Espresso', isPrimary: true }],
    stock: 100,
    rating: { average: 4.8, count: 45 },
    tags: ['espresso', 'strong', 'single-origin'],
    isFeatured: true,
    isPopular: true
  },
  {
    name: 'Cappuccino Supreme',
    description: 'Perfect balance of espresso, steamed milk, and foam. A timeless Italian classic.',
    price: 180,
    category: 'coffee',
    images: [{ url: '/images/cappuccino.jpg', alt: 'Cappuccino Supreme', isPrimary: true }],
    stock: 85,
    rating: { average: 4.7, count: 38 },
    tags: ['cappuccino', 'milk', 'foam'],
    isPopular: true
  },
  {
    name: 'Americano Gold',
    description: 'Smooth and rich Americano made with premium gold-grade coffee beans.',
    price: 150,
    category: 'coffee',
    images: [{ url: '/images/americano.jpg', alt: 'Americano Gold', isPrimary: true }],
    stock: 75,
    rating: { average: 4.5, count: 28 },
    tags: ['americano', 'smooth', 'premium']
  },
  {
    name: 'Iced Frappuccino',
    description: 'Refreshing blend of coffee, ice, and whipped cream. Perfect for hot summer days.',
    price: 220,
    category: 'coffee',
    images: [{ url: '/images/frappuccino.jpg', alt: 'Iced Frappuccino', isPrimary: true }],
    stock: 60,
    rating: { average: 4.9, count: 52 },
    tags: ['iced', 'frappuccino', 'summer'],
    isFeatured: true
  },
  {
    name: 'Vanilla Latte',
    description: 'Smooth espresso with steamed milk and a hint of vanilla sweetness.',
    price: 190,
    category: 'coffee',
    images: [{ url: '/images/vanilla-latte.jpg', alt: 'Vanilla Latte', isPrimary: true }],
    stock: 90,
    rating: { average: 4.6, count: 35 },
    tags: ['latte', 'vanilla', 'sweet']
  },
  {
    name: 'Mocha Delight',
    description: 'Rich espresso with chocolate and steamed milk. A perfect indulgence.',
    price: 210,
    category: 'coffee',
    images: [{ url: '/images/mocha.jpg', alt: 'Mocha Delight', isPrimary: true }],
    stock: 70,
    rating: { average: 4.8, count: 41 },
    tags: ['mocha', 'chocolate', 'indulgent']
  },
  {
    name: 'Cold Brew Special',
    description: 'Smooth, less acidic coffee brewed cold for 12+ hours. Pure coffee essence.',
    price: 160,
    category: 'coffee',
    images: [{ url: '/images/cold-brew.jpg', alt: 'Cold Brew Special', isPrimary: true }],
    stock: 55,
    rating: { average: 4.5, count: 25 },
    tags: ['cold-brew', 'smooth', 'low-acid']
  },
  {
    name: 'Caramel Macchiato',
    description: 'Espresso with vanilla syrup, steamed milk, and caramel drizzle.',
    price: 200,
    category: 'coffee',
    images: [{ url: '/images/caramel-macchiato.jpg', alt: 'Caramel Macchiato', isPrimary: true }],
    stock: 65,
    rating: { average: 4.5, count: 33 },
    tags: ['macchiato', 'caramel', 'sweet']
  },

  // Tea Products
  {
    name: 'Masala Chai',
    description: 'Traditional Indian spiced tea with cardamom, cinnamon, and ginger.',
    price: 120,
    category: 'tea',
    images: [{ url: '/images/masala-chai.jpg', alt: 'Masala Chai', isPrimary: true }],
    stock: 120,
    rating: { average: 4.9, count: 67 },
    tags: ['masala', 'spiced', 'traditional'],
    isFeatured: true,
    isPopular: true
  },
  {
    name: 'Black Tea',
    description: 'Perfect balance leaf, and foam. A timeless Italian classic.',
    price: 180,
    category: 'tea',
    images: [{ url: '/images/black-tea.webp', alt: 'Black Tea', isPrimary: true }],
    stock: 95,
    rating: { average: 4.7, count: 42 },
    tags: ['black-tea', 'classic', 'strong']
  },
  {
    name: 'Tandoori Chai',
    description: 'Clay pot brewed chai with authentic tandoori flavor.',
    price: 150,
    category: 'tea',
    images: [{ url: '/images/tandoori-chai.jpg', alt: 'Tandoori Chai', isPrimary: true }],
    stock: 80,
    rating: { average: 4.6, count: 38 },
    tags: ['tandoori', 'clay-pot', 'authentic']
  },
  {
    name: 'Oolong Tea',
    description: 'Light Tea leaf dipped in milk, Perfect for hot summer days.',
    price: 220,
    category: 'tea',
    images: [{ url: '/images/oolong-tea.jpg', alt: 'Oolong Tea', isPrimary: true }],
    stock: 70,
    rating: { average: 4.9, count: 31 },
    tags: ['oolong', 'light', 'refreshing']
  },
  {
    name: 'Sheer Chai',
    description: 'Cream steamed milk and a touch of vanilla sweetness.',
    price: 250,
    category: 'tea',
    images: [{ url: '/images/sheer-chai.webp', alt: 'Sheer Chai', isPrimary: true }],
    stock: 60,
    rating: { average: 4.6, count: 29 },
    tags: ['sheer', 'creamy', 'vanilla']
  },
  {
    name: 'Kahwa Chai',
    description: 'Kashmiri green tea with almonds, cardamom, and saffron.',
    price: 210,
    category: 'tea',
    images: [{ url: '/images/kahwa.webp', alt: 'Kahwa Chai', isPrimary: true }],
    stock: 85,
    rating: { average: 4.8, count: 45 },
    tags: ['kahwa', 'kashmiri', 'saffron'],
    isFeatured: true
  },
  {
    name: 'Filter Coffee',
    description: 'Made from filtered south Indian techniques. Pure coffee essence.',
    price: 160,
    category: 'tea',
    images: [{ url: '/images/filter-coffee.webp', alt: 'Filter Coffee', isPrimary: true }],
    stock: 75,
    rating: { average: 4.5, count: 36 },
    tags: ['filter', 'south-indian', 'traditional']
  },
  {
    name: 'Matcha Tea',
    description: 'Premium Japanese matcha powder whisked to perfection.',
    price: 280,
    category: 'tea',
    images: [{ url: '/images/matcha-tea.webp', alt: 'Matcha Tea', isPrimary: true }],
    stock: 50,
    rating: { average: 4.7, count: 27 },
    tags: ['matcha', 'japanese', 'premium']
  },
  {
    name: 'Kashmiri Chai',
    description: 'Pink tea with almonds, pistachios, and cardamom.',
    price: 250,
    category: 'tea',
    images: [{ url: '/images/kashmiri-chai.jpg', alt: 'Kashmiri Chai', isPrimary: true }],
    stock: 65,
    rating: { average: 4.8, count: 32 },
    tags: ['kashmiri', 'pink-tea', 'nuts']
  },

  // Chocolate Products
  {
    name: 'Dark Chocolate',
    description: 'Made with dark flavour essence.',
    price: 1200,
    category: 'chocolate',
    images: [{ url: '/images/dark-chocolate.jpg', alt: 'Dark Chocolate', isPrimary: true }],
    stock: 45,
    rating: { average: 3.7, count: 18 },
    tags: ['dark', 'bitter', 'premium']
  },
  {
    name: 'Milk Chocolate',
    description: 'Made with milky flavour essence.',
    price: 830,
    category: 'chocolate',
    images: [{ url: '/images/milk-chocolate.webp', alt: 'Milk Chocolate', isPrimary: true }],
    stock: 60,
    rating: { average: 4.2, count: 24 },
    tags: ['milk', 'sweet', 'creamy']
  },
  {
    name: 'Chocolate Pie',
    description: 'Rich chocolate pie with graham cracker crust.',
    price: 420,
    category: 'chocolate',
    images: [{ url: '/images/chocolate-pie.webp', alt: 'Chocolate Pie', isPrimary: true }],
    stock: 35,
    rating: { average: 4.5, count: 22 },
    tags: ['pie', 'dessert', 'rich']
  },
  {
    name: 'Walnut',
    description: 'Fresh California walnuts.',
    price: 700,
    category: 'chocolate',
    images: [{ url: '/images/walnuts.webp', alt: 'Walnut', isPrimary: true }],
    stock: 80,
    rating: { average: 4.3, count: 31 },
    tags: ['walnut', 'nuts', 'healthy']
  },
  {
    name: 'Almond',
    description: 'Fresh Californian almonds',
    price: 1180,
    category: 'chocolate',
    images: [{ url: '/images/almond.webp', alt: 'Almond', isPrimary: true }],
    stock: 70,
    rating: { average: 4.0, count: 26 },
    tags: ['almond', 'nuts', 'premium']
  },
  {
    name: 'Cashew',
    description: 'Dried spiced flakes cashew.',
    price: 1350,
    category: 'chocolate',
    images: [{ url: '/images/cashew.webp', alt: 'Cashew', isPrimary: true }],
    stock: 55,
    rating: { average: 4.4, count: 19 },
    tags: ['cashew', 'spiced', 'premium']
  },

  // Equipment Products
  {
    name: 'Tea Kettle',
    description: 'Alloy body kettle.',
    price: 1200,
    category: 'equipment',
    images: [{ url: '/images/tea-kettle.jpg', alt: 'Tea Kettle', isPrimary: true }],
    stock: 25,
    rating: { average: 3.7, count: 12 },
    tags: ['kettle', 'alloy', 'brewing']
  },
  {
    name: 'Tea Stainer',
    description: 'Alloy body stainer.',
    price: 930,
    category: 'equipment',
    images: [{ url: '/images/tea-stainer.webp', alt: 'Tea Stainer', isPrimary: true }],
    stock: 40,
    rating: { average: 4.7, count: 15 },
    tags: ['stainer', 'filter', 'alloy']
  },
  {
    name: 'Moka Pot',
    description: 'Alloy body Moka Pot.',
    price: 1550,
    category: 'equipment',
    images: [{ url: '/images/moka-pot.webp', alt: 'Moka Pot', isPrimary: true }],
    stock: 30,
    rating: { average: 4.5, count: 18 },
    tags: ['moka-pot', 'espresso', 'italian']
  },
  {
    name: 'Paragon-Pour',
    description: 'Paragon pour machine',
    price: 700,
    category: 'equipment',
    images: [{ url: '/images/paragon-pour.webp', alt: 'Paragon-Pour', isPrimary: true }],
    stock: 35,
    rating: { average: 4.9, count: 21 },
    tags: ['pour-over', 'precision', 'manual'],
    isPopular: true
  },
  {
    name: 'Filter coffee maker',
    description: 'Filter coffee with Brass body.',
    price: 3000,
    category: 'equipment',
    images: [{ url: '/images/filter-coffee-maker.webp', alt: 'Filter coffee maker', isPrimary: true }],
    stock: 20,
    rating: { average: 4.0, count: 9 },
    tags: ['filter', 'brass', 'traditional']
  },
  {
    name: 'Espresso Machine',
    description: 'Professional espresso machine for home use.',
    price: 35000,
    category: 'equipment',
    images: [{ url: '/images/espresso-machine.avif', alt: 'Espresso Machine', isPrimary: true }],
    stock: 10,
    rating: { average: 4.8, count: 7 },
    tags: ['espresso', 'machine', 'professional'],
    isFeatured: true
  },

  // Merchandise Products
  {
    name: 'Stanley Bottle',
    description: 'Stanley inspired bottle',
    price: 1200,
    category: 'merchandise',
    images: [{ url: '/images/stanley-bottle.jpeg', alt: 'Stanley Bottle', isPrimary: true }],
    stock: 50,
    rating: { average: 3.7, count: 14 },
    tags: ['bottle', 'stanley', 'travel']
  },
  {
    name: 'Coffee mug',
    description: 'Elongated mug.',
    price: 630,
    category: 'merchandise',
    images: [{ url: '/images/coffee-mug.jpeg', alt: 'Coffee mug', isPrimary: true }],
    stock: 75,
    rating: { average: 4.7, count: 28 },
    tags: ['mug', 'coffee', 'ceramic']
  },
  {
    name: 'white tshirt',
    description: 'women tshirt(XL)',
    price: 450,
    category: 'merchandise',
    images: [{ url: '/images/white-tshirt.jpeg', alt: 'white tshirt', isPrimary: true }],
    stock: 100,
    rating: { average: 4.8, count: 35 },
    tags: ['tshirt', 'women', 'xl']
  },
  {
    name: 'Cap',
    description: 'Brew&Bean knitted cap',
    price: 600,
    category: 'merchandise',
    images: [{ url: '/images/cap.jpeg', alt: 'Cap', isPrimary: true }],
    stock: 80,
    rating: { average: 4.9, count: 22 },
    tags: ['cap', 'knitted', 'brand'],
    isPopular: true
  },
  {
    name: 'Water Bottle',
    description: 'Water Bottle named Brew&bean.',
    price: 350,
    category: 'merchandise',
    images: [{ url: '/images/water-bottle.jpeg', alt: 'Water Bottle', isPrimary: true }],
    stock: 90,
    rating: { average: 4.0, count: 16 },
    tags: ['bottle', 'water', 'branded']
  },
  {
    name: 'Mid-Size Plate',
    description: 'Plates for snacks.',
    price: 430,
    category: 'merchandise',
    images: [{ url: '/images/plate.jpeg', alt: 'Mid-Size Plate', isPrimary: true }],
    stock: 60,
    rating: { average: 4.2, count: 19 },
    tags: ['plate', 'snacks', 'ceramic']
  }
];

const sampleCategories = [
  {
    name: 'Coffee',
    description: 'Premium coffee collection from around the world',
    image: { url: '/images/coffee-category.jpg', alt: 'Coffee Category' },
    sortOrder: 1
  },
  {
    name: 'Tea',
    description: 'Traditional and exotic tea varieties',
    image: { url: '/images/tea-category.jpg', alt: 'Tea Category' },
    sortOrder: 2
  },
  {
    name: 'Chocolate',
    description: 'Rich chocolates and sweet treats',
    image: { url: '/images/chocolate-category.jpg', alt: 'Chocolate Category' },
    sortOrder: 3
  },
  {
    name: 'Cookies',
    description: 'Freshly baked cookies and biscuits',
    image: { url: '/images/cookies-category.jpg', alt: 'Cookies Category' },
    sortOrder: 4
  },
  {
    name: 'Equipment',
    description: 'Coffee and tea brewing equipment',
    image: { url: '/images/equipment-category.jpg', alt: 'Equipment Category' },
    sortOrder: 5
  },
  {
    name: 'Merchandise',
    description: 'Brew&Bean branded merchandise',
    image: { url: '/images/merchandise-category.jpg', alt: 'Merchandise Category' },
    sortOrder: 6
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@brewbean.com',
      password: hashedPassword,
      phone: '+919876543210',
      role: 'admin',
      address: {
        street: '123 Coffee Street',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122001',
        country: 'India'
      }
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);
    
    // Create sample customer user
    console.log('👥 Creating sample customer...');
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customerUser = await User.create({
      name: 'John Doe',
      email: 'customer@example.com',
      password: customerPassword,
      phone: '+919876543211',
      role: 'customer',
      address: {
        street: '456 Tea Avenue',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India'
      }
    });
    console.log(`✅ Customer user created: ${customerUser.email}`);
    
    // Create categories
    console.log('📂 Creating categories...');
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`✅ Created ${createdCategories.length} categories`);
    
    // Create products
    console.log('📦 Creating products...');
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${createdProducts.length} products`);
    
    // Update category product counts
    console.log('🔢 Updating category product counts...');
    for (const category of createdCategories) {
      const productCount = await Product.countDocuments({ 
        category: category.name.toLowerCase(),
        isActive: true 
      });
      category.productCount = productCount;
      await category.save();
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Categories: ${await Category.countDocuments()}`);
    console.log(`   Products: ${await Product.countDocuments()}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Admin: admin@brewbean.com / admin123`);
    console.log(`   Customer: customer@example.com / customer123`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
