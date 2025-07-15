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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Lock,
  LockOpen,
  Refresh,
  PersonAdd,
  Security,
  People,
  AdminPanelSettings,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'asset_manager' | 'auditor';
  status: 'active' | 'inactive' | 'locked' | 'suspended';
  department?: string;
  phone?: string;
  created_at: string;
  last_login?: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  recent_logins: number;
  status_breakdown: Record<string, number>;
  role_breakdown: Record<string, number>;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'edit' | 'role' | 'status'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'asset_manager',
    department: '',
    phone: '',
    password: '',
    status: 'active',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const [usersData, statsData] = await Promise.all([
        apiService.getUsers(params),
        apiService.getUserStats()
      ]);

      setUsers(usersData);
      setStats(statsData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await apiService.createUser({
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
        password: formData.password
      });
      
      setOpenDialog(false);
      resetForm();
      fetchData();
      alert('User created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await apiService.updateUser(selectedUser.id, {
        email: formData.email,
        full_name: formData.full_name,
        department: formData.department,
        phone: formData.phone
      });
      
      setOpenDialog(false);
      resetForm();
      fetchData();
      alert('User updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    try {
      await apiService.assignUserRole(selectedUser.id, {
        role: formData.role,
        reason: formData.reason
      });
      
      setOpenDialog(false);
      resetForm();
      fetchData();
      alert('User role updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedUser) return;

    try {
      await apiService.changeUserStatus(selectedUser.id, {
        status: formData.status,
        reason: formData.reason
      });
      
      setOpenDialog(false);
      resetForm();
      fetchData();
      alert('User status updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('Are you sure you want to reset this user\'s password?')) return;

    try {
      const result = await apiService.resetUserPassword(userId);
      alert(`Password reset successfully! New password: ${result.new_password}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiService.deleteUser(userId);
      fetchData();
      alert('User deleted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const openCreateDialog = () => {
    setDialogType('create');
    resetForm();
    setOpenDialog(true);
  };

  const openEditDialog = (user: User) => {
    setDialogType('edit');
    setSelectedUser(user);
    setFormData({
      ...formData,
      email: user.email,
      full_name: user.full_name,
      department: user.department || '',
      phone: user.phone || ''
    });
    setOpenDialog(true);
  };

  const openRoleDialog = (user: User) => {
    setDialogType('role');
    setSelectedUser(user);
    setFormData({
      ...formData,
      role: user.role,
      reason: ''
    });
    setOpenDialog(true);
  };

  const openStatusDialog = (user: User) => {
    setDialogType('status');
    setSelectedUser(user);
    setFormData({
      ...formData,
      status: user.status,
      reason: ''
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      role: 'asset_manager',
      department: '',
      phone: '',
      password: '',
      status: 'active',
      reason: ''
    });
    setSelectedUser(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'locked': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'asset_manager': return 'primary';
      case 'auditor': return 'secondary';
      default: return 'default';
    }
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
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={openCreateDialog}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* User Statistics */}
      {stats && (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={3} sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">{stats.total_users}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LockOpen sx={{ mr: 2, fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6">{stats.active_users}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Security sx={{ mr: 2, fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="h6">{stats.recent_logins}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent Logins
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AdminPanelSettings sx={{ mr: 2, fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="h6">{stats.role_breakdown.admin || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Administrators
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr 1fr auto' }} gap={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Role"
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="asset_manager">Asset Manager</MenuItem>
              <MenuItem value="auditor">Auditor</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="locked">Locked</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
          <Box>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchData}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role.replace('_', ' ').toUpperCase()}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status.toUpperCase()}
                    color={getStatusColor(user.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.department || 'N/A'}</TableCell>
                <TableCell>
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString()
                    : 'Never'
                  }
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit User">
                    <IconButton size="small" onClick={() => openEditDialog(user)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Change Role">
                    <IconButton size="small" onClick={() => openRoleDialog(user)}>
                      <Security />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Change Status">
                    <IconButton
                      size="small"
                      onClick={() => openStatusDialog(user)}
                      color={user.status === 'active' ? 'warning' : 'success'}
                    >
                      {user.status === 'active' ? <Lock /> : <LockOpen />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset Password">
                    <IconButton
                      size="small"
                      onClick={() => handleResetPassword(user.id)}
                      color="info"
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete User">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'create' && 'Create New User'}
          {dialogType === 'edit' && 'Edit User'}
          {dialogType === 'role' && 'Change User Role'}
          {dialogType === 'status' && 'Change User Status'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {dialogType === 'create' && (
              <>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  margin="normal"
                  required
                  helperText="Minimum 12 characters with uppercase, lowercase, numbers, and special characters"
                />
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  margin="normal"
                  required
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    label="Role"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="asset_manager">Asset Manager</MenuItem>
                    <MenuItem value="auditor">Auditor</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  margin="normal"
                />
              </>
            )}

            {dialogType === 'edit' && (
              <>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  margin="normal"
                />
              </>
            )}

            {dialogType === 'role' && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>New Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    label="New Role"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="asset_manager">Asset Manager</MenuItem>
                    <MenuItem value="auditor">Auditor</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Reason for Change"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </>
            )}

            {dialogType === 'status' && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>New Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    label="New Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="locked">Locked</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Reason for Change"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (dialogType === 'create') handleCreateUser();
              else if (dialogType === 'edit') handleUpdateUser();
              else if (dialogType === 'role') handleChangeRole();
              else if (dialogType === 'status') handleChangeStatus();
            }}
          >
            {dialogType === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
