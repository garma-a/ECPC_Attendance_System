export interface User {
  id: string;
  email?: string;
  name: string;
  username: string;
  groupName?: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface Session {
  id: string;
  name: string;
  courseName: string;
  date: string; // ISO string
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    name: string;
  };
}

export interface Attendance {
  id: string;
  userId: string;
  sessionId: string;
  latitude?: number | null;
  longitude?: number | null;
  scannedAt: string; // ISO string
  user?: {
    name: string;
    username: string;
    groupName: string;
  };
  session?: {
    name: string;
    courseName: string;
    date?: string;
  };
}

export interface QRToken {
  token: string;
  sessionId: string;
  expiresAt: string;
  createdAt: string;
}

export interface WeeklyBreakdown {
  week: string;
  attended: number;
  absent: number;
}

export interface RecentAttendance {
  id: string;
  sessionName: string;
  courseName: string;
  scannedAt: string;
}

export interface UserStats {
  user: {
    name: string;
    groupName: string;
  };
  stats: {
    totalSessions: number;
    attendanceCount: number;
    absenceCount: number;
    attendanceRate: number;
  };
  weeklyBreakdown: WeeklyBreakdown[];
  recentAttendances: RecentAttendance[];
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  instructor_id: string;
  target_group: string;
  created_at: string;
  instructor?: {
    name: string;
  };
}
