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

const HostelManagementKitchenLayout = () => (
  <HostelManagementProvider>
    <div className="min-h-screen bg-gray-50">
      <KitchenNavbar />
      <div className="min-h-[calc(100vh-104px)]">
        <Switch>
          <PrivateRoute
            exact
            path="/hostel-management/kitchen"
            component={HostelManagementKitchenFoodPage}
          />
          <PrivateRoute
            exact
            path="/hostel-management/kitchen/food-report"
            component={HostelManagementKitchenFoodPage}
          />
          <PrivateRoute
            exact
            path="/hostel-management/kitchen/special-orders"
            component={HostelManagementKitchenOrdersPage}
          />
          <Route path="/hostel-management/kitchen">
            <Redirect to="/hostel-management/kitchen/food-report" />
          </Route>
        </Switch>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  </HostelManagementProvider>
);

export default HostelManagementKitchenLayout;
