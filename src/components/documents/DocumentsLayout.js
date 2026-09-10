import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BillingProvider } from '../../context/billing_context';
import BillingAppGuards from '../BillingAppGuards';
import DocumentsNavbar from './DocumentsNavbar';
import DocumentsAppMenuBar from './DocumentsAppMenuBar';
import DocumentsBoxPage from '../../pages/documents/DocumentsBoxPage';
import MyBillingPage from '../../pages/MyBillingPage';
import PrivateRoute from '../../pages/PrivateRoute';

const DocumentsLayout = () => (
    <BillingProvider
        appCode="DOCUMENTS"
        billingPath="/documents-box/user/billing"
    >
        <BillingAppGuards>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <DocumentsNavbar />
                <DocumentsAppMenuBar />
                <Switch>
                    <Route path="/documents-box/user" exact>
                        <Redirect to="/documents-box/user/box" />
                    </Route>
                    <PrivateRoute
                        exact
                        path="/documents-box/user/box"
                        component={DocumentsBoxPage}
                    />
                    <PrivateRoute
                        exact
                        path="/documents-box/user/billing"
                        component={MyBillingPage}
                    />
                    <Route path="/documents-box">
                        <Redirect to="/documents-box/user/box" />
                    </Route>
                </Switch>
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </BillingAppGuards>
    </BillingProvider>
);

export default DocumentsLayout;
