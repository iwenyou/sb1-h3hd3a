const axios = require('axios');
const { BASE_URL, AK, SK } = require('../config');

function validateEnvironment() {
  const errors = [];
  
  if (!AK || AK === 'YOUR_ACCESS_KEY') {
    errors.push('Access Key (AK) is not configured');
  }
  if (!SK || SK === 'YOUR_SECRET_KEY') {
    errors.push('Secret Key (SK) is not configured');
  }
  if (!BASE_URL) {
    errors.push('API Base URL is not configured');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

async function getAccessToken() {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    throw new Error(`Environment configuration errors: ${validation.errors.join(', ')}`);
  }

  const options = {
    method: 'POST',
    url: `${BASE_URL}/oauth/2.0/token`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    params: {
      grant_type: 'client_credentials',
      client_id: AK,
      client_secret: SK
    }
  };

  try {
    const response = await axios(options);
    if (!response.data.access_token) {
      throw new Error('No access token in response');
    }
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { getAccessToken, validateEnvironment };