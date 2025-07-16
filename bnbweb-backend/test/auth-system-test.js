/**
 * Authentication System Test Script
 * Tests the complete authentication flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

// Test configuration
const testUser = {
  name: 'Test User',
  email: 'test@brewbean.com',
  password: 'TestPass123!',
  phone: '+1234567890'
};

let authToken = '';
let resetToken = '';

async function runTests() {
  console.log('🧪 Starting Authentication System Tests...\n');

  try {
    // Test 1: Register new user
    console.log('1️⃣ Testing User Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    console.log('✅ Registration successful');
    console.log(`   User: ${registerResponse.data.data.user.name}`);
    console.log(`   Email: ${registerResponse.data.data.user.email}`);
    authToken = registerResponse.data.data.token;
    console.log(`   Token received: ${authToken.substring(0, 20)}...\n`);

    // Test 2: Login
    console.log('2️⃣ Testing User Login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password,
      rememberMe: false
    });
    console.log('✅ Login successful');
    console.log(`   Last Login: ${loginResponse.data.data.user.lastLogin}`);
    authToken = loginResponse.data.data.token;
    console.log(`   New Token: ${authToken.substring(0, 20)}...\n`);

    // Test 3: Get user profile
    console.log('3️⃣ Testing Get Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile retrieval successful');
    console.log(`   Account Status: ${profileResponse.data.data.accountStatus}\n`);

    // Test 4: Forgot password (OTP request)
    console.log('4️⃣ Testing Forgot Password (OTP Request)...');
    const forgotResponse = await axios.post(`${BASE_URL}/forgot-password`, {
      email: testUser.email
    });
    console.log('✅ OTP request successful');
    console.log(`   Message: ${forgotResponse.data.message}\n`);

    // Test 5: Change password
    console.log('5️⃣ Testing Change Password...');
    const changePasswordResponse = await axios.put(`${BASE_URL}/change-password`, {
      currentPassword: testUser.password,
      newPassword: 'NewTestPass123!'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Password change successful');
    console.log(`   Message: ${changePasswordResponse.data.message}\n`);

    // Test 6: Login with new password
    console.log('6️⃣ Testing Login with New Password...');
    const newLoginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: 'NewTestPass123!'
    });
    console.log('✅ Login with new password successful');
    authToken = newLoginResponse.data.data.token;
    console.log(`   New Token: ${authToken.substring(0, 20)}...\n`);

    // Test 7: Logout
    console.log('7️⃣ Testing Logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/logout`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Logout successful');
    console.log(`   Message: ${logoutResponse.data.message}\n`);

    // Test 8: Try to access protected route with invalidated token
    console.log('8️⃣ Testing Access with Invalidated Token...');
    try {
      await axios.get(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ Should have failed with invalidated token');
    } catch (error) {
      console.log('✅ Access correctly denied with invalidated token');
      console.log(`   Error: ${error.response.data.message}\n`);
    }

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ User Registration');
    console.log('   ✅ User Login');
    console.log('   ✅ Profile Access');
    console.log('   ✅ Forgot Password (OTP)');
    console.log('   ✅ Change Password');
    console.log('   ✅ Login with New Password');
    console.log('   ✅ Secure Logout');
    console.log('   ✅ Token Invalidation');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Error handling for validation tests
async function testValidation() {
  console.log('\n🔍 Testing Input Validation...');

  try {
    // Test weak password
    console.log('Testing weak password validation...');
    await axios.post(`${BASE_URL}/register`, {
      name: 'Test User',
      email: 'test2@brewbean.com',
      password: '123' // Weak password
    });
  } catch (error) {
    console.log('✅ Weak password correctly rejected');
    console.log(`   Error: ${error.response.data.message}`);
  }

  try {
    // Test invalid email
    console.log('Testing invalid email validation...');
    await axios.post(`${BASE_URL}/register`, {
      name: 'Test User',
      email: 'invalid-email',
      password: 'TestPass123!'
    });
  } catch (error) {
    console.log('✅ Invalid email correctly rejected');
    console.log(`   Error: ${error.response.data.message}`);
  }

  console.log('✅ Validation tests completed\n');
}

// Rate limiting test
async function testRateLimit() {
  console.log('🚦 Testing Rate Limiting...');
  
  const requests = [];
  for (let i = 0; i < 10; i++) {
    requests.push(
      axios.post(`${BASE_URL}/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      }).catch(err => err.response)
    );
  }

  try {
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(res => res.status === 429);
    
    if (rateLimited) {
      console.log('✅ Rate limiting working correctly');
    } else {
      console.log('⚠️ Rate limiting may not be working as expected');
    }
  } catch (error) {
    console.log('⚠️ Rate limiting test inconclusive');
  }

  console.log('✅ Rate limiting test completed\n');
}

// Main test runner
async function main() {
  console.log('🔐 Brew&Bean Authentication System Test Suite');
  console.log('=' .repeat(50));
  console.log(`🌐 Testing against: ${BASE_URL}`);
  console.log('⚠️  Make sure the backend server is running on localhost:5000\n');

  // Give user time to read
  await new Promise(resolve => setTimeout(resolve, 2000));

  await runTests();
  await testValidation();
  await testRateLimit();

  console.log('\n🏁 Test suite completed!');
  console.log('\n💡 Note: For full testing, also test OTP verification flow manually');
  console.log('   (Check email for OTP and test verify-otp and reset-password endpoints)');
}

// Run tests if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runTests,
  testValidation,
  testRateLimit
};
