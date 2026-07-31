/**
 * Resolve a company logo for @react-pdf/renderer (prefers data:image base64).
 */

const isUsableLogo = (value) => {
    if (!value || typeof value !== 'string') return false;
    const v = value.trim();
    if (!v) return false;
    const lower = v.toLowerCase();
    if (lower.startsWith('default-')) return false;
    if (lower === 'default-company_logo.jpg') return false;
    return (
        lower.startsWith('data:image')
        || lower.startsWith('http://')
        || lower.startsWith('https://')
        || lower.startsWith('blob:')
    );
};

/**
 * Convert a remote image URL to a data URI for PDF embedding.
 */
export const fetchImageAsDataUrl = async (url) => {
    if (!isUsableLogo(url)) return null;
    if (String(url).toLowerCase().startsWith('data:image')) return url;

    try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob || !blob.type.startsWith('image/')) return null;

        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn('fetchImageAsDataUrl failed:', error?.message || error);
        return null;
    }
};

/**
 * Pick the best logo field from a PL / platform company object, then base64-encode if needed.
 */
export const resolveCompanyLogoForPdf = async (companyLike = {}) => {
    const c = companyLike || {};
    const candidates = [
        c.company_logo_base64format,
        c.logo_base64format,
        c.company_logo_s3_image,
        c.logo_s3_image,
        c.company_logo,
        c.logo,
    ];

    for (const candidate of candidates) {
        if (!isUsableLogo(candidate)) continue;
        if (String(candidate).toLowerCase().startsWith('data:image')) {
            return candidate;
        }
        const dataUrl = await fetchImageAsDataUrl(candidate);
        if (dataUrl) return dataUrl;
        // Last resort: return HTTPS URL (react-pdf may still load it)
        if (String(candidate).toLowerCase().startsWith('http')) {
            return candidate;
        }
    }
    return null;
};

export const pickCompanyLogoCandidate = (companyLike = {}) => {
    const c = companyLike || {};
    return (
        [
            c.company_logo_base64format,
            c.logo_base64format,
            c.company_logo_s3_image,
            c.logo_s3_image,
            c.company_logo,
            c.logo,
        ].find(isUsableLogo) || null
    );
};
