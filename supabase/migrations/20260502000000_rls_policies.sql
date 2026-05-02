-- =============================================
-- RLS Policies for ACPC Attendance System
-- =============================================

-- =============================================
-- USER TABLE
-- =============================================
-- Enable RLS (in case not already enabled)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read ALL users
-- (needed for admin panel, instructor dashboards, attendance lists)
CREATE POLICY "Authenticated users can view all users"
  ON public."User"
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public."User"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to do everything (edge functions use service role)
-- Note: service role bypasses RLS by default, so no explicit policy needed

-- =============================================
-- SESSION TABLE
-- =============================================
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view sessions
CREATE POLICY "Authenticated users can view sessions"
  ON public."Session"
  FOR SELECT
  TO authenticated
  USING (true);

-- Instructors and admins can create/update/delete sessions
CREATE POLICY "Instructors and admins can manage sessions"
  ON public."Session"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
  );

-- =============================================
-- ATTENDANCE TABLE
-- =============================================
ALTER TABLE public."Attendance" ENABLE ROW LEVEL SECURITY;

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance"
  ON public."Attendance"
  FOR SELECT
  TO authenticated
  USING (
    "userId" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
  );

-- Students can insert their own attendance
CREATE POLICY "Students can insert own attendance"
  ON public."Attendance"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid());

-- Admins/Instructors can delete attendance
CREATE POLICY "Admins and instructors can delete attendance"
  ON public."Attendance"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
  );

-- Admins can insert attendance on behalf of students
CREATE POLICY "Admins can insert any attendance"
  ON public."Attendance"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================
-- QRTOKEN TABLE
-- =============================================
ALTER TABLE public."QRToken" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read QR tokens (needed for scanning)
CREATE POLICY "Authenticated users can read QR tokens"
  ON public."QRToken"
  FOR SELECT
  TO authenticated
  USING (true);

-- Instructors and admins can manage QR tokens
CREATE POLICY "Instructors and admins can manage QR tokens"
  ON public."QRToken"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
  );

-- =============================================
-- ANNOUNCEMENT TABLE
-- =============================================
ALTER TABLE public."Announcement" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read announcements
CREATE POLICY "Authenticated users can read announcements"
  ON public."Announcement"
  FOR SELECT
  TO authenticated
  USING (true);

-- Instructors and admins can create announcements
CREATE POLICY "Instructors and admins can create announcements"
  ON public."Announcement"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
  );

-- Instructors and admins can delete their own announcements
CREATE POLICY "Instructors and admins can delete announcements"
  ON public."Announcement"
  FOR DELETE
  TO authenticated
  USING (
    instructor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================
-- RESOURCE TABLE
-- =============================================
ALTER TABLE public."Resource" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view resources
CREATE POLICY "Authenticated users can view resources"
  ON public."Resource"
  FOR SELECT
  TO authenticated
  USING (true);

-- Instructors and admins can manage resources
CREATE POLICY "Instructors and admins can manage resources"
  ON public."Resource"
  FOR ALL
  TO authenticated
  USING (
    instructor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
  );

-- =============================================
-- ANNOUNCEMENTCOMMENT TABLE
-- =============================================
ALTER TABLE public."AnnouncementComment" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read comments
CREATE POLICY "Authenticated users can read comments"
  ON public."AnnouncementComment"
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public."AnnouncementComment"
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public."AnnouncementComment"
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments; admins can delete any
CREATE POLICY "Users and admins can delete comments"
  ON public."AnnouncementComment"
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
