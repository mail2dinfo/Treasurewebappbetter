import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { BillingProvider } from '../../context/billing_context';
import BillingAppGuards from '../BillingAppGuards';
import PersonalFinanceNavbar from './PersonalFinanceNavbar';
import PersonalFinanceDashboardPage from '../../pages/personalFinance/PersonalFinanceDashboardPage';
import PersonalFinanceCategoriesPage from '../../pages/personalFinance/PersonalFinanceCategoriesPage';
import PersonalFinanceAccountsPage from '../../pages/personalFinance/PersonalFinanceAccountsPage';
import MyBillingPage from '../../pages/MyBillingPage';
import PrivateRoute from '../../pages/PrivateRoute';

const PersonalFinanceLayout = () => (
    <BillingProvider
        appCode="PERSONAL_FINANCE"
        billingPath="/personal-finance/user/billing"
    >
        <BillingAppGuards>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <PersonalFinanceNavbar />
                <Switch>
                    <Route path="/personal-finance/user" exact>
                        <Redirect to="/personal-finance/user/dashboard" />
                    </Route>
                    <PrivateRoute
                        exact
                        path="/personal-finance/user/dashboard"
                        component={PersonalFinanceDashboardPage}
                    />
                    <PrivateRoute
                        exact
                        path="/personal-finance/user/categories"
                        component={PersonalFinanceCategoriesPage}
                    />
                    <PrivateRoute
                        exact
                        path="/personal-finance/user/accounts"
                        component={PersonalFinanceAccountsPage}
                    />
                    <PrivateRoute
                        exact
                        path="/personal-finance/user/billing"
                        component={MyBillingPage}
                    />
                    <Route path="/personal-finance">
                        <Redirect to="/personal-finance/user/dashboard" />
                    </Route>
                </Switch>
            </div>
        </BillingAppGuards>
    </BillingProvider>
);

export default PersonalFinanceLayout;
