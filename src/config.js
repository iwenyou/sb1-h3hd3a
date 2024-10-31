require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8000,
  AK: process.env.AK,
  SK: process.env.SK,
  BASE_URL: 'https://aip.baidubce.com',
  CHAT_ENDPOINT: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-lite-8k',
  SOURCE_PARAMS: '&sourceVer=0.0.1&source=app_center&appName=streamDemo'
};