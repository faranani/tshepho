import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,

} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Schedule,
  Error,
  Refresh,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { VerificationStatusResponse, AssetVerificationStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`verification-tabpanel-${index}`}
      aria-labelledby={`verification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const VerificationStatus: React.FC = () => {
  const { user } = useAuth();
  const [verificationData, setVerificationData] = useState<VerificationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Check if user has permission
    if (user?.role !== 'asset_manager' && user?.role !== 'admin') {
      setError('Access denied. Asset Manager or Admin role required.');
      setLoading(false);
      return;
    }

    fetchVerificationStatus();
  }, [user]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const data = await apiService.getVerificationStatus();
      setVerificationData(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'found':
        return 'success';
      case 'not_found':
        return 'error';
      case 'damaged':
        return 'warning';
      case 'exception':
        return 'error';
      case 'under_verification':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderAssetTable = (assets: AssetVerificationStatus[], title: string) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Asset ID</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Primary Custodian</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Verification</TableCell>
            <TableCell>Next Due</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assets.length > 0 ? (
            assets.map((asset) => (
              <TableRow key={asset.asset_id}>
                <TableCell>{asset.asset_id}</TableCell>
                <TableCell>{asset.description}</TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell>
                  {asset.custodians?.find(c => c.is_primary)?.full_name || asset.custodian || 'Unassigned'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={asset.status}
                    color={getStatusColor(asset.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {asset.last_verification_date 
                    ? new Date(asset.last_verification_date).toLocaleDateString()
                    : 'Never'
                  }
                </TableCell>
                <TableCell>
                  {asset.next_verification_due 
                    ? new Date(asset.next_verification_due).toLocaleDateString()
                    : 'Not set'
                  }
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary">
                  No {title.toLowerCase()} found.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchVerificationStatus} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!verificationData) {
    return (
      <Box p={3}>
        <Alert severity="info">No verification data available</Alert>
      </Box>
    );
  }

  const summaryCards = [
    {
      title: 'Total Assets',
      value: verificationData.summary.total_assets,
      icon: <CheckCircle />,
      color: '#1976d2',
    },
    {
      title: 'Overdue Verifications',
      value: verificationData.summary.overdue_verifications,
      icon: <Warning />,
      color: '#f44336',
    },
    {
      title: 'Active Verifications',
      value: verificationData.summary.active_verifications,
      icon: <Schedule />,
      color: '#ff9800',
    },
    {
      title: 'Exceptions',
      value: verificationData.summary.exceptions,
      icon: <Error />,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Verification Status
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchVerificationStatus}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 3
        }}
      >
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    backgroundColor: card.color,
                    color: 'white',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2,
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h6" component="div">
                  {card.title}
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Tabs for different verification categories */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="verification status tabs">
            <Tab label={`Overdue (${verificationData.summary.overdue_verifications})`} />
            <Tab label={`Exceptions (${verificationData.summary.exceptions})`} />
            <Tab label={`Active (${verificationData.summary.active_verifications})`} />
            <Tab label={`Upcoming (${verificationData.summary.upcoming_verifications})`} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {renderAssetTable(verificationData.overdue_verifications, 'Overdue Verifications')}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {renderAssetTable(verificationData.exceptions, 'Verification Exceptions')}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {renderAssetTable(verificationData.active_verifications, 'Active Verifications')}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          {renderAssetTable(verificationData.upcoming_verifications, 'Upcoming Verifications')}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default VerificationStatus;
