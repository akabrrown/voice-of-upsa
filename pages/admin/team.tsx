import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import toast from 'react-hot-toast';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiImage } from 'react-icons/fi';
import Image from 'next/image';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const AdminTeamPage: React.FC = () => {
  const { user, supabase } = useSupabase();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember> | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/admin/team', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch team members');
      
      const data = await response.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (user) fetchMembers();
  }, [user, fetchMembers]);

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setCurrentMember(member);
    } else {
      setCurrentMember({
        name: '',
        role: '',
        bio: '',
        image_url: '',
        is_active: true,
        order_index: members.length
      });
    }
    setIsEditing(true);
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    setCurrentMember(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember?.name || !currentMember?.role) {
      toast.error('Name and role are required');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = currentMember.id 
        ? `/api/admin/team/${currentMember.id}` 
        : '/api/admin/team';
      const method = currentMember.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentMember),
      });

      if (!response.ok) throw new Error('Failed to save team member');

      toast.success(currentMember.id ? 'Team member updated' : 'Team member added');
      handleCloseModal();
      fetchMembers();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save team member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/team/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Team member deleted');
      fetchMembers();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete team member');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/team/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setCurrentMember(prev => ({ ...prev, image_url: data.data.url }));
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Admin - Team Management">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin - Team Management">
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-navy flex items-center">
                <FiUsers className="mr-3" />
                Team Management
              </h1>
              <p className="text-gray-600">Manage team members displayed on the About page</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-golden text-navy px-6 py-2 rounded-lg font-bold flex items-center hover:bg-yellow-400 transition-colors"
            >
              <FiPlus className="mr-2" />
              Add Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {members.map((member) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
                >
                  <div className="aspect-square relative bg-gray-100">
                    {member.image_url ? (
                      <Image
                        src={member.image_url}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FiImage className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex space-x-2 z-10">
                      <button
                        onClick={() => handleOpenModal(member)}
                        className="p-2 bg-white rounded-full text-navy shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
                        title="Edit member"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-2 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-700 transition-all hover:scale-105"
                        title="Delete member"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-navy">{member.name}</h3>
                    <p className="text-golden font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm line-clamp-2">{member.bio || 'No bio provided'}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                      <span>Order: {member.order_index}</span>
                      <span className={member.is_active ? 'text-green-500' : 'text-red-500'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-bold text-navy">
                  {currentMember?.id ? 'Edit Team Member' : 'Add Team Member'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-navy transition-colors">
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-navy uppercase tracking-wider">
                      Profile Picture
                    </label>
                    <div className="aspect-square rounded-xl bg-gray-100 relative overflow-hidden group border-2 border-dashed border-gray-200 hover:border-golden transition-colors">
                      {currentMember?.image_url ? (
                        <Image
                          src={currentMember.image_url}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                          <FiImage className="w-12 h-12 mb-2" />
                          <span className="text-sm">Click to upload</span>
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-navy/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden font-bold"></div>
                        </div>
                      )}
                      <input
                        type="file"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={currentMember?.name || ''}
                        onChange={(e) => setCurrentMember(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-golden outline-none transition-shadow"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider">
                        Role / Designation
                      </label>
                      <input
                        type="text"
                        required
                        value={currentMember?.role || ''}
                        onChange={(e) => setCurrentMember(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-golden outline-none transition-shadow"
                        placeholder="Editor-in-Chief"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={currentMember?.order_index || 0}
                          onChange={(e) => setCurrentMember(prev => ({ ...prev, order_index: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-golden outline-none transition-shadow"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 rounded-xl w-full border border-gray-100">
                          <input
                            type="checkbox"
                            checked={currentMember?.is_active || false}
                            onChange={(e) => setCurrentMember(prev => ({ ...prev, is_active: e.target.checked }))}
                            className="w-5 h-5 rounded text-golden focus:ring-golden"
                          />
                          <span className="text-sm font-bold text-navy uppercase tracking-wider">Active</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider">
                    Biography
                  </label>
                  <textarea
                    value={currentMember?.bio || ''}
                    onChange={(e) => setCurrentMember(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-golden outline-none transition-shadow min-h-[120px] resize-none"
                    placeholder="Short bio about the team member..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-golden text-navy font-bold flex items-center hover:bg-yellow-400 transition-colors shadow-lg shadow-golden/20"
                  >
                    <FiSave className="mr-2" />
                    Save Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default AdminTeamPage;
