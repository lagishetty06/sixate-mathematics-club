import React from 'react';

// Admin routes are publicly accessible — no login required.
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
