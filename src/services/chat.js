const axios = require('axios');
const { BASE_URL, CHAT_ENDPOINT, SOURCE_PARAMS } = require('../config');
const { getAccessToken } = require('./auth');

async function runPrompt(prompt, res) {
  const accessToken = await getAccessToken();
  const config = {
    method: 'post',
    url: `${BASE_URL}${CHAT_ENDPOINT}?access_token=${accessToken}${SOURCE_PARAMS}`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      disable_search: false,
      enable_citation: false,
      stream: true
    }),
    responseType: 'stream'
  };

  try {
    const response = await axios.request(config);
    let buffer = '';
    let dataMsgBuffer = '';
    const decoder = new TextDecoder('utf-8');

    response.data.on('data', (chunk) => {
      buffer += decoder.decode(chunk);
      const lines = buffer.split('\n');
      buffer = lines.pop();
      
      lines.forEach(line => {
        if (line === '') {
          res.write(dataMsgBuffer);
          dataMsgBuffer = '';
          return;
        }
        
        const [type] = line.split(':', 1);
        const content = line.substring(type.length + 1);
        
        if (type === 'data') {
          dataMsgBuffer += content.trim();
        }
      });
    });

    response.data.on('end', () => {
      res.end();
    });
  } catch (error) {
    console.error('Error in runPrompt:', error);
    throw error;
  }
}

module.exports = { runPrompt };