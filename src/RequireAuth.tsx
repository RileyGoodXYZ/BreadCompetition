import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';


// Wrap all pages EXCEPT PROFILE in RequireAuth to force user to sign in
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Disable in testing
  if (window.location.hostname === "2026-scouting-app-q77y.vercel.app") {
    alert("Please sign in!");
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
