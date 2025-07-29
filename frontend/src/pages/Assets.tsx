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
  Person,
  Warning,
  DeleteForever,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { Asset } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { safeCurrencyFormat } from '../utils/formatters';

// Calculation helper functions
const calculateAssetMetrics = (asset: Asset) => {
  const purchaseDate = new Date(asset.purchase_date);
  const currentDate = new Date();
  const ageInYears = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  // Calculate depreciation (straight-line method)
  const annualDepreciationRate = 1 / asset.useful_life_years;
  const accumulatedDepreciation = Math.min(ageInYears * annualDepreciationRate, 1) * asset.purchase_cost;
  const currentValue = Math.max(asset.purchase_cost - accumulatedDepreciation, 0);

  // Calculate time to next maintenance (assuming 1 year maintenance cycle)
  const lastMaintenanceDate = asset.maintenance_date ? new Date(asset.maintenance_date) : purchaseDate;
  const nextMaintenanceDate = new Date(lastMaintenanceDate);
  nextMaintenanceDate.setFullYear(nextMaintenanceDate.getFullYear() + 1);
  const daysToMaintenance = Math.ceil((nextMaintenanceDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate time remaining until disposal (based on useful life)
  const disposalDate = new Date(purchaseDate);
  disposalDate.setFullYear(disposalDate.getFullYear() + asset.useful_life_years);
  const daysToDisposal = Math.ceil((disposalDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    ageInYears: Math.round(ageInYears * 10) / 10,
    currentValue: Math.round(currentValue * 100) / 100,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    depreciationPercentage: Math.round((accumulatedDepreciation / asset.purchase_cost) * 100),
    daysToMaintenance,
    daysToDisposal,
    isOverdue: daysToDisposal < 0,
    maintenanceOverdue: daysToMaintenance < 0
  };
};

const Assets: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [custodianDialogOpen, setCustodianDialogOpen] = useState(false);
  const [selectedAssetForCustodian, setSelectedAssetForCustodian] = useState<Asset | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  // Helper functions for popup messages
  const showError = (message: string) => {
    setDialogMessage(message);
    setErrorDialogOpen(true);
    setError(null); // Clear the banner error
  };

  const showSuccess = (message: string) => {
    setDialogMessage(message);
    setSuccessDialogOpen(true);
    setError(null); // Clear any existing errors
  };

  const [newAsset, setNewAsset] = useState({
    asset_tag: '',
    name: '',
    description: '',
    category: '',
    location: '',
    assigned_to: '',
    purchase_cost: '',
    useful_life_years: '5',
    status: 'active',
    purchase_date: '',
    maintenance_date: '',
    disposed_date: ''
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

        showError(errorMessage);
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
        showError('Please fill in all required fields (Asset Tag, Name, Location, Assigned To)');
        return;
      }

      // Helper function to format date for backend
      const formatDateForBackend = (dateString: string) => {
        if (!dateString) return null;
        try {
          // If it's already in ISO format, return as is
          if (dateString.includes('T')) return dateString;
          // Convert YYYY-MM-DD to ISO format
          return new Date(dateString + 'T00:00:00.000Z').toISOString();
        } catch (error) {
          return null;
        }
      };

      const assetData: any = {
        asset_id: newAsset.asset_tag,
        description: newAsset.description || newAsset.name,
        location: newAsset.location,
        custodian: newAsset.assigned_to,
        barcode: editingAsset ? editingAsset.barcode : `BC${Date.now()}`,
        purchase_date: formatDateForBackend(newAsset.purchase_date) || (editingAsset ? editingAsset.purchase_date : new Date().toISOString()),
        depreciation_class: 'equipment',
        purchase_cost: parseFloat(newAsset.purchase_cost) || 0,
        useful_life_years: parseInt(newAsset.useful_life_years) || 5,
        status: newAsset.status,
        category: newAsset.category || 'General',
        notes: newAsset.description
      };

      // Only add date fields if they have values
      const maintenanceDate = formatDateForBackend(newAsset.maintenance_date);
      if (maintenanceDate) {
        assetData.maintenance_date = maintenanceDate;
      }

      const disposedDate = newAsset.status === 'disposed' ?
        (formatDateForBackend(newAsset.disposed_date) || new Date().toISOString()) :
        formatDateForBackend(newAsset.disposed_date);
      if (disposedDate) {
        assetData.disposed_date = disposedDate;
      }

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
        status: 'active',
        purchase_date: '',
        maintenance_date: '',
        disposed_date: ''
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

      showError(errorMessage);
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
        showSuccess('Asset deleted successfully');
      } catch (err: any) {
        let errorMessage = 'Failed to delete asset';

        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        showError(errorMessage);
      }
    }
  };

  const handleDisposeAsset = async (asset: Asset) => {
    if (window.confirm(`Are you sure you want to dispose of asset "${asset.asset_tag || asset.asset_id}"? This action will mark the asset as disposed.`)) {
      try {
        const updateData = {
          status: 'disposed',
          disposed_date: new Date().toISOString()
        };

        await apiService.updateAsset(asset.asset_tag || asset.asset_id || '', updateData);

        // Refresh assets list
        const data = await apiService.getAssets();
        setAssets(data);

        // Show success message
        showSuccess('Asset has been successfully disposed.');
      } catch (err: any) {
        showError(err.response?.data?.message || 'Failed to dispose asset');
      }
    }
  };

  const handleAssignCustodian = (asset: Asset) => {
    setSelectedAssetForCustodian(asset);
    setCustodianDialogOpen(true);
  };

  const canDeleteAsset = (asset: Asset) => {
    // Asset Manager cannot delete assets in WIP or under verification
    if (user?.role === 'asset_manager') {
      return asset.status !== 'wip' && asset.status !== 'under_verification';
    }
    // Admin can delete any asset
    return user?.role === 'admin';
  };

  const canEditAsset = () => {
    return user?.role === 'asset_manager' || user?.role === 'admin';
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
      status: asset.status || 'active',
      purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
      maintenance_date: asset.maintenance_date ? asset.maintenance_date.split('T')[0] : '',
      disposed_date: asset.disposed_date ? asset.disposed_date.split('T')[0] : ''
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
              <TableCell>Depreciation</TableCell>
              <TableCell>Maintenance</TableCell>
              <TableCell>Disposal</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => {
                const metrics = calculateAssetMetrics(asset);
                return (
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
                  <TableCell>{safeCurrencyFormat(metrics.currentValue)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: metrics.depreciationPercentage > 75 ? 'error.main' : 'text.primary' }}>
                        {metrics.depreciationPercentage}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {safeCurrencyFormat(metrics.accumulatedDepreciation)} lost
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ color: metrics.maintenanceOverdue ? 'error.main' : 'text.primary' }}>
                        {metrics.maintenanceOverdue ? 'Overdue' : `${metrics.daysToMaintenance} days`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {metrics.maintenanceOverdue ? 'Maintenance needed' : 'Next maintenance'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ color: metrics.isOverdue ? 'error.main' : metrics.daysToDisposal < 365 ? 'warning.main' : 'text.primary' }}>
                        {metrics.isOverdue ? 'Overdue' : `${metrics.daysToDisposal} days`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {metrics.isOverdue ? 'Should be disposed' : 'Until disposal'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {canEditAsset() && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditAsset(asset)}
                        title="Edit Asset"
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {(user?.role === 'asset_manager' || user?.role === 'admin') && (
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleAssignCustodian(asset)}
                        title="Assign Custodian"
                      >
                        <Person />
                      </IconButton>
                    )}
                    {(user?.role === 'asset_manager' || user?.role === 'admin') && asset.status !== 'disposed' && (
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleDisposeAsset(asset)}
                        title="Dispose Asset"
                      >
                        <DeleteForever />
                      </IconButton>
                    )}
                    {canDeleteAsset(asset) && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteAsset(asset.asset_tag || asset.asset_id || '')}
                        title={asset.status === 'wip' || asset.status === 'under_verification' ?
                          'Cannot delete: Asset is in WIP or under verification' : 'Delete Asset'}
                        disabled={!canDeleteAsset(asset)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                    {(asset.status === 'wip' || asset.status === 'under_verification') && (
                      <IconButton
                        size="small"
                        color="warning"
                        title={`Asset is ${asset.status === 'wip' ? 'in WIP' : 'under verification'}`}
                        disabled
                      >
                        <Warning />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Purchase Date"
                type="date"
                value={newAsset.purchase_date}
                onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Date when the asset was purchased"
              />
              <TextField
                fullWidth
                label="Maintenance Date"
                type="date"
                value={newAsset.maintenance_date}
                onChange={(e) => handleInputChange('maintenance_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Last maintenance performed"
              />
            </Box>
            {newAsset.status === 'disposed' && (
              <TextField
                fullWidth
                label="Disposed Date"
                type="date"
                value={newAsset.disposed_date}
                onChange={(e) => handleInputChange('disposed_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Date when asset was disposed"
              />
            )}
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
              status: 'active',
              purchase_date: '',
              maintenance_date: '',
              disposed_date: ''
            });
          }}>Cancel</Button>
          <Button onClick={handleAddAsset} variant="contained">
            {editingAsset ? 'Update Asset' : 'Add Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custodian Assignment Dialog */}
      <Dialog open={custodianDialogOpen} onClose={() => setCustodianDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Custodian</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Asset: {selectedAssetForCustodian?.asset_tag || selectedAssetForCustodian?.asset_id} - {selectedAssetForCustodian?.description}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Current Custodian: {selectedAssetForCustodian?.custodian || selectedAssetForCustodian?.assigned_to || 'Unassigned'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Custodian assignment functionality will be implemented in the next phase.
            This will include user selection, notification sending, and audit trail logging.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustodianDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained" disabled>
            Assign (Coming Soon)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Error
        </DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialogOpen(false)} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)}>
        <DialogTitle sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="span" sx={{ color: 'success.main' }}>
            ✓ Success
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessDialogOpen(false)} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assets;
