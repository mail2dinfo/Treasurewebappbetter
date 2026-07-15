import { API_BASE_URL } from './apiConfig';

export async function fetchSuperAdminApi(path, token) {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (!contentType.includes('application/json')) {
        throw new Error(
            `Analytics API not available at ${url}. Deploy the latest backend or set REACT_APP_API_BASE_URL to your running API (e.g. http://localhost:6001/api/v1 or https://treasure-services-mani.onrender.com/api/v1).`
        );
    }

    let data;
    try {
        data = JSON.parse(bodyText);
    } catch {
        throw new Error('Invalid JSON response from analytics API.');
    }

    if (!response.ok || data.error || data.success === false) {
        throw new Error(data.message || 'Failed to load analytics data');
    }

    return data;
}

export async function patchSuperAdminApi(path, token, body) {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (!contentType.includes('application/json')) {
        throw new Error(
            `Analytics API not available at ${url}. Deploy the latest backend or set REACT_APP_API_BASE_URL to your running API.`
        );
    }

    let data;
    try {
        data = JSON.parse(bodyText);
    } catch {
        throw new Error('Invalid JSON response from analytics API.');
    }

    if (!response.ok || data.error || data.success === false) {
        throw new Error(data.message || 'Failed to update data');
    }

    return data;
}
