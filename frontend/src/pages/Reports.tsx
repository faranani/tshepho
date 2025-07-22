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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,

  Divider,
} from '@mui/material';
import {
  Assessment,
  GetApp,
  Visibility,
  Close,
  Add,
  PictureAsPdf,
  TableChart,
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
  const [customReportDialogOpen, setCustomReportDialogOpen] = useState(false);
  const [customReportConfig, setCustomReportConfig] = useState({
    name: '',
    filters: {
      location: '',
      custodian: '',
      status: '',
      category: '',
      date_range: { start: '', end: '' }
    },
    format: 'pdf'
  });

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

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadReport = async (reportType: string, format: 'pdf' | 'csv' = 'pdf') => {
    try {
      setGenerating(reportType);
      let blob: Blob;
      let filename: string;

      switch (reportType) {
        case 'asset-register':
          if (format === 'csv') {
            blob = await apiService.downloadAssetRegisterCSV();
            filename = 'asset_register.csv';
          } else {
            blob = await apiService.downloadAssetRegisterPDF();
            filename = 'asset_register.pdf';
          }
          break;
        case 'exceptions':
          if (format === 'csv') {
            blob = await apiService.downloadExceptionReportCSV();
            filename = 'exception_report.csv';
          } else {
            blob = await apiService.downloadExceptionReportPDF();
            filename = 'exception_report.pdf';
          }
          break;
        case 'depreciation-summary':
          if (format === 'csv') {
            blob = await apiService.downloadDepreciationSummaryCSV();
            filename = 'depreciation_summary.csv';
          } else {
            blob = await apiService.downloadDepreciationSummaryPDF();
            filename = 'depreciation_summary.pdf';
          }
          break;
        case 'verification-results':
          if (format === 'csv') {
            blob = await apiService.downloadVerificationResultsCSV();
            filename = 'verification_results.csv';
          } else {
            blob = await apiService.downloadVerificationResultsPDF();
            filename = 'verification_results.pdf';
          }
          break;
        default:
          throw new Error('Unknown report type');
      }

      downloadBlob(blob, filename);
      setSnackbarMessage(`${format.toUpperCase()} report ${reportType} downloaded successfully!`);
      setSnackbarOpen(true);
    } catch (err: any) {
      setSnackbarMessage(err.response?.data?.message || 'Failed to download report');
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
          data = await apiService.viewAssetRegister();
          break;
        case 'exceptions':
          data = await apiService.viewExceptionReport();
          break;
        case 'depreciation-summary':
          data = await apiService.viewDepreciationSummary();
          break;
        case 'verification-results':
          data = await apiService.viewVerificationResults();
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

  const handleCreateCustomReport = async () => {
    try {
      setGenerating('custom');

      if (customReportConfig.format === 'pdf') {
        const blob = await apiService.createCustomReport(customReportConfig);
        const filename = `${customReportConfig.name.toLowerCase().replace(/\s+/g, '_')}.pdf`;
        downloadBlob(blob, filename);
        setSnackbarMessage('Custom report downloaded successfully!');
      } else {
        const data = await apiService.createCustomReport(customReportConfig);
        setReportData(data);
        setSelectedReport({ name: customReportConfig.name, type: 'custom' });
        setViewDialogOpen(true);
        setSnackbarMessage('Custom report generated successfully!');
      }

      setSnackbarOpen(true);
      setCustomReportDialogOpen(false);
    } catch (err: any) {
      setSnackbarMessage(err.response?.data?.message || 'Failed to create custom report');
      setSnackbarOpen(true);
    } finally {
      setGenerating(null);
    }
  };

  const handleCustomReportConfigChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCustomReportConfig(prev => {
        const parentObj = prev[parent as keyof typeof prev];
        return {
          ...prev,
          [parent]: {
            ...(typeof parentObj === 'object' && parentObj !== null ? parentObj : {}),
            [child]: value
          }
        };
      });
    } else {
      setCustomReportConfig(prev => ({
        ...prev,
        [field]: value
      }));
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
                startIcon={<PictureAsPdf />}
                onClick={() => handleDownloadReport(report.type, 'pdf')}
                disabled={generating === report.type}
                sx={{ mr: 1 }}
              >
                {generating === report.type ? 'Downloading...' : 'Download PDF'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<TableChart />}
                onClick={() => handleDownloadReport(report.type, 'csv')}
                disabled={generating === report.type}
                color="success"
              >
                {generating === report.type ? 'Downloading...' : 'Download CSV'}
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
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCustomReportDialogOpen(true)}
          disabled={generating === 'custom'}
        >
          {generating === 'custom' ? 'Creating...' : 'Create Custom Report'}
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

      {/* Custom Report Dialog */}
      <Dialog
        open={customReportDialogOpen}
        onClose={() => setCustomReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Custom Report</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Report Name"
              value={customReportConfig.name}
              onChange={(e) => handleCustomReportConfigChange('name', e.target.value)}
              sx={{ mb: 3 }}
            />

            <Typography variant="h6" gutterBottom>Filters</Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Location"
                value={customReportConfig.filters.location}
                onChange={(e) => handleCustomReportConfigChange('filters.location', e.target.value)}
              />

              <TextField
                fullWidth
                label="Custodian"
                value={customReportConfig.filters.custodian}
                onChange={(e) => handleCustomReportConfigChange('filters.custodian', e.target.value)}
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={customReportConfig.filters.status}
                  onChange={(e) => handleCustomReportConfigChange('filters.status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="disposed">Disposed</MenuItem>
                  <MenuItem value="under_verification">Under Verification</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Category"
                value={customReportConfig.filters.category}
                onChange={(e) => handleCustomReportConfigChange('filters.category', e.target.value)}
              />

              <TextField
                fullWidth
                label="Date From"
                type="date"
                value={customReportConfig.filters.date_range.start}
                onChange={(e) => handleCustomReportConfigChange('filters.date_range.start', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="Date To"
                type="date"
                value={customReportConfig.filters.date_range.end}
                onChange={(e) => handleCustomReportConfigChange('filters.date_range.end', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Output Format</InputLabel>
              <Select
                value={customReportConfig.format}
                onChange={(e) => handleCustomReportConfigChange('format', e.target.value)}
                label="Output Format"
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="json">JSON (Preview)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomReportDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCustomReport}
            variant="contained"
            disabled={!customReportConfig.name || generating === 'custom'}
          >
            {generating === 'custom' ? 'Creating...' : 'Create Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
