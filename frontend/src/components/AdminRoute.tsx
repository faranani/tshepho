import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Alert } from '@mui/material';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'asset_manager' | 'auditor' | string[];
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, requiredRole = 'admin' }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity="error">
          User information not available. Please log in again.
        </Alert>
      </Box>
    );
  }

  // Check if user has required role
  const hasRequiredRole = () => {
    // If requiredRole is an array, check if user role is in the array
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }

    // Legacy single role checking
    if (requiredRole === 'admin') {
      return user.role === 'admin';
    }
    if (requiredRole === 'asset_manager') {
      return user.role === 'admin' || user.role === 'asset_manager';
    }
    if (requiredRole === 'auditor') {
      return user.role === 'admin' || user.role === 'auditor';
    }
    return false;
  };

  if (!hasRequiredRole()) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1">
            You don't have permission to access this page. Required role(s): {
              Array.isArray(requiredRole)
                ? requiredRole.map(role => role.replace('_', ' ').toUpperCase()).join(' or ')
                : requiredRole.replace('_', ' ').toUpperCase()
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your current role: {user.role.replace('_', ' ').toUpperCase()}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
