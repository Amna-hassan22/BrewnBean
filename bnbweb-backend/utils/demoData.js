// Demo data store for testing without MongoDB
class DemoDataStore {
  constructor() {
    this.users = [
      {
        _id: '1',
        name: 'Admin User',
        email: 'admin@brewbean.com',
        password: '$2a$10$demo.hashed.password', // hashed 'admin123'
        role: 'admin',
        phone: '+919876543210',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: '2',
        name: 'John Doe',
        email: 'customer@example.com',
        password: '$2a$10$demo.hashed.password', // hashed 'customer123'
        role: 'customer',
        phone: '+919876543211',
        isActive: true,
        createdAt: new Date()
      }
    ];

    this.products = [
      {
        _id: '1',
        name: 'Classic Espresso',
        description: 'Rich, bold espresso with a perfect crema. Single-origin beans roasted to perfection.',
        price: 120,
        category: 'coffee',
        images: [{ url: '/images/espresso.jpg', alt: 'Classic Espresso', isPrimary: true }],
        stock: 100,
        rating: { average: 4.8, count: 45 },
        tags: ['espresso', 'strong', 'single-origin'],
        isFeatured: true,
        isPopular: true,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: '2',
        name: 'Cappuccino Supreme',
        description: 'Perfect balance of espresso, steamed milk, and foam. A timeless Italian classic.',
        price: 180,
        category: 'coffee',
        images: [{ url: '/images/cappuccino.jpg', alt: 'Cappuccino Supreme', isPrimary: true }],
        stock: 85,
        rating: { average: 4.7, count: 38 },
        tags: ['cappuccino', 'milk', 'foam'],
        isPopular: true,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: '3',
        name: 'Americano Gold',
        description: 'Smooth and rich Americano made with premium gold-grade coffee beans.',
        price: 150,
        category: 'coffee',
        images: [{ url: '/images/americano.jpg', alt: 'Americano Gold', isPrimary: true }],
        stock: 75,
        rating: { average: 4.5, count: 28 },
        tags: ['americano', 'smooth', 'premium'],
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: '4',
        name: 'Iced Frappuccino',
        description: 'Refreshing blend of coffee, ice, and whipped cream. Perfect for hot summer days.',
        price: 220,
        category: 'coffee',
        images: [{ url: '/images/frappuccino.jpg', alt: 'Iced Frappuccino', isPrimary: true }],
        stock: 60,
        rating: { average: 4.9, count: 52 },
        tags: ['iced', 'frappuccino', 'summer'],
        isFeatured: true,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: '5',
        name: 'Masala Chai',
        description: 'Traditional Indian spiced tea with cardamom, cinnamon, and ginger.',
        price: 120,
        category: 'tea',
        images: [{ url: '/images/masala-chai.jpg', alt: 'Masala Chai', isPrimary: true }],
        stock: 120,
        rating: { average: 4.9, count: 67 },
        tags: ['masala', 'spiced', 'traditional'],
        isFeatured: true,
        isPopular: true,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: '6',
        name: 'Dark Chocolate',
        description: 'Made with dark flavour essence.',
        price: 1200,
        category: 'chocolate',
        images: [{ url: '/images/dark-chocolate.jpg', alt: 'Dark Chocolate', isPrimary: true }],
        stock: 45,
        rating: { average: 3.7, count: 18 },
        tags: ['dark', 'bitter', 'premium'],
        isActive: true,
        createdAt: new Date()
      }
    ];

    this.categories = [
      {
        _id: '1',
        name: 'Coffee',
        slug: 'coffee',
        description: 'Premium coffee collection from around the world',
        isActive: true,
        productCount: 4,
        sortOrder: 1
      },
      {
        _id: '2',
        name: 'Tea',
        slug: 'tea',
        description: 'Traditional and exotic tea varieties',
        isActive: true,
        productCount: 1,
        sortOrder: 2
      },
      {
        _id: '3',
        name: 'Chocolate',
        slug: 'chocolate',
        description: 'Rich chocolates and sweet treats',
        isActive: true,
        productCount: 1,
        sortOrder: 3
      }
    ];

    this.carts = [];
    this.orders = [];
  }

  // Simulate MongoDB-like find operations
  findUser(query) {
    if (query._id) {
      return this.users.find(user => user._id === query._id);
    }
    if (query.email) {
      return this.users.find(user => user.email === query.email);
    }
    return null;
  }

  findProducts(query = {}) {
    let products = [...this.products];
    
    if (query.category) {
      products = products.filter(p => p.category === query.category);
    }
    
    if (query.isActive !== undefined) {
      products = products.filter(p => p.isActive === query.isActive);
    }
    
    if (query.isFeatured !== undefined) {
      products = products.filter(p => p.isFeatured === query.isFeatured);
    }
    
    if (query.isPopular !== undefined) {
      products = products.filter(p => p.isPopular === query.isPopular);
    }
    
    return products;
  }

  findProduct(id) {
    return this.products.find(p => p._id === id);
  }

  findCart(userId) {
    return this.carts.find(c => c.user === userId) || {
      user: userId,
      items: [],
      totalItems: 0,
      totalAmount: 0
    };
  }

  updateCart(userId, cartData) {
    const existingIndex = this.carts.findIndex(c => c.user === userId);
    const cart = {
      user: userId,
      ...cartData,
      updatedAt: new Date()
    };
    
    if (existingIndex >= 0) {
      this.carts[existingIndex] = cart;
    } else {
      this.carts.push(cart);
    }
    
    return cart;
  }

  createOrder(orderData) {
    const order = {
      _id: Date.now().toString(),
      orderNumber: `ORD${Date.now()}`,
      ...orderData,
      createdAt: new Date()
    };
    
    this.orders.push(order);
    return order;
  }

  findOrders(userId) {
    return this.orders.filter(o => o.user === userId);
  }
}

module.exports = new DemoDataStore();
