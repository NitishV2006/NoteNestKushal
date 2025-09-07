/*
# Note Nest Database Schema Creation
This migration creates the foundational database structure for the Note Nest academic platform, including user profiles, notes, and enrollment management.

## Query Description: 
This operation creates new tables and relationships for the Note Nest platform. This is a safe initial setup that creates user profiles, notes storage, and enrollment tracking. No existing data will be affected as these are new tables.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- profiles: User profile information linked to auth.users
- notes: Academic notes uploaded by faculty
- enrollments: Student subject enrollment tracking

## Security Implications:
- RLS Status: Enabled on all tables
- Policy Changes: Yes - comprehensive RLS policies for role-based access
- Auth Requirements: All tables require authentication

## Performance Impact:
- Indexes: Added for foreign keys and search optimization
- Triggers: Profile creation trigger on auth.users
- Estimated Impact: Minimal - optimized for read/write operations
*/

-- Enable RLS on auth.users is not allowed, so we work with public tables only

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')) DEFAULT 'student',
    subjects TEXT[], -- Array of subjects for faculty/students
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create notes table for academic content
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    department TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    description TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create enrollments table for student-subject relationships
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    department TEXT NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(student_id, subject, department)
);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_notes_uploaded_by ON public.notes(uploaded_by);
CREATE INDEX idx_notes_subject ON public.notes(subject);
CREATE INDEX idx_notes_department ON public.notes(department);
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_subject ON public.enrollments(subject);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Notes policies
CREATE POLICY "Faculty can insert their own notes" ON public.notes
    FOR INSERT WITH CHECK (
        auth.uid() = uploaded_by AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

CREATE POLICY "Faculty can update their own notes" ON public.notes
    FOR UPDATE USING (
        auth.uid() = uploaded_by AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

CREATE POLICY "Faculty can delete their own notes" ON public.notes
    FOR DELETE USING (
        auth.uid() = uploaded_by AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

CREATE POLICY "Students can view notes for enrolled subjects" ON public.notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.profiles p ON p.user_id = e.student_id
            WHERE e.student_id = auth.uid() 
            AND e.subject = notes.subject 
            AND e.department = notes.department
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

CREATE POLICY "Faculty and admin can view all notes" ON public.notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

CREATE POLICY "Admins can delete any notes" ON public.notes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Enrollments policies
CREATE POLICY "Students can view their own enrollments" ON public.enrollments
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all enrollments" ON public.enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert enrollments" ON public.enrollments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
