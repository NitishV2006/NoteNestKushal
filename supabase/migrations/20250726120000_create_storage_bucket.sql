/*
# [Feature] Create Storage Bucket for Notes
Creates the 'notes' storage bucket and sets up security policies for file uploads and downloads.

## Query Description:
This script initializes the file storage system for the application. It creates a new public bucket named 'notes' where all uploaded academic notes will be stored. It also configures the necessary security rules (Row Level Security) to control who can upload, download, update, and delete files.

- **Bucket Creation**: A new bucket `notes` is created.
- **Security Policies**:
  - **Faculty Uploads**: Only users with the 'faculty' role can upload new files.
  - **Authenticated Downloads**: Any logged-in user (student or faculty) can download files.
  - **Owner Updates/Deletes**: Faculty can only modify or delete the files they have personally uploaded.

This operation is safe and does not affect existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (Policies and bucket can be dropped)

## Structure Details:
- Creates bucket: `storage.buckets('notes')`
- Adds RLS policies to: `storage.objects`

## Security Implications:
- RLS Status: Enabled on `storage.objects` for this bucket.
- Policy Changes: Yes, new policies are created.
- Auth Requirements: Policies rely on the user's authentication status and role.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. RLS checks are efficient.
*/

-- 1. Create the storage bucket for notes if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies for 'notes' bucket to ensure a clean state
DROP POLICY IF EXISTS "Allow authenticated read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow faculty to upload notes" ON storage.objects;
DROP POLICY IF EXISTS "Allow faculty to update their own notes" ON storage.objects;
DROP POLICY IF EXISTS "Allow faculty to delete their own notes" ON storage.objects;

-- 3. Create RLS policies for the 'notes' bucket

-- Allow authenticated users to view/download files
CREATE POLICY "Allow authenticated read access"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notes');

-- Allow faculty members to upload new files
CREATE POLICY "Allow faculty to upload notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notes' AND get_my_role() = 'faculty');

-- Allow faculty members to update their own files
CREATE POLICY "Allow faculty to update their own notes"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner AND bucket_id = 'notes')
WITH CHECK (auth.uid() = owner AND bucket_id = 'notes');

-- Allow faculty members to delete their own files
CREATE POLICY "Allow faculty to delete their own notes"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner AND bucket_id = 'notes');
