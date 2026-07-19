import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MdBusiness, MdLocationOn, MdVoicemail } from 'react-icons/md';
import { useHistory, useLocation } from 'react-router-dom';
import defaultLogo from '../../assets/logo.png';
import { getVehicleFinanceBasePath } from './vehicleFinanceMenuItems';
import { getVfCompanyLogoUrl } from './vfCompanyLogo';
import { useVfPermission } from './useVfPermission';

const VehicleFinanceCompanyCard = ({ company }) => {
    const history = useHistory();
    const location = useLocation();
    const { canAccess, enforceAccess } = useVfPermission();
    const canAddCompany = canAccess('vf_company_add');
    const canEditCompany = canAccess('vf_company_edit');
    const canViewCompany = canAccess('vf_company_view') || canAddCompany || canEditCompany;
    const [imageError, setImageError] = useState(false);
    const basePath = getVehicleFinanceBasePath(location.pathname);

    const logoUrl = getVfCompanyLogoUrl(company);
    const avatarUrl = !imageError ? logoUrl : defaultLogo;

    useEffect(() => {
        setImageError(false);
    }, [company?.id, company?.company_logo, company?.company_logo_s3_image, company?.company_logo_base64format]);

    const handleOpenCompany = () => history.push(`${basePath}/company`);

    if (!company) {
        if (enforceAccess && !canAddCompany) {
            return (
                <Wrapper>
                    <div className="welcome-guest">
                        <p className="guest-text">Hello, Welcome</p>
                        <p className="guest-subtext">Company profile is not set up yet.</p>
                    </div>
                </Wrapper>
            );
        }
        return (
            <Wrapper>
                <div className="welcome-guest">
                    <p className="guest-text">Hello, Welcome</p>
                    <p className="guest-subtext">Set up your vehicle finance company to get started</p>
                    {canAddCompany && (
                        <button type="button" className="start-company-button" onClick={handleOpenCompany}>
                            Setup Company
                        </button>
                    )}
                </div>
            </Wrapper>
        );
    }

    const actionLabel = canEditCompany ? 'Edit Company' : 'View Company';

    return (
        <Wrapper>
            <div className="company-info">
                <header>
                    <img
                        key={avatarUrl}
                        src={avatarUrl}
                        alt={company.company_name}
                        onError={() => setImageError(true)}
                    />
                    <div className="header-text">
                        <h4>{company.company_name}</h4>
                        <p>Vehicle Finance</p>
                    </div>
                    {canViewCompany && (
                        <button type="button" className="edit-link" onClick={handleOpenCompany}>
                            {actionLabel}
                        </button>
                    )}
                </header>
                <p className="bio">Welcome to MyTreasure Vehicle Finance</p>
                <div className="links">
                    {company.address && (
                        <p>
                            <MdLocationOn /> {company.address}
                        </p>
                    )}
                    {company.contact_no && (
                        <p>
                            <MdVoicemail /> {company.contact_no}
                        </p>
                    )}
                    {company.email && (
                        <p>
                            <MdBusiness /> {company.email}
                        </p>
                    )}
                </div>
            </div>
        </Wrapper>
    );
};

const Wrapper = styled.article`
    background: #fff;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    height: 100%;

    .welcome-guest {
        text-align: center;
        padding: 1.5rem 0.5rem;
    }

    .guest-text {
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 0.5rem;
    }

    .guest-subtext {
        color: #6b7280;
        margin: 0 0 1rem;
        font-size: 0.9rem;
    }

    .start-company-button {
        background: #dc2626;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 0.6rem 1.1rem;
        font-weight: 600;
        cursor: pointer;
    }

    .company-info header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }

    .company-info header img {
        width: 56px;
        height: 56px;
        border-radius: 10px;
        object-fit: cover;
        background: #f3f4f6;
    }

    .header-text {
        flex: 1;
        min-width: 0;
    }

    .header-text h4 {
        margin: 0;
        font-size: 1.05rem;
        color: #111827;
    }

    .header-text p {
        margin: 0.15rem 0 0;
        font-size: 0.8rem;
        color: #6b7280;
    }

    .edit-link {
        border: 1px solid #fecaca;
        background: #fef2f2;
        color: #b91c1c;
        border-radius: 8px;
        padding: 0.35rem 0.65rem;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
    }

    .bio {
        color: #4b5563;
        font-size: 0.875rem;
        margin: 0 0 0.75rem;
    }

    .links p {
        display: flex;
        align-items: flex-start;
        gap: 0.4rem;
        margin: 0.35rem 0;
        font-size: 0.85rem;
        color: #374151;
    }

    .links svg {
        flex-shrink: 0;
        margin-top: 0.15rem;
        color: #dc2626;
    }
`;

export default VehicleFinanceCompanyCard;
