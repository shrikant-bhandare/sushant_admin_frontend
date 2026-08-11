import React from "react";
import { Route, Routes } from "react-router-dom";

// import Appointments from "./pages/Appointments";
// import NewAppointment from "./pages/NewAppointment";

import PrivateRoute from "../components/routes/PrivateRoutes";
import AuthoRisedLayout from "../components/layouts/AuthoRisedLayout";

import ReceptionistDashboard from "./ReceptionDashBoard";
import NotFound from "../pages/NotFound";
import SalesOrders from "./SalesOrders";
import NewSaleOrder from "./NewSaleOrder";
import InvoiceView from "./InvoiceView";
import ServiceOrder from "./ServiceOrder";
import Departments from "../admin/pages/Departments";
import AllOrders from "./AllOrders";
import SocialMediaChats from "../socialMedia/SocialMediaChats";
import Inventory from "../components/inventory/Inventory"; // Import Inventory component
import DiagnosticsListing from "../diagnostic-technician/DiagnosticsListing";
import Notifications from "./Notifications";
import Diagnose from "../diagnostic-technician/Diagnose";

import InventoryPartsRequests from "../inventoryManager/InventoryPartsRequests";
import CustomerProfile from "../customer/CustomerProfile";
import CustomerAddress from "../customer/CustomerAddress";
import RepairOrders from "../technician/RepairOrders";
import RequestPart from "../technician/RequestPart";

import InventoryTabs from './InventoryTabs';
import TasksView from './TasksView';
import CustomerList from "../components/customer/CustomerList";
import Attendance from "../technician/Attendance"; // Import Attendance component

const ReceptionRoutes = () => {
  return (
    <Routes>
      <Route
        exact
        path="/dashboard"
        element={
          <PrivateRoute>
            <ReceptionistDashboard />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/saleorders"
        element={
          <PrivateRoute>
            <SalesOrders />
          </PrivateRoute>
        }
      />
            <Route
        exact
        path="/alldepartments"
        element={
          <PrivateRoute>
            <AllOrders />
          </PrivateRoute>
        }
      />      <Route
        exact
        path="/alldepartments/diagnostic-technician/:id"
        element={
          <PrivateRoute>
            <AllOrders />
          </PrivateRoute>
        }
      />
              <Route
        exact
        path="/alldepartments/diagnostic/:invoiceId"
        element={
          <PrivateRoute>
            <AllOrders />
          </PrivateRoute>
        }
      />
  {/* /receptionist/alldepartments/postdiagnostic/${orderId} */}
  <Route
        exact
        path="/alldepartments/postdiagnostic/:invoiceId"
        element={
          <PrivateRoute>
            <Diagnose />
          </PrivateRoute>
        }
      />

      <Route
        exact
        path="/saleorders/new"
        element={
          <PrivateRoute>
            <NewSaleOrder />
          </PrivateRoute>
        }
      />

      
<Route
        exact
        path="/requestedParts"
        element={
          <PrivateRoute>
            <InventoryPartsRequests />
          </PrivateRoute>
        }
      />
        <Route
        exact
        path="/saleorders/new/"
        element={
          <PrivateRoute>
            <NewSaleOrder />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/saleorders/invoice/diagnostic/:invoiceId"
        element={
          <PrivateRoute>
            <Diagnose />
          </PrivateRoute>
        }
      />

      <Route
        exact
        path="/saleorders/invoice/:invoiceId"
        element={
          <PrivateRoute>
            <InvoiceView />
          </PrivateRoute>
        }
      />
      <Route
        exact
        path="/saleorders/serviceorder/:invoiceId"
        element={
          <PrivateRoute>
            <ServiceOrder />
          </PrivateRoute>
        }
      />
    
      <Route
        path="/saleorders/edit/:invoiceId"
        element={
          <PrivateRoute>
            <NewSaleOrder />
          </PrivateRoute>
        }
      />

      <Route
        path="/social-media"
        element={
          <PrivateRoute>
            <SocialMediaChats />
          </PrivateRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <PrivateRoute>
            <InventoryTabs />
          </PrivateRoute>
        }
      />

      <Route
        path="/diagnostics"
        element={
          <PrivateRoute>
            <DiagnosticsListing />
          </PrivateRoute>
        }
      />
      <Route
        path="/diagnostics/:id"
        element={
          <PrivateRoute>
            <Diagnose />
          </PrivateRoute>
        }
      />
      

      <Route
        path="/inventory/parts-requests"
        element={
          <PrivateRoute>
            <InventoryPartsRequests />
          </PrivateRoute>
        }
      />
      <Route
        path="/customer-profile"
        element={
          <PrivateRoute>
            <CustomerProfile />
          </PrivateRoute>
        }
      />
      <Route
        path="/customer-address"
        element={
          <PrivateRoute>
            <CustomerAddress />
          </PrivateRoute>
        }
      />
      <Route
        path="/repair-orders"
        element={
          <PrivateRoute>
            <RepairOrders />
          </PrivateRoute>
        }
      />
      <Route
        path="/request-part"
        element={
          <PrivateRoute>
            <RequestPart />
          </PrivateRoute>
        }
      />

      <Route
        path="/tasks"
        element={
          <PrivateRoute>
            <TasksView />
          </PrivateRoute>
        }
      />

      <Route
        path="/customer-list"
        element={
          <PrivateRoute>
            <CustomerList />
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

export default ReceptionRoutes;
