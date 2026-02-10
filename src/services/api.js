import { supabase } from '../supabaseClient';

class ApiService {

  async login(username, password) {
    // 1. Auto-append domain for internal system
    const email = username.includes('@') ? username : `${username}@system.local`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    // 1. Get Auth User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 2. Get Profile Data (Role, Name) from your custom table
    const { data: profile, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return profile;
  }

  // --- Admin: Create User (Uses Edge Function) ---

  async createUser(userData) {
    // Calls the 'create-user' Edge Function we built earlier
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: userData
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error); // Handle function-level errors
    return data;
  }

  // --- Session Endpoints ---

  async getSessions() {
    // Select session and include the Creator's name
    const { data, error } = await supabase
      .from('Session')
      .select('*, creator:User(name)')
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getSession(id) {
    const { data, error } = await supabase
      .from('Session')
      .select('*, creator:User(name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createSession(sessionData) {
    // Get current user ID to set as creator
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('Session')
      .insert([{
        ...sessionData,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSession(id) {
    const { error } = await supabase
      .from('Session')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // --- QR & Attendance Endpoints ---

  async getSessionQR(sessionId) {
    // In Supabase, we fetch the token associated with the session
    const { data, error } = await supabase
      .from('QRToken')
      .select('token, expiresAt')
      .eq('sessionId', sessionId)
      .maybeSingle(); // maybeSingle avoids error if no QR exists yet

    if (error) throw error;
    return data;
  }

  async generateSessionQR(sessionId) {
    // Generate a random token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Delete any existing token for this session
    await supabase
      .from('QRToken')
      .delete()
      .eq('sessionId', sessionId);

    // Insert new token
    const { data, error } = await supabase
      .from('QRToken')
      .insert({
        token,
        sessionId,
        expiresAt,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error
    };
    return { token: data.token, expiresAt: data.expiresAt };
  }

  async getSessionAttendance(sessionId, format = "json") {
    // Fetch attendance + Student details
    const { data, error } = await supabase
      .from('Attendance')
      .select('*, user:User(name, username, groupName)')
      .eq('sessionId', sessionId);

    if (error) throw error;

    if (format === "csv") {
      // Basic CSV export logic on frontend
      this._downloadCSV(data, `attendance-${sessionId}.csv`);
      return;
    }
    return data;
  }

  // --- Student: Record Attendance ---

  async recordAttendance(token, latitude = null, longitude = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Find the Session ID for this Token
    const { data: qrData, error: qrError } = await supabase
      .from('QRToken')
      .select('sessionId, expiresAt')
      .eq('token', token)
      .single();

    if (qrError || !qrData) throw new Error("Invalid QR Code");

    // 2. Check Expiration
    if (new Date(qrData.expiresAt) < new Date()) {
      throw new Error("QR Code Expired");
    }

    // 3. Record Attendance
    const { data, error } = await supabase
      .from('Attendance')
      .insert({
        userId: user.id,
        sessionId: qrData.sessionId,
        latitude,
        longitude,
        scannedAt: new Date(),
        createdAt: new Date().toISOString()
      })
      .select('id, scannedAt, session:Session(name, courseName)')
      .single();

    if (error) {
      if (error.code === '23505') throw new Error("You have already scanned this QR.");
      throw error;
    }

    return {
      message: "Attendance recorded successfully!",
      messageAr: "تم تسجيل الحضور بنجاح!",
      attendance: {
        id: data.id,
        sessionName: data.session?.name || 'Unknown',
        courseName: data.session?.courseName || 'Unknown',
        scannedAt: data.scannedAt,
      }
    };
  }

  // --- Student: Stats ---

  async getUserStats(userId) {
    // 1. Get user profile
    const { data: userProfile, error: userError } = await supabase
      .from('User')
      .select('name, groupName')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 2. Get total sessions count
    const { count: totalSessions, error: sessionsError } = await supabase
      .from('Session')
      .select('*', { count: 'exact', head: true });

    if (sessionsError) throw sessionsError;

    // 3. Get user's attendances with session info
    const { data: attendances, error: attError } = await supabase
      .from('Attendance')
      .select('id, scannedAt, session:Session(name, courseName, date)')
      .eq('userId', userId)
      .order('scannedAt', { ascending: false });

    if (attError) throw attError;

    const attendanceCount = attendances?.length || 0;
    const absenceCount = (totalSessions || 0) - attendanceCount;
    const attendanceRate = totalSessions > 0
      ? Math.round((attendanceCount / totalSessions) * 100)
      : 0;

    // 4. Build weekly breakdown (last 8 weeks)
    const weeklyBreakdown = this._buildWeeklyBreakdown(attendances || [], totalSessions || 0);

    // 5. Build recent attendances list
    const recentAttendances = (attendances || []).slice(0, 10).map(att => ({
      id: att.id,
      sessionName: att.session?.name || 'Unknown',
      courseName: att.session?.courseName || 'Unknown',
      scannedAt: att.scannedAt,
    }));

    return {
      user: userProfile,
      stats: {
        totalSessions: totalSessions || 0,
        attendanceCount,
        absenceCount: Math.max(0, absenceCount),
        attendanceRate,
      },
      weeklyBreakdown,
      recentAttendances,
    };
  }

  _buildWeeklyBreakdown(attendances, totalSessions) {
    // Group attendances by ISO week
    const weekMap = {};
    const now = new Date();

    // Create entries for the last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekLabel = this._getWeekLabel(d);
      weekMap[weekLabel] = { week: weekLabel, attended: 0, absent: 0 };
    }

    // Count attendances per week
    for (const att of attendances) {
      const weekLabel = this._getWeekLabel(new Date(att.scannedAt));
      if (weekMap[weekLabel]) {
        weekMap[weekLabel].attended++;
      }
    }

    return Object.values(weekMap);
  }

  _getWeekLabel(date) {
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    // Get Monday of that week
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    return `${monday.toLocaleString('en-US', { month: 'short' })} ${monday.getDate()}`;
  }

  // --- Admin: User Management ---

  async getUsers() {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }

  async getAllAttendance() {
    const { data, error } = await supabase
      .from('Attendance')
      .select('*, user:User(name, username), session:Session(name)')
      .order('scannedAt', { ascending: false });

    if (error) throw error;
    return data;
  }

  async deleteUser(userId) {
    // Calls the 'delete-user' Edge Function to remove from Auth and Public table
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });

    if (error) throw new Error(error.message);
    if (data && data.error) throw new Error(data.error);
  }

  async deleteAttendance(attendanceId) {
    const { error } = await supabase
      .from('Attendance')
      .delete()
      .eq('id', attendanceId);

    if (error) throw error;
  }

  async addAttendance(userId, sessionId) {
    // Admin manually adding attendance
    const { data, error } = await supabase
      .from('Attendance')
      .insert({
        userId,
        sessionId,
        scannedAt: new Date(),
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error("Attendance already recorded for this user and session.");
      throw error;
    }
    return data;
  }

  // --- Helper: CSV Downloader ---
  _downloadCSV(data, filename) {
    if (!data || !data.length) return;

    const headers = ['Name', 'Username', 'Group', 'Scanned At'];
    const rows = data.map(row => [
      row.user?.name,
      row.user?.username,
      row.user?.groupName,
      new Date(row.scannedAt).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default new ApiService();
