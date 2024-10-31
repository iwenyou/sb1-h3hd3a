const express = require('express');
const expressWs = require('express-ws');
const path = require('path');
const { PORT, AK, SK, BASE_URL } = require('./config');
const { runPrompt } = require('./services/chat');
const { getAccessToken, validateEnvironment } = require('./services/auth');

const app = express();
expressWs(app);

app.use(express.json());
app.use(express.static('public'));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Enhanced API Status endpoint with debug info
app.get('/api/status', async (req, res) => {
  const envValidation = validateEnvironment();
  
  if (!envValidation.isValid) {
    return res.status(500).json({
      status: 'error',
      message: 'Environment configuration errors detected',
      errors: envValidation.errors,
      ak_status: Boolean(AK && AK !== 'YOUR_ACCESS_KEY'),
      sk_status: Boolean(SK && SK !== 'YOUR_SECRET_KEY'),
      endpoint_status: Boolean(BASE_URL),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      res.json({
        status: 'connected',
        message: 'Successfully connected to Qianfan API',
        ak_status: true,
        sk_status: true,
        endpoint_status: true
      });
    } else {
      throw new Error('Failed to obtain access token');
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Qianfan API',
      error: error.message,
      ak_status: Boolean(AK && AK !== 'YOUR_ACCESS_KEY'),
      sk_status: Boolean(SK && SK !== 'YOUR_SECRET_KEY'),
      endpoint_status: Boolean(BASE_URL),
      timestamp: new Date().toISOString()
    });
  }
});

// HTTP endpoint for streaming
app.post('/eb_stream', async (req, res) => {
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    return res.status(500).json({
      error: 'Configuration Error',
      message: envValidation.errors.join(', ')
    });
  }

  try {
    const { prompt } = req.body;
    console.log('Received prompt:', prompt);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    await runPrompt(prompt, res);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Server Error');
  }
});

// WebSocket endpoint for streaming
app.ws('/ws_stream', (ws, req) => {
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    ws.send(JSON.stringify({
      error: 'Configuration Error',
      message: envValidation.errors.join(', ')
    }));
    ws.close();
    return;
  }

  ws.on('message', async (message) => {
    try {
      const { prompt } = JSON.parse(message);
      console.log('Received prompt via WebSocket:', prompt);

      const wsResponse = {
        write: (data) => ws.send(data),
        end: () => ws.close()
      };

      await runPrompt(prompt, wsResponse);
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ error: 'Server Error' }));
      ws.close();
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});