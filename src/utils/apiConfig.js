// apiConfig.js
const isProduction = process.env.REACT_APP_DEPLOY_ENV === "production";

console.log("=================================", process.env.REACT_APP_DEPLOY_ENV);

export const API_BASE_URL = isProduction
  ? 'https://treasure-mani.onrender.com/api/v1'
  : 'https://treasure-services-mani.onrender.com/api/v1';


export const WEBSOCKET_URL = isProduction
  ? 'wss://treasure-mani.onrender.com'
  : 'wss://treasure-services-mani.onrender.com';




//Test

// export const API_BASE_URL = 'https://treasure-mani.onrender.com/api/v1';
// export const WEBSOCKET_URL = 'wss://treasure-mani.onrender.com';


//Prod
// export const API_BASE_URL = 'https://mytreasure.in/api/v1';
// export const WEBSOCKET_URL = 'wss://mytreasure.in';

// if (process.env.DEPLOY_ENV === "production") {

//     export const API_BASE_URL = 'https://mytreasure.in/api/v1';
// export const WEBSOCKET_URL = 'wss://mytreasure.in';

// }

