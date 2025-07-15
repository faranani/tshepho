import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Storage,
  History,
  RestoreFromTrash,
  Save,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

interface SystemModule {
  name: string;
  display_name: string;
  description: string;
  status: 'enabled' | 'disabled' | 'maintenance';
  version?: string;
  dependencies: string[];
  settings: Record<string, any>;
}

interface ConfigurationItem {
  key: string;
  value: any;
  category: string;
  description: string;
  data_type: string;
  is_sensitive: boolean;
  requires_restart: boolean;
  validation_rules?: Record<string, any>;
}

interface ConfigurationHistory {
  id: string;
  config_key: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  changed_at: string;
  reason?: string;
  category: string;
}

const SystemConfiguration: React.FC = () => {
  const [modules, setModules] = useState<Record<string, SystemModule>>({});
  const [settings, setSettings] = useState<Record<string, ConfigurationItem>>({});
  const [history, setHistory] = useState<ConfigurationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'setting' | 'reset'>('setting');
  const [selectedSetting, setSelectedSetting] = useState<ConfigurationItem | null>(null);
  const [settingValue, setSettingValue] = useState<any>('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modulesData, settingsData, historyData] = await Promise.all([
        apiService.getSystemModules(),
        apiService.getSystemSettings(),
        apiService.getConfigurationHistory({ limit: 20 })
      ]);

      setModules(modulesData);
      setSettings(settingsData);
      setHistory(historyData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = async (moduleName: string, currentStatus: string) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    
    try {
      await apiService.updateModuleStatus(moduleName, newStatus, `Module ${newStatus} via UI`);
      fetchData();
      alert(`Module ${moduleName} ${newStatus} successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${newStatus} module`);
    }
  };

  const handleSettingUpdate = async () => {
    if (!selectedSetting) return;

    try {
      await apiService.updateSetting(selectedSetting.key, settingValue, reason);
      setOpenDialog(false);
      fetchData();
      alert('Setting updated successfully!');
      
      if (selectedSetting.requires_restart) {
        alert('Note: This setting requires a system restart to take effect.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update setting');
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.resetSystemToDefaults();
      setOpenDialog(false);
      fetchData();
      alert('System configuration reset to defaults successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset configuration');
    }
  };

  const openSettingDialog = (setting: ConfigurationItem) => {
    setDialogType('setting');
    setSelectedSetting(setting);
    setSettingValue(setting.value);
    setReason('');
    setOpenDialog(true);
  };

  const openResetDialog = () => {
    setDialogType('reset');
    setOpenDialog(true);
  };

  const getModuleStatusColor = (status: string) => {
    switch (status) {
      case 'enabled': return 'success';
      case 'disabled': return 'default';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Security />;
      case 'notifications': return <Notifications />;
      case 'system': return <Settings />;
      case 'audit': return <Storage />;
      default: return <Settings />;
    }
  };

  const formatValue = (value: any, dataType: string) => {
    if (dataType === 'boolean') {
      return value ? 'Enabled' : 'Disabled';
    }
    return String(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          System Configuration
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RestoreFromTrash />}
          onClick={openResetDialog}
          color="warning"
        >
          Reset to Defaults
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="System Modules" />
        <Tab label="System Settings" />
        <Tab label="Configuration History" />
      </Tabs>

      {/* System Modules Tab */}
      {activeTab === 0 && (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={3}>
          {Object.entries(modules).map(([moduleName, module]) => (
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      {module.display_name}
                    </Typography>
                    <Chip 
                      label={module.status.toUpperCase()} 
                      color={getModuleStatusColor(module.status) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {module.description}
                  </Typography>
                  {module.version && (
                    <Typography variant="caption" display="block" mb={1}>
                      Version: {module.version}
                    </Typography>
                  )}
                  {module.dependencies.length > 0 && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Dependencies: {module.dependencies.join(', ')}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={module.status === 'enabled'}
                        onChange={() => handleModuleToggle(moduleName, module.status)}
                        disabled={module.status === 'maintenance'}
                      />
                    }
                    label={module.status === 'enabled' ? 'Enabled' : 'Disabled'}
                  />
                </CardActions>
              </Card>
          ))}
        </Box>
      )}

      {/* System Settings Tab */}
      {activeTab === 1 && (
        <Box>
          {Object.entries(
            Object.entries(settings).reduce((acc, [key, setting]) => {
              const category = setting.category;
              if (!acc[category]) acc[category] = [];
              acc[category].push([key, setting]);
              return acc;
            }, {} as Record<string, Array<[string, ConfigurationItem]>>)
          ).map(([category, categorySettings]) => (
            <Box key={category} mb={3}>
              <Paper sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  {getCategoryIcon(category)}
                  <Typography variant="h6" sx={{ ml: 1, textTransform: 'capitalize' }}>
                    {category.replace('_', ' ')} Settings
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }} gap={2}>
                  {categorySettings.map(([key, setting]) => (
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {setting.description}
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            Current Value: {formatValue(setting.value, setting.data_type)}
                          </Typography>
                          {setting.requires_restart && (
                            <Chip label="Requires Restart" size="small" color="warning" sx={{ mt: 1 }} />
                          )}
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            startIcon={<Settings />}
                            onClick={() => openSettingDialog(setting)}
                          >
                            Configure
                          </Button>
                        </CardActions>
                      </Card>
                  ))}
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      )}

      {/* Configuration History Tab */}
      {activeTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Setting</TableCell>
                <TableCell>Old Value</TableCell>
                <TableCell>New Value</TableCell>
                <TableCell>Changed By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.config_key}</TableCell>
                  <TableCell>{String(entry.old_value)}</TableCell>
                  <TableCell>{String(entry.new_value)}</TableCell>
                  <TableCell>{entry.changed_by}</TableCell>
                  <TableCell>
                    {new Date(entry.changed_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{entry.reason || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={entry.category} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Configuration Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'setting' && 'Update Setting'}
          {dialogType === 'reset' && 'Reset Configuration'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'setting' && selectedSetting && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedSetting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {selectedSetting.description}
              </Typography>

              {selectedSetting.data_type === 'boolean' ? (
                <FormControlLabel
                  control={
                    <Switch
                      checked={settingValue}
                      onChange={(e) => setSettingValue(e.target.checked)}
                    />
                  }
                  label={settingValue ? 'Enabled' : 'Disabled'}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Value"
                  value={settingValue}
                  onChange={(e) => setSettingValue(
                    selectedSetting.data_type === 'integer'
                      ? parseInt(e.target.value) || 0
                      : e.target.value
                  )}
                  type={selectedSetting.data_type === 'integer' ? 'number' : 'text'}
                  margin="normal"
                  helperText={
                    selectedSetting.validation_rules
                      ? `Min: ${selectedSetting.validation_rules.min || 'N/A'}, Max: ${selectedSetting.validation_rules.max || 'N/A'}`
                      : undefined
                  }
                />
              )}

              <TextField
                fullWidth
                label="Reason for Change"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                margin="normal"
                multiline
                rows={3}
                placeholder="Describe why you're making this change..."
              />

              {selectedSetting.requires_restart && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This setting requires a system restart to take effect.
                </Alert>
              )}
            </Box>
          )}

          {dialogType === 'reset' && (
            <Box sx={{ pt: 1 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will reset ALL system configuration to default values. This action cannot be undone.
              </Alert>
              <Typography variant="body1">
                Are you sure you want to proceed? This will affect:
              </Typography>
              <ul>
                <li>All system modules will be enabled</li>
                <li>All settings will return to default values</li>
                <li>Custom configurations will be lost</li>
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={dialogType === 'setting' ? handleSettingUpdate : handleResetToDefaults}
            color={dialogType === 'reset' ? 'warning' : 'primary'}
            startIcon={dialogType === 'setting' ? <Save /> : <RestoreFromTrash />}
          >
            {dialogType === 'setting' ? 'Update Setting' : 'Reset to Defaults'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemConfiguration;
