import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  Assessment,
  GetApp,
  Visibility,
  Close,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { Report } from '../types';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await apiService.getReports();
        setReports(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleGenerateReport = async (reportType: string) => {
    try {
      setGenerating(reportType);
      await apiService.generateReport(reportType);
      setSnackbarMessage(`Report ${reportType} generated successfully!`);
      setSnackbarOpen(true);

      // Refresh reports list
      const data = await apiService.getReports();
      setReports(data);
    } catch (err: any) {
      setSnackbarMessage(err.response?.data?.message || 'Failed to generate report');
      setSnackbarOpen(true);
    } finally {
      setGenerating(null);
    }
  };

  const handleViewReport = async (report: any) => {
    try {
      setSelectedReport(report);
      setViewDialogOpen(true);

      // Fetch actual report data based on type
      let data;
      switch (report.type) {
        case 'asset-register':
          data = await fetch(`http://localhost:8000/api/reports/asset-register`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }).then(res => res.json());
          break;
        case 'exceptions':
          data = await fetch(`http://localhost:8000/api/reports/exceptions`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }).then(res => res.json());
          break;
        case 'depreciation-summary':
          data = await fetch(`http://localhost:8000/api/reports/depreciation-summary`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }).then(res => res.json());
          break;
        case 'verification-results':
          data = await fetch(`http://localhost:8000/api/reports/verification-results`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }).then(res => res.json());
          break;
        default:
          data = { message: 'Report data not available' };
      }

      setReportData(data);
    } catch (err: any) {
      setSnackbarMessage('Failed to load report data');
      setSnackbarOpen(true);
    }
  };

  const handleDownloadReport = async (report: any) => {
    try {
      // For now, download as JSON - in production this would be PDF/Excel
      const dataStr = JSON.stringify(reportData || report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.type}-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSnackbarMessage('Report downloaded successfully!');
      setSnackbarOpen(true);
    } catch (err: any) {
      setSnackbarMessage('Failed to download report');
      setSnackbarOpen(true);
    }
  };

  const renderReportData = () => {
    if (!reportData) return <CircularProgress />;

    // Handle different report types
    if (Array.isArray(reportData)) {
      // Asset register or similar list reports
      return (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Asset ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.slice(0, 50).map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{item.asset_id || item.id || 'N/A'}</TableCell>
                  <TableCell>{item.description || item.name || 'N/A'}</TableCell>
                  <TableCell>{item.location || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.status || 'Unknown'}
                      color={item.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>${(item.current_value || item.purchase_cost || 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else if (typeof reportData === 'object') {
      // Summary reports
      return (
        <Box>
          <Typography variant="h6" gutterBottom>Report Summary</Typography>
          <Paper sx={{ p: 2 }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </Paper>
        </Box>
      );
    }

    return <Typography>No data available</Typography>;
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
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Default report types if no reports exist
  const defaultReports = [
    {
      _id: 'asset-register',
      name: 'Asset Register',
      type: 'asset-register',
      description: 'Complete list of all assets with their details',
      status: 'pending' as const,
    },
    {
      _id: 'exception-report',
      name: 'Exception Report',
      type: 'exception-report',
      description: 'Assets with verification exceptions or issues',
      status: 'pending' as const,
    },
    {
      _id: 'depreciation-summary',
      name: 'Depreciation Summary',
      type: 'depreciation-summary',
      description: 'Summary of asset depreciation calculations',
      status: 'pending' as const,
    },
    {
      _id: 'verification-results',
      name: 'Verification Results',
      type: 'verification-results',
      description: 'Results from recent verification campaigns',
      status: 'pending' as const,
    },
  ];

  const displayReports = reports.length > 0 ? reports : defaultReports;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3
        }}
      >
        {displayReports.map((report) => (
          <Card key={report._id}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2,
                  }}
                >
                  <Assessment />
                </Box>
                <Typography variant="h6">
                  {report.name}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {report.description}
              </Typography>
              {report.status && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Status: {report.status}
                  </Typography>
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => handleViewReport(report)}
                sx={{ mr: 1 }}
              >
                View
              </Button>
              <Button
                variant="contained"
                startIcon={<GetApp />}
                onClick={() => handleGenerateReport(report.type)}
                disabled={generating === report.type}
                sx={{ mr: 1 }}
              >
                {generating === report.type ? 'Generating...' : 'Generate'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={() => handleDownloadReport(report)}
              >
                Download
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Custom Reports
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Create custom reports with specific filters and date ranges.
        </Typography>
        <Button variant="outlined">
          Create Custom Report
        </Button>
      </Paper>

      {/* Report View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedReport?.name || 'Report'}
            </Typography>
            <IconButton onClick={() => setViewDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minHeight: 300 }}>
            {renderReportData()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleDownloadReport(selectedReport)}
            startIcon={<GetApp />}
          >
            Download
          </Button>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setSnackbarOpen(false)}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default Reports;
