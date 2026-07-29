import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HostelManagementProvider } from '../../context/hostelManagement/HostelManagementContext';
import HostelManagementResidentNavbar from './HostelManagementResidentNavbar';
import HostelManagementResidentAppMenuBar from './HostelManagementResidentAppMenuBar';
import HostelManagementResidentPortal from '../../pages/hostelManagement/HostelManagementResidentPortal';
import HostelManagementResidentOrderFoodPage from '../../pages/hostelManagement/HostelManagementResidentOrderFoodPage';
import HostelManagementResidentSpecialOrdersPage from '../../pages/hostelManagement/HostelManagementResidentSpecialOrdersPage';
import {
  HostelManagementResidentTurfsPage,
  HostelManagementResidentShuttleCourtsPage,
} from '../../pages/hostelManagement/HostelManagementResidentVenuesPage';
import PrivateRoute from '../../pages/PrivateRoute';

const HostelManagementResidentLayout = () => (
  <HostelManagementProvider>
    <div className="min-h-screen bg-gray-50">
      <HostelManagementResidentNavbar />
      <HostelManagementResidentAppMenuBar />
      <div className="min-h-[calc(100vh-112px)]">
        <Switch>
          <PrivateRoute exact path="/hostel-management/resident" component={HostelManagementResidentPortal} />
          <PrivateRoute exact path="/hostel-management/resident/dashboard" component={HostelManagementResidentPortal} />
          <PrivateRoute exact path="/hostel-management/resident/special-orders" component={HostelManagementResidentSpecialOrdersPage} />
          <PrivateRoute exact path="/hostel-management/resident/order-food" component={HostelManagementResidentOrderFoodPage} />
          <PrivateRoute exact path="/hostel-management/resident/turfs" component={HostelManagementResidentTurfsPage} />
          <PrivateRoute exact path="/hostel-management/resident/shuttle-courts" component={HostelManagementResidentShuttleCourtsPage} />
          <Redirect from="/hostel-management/resident" to="/hostel-management/resident/dashboard" />
        </Switch>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  </HostelManagementProvider>
);

export default HostelManagementResidentLayout;
