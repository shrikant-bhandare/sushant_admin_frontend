import React from "react";
import { Route, Routes } from "react-router-dom";

import PrivateRoute from "../components/routes/PrivateRoutes";
import AuthoRisedLayout from "../components/layouts/AuthoRisedLayout";

import NotFound from "../pages/NotFound";
import TechnicianDashboard from "./TechnicianDashboard";
import RepairOrders from "./RepairOrders";
import RequestPart from "./RequestPart";
import Diagnosis from "./Diagnosis";
import TasksAssigned from "./TasksAssigned";
import InventoryListing from "../components/inventory/Inventory";
import Attendance from "./Attendance";
import Notifications from "./Notifications";

const TechnicianRoutes = () => {
  return (
    <Routes>
      <Route
        exact
        path="/dashboard"
        element={
          <PrivateRoute>
            <TechnicianDashboard />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/repairs"
        element={
          <PrivateRoute>
            <RepairOrders />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/request-part"
        element={
          <PrivateRoute>
            <RequestPart />
          </PrivateRoute>
        }
      />
      <Route
        path="/diagnosis"
        element={
          <PrivateRoute>
            <Diagnosis />
          </PrivateRoute>
        }
      />
      <Route
        path="/tasks-assigned"
        element={
          <PrivateRoute>
            <TasksAssigned />
          </PrivateRoute>
        }
      />
      <Route
        path="/inventory-listing"
        element={
          <PrivateRoute>
            <InventoryListing />
          </PrivateRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <PrivateRoute>
            <Attendance />
          </PrivateRoute>
        }
      />
      <Route
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

export default TechnicianRoutes;

