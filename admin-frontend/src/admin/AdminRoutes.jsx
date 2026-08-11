import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Billing from "./pages/Billing";
import NewBilling from "./pages/NewBilling";
import Inventory from "../components/inventory/Inventory";

import PrivateRoute from "../components/routes/PrivateRoutes";
import AuthoRisedLayout from "../components/layouts/AuthoRisedLayout";
import NotFound from "../pages/NotFound";
import Departments from "./pages/Departments";
import UserManagement from "./pages/UserManagement";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import WhatsAppMessaging from "./pages/WhatsAppMessaging";
import RepairHistory from "./pages/RepairHistory";
import TodaysSales from "./pages/TodaysSales";
import DiagnosisHistory from "./pages/DiagnosisHistory";
import TechnicianWorkHistory from "./pages/TechnicianWorkHistory";
import PartUsedHistory from "./pages/PartUsedHistory";
import GSTR1Report from "./pages/GSTR1Report";
import ServiceOrdersList from "./pages/ServiceOrdersList";

const AdminRoutes = () => {
  return (
    <Routes>

      {/* New Modern Admin Dashboard */}
      <Route
        exact
        path="/dashboard"
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/users"
        element={
          <PrivateRoute>
            <UserManagement />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/billing"
        element={
          <PrivateRoute>
            <Billing />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/service-orders"
        element={
          <PrivateRoute>
            <ServiceOrdersList />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/inventory"
        element={
          <PrivateRoute>
            <Inventory />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/billing/new"
        element={
          <PrivateRoute>
            <NewBilling />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/departments"
        element={
          <PrivateRoute>
            <Departments />
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
        path="/messages"
        element={
          <PrivateRoute>
            <Messages />
          </PrivateRoute>
        }
      />

      <Route
        exact
        path="/whatsapp-settings"
        element={
          <PrivateRoute>
            <WhatsAppMessaging />
          </PrivateRoute>
        }
      />

      <Route
        exact
        path="/repair_history"
        element={
          <PrivateRoute>
            <RepairHistory />
          </PrivateRoute>
        }
      />

      <Route
        exact
        path="/todays-sales"
        element={
          <PrivateRoute>
            <TodaysSales />
          </PrivateRoute>
        }
      />

      <Route
        exact
        path="/diagnosis-history"
        element={
          <PrivateRoute>
            <DiagnosisHistory />
          </PrivateRoute>
        }
      />

      <Route
        exact
        path="/technician-work-history"
        element={
          <PrivateRoute>
            <TechnicianWorkHistory />
          </PrivateRoute>
        }
      />

      <Route
        exact
        path="/parts-used-history"
        element={
          <PrivateRoute>
            <PartUsedHistory />
          </PrivateRoute>
        }
      />

        <Route
          exact
          path="/gstr1-report"
          element={
            <PrivateRoute>
              <GSTR1Report />
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

export default AdminRoutes;
