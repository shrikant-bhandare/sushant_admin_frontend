import React from "react";
import { Route, Routes } from "react-router-dom";

import PrivateRoute from "../components/routes/PrivateRoutes";
import AuthoRisedLayout from "../components/layouts/AuthoRisedLayout";

import NotFound from "../pages/NotFound";
import CustomerDashboard from "./CustomerDashboard";
import CustomerProfile from "./CustomerProfile";
import CustomerAddress from "./CustomerAddress";
import Notifications from "./Notifications";
// import Orders from "./Orders";
// import OrderDetail from "./OrderDetail";

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route
        exact
        path="/dashboard"
        element={
          <PrivateRoute>
            <CustomerDashboard />
          </PrivateRoute>
        }
      />

<Route
        exact
        path="/profile"
        element={
          <PrivateRoute>
            <CustomerProfile />
          </PrivateRoute>
        }
      />
      
      <Route
        exact
        path="/address"
        element={
          <PrivateRoute>
            <CustomerAddress />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/notifications"
        element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        }
      />
      {/* <Route
        exact
        path="/orders"
        element={
          <PrivateRoute>
            <Orders />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/orders/:id"
        element={
          <PrivateRoute>
            <OrderDetail />
          </PrivateRoute>
        }
      /> */}
      <Route
        path="*"
        element={
          <AuthoRisedLayout>
            <NotFound />
          </AuthoRisedLayout>
        }
      />
    </Routes>
  );
};

export default CustomerRoutes;