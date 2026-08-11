import React from "react";
import { Route, Routes } from "react-router-dom";

import PrivateRoute from "../components/routes/PrivateRoutes";
import AuthoRisedLayout from "../components/layouts/AuthoRisedLayout";

import NotFound from "../pages/NotFound";
import InventoryManagerDashboard from "./InventoryManagerDashboard";
import Inventory from "../components/inventory/Inventory";
import InventoryPartsRequests from "./InventoryPartsRequests";
import Notifications from "./Notifications";

// import Orders from "./Orders";
// import OrderDetail from "./OrderDetail";

const InventoryManagerRoutes = () => {
  return (
    <Routes>
      <Route
        exact
        path="/dashboard"
        element={
          <PrivateRoute>
            <InventoryManagerDashboard />
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
        path="/PartRequests"
        element={
          <PrivateRoute>
            <InventoryPartsRequests />
          </PrivateRoute>
        }
      />

{/* <Route
        exact
        path="/profile"
        element={
          <PrivateRoute>
            <CustomerProfile />
          </PrivateRoute>
        }
      /> */}
      
      {/* <Route
        exact
        path="/address"
        element={
          <PrivateRoute>
            <CustomerAddress />
          </PrivateRoute>
        }
      /> */}
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

export default InventoryManagerRoutes;