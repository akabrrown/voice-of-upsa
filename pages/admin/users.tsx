import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import CreateRoleModal from '@/components/CreateRoleModal';
import UserInvitationModal from '@/components/UserInvitationModal';
import DeleteUserModal from '@/components/DeleteUserModal';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { FiShield, FiEdit2, FiUsers, FiSearch, FiMail, FiCalendar, FiUserPlus, FiKey, FiArchive, FiTrash2, FiRefreshCw } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'editor';
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  avatar_url?: string;
  is_active: boolean;
  security_level?: string;
  password_strength_score?: number;
}

const AdminUsersPage: React.FC = () => {
  const { user, supabase } = useSupabase();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'editor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [invitationUser, setInvitationUser] = useState<User | null>(null);
  const [deleteUserModal, setDeleteUserModal] = useState<User | null>(null);
  const [permanentDeleteModal, setPermanentDeleteModal] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastRefreshRef = useRef<number>(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Admin users: Starting fetch...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Admin users: Session result:', { session: !!session, sessionError });
      
      if (sessionError || !session) {
        console.log('Admin users: No session, showing error');
        toast.error('No active session');
        return;
      }

      // Only refresh if token is expired or it's been more than 5 minutes since last refresh
      const now = Date.now();
      const tokenExpiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const shouldRefresh = tokenExpiresAt < now || (now - lastRefreshRef.current) > 300000; // 5 minutes

      let freshSession = session;
      
      if (shouldRefresh) {
        console.log('Admin users: Token expired or stale, refreshing session...');
        // Refresh session to get fresh token
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        console.log('Admin users: Refresh result:', { freshSession: !!refreshedSession, refreshError });
        
        if (refreshError || !refreshedSession) {
          console.error('Admin users: Session refresh failed:', refreshError);
          toast.error('Session expired, please sign in again');
          return;
        }
        freshSession = refreshedSession;
        lastRefreshRef.current = now;
      } else {
        console.log('Admin users: Using existing valid token');
      }
      
      console.log('Admin users: Making API call with token...');
      
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const url = `/api/admin/users${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${freshSession.access_token}`,
        },
      });

      console.log('Admin users: API response status:', response.status);
      console.log('Admin users: API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Admin users: API error response:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Admin users frontend: Received response:', data);
      console.log('Admin users frontend: Users array:', data.data?.users);
      console.log('Admin users frontend: Alternative paths:', {
        'data.users': data.data?.users,
        'users': data.users,
        'data.data': data.data?.data
      });
      setUsers(data.data?.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [supabase, roleFilter, statusFilter, searchTerm]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleSyncUsers = async () => {
    try {
      setIsSyncing(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch('/api/admin/users/sync-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sync users');
      }

      const data = await response.json();
      const stats = data.data.stats;
      
      toast.success(`Sync completed: ${stats.syncedCount} new, ${stats.updatedCount} updated`);
      
      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error syncing users:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync users');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'editor' | 'admin') => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setIsUpdatingRole(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      toast.success('User role updated successfully');
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleArchiveUser = async (userId: string, reason?: string) => {
    try {
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/admin/users/archive-user?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || 'Admin decision' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to archive user');
      }

      toast.success('User archived successfully. They can be restored later.');
      fetchUsers();
      setDeleteUserModal(null);
    } catch (error) {
      console.error('Error archiving user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to archive user');
    }
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/admin/users/restore-user?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to restore user');
      }

      toast.success('User restored successfully. They can now access their account.');
      fetchUsers();
    } catch (error) {
      console.error('Error restoring user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to restore user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/admin/users/delete-user?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete user');
      }

      toast.success('User deleted permanently.');
      fetchUsers();
      setDeleteUserModal(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active === true) ||
                         (statusFilter === 'archived' && user.is_active === false);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Debug logging
  console.log('Admin users page debug:', {
    loading,
    usersCount: users.length,
    filteredUsersCount: filteredUsers.length,
    roleFilter,
    statusFilter,
    searchTerm,
    usersSample: users.slice(0, 2)
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FiShield className="text-red-600" />;
      case 'editor':
        return <FiEdit2 className="text-blue-600" />;
      case 'user':
        return <FiUsers className="text-gray-600" />;
      default:
        return <FiUsers className="text-gray-600" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-navy text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <FiUsers className="mr-3" />
                  User Management
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSyncUsers}
                    disabled={isSyncing}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors"
                  >
                    <FiRefreshCw className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Users'}</span>
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors"
                  >
                    <FiUserPlus />
                    <span>Create Role</span>
                  </button>
                </div>
              </h1>
              <p className="text-gray-300">Manage user roles and permissions. Use &quot;Sync Users&quot; to sync new users from Supabase auth.</p>
            </motion.div>
          </div>
        </section>

        {/* Filters and Search */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-6"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <div className="flex gap-2">
                  {(['all', 'user', 'editor', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        roleFilter === role
                          ? 'bg-golden text-navy'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  {(['all', 'active', 'archived'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        statusFilter === status
                          ? 'bg-golden text-navy'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Users List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredUsers.length > 0 ? (
                filteredUsers.map((userItem) => (
                  <motion.div
                    key={userItem.id}
                    variants={itemVariants}
                    className="bg-white rounded-lg shadow-lg p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {userItem.avatar_url ? (
                            <Image
                              src={userItem.avatar_url}
                              alt={userItem.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                              <FiUsers className="text-gray-600" />
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-navy">{userItem.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getRoleColor(userItem.role)}`}>
                              {getRoleIcon(userItem.role)}
                              <span className="ml-1">{userItem.role}</span>
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(userItem.is_active)}`}>
                              {userItem.is_active ? 'Active' : 'Archived'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <FiMail className="mr-1" />
                              {userItem.email}
                            </div>
                            <div className="flex items-center">
                              <FiCalendar className="mr-1" />
                              Joined {new Date(userItem.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 mt-4 md:mt-0">
                        <button
                          onClick={() => setSelectedUser(userItem)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => setInvitationUser(userItem)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                        >
                          <FiKey className="mr-1" />
                          Invite User
                        </button>
                        {userItem.is_active ? (
                          <button
                            onClick={() => setDeleteUserModal(userItem)}
                            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors duration-200"
                            disabled={userItem.id === user?.id} // Prevent self-archiving
                          >
                            <FiArchive className="mr-1" />
                            Archive
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestoreUser(userItem.id)}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                          >
                            <FiArchive className="mr-1" />
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => setPermanentDeleteModal(userItem)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                          disabled={userItem.id === user?.id} // Prevent self-deletion
                        >
                          <FiTrash2 className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-lg shadow-lg p-12 text-center"
                >
                  <div className="text-gray-400 mb-4">
                    <FiUsers className="text-5xl mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy mb-2">No users found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'No users match the current filter'}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Role Change Modal */}
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-navy mb-4">Change User Role</h3>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  User: <span className="font-semibold">{selectedUser.name}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Email: <span className="font-semibold">{selectedUser.email}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Current role: <span className="font-semibold">{selectedUser.role}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                {(['user', 'editor', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(selectedUser.id, role)}
                    disabled={role === selectedUser.role || isUpdatingRole}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      role === selectedUser.role
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {getRoleIcon(role)}
                      <span className="ml-2">Set as {role}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Create Role Modal */}
        <CreateRoleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchUsers();
            toast.success('User role created successfully');
          }}
        />
        
        {/* User Invitation Modal */}
        <UserInvitationModal
          isOpen={!!invitationUser}
          onClose={() => setInvitationUser(null)}
          user={invitationUser}
        />
        
        {/* Delete User Modal */}
        {deleteUserModal && (
          <DeleteUserModal
            isOpen={!!deleteUserModal}
            onClose={() => setDeleteUserModal(null)}
            onConfirm={() => handleArchiveUser(deleteUserModal.id)}
            title="Archive User"
            message="Archiving a user will disable their account access, but their data will be preserved. They can be restored later if needed."
            confirmText="Archive User"
            confirmColor="bg-red-600 hover:bg-red-700"
          />
        )}
        
        {/* Permanent Delete User Modal */}
        {permanentDeleteModal && (
          <DeleteUserModal
            isOpen={!!permanentDeleteModal}
            onClose={() => setPermanentDeleteModal(null)}
            onConfirm={() => handleDeleteUser(permanentDeleteModal.id)}
            title="Delete User Permanently"
            message="⚠️ WARNING: This action cannot be undone. Deleting a user will permanently remove all their data including articles, comments, and other associated content. This action is irreversible."
            confirmText="Delete Permanently"
            confirmColor="bg-red-600 hover:bg-red-700"
          />
        )}
      </div>
    </Layout>
  );
};

export default AdminUsersPage;
