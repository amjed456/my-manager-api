const axios = require('axios');

const API_URL = 'https://my-manager-api-8xme.onrender.com/api';

async function testAuth() {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get('https://my-manager-api-8xme.onrender.com/health');
    console.log('Health check:', healthResponse.data);
    
    // Test registration
    console.log('\nTesting registration...');
    const registerData = {
      username: 'testuser' + Date.now(),
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };
    
    const registerResponse = await axios.post(`${API_URL}/users/register`, registerData);
    console.log('Registration successful:', registerResponse.data);
    
    // Test login
    console.log('\nTesting login...');
    const loginData = {
      username: registerData.username,
      password: registerData.password
    };
    
    const loginResponse = await axios.post(`${API_URL}/users/login`, loginData);
    console.log('Login successful:', loginResponse.data);
    
    // Test profile with token
    console.log('\nTesting profile with token...');
    const token = loginResponse.data.token;
    const profileResponse = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Profile fetch successful:', profileResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testAuth(); 