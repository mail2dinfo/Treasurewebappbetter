import defaultLogo from '../../assets/logo.png';

/**
 * Resolve a displayable logo URL for VF company records returned by the API.
 */
export const getVfCompanyLogoUrl = (company) => {
    if (!company) return defaultLogo;

    const s3Image = company.company_logo_s3_image?.trim();
    if (s3Image && s3Image !== 'default-company_logo.jpg' && !s3Image.startsWith('default-')) {
        return s3Image;
    }

    const base64 = company.company_logo_base64format?.trim();
    if (base64?.startsWith('data:')) {
        return base64;
    }

    const logo = company.company_logo?.trim();
    if (logo?.startsWith('data:') || logo?.startsWith('http://') || logo?.startsWith('https://')) {
        return logo;
    }

    return defaultLogo;
};
