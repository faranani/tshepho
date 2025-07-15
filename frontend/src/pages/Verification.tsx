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
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Error,
  Visibility,
  Edit,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { VerificationStats } from '../types';

const Verification: React.FC = () => {
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, assetsData] = await Promise.all([
          apiService.getVerificationStats(),
          apiService.getAssets()
        ]);
        setStats(statsData);
        setAssets(assetsData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load verification data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = assets.filter(asset =>
      (asset.asset_tag || asset.asset_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.name || asset.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.barcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.current_location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.custodian || asset.assigned_to || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleBarcodeSearch = () => {
    if (!barcodeInput.trim()) {
      alert('Please enter a barcode');
      return;
    }

    const asset = assets.find(asset =>
      (asset.barcode || '').toLowerCase() === barcodeInput.toLowerCase()
    );

    if (asset) {
      setSearchResults([asset]);
      setSearchTerm(barcodeInput);
    } else {
      alert('Asset with this barcode not found');
      setSearchResults([]);
    }
  };

  const handleVerifyAsset = async (assetId: string) => {
    try {
      await apiService.verifyAsset(assetId, {
        status: 'verified',
        verification_date: new Date().toISOString(),
        notes: 'Manual verification'
      });
      alert('Asset verified successfully!');

      // Refresh stats
      const statsData = await apiService.getVerificationStats();
      setStats(statsData);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify asset');
    }
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
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Asset Verification
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 3
        }}
      >
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Search sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h6">
                Search Assets
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Search for assets by asset tag, name, location, current location, barcode, or assigned person.
            </Typography>
            <TextField
              fullWidth
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </CardActions>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Edit sx={{ mr: 2, fontSize: 40, color: 'secondary.main' }} />
              <Typography variant="h6">
                Manual Barcode Entry
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Enter asset barcode manually to find and verify assets.
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter barcode..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
            />
          </CardContent>
          <CardActions>
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={handleBarcodeSearch}
            >
              Find Asset
            </Button>
          </CardActions>
        </Card>
      </Box>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              Search Results ({searchResults.length} found)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset Tag</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Current Location</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Barcode</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((asset) => (
                    <TableRow key={asset._id}>
                      <TableCell>{asset.asset_tag || asset.asset_id}</TableCell>
                      <TableCell>{asset.name || asset.description}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>{asset.current_location || asset.location || 'N/A'}</TableCell>
                      <TableCell>{asset.assigned_to || asset.custodian || 'Unassigned'}</TableCell>
                      <TableCell>{asset.barcode || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={asset.status || 'Unknown'}
                          color={asset.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleVerifyAsset(asset.asset_tag || asset.asset_id)}
                          title="Verify Asset"
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
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
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Verification Status
        </Typography>
        {stats ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 2
            }}
          >
            <Box display="flex" alignItems="center">
              <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
              <Box>
                <Typography variant="h6">{stats.total_verified.toLocaleString()}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Verified
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Error sx={{ color: 'warning.main', mr: 1 }} />
              <Box>
                <Typography variant="h6">{stats.pending_verification.toLocaleString()}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Error sx={{ color: 'error.main', mr: 1 }} />
              <Box>
                <Typography variant="h6">{stats.verification_exceptions.toLocaleString()}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Exceptions
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center">
              <CheckCircle sx={{ color: 'info.main', mr: 1 }} />
              <Box>
                <Typography variant="h6">{stats.verification_progress.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No verification data available.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Verification;
