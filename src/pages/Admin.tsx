import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText } from 'lucide-react';
import { UserManagement } from '../components/admin/UserManagement';
import { NoteManagement } from '../components/admin/NoteManagement';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'notes'>('users');

  const tabs = [
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'notes', name: 'Note Management', icon: FileText },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-lg text-gray-600 mt-1">
          Manage platform users and content
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 max-w-md mx-auto">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'users' | 'notes')}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'notes' && <NoteManagement />}
      </motion.div>
    </div>
  );
};
