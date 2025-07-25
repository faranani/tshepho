import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Inventory,
  VerifiedUser,
  Add,
  QrCodeScanner,
  Assessment as ReportIcon,
  Warning,
  Build,
  Person,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { DashboardStats, AuditLog } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, activitiesData] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentActivities()
        ]);
        setStats(statsData);
        setRecentActivities(activitiesData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleAddNewAsset = () => {
    navigate('/assets?action=add');
  };

  const handleStartVerification = (method?: string) => {
    if (method) {
      navigate(`/verification?method=${method}`);
      setVerificationDialogOpen(false);
    } else {
      setVerificationDialogOpen(true);
    }
  };

  const handleGenerateReport = (type?: string) => {
    if (type) {
      navigate(`/reports?type=${type}`);
      setReportDialogOpen(false);
    } else {
      setReportDialogOpen(true);
    }
  };

  const handleViewVerificationStatus = () => {
    navigate('/verification-status');
  };

  const handleManageCustodians = () => {
    navigate('/assets?tab=custodians');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box p={3}>
        <Alert severity="info">No dashboard data available</Alert>
      </Box>
    );
  }

  // Asset status stat cards
  const statCards = [
    {
      title: 'Total Assets',
      value: stats.total_assets.toLocaleString(),
      icon: <Inventory />,
      color: '#1976d2',
    },
    {
      title: 'Active Assets',
      value: stats.active_assets.toLocaleString(),
      icon: <VerifiedUser />,
      color: '#2e7d32',
    },
    {
      title: 'Disposed Assets',
      value: stats.disposed_assets.toLocaleString(),
      icon: <Warning />,
      color: '#f44336',
    },
    {
      title: 'Maintenance Assets',
      value: stats.maintenance_assets.toLocaleString(),
      icon: <Build />,
      color: '#ff9800',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3
        }}
      >
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    backgroundColor: stat.color,
                    color: 'white',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2,
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="h6" component="div">
                  {stat.title}
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mt: 3
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activities
          </Typography>
          {recentActivities.length > 0 ? (
            <Box>
              {recentActivities.slice(0, 5).map((activity) => (
                <Box key={activity._id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {activity.action}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.user_name} • {new Date(activity.timestamp).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recent activities found.
            </Typography>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {(user?.role === 'asset_manager' || user?.role === 'admin') && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<Add />}
                onClick={handleAddNewAsset}
              >
                ADD NEW ASSET
              </Button>
            )}
            <Button
              variant="outlined"
              fullWidth
              startIcon={<QrCodeScanner />}
              onClick={() => handleStartVerification()}
            >
              START VERIFICATION
            </Button>
            {(user?.role === 'asset_manager' || user?.role === 'admin') && (
              <>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Warning />}
                  onClick={handleViewVerificationStatus}
                  color="warning"
                >
                  VIEW VERIFICATION STATUS
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Person />}
                  onClick={handleManageCustodians}
                >
                  MANAGE CUSTODIANS
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ReportIcon />}
              onClick={() => handleGenerateReport()}
            >
              GENERATE REPORT
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Verification Method Dialog */}
      <Dialog open={verificationDialogOpen} onClose={() => setVerificationDialogOpen(false)}>
        <DialogTitle>Choose Verification Method</DialogTitle>
        <DialogContent>
          <List>
            <ListItemButton onClick={() => handleStartVerification('barcode')}>
              <ListItemText
                primary="Barcode Scanning"
                secondary="Scan asset barcodes for quick verification"
              />
            </ListItemButton>
            <ListItemButton onClick={() => handleStartVerification('photo')}>
              <ListItemText
                primary="Photo Verification"
                secondary="Take photos to verify asset condition and location"
              />
            </ListItemButton>
            <ListItemButton onClick={() => handleStartVerification('manual')}>
              <ListItemText
                primary="Manual Verification"
                secondary="Manually check and update asset information"
              />
            </ListItemButton>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Report Type Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)}>
        <DialogTitle>Choose Report Type</DialogTitle>
        <DialogContent>
          <List>
            <ListItemButton onClick={() => handleGenerateReport('asset-summary')}>
              <ListItemText
                primary="Asset Summary Report"
                secondary="Overview of all assets with key metrics"
              />
            </ListItemButton>
            <ListItemButton onClick={() => handleGenerateReport('depreciation')}>
              <ListItemText
                primary="Depreciation Report"
                secondary="Asset depreciation analysis and current values"
              />
            </ListItemButton>
            <ListItemButton onClick={() => handleGenerateReport('verification')}>
              <ListItemText
                primary="Verification Report"
                secondary="Asset verification status and compliance"
              />
            </ListItemButton>
            <ListItemButton onClick={() => handleGenerateReport('maintenance')}>
              <ListItemText
                primary="Maintenance Report"
                secondary="Maintenance schedules and asset condition"
              />
            </ListItemButton>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
