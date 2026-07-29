import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HostelManagementProvider } from '../../context/hostelManagement/HostelManagementContext';
import PrivateRoute from '../../pages/PrivateRoute';
import HostelManagementKitchenFoodPage, {
  KitchenNavbar,
} from '../../pages/hostelManagement/HostelManagementKitchenFoodPage';
import HostelManagementKitchenOrdersPage from '../../pages/hostelManagement/HostelManagementKitchenOrdersPage';
import { useHmPermission } from './useHmPermission';
import { HM_NAV_ANY } from '../../utils/hmPermissionCatalog';

const KitchenRoutes = () => {
  const { canAny, roleCode } = useHmPermission();
  const isKitchenStaff = String(roleCode || '').toUpperCase() === 'KITCHEN_STAFF';
  // Kitchen Staff always gets Food Report + Special Orders (role package).
  // Other roles need the matching feature grants.
  const canFood = isKitchenStaff || canAny(HM_NAV_ANY.foodReport);
  const canOrders = isKitchenStaff || canAny(HM_NAV_ANY.specialOrders);

  if (!canFood && !canOrders) {
    return <Redirect to="/app-selection" />;
  }

  const defaultPath = canFood
    ? '/hostel-management/kitchen/food-report'
    : '/hostel-management/kitchen/special-orders';

  return (
    <Switch>
      <PrivateRoute
        exact
        path="/hostel-management/kitchen"
        component={canFood ? HostelManagementKitchenFoodPage : HostelManagementKitchenOrdersPage}
      />
      {canFood && (
        <PrivateRoute
          exact
          path="/hostel-management/kitchen/food-report"
          component={HostelManagementKitchenFoodPage}
        />
      )}
      {canOrders && (
        <PrivateRoute
          exact
          path="/hostel-management/kitchen/special-orders"
          component={HostelManagementKitchenOrdersPage}
        />
      )}
      <Route path="/hostel-management/kitchen">
        <Redirect to={defaultPath} />
      </Route>
    </Switch>
  );
};

const HostelManagementKitchenLayout = () => (
  <HostelManagementProvider>
    <div className="min-h-screen bg-gray-50">
      <KitchenNavbar />
      <div className="min-h-[calc(100vh-104px)]">
        <KitchenRoutes />
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  </HostelManagementProvider>
);

export default HostelManagementKitchenLayout;
