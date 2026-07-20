// apiConfig.js
const deployEnv = (process.env.REACT_APP_DEPLOY_ENV || '').toLowerCase();
const isProduction = deployEnv === 'production';

const RENDER_DEV_API_BASE = 'https://treasure-services-mani.onrender.com/api/v1';
const RENDER_PROD_API_BASE = 'https://treasure-mani.onrender.com/api/v1';

const normalizeApiBaseUrl = (url) => {
    if (!url) return null;

    let normalized = url.trim().replace(/\/+$/, '');

    if (!normalized.endsWith('/api/v1')) {
        normalized = `${normalized.replace(/\/api\/v1\/?$/, '')}/api/v1`;
    }

    return normalized;
};

const configuredApiBaseUrl = process.env.REACT_APP_API_BASE_URL
    ? normalizeApiBaseUrl(process.env.REACT_APP_API_BASE_URL)
    : null;

// Explicit .env override wins; otherwise prod deploy → prod API, else Render dev API.
const defaultApiBaseUrl = isProduction ? RENDER_PROD_API_BASE : RENDER_DEV_API_BASE;

export const API_BASE_URL = configuredApiBaseUrl || defaultApiBaseUrl;

export const WEBSOCKET_URL = isProduction
    ? 'wss://treasure-mani.onrender.com'
    : 'wss://treasure-services-mani.onrender.com';

export const IS_PRODUCTION_DEPLOY = isProduction;

export const MANUAL_CRON_ENABLED = process.env.REACT_APP_ENABLE_MANUAL_CRON === 'true';

/**
 * Read and parse a fetch Response safely. Throws a clear error when the
 * server returns HTML (common when the URL points at the React app or a 502 page).
 */
export async function readApiResponse(res) {
    const contentType = res.headers.get('content-type') || '';
    const bodyText = await res.text();
    const trimmed = bodyText.trim();

    const looksLikeHtml =
        trimmed.startsWith('<!DOCTYPE') ||
        trimmed.startsWith('<html') ||
        (trimmed.startsWith('<') && !contentType.includes('json'));

    if (looksLikeHtml) {
        throw new Error(
            `API returned HTML instead of JSON (${res.status}). ` +
                `Deploy the latest backend or set REACT_APP_API_BASE_URL to ` +
                `https://treasure-services-mani.onrender.com/api/v1. ` +
                `Current base: ${API_BASE_URL}. Restart npm start after changing .env.`
        );
    }

    let data = {};
    if (trimmed) {
        try {
            data = JSON.parse(bodyText);
        } catch {
            throw new Error(`Invalid JSON from API (${res.status})`);
        }
    }

    if (!res.ok) {
        let message = data.message || `Request failed (${res.status})`;
        if (message === 'Validation errors' && data.errors) {
            message = typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors);
        }
        throw new Error(message);
    }

    return data;
}

console.log('=================================', process.env.REACT_APP_DEPLOY_ENV);
console.log('API_BASE_URL =>', API_BASE_URL);
