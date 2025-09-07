import React from 'react';
import { BookOpen, Users, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const About: React.FC = () => {
  const values = [
    {
      icon: BookOpen,
      title: 'Academic Excellence',
      description: 'We believe in empowering students with easy access to quality study materials that enhance their learning experience.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Built by educators, for educators and students. Our platform fosters collaboration between faculty and students.'
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'We prioritize data security and privacy, ensuring that academic content is shared safely and responsibly.'
    },
    {
      icon: Zap,
      title: 'Simple & Efficient',
      description: 'Our intuitive design makes it easy for faculty to upload notes and students to find exactly what they need.'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          About <span className="text-blue-600">Note Nest</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Revolutionizing how academic institutions share and access study materials 
          through a secure, user-friendly platform designed for modern education.
        </p>
      </motion.div>

      {/* Mission Statement */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12"
      >
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Note Nest bridges the gap between faculty and students by providing a centralized, 
            secure platform for academic note sharing. We enable educators to easily distribute 
            study materials while ensuring students have organized access to the resources they 
            need to succeed in their academic journey.
          </p>
        </div>
      </motion.div>

      {/* Core Values */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            These principles guide everything we do at Note Nest
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <value.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Platform Features */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 md:p-12"
      >
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Note Nest Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A simple, three-step process for seamless academic note sharing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Faculty Upload</h3>
              <p className="text-gray-600">
                Faculty members create accounts, set up their profiles with subjects and departments, 
                then upload comprehensive notes for their courses.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Student Enrollment</h3>
              <p className="text-gray-600">
                Students sign up and get enrolled in subjects by administrators, 
                giving them access to relevant study materials.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Access & Download</h3>
              <p className="text-gray-600">
                Students can search, filter, and download notes for their enrolled subjects, 
                making studying more efficient and organized.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact/Support */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions or Feedback?</h2>
        <p className="text-gray-600 mb-6">
          We're continuously improving Note Nest based on user feedback. 
          Your input helps us build a better platform for academic success.
        </p>
        <div className="text-blue-600 font-medium">
          Platform developed with ❤️ for the academic community
        </div>
      </motion.div>
    </div>
  );
};
