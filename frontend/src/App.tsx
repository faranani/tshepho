import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Verification from './pages/Verification';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import SystemConfiguration from './pages/SystemConfiguration';
// import AuditLogs from './pages/AuditLogs';
// import ComplianceReports from './pages/ComplianceReports';
// import VerificationIssues from './pages/VerificationIssues';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="assets" element={<Assets />} />
                <Route path="verification" element={<Verification />} />
                <Route path="reports" element={<Reports />} />
                <Route path="admin/users" element={
                  <AdminRoute requiredRole="admin">
                    <UserManagement />
                  </AdminRoute>
                } />
                <Route path="admin/system" element={
                  <AdminRoute requiredRole="admin">
                    <SystemConfiguration />
                  </AdminRoute>
                } />
                {/* Temporarily disabled auditor routes for compilation
              <Route path="auditor/logs" element={
                  <AdminRoute requiredRole={["auditor", "admin"]}>
                    <AuditLogs />
                  </AdminRoute>
                } />
                <Route path="auditor/reports" element={
                  <AdminRoute requiredRole={["auditor", "admin"]}>
                    <ComplianceReports />
                  </AdminRoute>
                } />
                <Route path="auditor/issues" element={
                  <AdminRoute requiredRole={["auditor", "admin"]}>
                    <VerificationIssues />
                  </AdminRoute>
                } />
              */}
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
