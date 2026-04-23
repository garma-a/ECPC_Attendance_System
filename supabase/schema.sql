-- User Table (linked to auth.users)
CREATE TABLE public."User" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    "groupName" TEXT,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin'))
);

-- Session Table
CREATE TABLE public."Session" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    "createdBy" UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE public."Attendance" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    "sessionId" UUID REFERENCES public."Session"(id) ON DELETE CASCADE,
    latitude NUMERIC,
    longitude NUMERIC,
    "scannedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("userId", "sessionId")
);

-- QRToken Table
CREATE TABLE public."QRToken" (
    token TEXT PRIMARY KEY,
    "sessionId" UUID REFERENCES public."Session"(id) ON DELETE CASCADE,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcement Table
CREATE TABLE public."Announcement" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    instructor_id UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    target_group TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resource Table
CREATE TABLE public."Resource" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    image_url TEXT,
    instructor_id UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AnnouncementComment Table
CREATE TABLE public."AnnouncementComment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    announcement_id UUID REFERENCES public."Announcement"(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public."AnnouncementComment"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
