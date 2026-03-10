import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';


// Wrap all pages EXCEPT PROFILE in RequireAuth to force user to sign in
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Disable in testing
  if (localStorage.getItem('profile_is_signed_in') !== 'true' && (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")) {
    alert("Please sign in!");
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
