import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

const translations = {
  en: {
    // Common
    login: "Login",
    logout: "Logout",
    username: "Username",
    password: "Password",
    name: "Name",
    submit: "Submit",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    loading: "Loading...",
    error: "Error",
    success: "Success",

    // Navigation
    dashboard: "Dashboard",
    scanQR: "Scan QR",
    profile: "Profile",
    sessions: "Sessions",
    adminPanel: "Admin Panel",

    // Student Dashboard
    welcome: "Welcome",
    totalSessions: "Total Sessions",
    attendanceCount: "Attendance",
    absenceCount: "Absences",
    attendanceRate: "Attendance Rate",
    weeklyBreakdown: "Weekly Breakdown",
    recentAttendance: "Recent Attendance",
    week: "Week",
    attended: "Attended",
    absent: "Absent",

    // Scan QR
    scanQRCode: "Scan QR Code",
    scanInstructions:
      "Point your camera at the QR code displayed by your instructor",
    startScanning: "Start Scanning",
    stopScanning: "Stop Scanning",
    scanSuccess: "Attendance recorded successfully!",
    scanError: "Failed to record attendance",

    // Instructor Dashboard
    createSession: "Create Session",
    sessionName: "Session Name",
    courseName: "Course Name",
    sessionDate: "Session Date",
    generateQR: "Generate QR Code",
    showQR: "Show QR Code",
    liveAttendance: "Live Attendance",
    exportCSV: "Export CSV",
    studentsPresent: "Students Present",

    // Admin Panel
    userManagement: "User Management",
    attendanceRecords: "Attendance Records",
    users: "Users",
    role: "Role",
    group: "Group",
    student: "Student",
    instructor: "Instructor",
    admin: "Admin",
    createUser: "Create User",
    groupName: "Group Name"

  },
  ar: {
    // Common
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    name: "الاسم",
    submit: "إرسال",
    cancel: "إلغاء",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    close: "إغلاق",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجح",

    // Navigation
    dashboard: "لوحة التحكم",
    scanQR: "مسح رمز QR",
    profile: "الملف الشخصي",
    sessions: "الجلسات",
    adminPanel: "لوحة المدير",

    // Student Dashboard
    welcome: "مرحباً",
    totalSessions: "إجمالي الجلسات",
    attendanceCount: "الحضور",
    absenceCount: "الغياب",
    attendanceRate: "معدل الحضور",
    weeklyBreakdown: "التفصيل الأسبوعي",
    recentAttendance: "الحضور الأخير",
    week: "أسبوع",
    attended: "حضر",
    absent: "غائب",

    // Scan QR
    scanQRCode: "مسح رمز QR",
    scanInstructions: "وجه الكاميرا نحو رمز QR المعروض من قبل المحاضر",
    startScanning: "بدء المسح",
    stopScanning: "إيقاف المسح",
    scanSuccess: "تم تسجيل الحضور بنجاح!",
    scanError: "فشل في تسجيل الحضور",

    // Instructor Dashboard
    createSession: "إنشاء جلسة",
    sessionName: "اسم الجلسة",
    courseName: "اسم المادة",
    sessionDate: "تاريخ الجلسة",
    generateQR: "إنشاء رمز QR",
    showQR: "عرض رمز QR",
    liveAttendance: "الحضور المباشر",
    exportCSV: "تصدير CSV",
    studentsPresent: "الطلاب الحاضرون",

    // Admin Panel
    userManagement: "إدارة المستخدمين",
    attendanceRecords: "سجلات الحضور",
    users: "المستخدمون",
    role: "الدور",
    group: "المجموعة",
    student: "طالب",
    instructor: "محاضر",
    admin: "مدير",
    createUser: "انشاء مستخدم",
    groupName: "اسم الجروب"

  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "ar";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.setAttribute(
      "dir",
      language === "ar" ? "rtl" : "ltr"
    );
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
  };

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
