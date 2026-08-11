import React from "react";
import { Route, Routes } from "react-router-dom";

import PrivateRoute from "../components/routes/PrivateRoutes";
import AuthoRisedLayout from "../components/layouts/AuthoRisedLayout";

import DiagnosticTechnicianDashboard from "./DiagnosticTechnicianDashboard";
import NotFound from "../pages/NotFound";
import DiagnosticsListing from "./DiagnosticsListing";
import Diagnose from "./Diagnose";
import Notifications from "./Notifications";
// import DiagnosticOrders from "./DiagnosticOrders";
// import NewDiagnosticOrder from "./NewDiagnosticOrder";

const DiagnosticTechnicianRoutes = () => {
  return (
    <Routes>
      <Route
        exact
        path="/dashboard"
        element={
          <PrivateRoute>
            <DiagnosticTechnicianDashboard />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/diagnostics"
        element={
          <PrivateRoute>
            <DiagnosticsListing />
          </PrivateRoute>
        }
      />
        <Route
        exact
        path="/diagnose/:invoiceId"
        element={
          <PrivateRoute>
            <Diagnose />
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
    {/*   <Route
        exact
        path="/diagnosticorders/new"
        element={
          <PrivateRoute>
            <NewDiagnosticOrder />
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

export default DiagnosticTechnicianRoutes;