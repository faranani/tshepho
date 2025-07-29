import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  TablePagination,
} from '@mui/material';
import {
  Warning,
  Search,
  Refresh,
  Assignment,
  Error,
  Schedule,
  CheckCircle,
  Visibility,
  Edit,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { formatTimestamp } from '../utils/formatters';

interface VerificationIssue {
  id: string;
  assetId: string;
  assetName: string;
  issueType: 'missing' | 'damaged' | 'location_mismatch' | 'documentation' | 'overdue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reportedBy: string;
  reportedDate: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  dueDate?: string;
  resolution?: string;
}

const VerificationIssues: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<VerificationIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<VerificationIssue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<VerificationIssue | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock data for verification issues
  const mockIssues: VerificationIssue[] = [
    {
      id: '1',
      assetId: 'AST-001',
      assetName: 'Dell Laptop - Latitude 5520',
      issueType: 'missing',
      severity: 'high',
      description: 'Asset not found at registered location during verification',
      reportedBy: 'John Doe',
      reportedDate: '2025-01-25T10:30:00Z',
      status: 'open',
      assignedTo: 'Asset Manager',
      dueDate: '2025-02-01T00:00:00Z'
    },
    {
      id: '2',
      assetId: 'AST-045',
      assetName: 'HP Printer - LaserJet Pro',
      issueType: 'damaged',
      severity: 'medium',
      description: 'Physical damage observed on printer casing',
      reportedBy: 'Jane Smith',
      reportedDate: '2025-01-24T14:15:00Z',
      status: 'in_progress',
      assignedTo: 'Maintenance Team',
      dueDate: '2025-01-30T00:00:00Z'
    },
    {
      id: '3',
      assetId: 'AST-078',
      assetName: 'Office Chair - Ergonomic',
      issueType: 'location_mismatch',
      severity: 'low',
      description: 'Asset found in different location than recorded',
      reportedBy: 'Mike Johnson',
      reportedDate: '2025-01-23T09:45:00Z',
      status: 'resolved',
      assignedTo: 'Asset Manager',
      resolution: 'Location updated in system'
    },
    {
      id: '4',
      assetId: 'AST-112',
      assetName: 'Server - Dell PowerEdge',
      issueType: 'overdue',
      severity: 'critical',
      description: 'Asset verification overdue by 30 days',
      reportedBy: 'System',
      reportedDate: '2025-01-22T00:00:00Z',
      status: 'open',
      dueDate: '2025-01-25T00:00:00Z'
    },
    {
      id: '5',
      assetId: 'AST-089',
      assetName: 'Monitor - Samsung 27"',
      issueType: 'documentation',
      severity: 'medium',
      description: 'Missing purchase documentation',
      reportedBy: 'Sarah Wilson',
      reportedDate: '2025-01-21T16:20:00Z',
      status: 'in_progress',
      assignedTo: 'Admin',
      dueDate: '2025-01-28T00:00:00Z'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, this would be an API call
        setIssues(mockIssues);
        setFilteredIssues(mockIssues);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load verification issues');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = issues;

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (severityFilter) {
      filtered = filtered.filter(issue => issue.severity === severityFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(issue => issue.issueType === typeFilter);
    }

    setFilteredIssues(filtered);
    setPage(0);
  }, [issues, searchTerm, statusFilter, severityFilter, typeFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Error color="error" />;
      case 'in_progress':
        return <Schedule color="warning" />;
      case 'resolved':
        return <CheckCircle color="success" />;
      case 'closed':
        return <CheckCircle color="disabled" />;
      default:
        return <Schedule color="disabled" />;
    }
  };

  const handleViewIssue = (issue: VerificationIssue) => {
    setSelectedIssue(issue);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedIssue(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const refreshData = () => {
    // In real implementation, this would refetch data from API
    console.log('Refreshing verification issues...');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const paginatedIssues = filteredIssues.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="primary" />
          Verification Issues
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage asset verification issues and discrepancies
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 3
        }}
      >
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Total Issues
            </Typography>
            <Typography variant="h5">
              {issues.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Open Issues
            </Typography>
            <Typography variant="h5" color="error">
              {issues.filter(issue => issue.status === 'open').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              In Progress
            </Typography>
            <Typography variant="h5" color="warning.main">
              {issues.filter(issue => issue.status === 'in_progress').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Critical Issues
            </Typography>
            <Typography variant="h5" color="error">
              {issues.filter(issue => issue.severity === 'critical').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr auto' },
            gap: 2,
            alignItems: 'center'
          }}
        >
          <TextField
            fullWidth
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select
              value={severityFilter}
              label="Severity"
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <MenuItem value="">All Severity</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="missing">Missing</MenuItem>
              <MenuItem value="damaged">Damaged</MenuItem>
              <MenuItem value="location_mismatch">Location Mismatch</MenuItem>
              <MenuItem value="documentation">Documentation</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={refreshData} title="Refresh">
            <Refresh />
          </IconButton>
        </Box>
      </Paper>

      {/* Issues Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset ID</TableCell>
                <TableCell>Asset Name</TableCell>
                <TableCell>Issue Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reported Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedIssues.map((issue) => (
                <TableRow key={issue.id} hover>
                  <TableCell>{issue.assetId}</TableCell>
                  <TableCell>{issue.assetName}</TableCell>
                  <TableCell>
                    <Chip label={issue.issueType.replace('_', ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={issue.severity}
                      color={getSeverityColor(issue.severity) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(issue.status)}
                      <Chip
                        label={issue.status.replace('_', ' ')}
                        color={getStatusColor(issue.status) as any}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{formatTimestamp(issue.reportedDate)}</TableCell>
                  <TableCell>
                    {issue.dueDate ? formatTimestamp(issue.dueDate) : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewIssue(issue)}
                      title="View Details"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredIssues.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Issue Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment />
            Issue Details
          </Box>
          <IconButton onClick={handleCloseDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedIssue && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedIssue.assetName} ({selectedIssue.assetId})
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Issue Type
                </Typography>
                <Chip label={selectedIssue.issueType.replace('_', ' ')} variant="outlined" />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Severity
                </Typography>
                <Chip
                  label={selectedIssue.severity}
                  color={getSeverityColor(selectedIssue.severity) as any}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedIssue.description}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Reported By
                </Typography>
                <Typography variant="body1">
                  {selectedIssue.reportedBy} on {formatTimestamp(selectedIssue.reportedDate)}
                </Typography>
              </Box>
              {selectedIssue.assignedTo && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Assigned To
                  </Typography>
                  <Typography variant="body1">
                    {selectedIssue.assignedTo}
                  </Typography>
                </Box>
              )}
              {selectedIssue.dueDate && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Due Date
                  </Typography>
                  <Typography variant="body1">
                    {formatTimestamp(selectedIssue.dueDate)}
                  </Typography>
                </Box>
              )}
              {selectedIssue.resolution && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Resolution
                  </Typography>
                  <Typography variant="body1">
                    {selectedIssue.resolution}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button variant="contained" startIcon={<Edit />}>
            Edit Issue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VerificationIssues;
