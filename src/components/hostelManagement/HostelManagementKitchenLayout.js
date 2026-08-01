import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HostelManagementProvider } from '../../context/hostelManagement/HostelManagementContext';
import PrivateRoute from '../../pages/PrivateRoute';
import HostelManagementKitchenFoodPage, {
  KitchenNavbar,
} from '../../pages/hostelManagement/HostelManagementKitchenFoodPage';
import HostelManagementSpecialOrdersPage from '../../pages/hostelManagement/HostelManagementSpecialOrdersPage';
import { useHmPermission } from './useHmPermission';
import { HM_NAV_ANY } from '../../utils/hmPermissionCatalog';
import {
  HM_KITCHENSTAFF_BASE_PATH,
  HmBasePathProvider,
} from './hostelManagementMenuItems';

const KitchenRoutes = () => {
  const { canAny, roleCode } = useHmPermission();
  const isKitchenStaff = String(roleCode || '').toUpperCase() === 'KITCHEN_STAFF';
  const canFood = isKitchenStaff || canAny(HM_NAV_ANY.foodReport);
  const canOrders = isKitchenStaff || canAny(HM_NAV_ANY.specialOrders);
  const base = HM_KITCHENSTAFF_BASE_PATH;

  if (!canFood && !canOrders) {
    return <Redirect to="/app-selection" />;
  }

  const defaultPath = canFood
    ? `${base}/food-report`
    : `${base}/special-orders`;

  return (
    <Switch>
      <PrivateRoute
        exact
        path={base}
        component={canFood ? HostelManagementKitchenFoodPage : HostelManagementSpecialOrdersPage}
      />
      {canFood && (
        <PrivateRoute
          exact
          path={`${base}/food-report`}
          component={HostelManagementKitchenFoodPage}
        />
      )}
      {canOrders && (
        <PrivateRoute
          exact
          path={`${base}/special-orders`}
          component={HostelManagementSpecialOrdersPage}
        />
      )}
      <Route path={base}>
        <Redirect to={defaultPath} />
      </Route>
    </Switch>
  );
};

const HostelManagementKitchenLayout = () => (
  <HostelManagementProvider>
    <HmBasePathProvider basePath={HM_KITCHENSTAFF_BASE_PATH}>
      <div className="min-h-screen bg-gray-50">
        <KitchenNavbar />
        <div className="min-h-[calc(100vh-104px)]">
          <KitchenRoutes />
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </HmBasePathProvider>
  </HostelManagementProvider>
);

export default HostelManagementKitchenLayout;
