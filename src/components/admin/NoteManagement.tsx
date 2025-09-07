import React, { useState, useEffect } from 'react';
import { supabase, Note } from '../../lib/supabase';
import { Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const NoteManagement: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*, uploader:profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (note: Note) => {
    if (window.confirm(`Are you sure you want to delete the note "${note.title}"? This action is irreversible.`)) {
      try {
        // Delete file from storage
        const filePath = note.file_url.split('/notes-files/')[1];
        if (filePath) {
          const { error: storageError } = await supabase.storage.from('notes-files').remove([filePath]);
          if (storageError) console.error("Could not delete file from storage, but proceeding with DB deletion:", storageError.message);
        }

        // Delete note from database
        const { error: dbError } = await supabase.from('notes').delete().eq('id', note.id);
        if (dbError) throw dbError;

        setNotes(notes.filter(n => n.id !== note.id));
      } catch (error: any) {
        setError(error.message || 'Failed to delete note');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Notes</h2>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploader</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notes.map(note => (
                <tr key={note.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{note.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{note.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{note.uploader?.full_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(note.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleDeleteNote(note)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
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
