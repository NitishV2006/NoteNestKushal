import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, Shield, Download, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export const Home: React.FC = () => {
  const { user, profile } = useAuth();

  const features = [
    {
      icon: FileText,
      title: 'Academic Notes',
      description: 'Access comprehensive notes uploaded by faculty members for all your enrolled subjects.'
    },
    {
      icon: Search,
      title: 'Easy Search',
      description: 'Find notes quickly by searching faculty names, subjects, or upload dates.'
    },
    {
      icon: Download,
      title: 'Download & Study',
      description: 'Download notes for offline studying and better exam preparation.'
    },
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Role-based access ensures students only see notes for their enrolled subjects.'
    },
    {
      icon: Users,
      title: 'Faculty Upload',
      description: 'Faculty members can easily upload and manage notes for their subjects.'
    },
    {
      icon: BookOpen,
      title: 'Organized Content',
      description: 'Notes are organized by department and subject for easy navigation.'
    }
  ];

  const userRoleMessage = {
    student: "Welcome back! Access your enrolled subjects' notes and download study materials.",
    faculty: "Welcome back! Upload and manage notes for your subjects.",
    admin: "Welcome back! Manage users, notes, and platform administration."
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8"
      >
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Welcome to <span className="text-blue-600">Note Nest</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your centralized platform for accessing academic notes. Faculty can upload comprehensive study materials, 
            and students can easily find, search, and download notes for their enrolled subjects.
          </p>
        </div>

        {user ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Hello, {profile?.full_name}!
            </h2>
            <p className="text-blue-700 mb-4">
              {profile?.role ? userRoleMessage[profile.role] : "Welcome to Note Nest!"}
            </p>
            <Link
              to="/notes"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span>Go to Notes</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-colors"
            >
              <Users className="h-5 w-5" />
              <span>Get Started</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-lg font-medium transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
            </div>
            <p className="text-gray-600">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Platform Stats */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"
      >
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Why Choose Note Nest?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Note Nest streamlines academic note sharing between faculty and students, ensuring 
            secure, organized access to study materials while maintaining role-based permissions 
            for optimal security and user experience.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
