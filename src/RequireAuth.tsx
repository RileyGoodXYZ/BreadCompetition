import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';


// Wrap all pages EXCEPT PROFILE in RequireAuth to force user to sign in
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isSignedIn = localStorage.getItem('profile_is_signed_in') === 'true';
  if (window.location.hostname !== 'localhost' && !isSignedIn) {
    alert("Please sign in!");
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
