// PrivateRoute.js
import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { getHhStaffLoginPathFromPathname } from '../components/hospitalManagement/hospitalManagementMenuItems';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { isLoggedIn, user } = useUserContext(); // Use your user context to check if the user is logged in

  console.log('PrivateRoute - isLoggedIn:', isLoggedIn);
  console.log('PrivateRoute - user:', user);
  console.log('PrivateRoute - path:', rest.path);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (isLoggedIn) return <Component {...props} />;
        const path = String(rest.path || props.location?.pathname || '');
        const loginTo = getHhStaffLoginPathFromPathname(path);
        return <Redirect to={loginTo} />;
      }}
    />
  );
};

export default PrivateRoute;
