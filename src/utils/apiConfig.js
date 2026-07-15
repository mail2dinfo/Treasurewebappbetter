// apiConfig.js
const deployEnv = (process.env.REACT_APP_DEPLOY_ENV || '').toLowerCase();
const isProduction = deployEnv === 'production';

const configuredApiBaseUrl = process.env.REACT_APP_API_BASE_URL;

export const API_BASE_URL = configuredApiBaseUrl
  || (isProduction
    ? 'https://treasure-mani.onrender.com/api/v1'
    : 'https://treasure-services-mani.onrender.com/api/v1');

export const WEBSOCKET_URL = isProduction
  ? 'wss://treasure-mani.onrender.com'
  : 'wss://treasure-services-mani.onrender.com';

export const IS_PRODUCTION_DEPLOY = isProduction;

export const MANUAL_CRON_ENABLED = process.env.REACT_APP_ENABLE_MANUAL_CRON === 'true';

console.log('=================================', process.env.REACT_APP_DEPLOY_ENV);
console.log('API_BASE_URL =>', API_BASE_URL);
