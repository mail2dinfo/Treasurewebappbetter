import React from 'react';
import VehicleFinanceAdminLayout from './VehicleFinanceAdminLayout';

// Manager shell — access is limited to User grants in People & Access Step 3 (VEHICLE_FINANCE).
const VehicleFinanceManagerLayout = () => <VehicleFinanceAdminLayout basePath="/vehicle-finance/manager" />;

export default VehicleFinanceManagerLayout;
