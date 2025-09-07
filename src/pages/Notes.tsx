import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter, Calendar, User, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { supabase, Note } from '../lib/supabase';
import { Modal } from '../components/Modal';
import { UploadNoteForm } from '../components/UploadNoteForm';

export const Notes: React.FC = () => {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // State for filter dropdown options
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchNotes();
    fetchFilterOptions();
  }, [user, profile]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, filterSubject, filterDepartment]);

  const fetchNotes = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      let query = supabase
        .from('notes')
        .select(`
          *,
          uploader:profiles!notes_uploaded_by_fkey(full_name, department)
        `)
        .order('created_at', { ascending: false });

      if (profile.role === 'student' && profile.subjects?.length) {
        query = query.in('subject', profile.subjects);
      } else if (profile.role === 'student') {
        // If student has no subjects, they see no notes.
        setNotes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Fetch all unique departments and subjects from faculty profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('department, subjects')
        .eq('role', 'faculty');

      if (error) throw error;

      if (data) {
        const uniqueDepts = [...new Set(data.map(p => p.department).filter(Boolean) as string[])];
        const allSubjects = data.flatMap(p => p.subjects || []);
        const uniqueSubs = [...new Set(allSubjects)];
        
        setAvailableDepartments(uniqueDepts.sort());
        setAvailableSubjects(uniqueSubs.sort());
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const filterNotes = () => {
    let filtered = notes;

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(lowercasedTerm) ||
        (note.description && note.description.toLowerCase().includes(lowercasedTerm)) ||
        (note.uploader?.full_name && note.uploader.full_name.toLowerCase().includes(lowercasedTerm))
      );
    }

    if (filterSubject) {
      filtered = filtered.filter(note => note.subject === filterSubject);
    }

    if (filterDepartment) {
      filtered = filtered.filter(note => note.department === filterDepartment);
    }

    setFilteredNotes(filtered);
  };

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    fetchNotes(); // Refresh notes list
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === null || bytes === undefined) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload New Note"
      >
        <UploadNoteForm 
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setIsUploadModalOpen(false)}
        />
      </Modal>

      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Academic Notes</h1>
            <p className="text-lg text-gray-600 mt-1">
              {profile?.role === 'student' 
                ? 'Access notes for your enrolled subjects'
                : 'Browse, search, and manage notes'}
            </p>
          </div>
          {profile?.role === 'faculty' && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Note</span>
            </button>
          )}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, description, or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Subjects</option>
                {availableSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Departments</option>
                {availableDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100"
          >
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Notes Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {notes.length === 0 && profile?.role === 'student'
                ? "It looks like you aren't enrolled in any subjects with notes yet, or no notes have been uploaded for your subjects."
                : "No notes match your current search and filter criteria. Try adjusting your filters or check back later."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex-grow space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{note.title}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span>{note.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span>{note.uploader?.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{formatDate(note.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {note.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">{note.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                  <div className="text-xs text-gray-500">
                    {formatFileSize(note.file_size)}
                  </div>
                  <a
                    href={note.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
};
