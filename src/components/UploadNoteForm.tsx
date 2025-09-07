import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { UploadCloud, File, Loader2 } from 'lucide-react';

interface UploadNoteFormProps {
  onUploadSuccess: () => void;
  onClose: () => void;
}

export const UploadNoteForm: React.FC<UploadNoteFormProps> = ({ onUploadSuccess, onClose }) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile?.subjects && profile.subjects.length > 0) {
      setSubject(profile.subjects[0]);
    }
  }, [profile?.subjects]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size cannot exceed 5MB.');
        setFile(null);
      } else {
        setFile(selectedFile);
        setError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !subject || !user || !profile) {
      setError('Please fill all required fields and select a file.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Upload file to Supabase Storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('notes-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('notes-files')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('Could not get public URL for the file.');

      // 3. Insert note metadata into the database
      const { error: insertError } = await supabase.from('notes').insert({
        title,
        description,
        subject,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        department: profile.department,
        uploaded_by: profile.id, // This should be the profile ID
      });

      if (insertError) throw insertError;

      setSuccess('Note uploaded successfully!');
      setTimeout(() => {
        onUploadSuccess();
      }, 1500);

    } catch (error: any) {
      console.error('Error uploading note:', error);
      setError(error.message || 'An unexpected error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role === 'faculty' && (!profile.subjects || profile.subjects.length === 0)) {
    return (
      <div className="text-center space-y-4 py-4">
        <h4 className="font-semibold text-lg text-gray-800">No Subjects Found</h4>
        <p className="text-gray-600">
          You must have at least one subject associated with your profile to upload notes.
        </p>
        <Link 
          to="/profile" 
          onClick={onClose} 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Go to Profile to Add Subjects
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Note Title *
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Introduction to Algorithms"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          Subject *
        </label>
        <select
          id="subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
        >
          <option value="" disabled>Select a subject</option>
          {profile?.subjects?.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="A brief summary of the note's content..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload File *
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {file ? (
              <div className="flex items-center space-x-2 text-gray-700">
                <File className="h-8 w-8 text-blue-500" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt,.ppt,.pptx" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, DOC, PPT, TXT up to 5MB</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !file}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" />
              <span>Upload Note</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
