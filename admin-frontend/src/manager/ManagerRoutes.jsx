import React from "react";
import { Route, Routes } from "react-router-dom";

import PrivateRoute from "../components/routes/PrivateRoutes";
import AuthoRisedLayout from "../components/layouts/AuthoRisedLayout";

import ManagerDashboard from "./ManagerDashboard.jsx";
import NotFound from "../pages/NotFound";
import RepairOrders from "./RepairOrders.jsx";
import TicketDetails from "./TicketDetails.jsx";
import Notifications from "./Notifications.jsx";

const ManagerRoutes = () => {
  return (
    <Routes>
      <Route
        exact
        path="/dashboard"
        element={
          <PrivateRoute>
            <ManagerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/RepairOrders"
        element={
          <PrivateRoute>
            <RepairOrders />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/assign-technician/:id"
        element={
          <PrivateRoute>
            <TicketDetails />
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

export default ManagerRoutes;