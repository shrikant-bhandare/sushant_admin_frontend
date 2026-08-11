import React from "react";
import { Navigate } from "react-router-dom";
import AuthoRisedLayout from "../layouts/AuthoRisedLayout";

const PrivateRoute = ({ children }) => {
  return localStorage.getItem("accessToken") ? (
    <AuthoRisedLayout>{children}</AuthoRisedLayout>
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoute;