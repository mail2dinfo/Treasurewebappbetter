import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';
import { DP_BASE_PATH, DP_COLLECTOR_PATH } from '../../components/deepavaliChits/deepavaliMenuItems';
import DeepavaliUserDetails from '../../components/deepavaliChits/DeepavaliUserDetails';
import Loading from '../../components/Loading';
import '../../style/home.css';

const DeepavaliDashboardPage = () => {
    const { dashboard, company, loading, error } = useDeepavali();
    const location = useLocation();
    const collector = location.pathname.startsWith(DP_COLLECTOR_PATH);
    const basePath = collector ? DP_COLLECTOR_PATH : DP_BASE_PATH;

    if (loading && !dashboard) {
        return <Loading fullscreen />;
    }

    return (
        <div className="home-page">
            <div className="list-container">
                {error && <p className="text-sm text-red-600 px-4">{error}</p>}
                <DeepavaliUserDetails
                    company={company}
                    dashboard={dashboard}
                    basePath={basePath}
                    collector={collector}
                />
            </div>
        </div>
    );
};

export default DeepavaliDashboardPage;
