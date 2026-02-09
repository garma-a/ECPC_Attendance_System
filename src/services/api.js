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
        createdBy: user.id
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
        scannedAt: new Date()
      });

    if (error) {
      if (error.code === '23505') throw new Error("You have already scanned this QR.");
      throw error;
    }
    return data;
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
    // Note: This only deletes from the Public table. 
    // To delete from Auth, you need another Edge Function (similar to create-user).
    // For now, this effectively "bans" them from the app.
    const { error } = await supabase
      .from('User')
      .delete()
      .eq('id', userId);

    if (error) throw error;
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
      .insert({ userId, sessionId });

    if (error) throw error;
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
