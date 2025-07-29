import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Description,
  Download,
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

interface ComplianceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface ComplianceReport {
  id: string;
  title: string;
  type: string;
  generatedDate: string;
  status: 'completed' | 'pending' | 'failed';
  downloadUrl?: string;
}

const ComplianceReports: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedReportType, setSelectedReportType] = useState('all');

  // Mock data for compliance metrics
  const mockMetrics: ComplianceMetric[] = [
    {
      id: '1',
      name: 'Asset Verification Rate',
      value: 85,
      target: 90,
      status: 'warning',
      trend: 'up'
    },
    {
      id: '2',
      name: 'Documentation Compliance',
      value: 92,
      target: 95,
      status: 'good',
      trend: 'stable'
    },
    {
      id: '3',
      name: 'Audit Trail Completeness',
      value: 98,
      target: 100,
      status: 'good',
      trend: 'up'
    },
    {
      id: '4',
      name: 'Overdue Verifications',
      value: 12,
      target: 5,
      status: 'critical',
      trend: 'down'
    }
  ];

  // Mock data for compliance reports
  const mockReports: ComplianceReport[] = [
    {
      id: '1',
      title: 'Monthly Asset Verification Report',
      type: 'verification',
      generatedDate: '2025-01-28',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Quarterly Compliance Summary',
      type: 'compliance',
      generatedDate: '2025-01-25',
      status: 'completed'
    },
    {
      id: '3',
      title: 'Annual Audit Report',
      type: 'audit',
      generatedDate: '2025-01-20',
      status: 'pending'
    },
    {
      id: '4',
      title: 'Risk Assessment Report',
      type: 'risk',
      generatedDate: '2025-01-15',
      status: 'completed'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, these would be API calls
        setMetrics(mockMetrics);
        setReports(mockReports);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'critical':
        return <Error color="error" />;
      default:
        return <Schedule color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const generateReport = (type: string) => {
    // Mock report generation
    console.log(`Generating ${type} report...`);
    // In real implementation, this would trigger a backend API call
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description color="primary" />
          Compliance Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor compliance metrics and generate regulatory reports
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Period"
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="annual">Annual</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={selectedReportType}
              label="Report Type"
              onChange={(e) => setSelectedReportType(e.target.value)}
            >
              <MenuItem value="all">All Reports</MenuItem>
              <MenuItem value="verification">Verification</MenuItem>
              <MenuItem value="compliance">Compliance</MenuItem>
              <MenuItem value="audit">Audit</MenuItem>
              <MenuItem value="risk">Risk Assessment</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Assessment />}
            onClick={() => generateReport(selectedReportType)}
          >
            Generate Report
          </Button>
        </Box>
      </Paper>

      {/* Compliance Metrics */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Compliance Metrics
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4
        }}
      >
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {metric.name}
                </Typography>
                {getStatusIcon(metric.status)}
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {metric.value}{metric.name.includes('Rate') || metric.name.includes('Compliance') ? '%' : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Target: {metric.target}{metric.name.includes('Rate') || metric.name.includes('Compliance') ? '%' : ''}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp 
                  fontSize="small" 
                  color={metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'error' : 'disabled'} 
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  {metric.trend === 'up' ? 'Improving' : metric.trend === 'down' ? 'Declining' : 'Stable'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Reports Table */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Generated Reports
      </Typography>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Report Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Generated Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports
                .filter(report => selectedReportType === 'all' || report.type === selectedReportType)
                .map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>
                      <Chip label={report.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{new Date(report.generatedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        color={getStatusColor(report.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {report.status === 'completed' && (
                        <Button
                          size="small"
                          startIcon={<Download />}
                          onClick={() => console.log(`Downloading ${report.title}`)}
                        >
                          Download
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ComplianceReports;
