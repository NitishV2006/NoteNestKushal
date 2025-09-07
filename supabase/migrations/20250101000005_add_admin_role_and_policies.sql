/*
  # [Operation] Admin Role and Policies Setup
  [This migration script establishes the 'admin' role, updates all relevant security policies to grant admins full platform access, and assigns the admin role to a specified user.]

  ## Query Description: [This operation modifies security rules across the 'profiles', 'notes', and 'enrollments' tables to recognize and empower the 'admin' role. It grants admins full CRUD (Create, Read, Update, Delete) permissions on all data. It also directly promotes one user to an admin. Ensure the target user exists before running.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: true
  - Reversible: false
  
  ## Structure Details:
  - Modifies RLS policies on tables: `profiles`, `notes`, `enrollments`.
  - Updates one row in the `profiles` table.
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [Yes]
  - Auth Requirements: [This script creates a super-user role with unrestricted access.]
  
  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [Low. Policy changes will be evaluated on future queries.]
*/

-- Step 1: Update RLS policies for the 'profiles' table to grant admin access.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile or admins can view all."
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile or admins can update all."
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id OR get_my_role() = 'admin');

-- Step 2: Update RLS policies for the 'notes' table to grant admin access.
DROP POLICY IF EXISTS "Users can view notes based on role." ON public.notes;
CREATE POLICY "Users can view notes based on role, admins can view all."
ON public.notes FOR SELECT
USING (
  (get_my_role() = 'admin') OR
  (get_my_role() = 'faculty') OR
  (
    (get_my_role() = 'student') AND
    (subject IN (
      SELECT unnest(subjects)
      FROM public.profiles
      WHERE user_id = auth.uid()
    ))
  )
);

DROP POLICY IF EXISTS "Faculty can insert notes." ON public.notes;
CREATE POLICY "Faculty and admins can insert notes."
ON public.notes FOR INSERT
WITH CHECK (get_my_role() IN ('faculty', 'admin'));

DROP POLICY IF EXISTS "Faculty can update their own notes." ON public.notes;
CREATE POLICY "Faculty can update their own notes, admins can update all."
ON public.notes FOR UPDATE
USING (
  (get_my_role() = 'admin') OR
  (uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Faculty can delete their own notes." ON public.notes;
CREATE POLICY "Faculty can delete their own notes, admins can delete all."
ON public.notes FOR DELETE
USING (
  (get_my_role() = 'admin') OR
  (uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Step 3: Update RLS policies for the 'enrollments' table to grant admin access.
DROP POLICY IF EXISTS "Admins can manage enrollments." ON public.enrollments;
CREATE POLICY "Admins can manage enrollments."
ON public.enrollments FOR ALL
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

-- Step 4: Assign the 'admin' role to the specified user.
-- IMPORTANT: Ensure a user with this email has already signed up.
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'deepthipathigulla@gmail.com';
