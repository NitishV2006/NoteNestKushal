import React, { useState, useEffect } from 'react';
import { supabase, Profile } from '../../lib/supabase';
import { Loader2, User, Trash2, ShieldCheck, Edit, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<'student' | 'faculty' | 'admin'>('student');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: Profile) => {
    setEditingUserId(user.id);
    setNewRole(user.role);
  };

  const handleSaveRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUserId(null);
    } catch (error: any) {
      setError(error.message || 'Failed to update role');
    }
  };
  
  // Note: Deleting a user from 'profiles' does not delete them from 'auth.users'.
  // This requires a server-side function for security. This implementation is for demonstration.
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user profile? This action is irreversible.')) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
        setUsers(users.filter(u => u.id !== userId));
      } catch (error: any) {
        setError(error.message || 'Failed to delete user');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Users</h2>
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingUserId === user.id ? (
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as any)}
                        className="w-full p-1 border border-gray-300 rounded-lg"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'faculty' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {editingUserId === user.id ? (
                        <>
                          <button onClick={() => handleSaveRole(user.id)} className="text-green-600 hover:text-green-900"><Save className="h-5 w-5" /></button>
                          <button onClick={() => setEditingUserId(null)} className="text-gray-600 hover:text-gray-900"><X className="h-5 w-5" /></button>
                        </>
                      ) : (
                        <button onClick={() => handleEditRole(user)} className="text-blue-600 hover:text-blue-900"><Edit className="h-5 w-5" /></button>
                      )}
                      <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};
