import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, BookOpen, Edit3, Save, X, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    department: '',
    subjects: [] as string[]
  });
  const [subjectInput, setSubjectInput] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        department: profile.department || '',
        subjects: profile.subjects || []
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddSubject = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && subjectInput.trim() !== '') {
      e.preventDefault();
      if (!formData.subjects.includes(subjectInput.trim())) {
        setFormData(prev => ({
          ...prev,
          subjects: [...prev.subjects, subjectInput.trim()]
        }));
      }
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subjectToRemove)
    }));
  };

  const handleSave = async () => {
    if (profile?.role === 'faculty' && formData.subjects.length === 0) {
      setError('Faculty members must have at least one subject. Please add a subject before saving.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        department: profile.department || '',
        subjects: profile.subjects || []
      });
    }
    setIsEditing(false);
    setError('');
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <User className="h-12 w-12 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
          <p className="text-lg text-gray-600 capitalize">{profile.role}</p>
        </div>
      </motion.div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4" />
              <span>Full Name</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{profile.full_name}</p>
            )}
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </label>
            <p className="text-gray-900">{profile.email}</p>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4" />
              <span>Phone</span>
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Building className="h-4 w-4" />
              <span>Department</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Computer Science"
              />
            ) : (
              <p className="text-gray-900">{profile.department}</p>
            )}
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="h-4 w-4" />
              <span>
                {profile.role === 'faculty' ? 'Subjects You Teach' : 'Enrolled Subjects'}
              </span>
            </label>
            {isEditing && profile.role === 'faculty' ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.subjects.map(subject => (
                    <span key={subject} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {subject}
                      <button type="button" onClick={() => handleRemoveSubject(subject)}>
                        <XCircle className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={handleAddSubject}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type a subject and press Enter to add"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.subjects?.length ? (
                  profile.subjects.map(subject => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {subject}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No subjects selected</span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
