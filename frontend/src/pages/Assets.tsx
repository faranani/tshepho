import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  QrCodeScanner,
  Search,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { Asset } from '../types';

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [newAsset, setNewAsset] = useState({
    asset_tag: '',
    name: '',
    description: '',
    category: '',
    location: '',
    assigned_to: '',
    purchase_cost: '',
    useful_life_years: '5',
    status: 'active'
  });

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        console.log('Fetching assets...');
        const data = await apiService.getAssets();
        console.log('Assets received:', data);
        setAssets(data);
        setError(null); // Clear any previous errors
      } catch (err: any) {
        console.error('Error fetching assets:', err);
        let errorMessage = 'Failed to load assets';

        if (err.response?.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const handleAddAsset = async () => {
    try {
      // Validate required fields
      if (!newAsset.asset_tag || !newAsset.name || !newAsset.location || !newAsset.assigned_to) {
        setError('Please fill in all required fields (Asset Tag, Name, Location, Assigned To)');
        return;
      }

      const assetData = {
        asset_id: newAsset.asset_tag,
        description: newAsset.description || newAsset.name,
        location: newAsset.location,
        custodian: newAsset.assigned_to,
        barcode: editingAsset ? editingAsset.barcode : `BC${Date.now()}`,
        purchase_date: editingAsset ? editingAsset.purchase_date : new Date().toISOString(),
        depreciation_class: 'equipment',
        purchase_cost: parseFloat(newAsset.purchase_cost) || 0,
        useful_life_years: parseInt(newAsset.useful_life_years) || 5,
        status: newAsset.status,
        category: newAsset.category || 'General',
        notes: newAsset.description
      };

      if (editingAsset) {
        // For updates, use the asset_tag from the existing asset (backend uses this as identifier)
        await apiService.updateAsset(editingAsset.asset_tag || editingAsset.asset_id, assetData);
      } else {
        await apiService.createAsset(assetData);
      }

      setAddDialogOpen(false);
      setEditingAsset(null);
      setNewAsset({
        asset_tag: '',
        name: '',
        description: '',
        category: '',
        location: '',
        assigned_to: '',
        purchase_cost: '',
        useful_life_years: '5',
        status: 'active'
      });

      // Refresh assets list
      const data = await apiService.getAssets();
      setAssets(data);
    } catch (err: any) {
      console.error('Asset save error:', err);
      let errorMessage = 'Failed to save asset';

      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Validation errors
          errorMessage = err.response.data.detail.map((e: any) =>
            `${e.loc?.join('.')} - ${e.msg}`
          ).join(', ');
        } else {
          errorMessage = err.response.data.detail;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewAsset(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteAsset = async (assetTag: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await apiService.deleteAsset(assetTag);
        setAssets(assets.filter(asset => asset.asset_tag !== assetTag));
        alert('Asset deleted successfully');
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete asset');
      }
    }
  };

  const handleEditAsset = (asset: any) => {
    // Map backend fields to frontend form fields
    setNewAsset({
      asset_tag: asset.asset_tag || asset.asset_id || '',
      name: asset.name || asset.description || '',
      description: asset.description || asset.notes || '',
      category: asset.category || '',
      location: asset.location || '',
      assigned_to: asset.assigned_to || asset.custodian || '',
      purchase_cost: asset.purchase_cost?.toString() || '',
      useful_life_years: asset.useful_life_years?.toString() || '5',
      status: asset.status || 'active'
    });
    setEditingAsset(asset);
    setAddDialogOpen(true);
  };

  const filteredAssets = assets.filter(asset =>
    (asset.name || asset.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.asset_tag || asset.asset_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.barcode && asset.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asset.category && asset.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ((asset.assigned_to || asset.custodian) && (asset.assigned_to || asset.custodian || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'disposed':
        return 'error';
      case 'missing':
        return 'error';
      default:
        return 'default';
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
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Assets
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<QrCodeScanner />}
            onClick={() => {
              // For now, show a simple prompt. In a real app, this would open a camera scanner
              const barcode = prompt('Enter barcode to search:');
              if (barcode) {
                setSearchTerm(barcode);
              }
            }}
          >
            Scan Barcode
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Asset
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Asset Tag</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Current Value</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => (
                <TableRow key={asset._id}>
                  <TableCell>{asset.asset_tag || asset.asset_id}</TableCell>
                  <TableCell>{asset.name || asset.description}</TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>{asset.assigned_to || asset.custodian || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Chip
                      label={asset.status}
                      color={getStatusColor(asset.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>${(asset.current_value || asset.purchase_cost || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditAsset(asset)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAsset(asset.asset_tag || asset.asset_id || '')}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'No assets found matching your search.' : 'No assets found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Asset Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Asset Tag"
                value={newAsset.asset_tag}
                onChange={(e) => handleInputChange('asset_tag', e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Asset Name"
                value={newAsset.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Box>
            <TextField
              fullWidth
              label="Description"
              value={newAsset.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newAsset.category}
                  label="Category"
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <MenuItem value="Laptop">Laptop</MenuItem>
                  <MenuItem value="Desktop">Desktop</MenuItem>
                  <MenuItem value="Monitor">Monitor</MenuItem>
                  <MenuItem value="Printer">Printer</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                  <MenuItem value="Tablet">Tablet</MenuItem>
                  <MenuItem value="Server">Server</MenuItem>
                  <MenuItem value="Network Equipment">Network Equipment</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={newAsset.location}
                  label="Location"
                  onChange={(e) => handleInputChange('location', e.target.value)}
                >
                  <MenuItem value="Building A - Floor 1">Building A - Floor 1</MenuItem>
                  <MenuItem value="Building A - Floor 2">Building A - Floor 2</MenuItem>
                  <MenuItem value="Building B - Floor 1">Building B - Floor 1</MenuItem>
                  <MenuItem value="Building B - Floor 2">Building B - Floor 2</MenuItem>
                  <MenuItem value="Warehouse">Warehouse</MenuItem>
                  <MenuItem value="Data Center">Data Center</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Custodian"
              value={newAsset.assigned_to}
              onChange={(e) => handleInputChange('assigned_to', e.target.value)}
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Purchase Cost"
                type="number"
                value={newAsset.purchase_cost}
                onChange={(e) => handleInputChange('purchase_cost', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                label="Useful Life (Years)"
                type="number"
                value={newAsset.useful_life_years}
                onChange={(e) => handleInputChange('useful_life_years', e.target.value)}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newAsset.status}
                label="Status"
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="disposed">Disposed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddDialogOpen(false);
            setEditingAsset(null);
            setNewAsset({
              asset_tag: '',
              name: '',
              description: '',
              category: '',
              location: '',
              assigned_to: '',
              purchase_cost: '',
              useful_life_years: '5',
              status: 'active'
            });
          }}>Cancel</Button>
          <Button onClick={handleAddAsset} variant="contained">
            {editingAsset ? 'Update Asset' : 'Add Asset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assets;
