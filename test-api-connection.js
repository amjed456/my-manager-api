const axios = require('axios');

const API_URL = 'https://my-manager-api-8xme.onrender.com/api';

async function testAPIConnection() {
  try {
    console.log('Testing API connection...');
    console.log('API URL:', API_URL);
    
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get('https://my-manager-api-8xme.onrender.com/health');
    console.log('Health check successful:', healthResponse.status, healthResponse.data);
    
    // Test 2: Try to access login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      username: 'nonexistentuser',
      password: 'wrongpassword'
    });
    console.log('Login response:', loginResponse.status, loginResponse.data);
    
  } catch (error) {
    console.error('Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
  }
}

testAPIConnection(); 