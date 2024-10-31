const request = require('request');
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
    url: `${BASE_URL}/oauth/2.0/token?grant_type=client_credentials&client_id=${AK}&client_secret=${SK}`,
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(response.body).access_token);
      }
    });
  });
}

module.exports = { getAccessToken, validateEnvironment };