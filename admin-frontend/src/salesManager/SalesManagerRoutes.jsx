import React from "react";
import { Route, Routes } from "react-router-dom";

import PrivateRoute from "../components/routes/PrivateRoutes";
import AuthoRisedLayout from "../components/layouts/AuthoRisedLayout";

import NotFound from "../pages/NotFound";
import SalesManagerDashboard from "./SalesManagerDashboard";
import SellDeviceManagement from "./SellDeviceManagement";
import DeviceInventoryManagement from "./DeviceInventoryManagement";
import Notifications from "./Notifications";
import SalesAnalytics from "./SalesAnalytics";
import OrderList from "./OrderList";

const SalesManagerRoutes = () => {
  return (

      <Routes>
        <Route
          exact
          path="/dashboard"
          element={
            <PrivateRoute>
              <SalesManagerDashboard />
            </PrivateRoute>
          }
        />

        <Route
          exact
          path="/sell-devices"
          element={
            <PrivateRoute>
              <SellDeviceManagement />
            </PrivateRoute>
          }
        />

        <Route
          exact
          path="/device-inventory"
          element={
            <PrivateRoute>
              <DeviceInventoryManagement />
            </PrivateRoute>
          }
        />

        <Route
          exact
          path="/orders"
          element={
            <PrivateRoute>
              <OrderList />
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

        <Route
          exact
          path="/analytics"
          element={
            <PrivateRoute>
              <SalesAnalytics />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

  );
};

export default SalesManagerRoutes;