import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, styles } from "./NativeUI";

const NAV_ITEMS = {
  student: [
    ["H", "Dashboard", "Dashboard"],
    ["C", "Enroll Courses", "StudentCourses"],
    ["M", "Monitoring", "StudentMonitoring"],
    ["R", "Rating", "StudentRating"],
    ["A", "Attendance", "StudentAttendance"],
    ["P", "Profile", "Profile"],
  ],
  lecturer: [
    ["H", "Dashboard", "Dashboard"],
    ["C", "My Classes", "LecturerClasses"],
    ["P", "Reports", "LecturerReports"],
    ["M", "Monitoring", "LecturerMonitoring"],
    ["R", "Ratings", "LecturerRating"],
    ["A", "Attendance", "LecturerAttendance"],
    ["U", "Profile", "Profile"],
  ],
  prl: [
    ["H", "Dashboard", "Dashboard"],
    ["C", "Courses", "PRLCourses"],
    ["P", "Reports", "PRLReports"],
    ["M", "Monitoring", "PRLMonitoring"],
    ["R", "Ratings", "PRLRating"],
    ["U", "Profile", "Profile"],
  ],
  pl: [
    ["H", "Dashboard", "Dashboard"],
    ["U", "User Management", "PLUsers"],
    ["C", "Courses", "PLCourses"],
    ["P", "Reports", "PLReports"],
    ["M", "Monitoring", "PLMonitoring"],
    ["L", "Classes", "PLClasses"],
    ["E", "Lecturers", "PLLecturers"],
    ["R", "Ratings", "PLRating"],
    ["O", "Profile", "Profile"],
  ],
};

const ROLE_LABELS = {
  student: "Student",
  lecturer: "Lecturer",
  prl: "Principal Lecturer",
  pl: "Program Leader",
};

export default function OriginalShell({ children, navigation, routeName, title = "Dashboard" }) {
  const { userProfile, logout } = useAuth();
  const { width } = useWindowDimensions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = userProfile?.role || "student";
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.student;
  const isWide = width >= 820;
  const initials = useMemo(() => {
    const name = userProfile?.fullName || userProfile?.name || "User";
    return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }, [userProfile]);

  const navigate = (target) => {
    setMobileOpen(false);
    if (target !== routeName) navigation.navigate(target);
  };

  const sidebar = (
    <View style={[shellStyles.sidebar, !isWide && shellStyles.mobileSidebar]}>
      <View style={shellStyles.sidebarHeader}>
        <View style={shellStyles.sidebarLogo}>
          <Text style={shellStyles.sidebarLogoText}>LU</Text>
        </View>
        <View>
          <Text style={shellStyles.sidebarTitle}>LUCT</Text>
          <Text style={shellStyles.sidebarSubtitle}>Reporting System</Text>
        </View>
      </View>

      <ScrollView style={shellStyles.sidebarNav} contentContainerStyle={{ paddingBottom: 12 }}>
        <Text style={shellStyles.navSectionLabel}>Navigation</Text>
        {navItems.map(([icon, label, target]) => {
          const active = target === routeName;
          return (
            <Pressable key={target} onPress={() => navigate(target)} style={[shellStyles.navItem, active && shellStyles.navItemActive]}>
              <Text style={[shellStyles.navIcon, active && shellStyles.navTextActive]}>{icon}</Text>
              <Text style={[shellStyles.navText, active && shellStyles.navTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={shellStyles.sidebarFooter}>
        <View style={shellStyles.userCard}>
          <View style={shellStyles.userAvatar}>
            <Text style={shellStyles.userAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={shellStyles.userName}>{userProfile?.fullName || userProfile?.name || "User"}</Text>
            <Text style={shellStyles.userRole}>{ROLE_LABELS[role]}</Text>
          </View>
        </View>
        <Pressable onPress={logout} style={shellStyles.signOutButton}>
          <Text style={shellStyles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={shellStyles.appLayout}>
      {isWide ? sidebar : mobileOpen ? (
        <>
          <Pressable style={shellStyles.overlay} onPress={() => setMobileOpen(false)} />
          {sidebar}
        </>
      ) : null}
      <View style={shellStyles.mainContent}>
        <View style={shellStyles.topbar}>
          {!isWide && (
            <Pressable style={shellStyles.menuButton} onPress={() => setMobileOpen(true)}>
              <Text style={shellStyles.menuButtonText}>Menu</Text>
            </Pressable>
          )}
          <Text style={shellStyles.topbarTitle}>{title}</Text>
        </View>
        <View style={shellStyles.pageContainer}>{children}</View>
      </View>
    </View>
  );
}

const shellStyles = {
  appLayout: { flex: 1, flexDirection: "row", backgroundColor: colors.bg },
  mainContent: { flex: 1, backgroundColor: colors.bg },
  pageContainer: { flex: 1 },
  sidebar: {
    width: 260,
    backgroundColor: colors.sidebar,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    height: "100%",
    zIndex: 100,
  },
  mobileSidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 90,
  },
  sidebarHeader: {
    height: 76,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sidebarLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarLogoText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  sidebarTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
  sidebarSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  sidebarNav: { flex: 1, paddingHorizontal: 8, paddingTop: 12 },
  navSectionLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: { backgroundColor: "rgba(108,99,255,0.25)" },
  navIcon: { color: colors.muted, width: 22, textAlign: "center", fontWeight: "800" },
  navText: { color: colors.muted, fontWeight: "600", fontSize: 14 },
  navTextActive: { color: colors.primaryLight },
  sidebarFooter: { padding: 8, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  userName: { color: colors.text, fontWeight: "700", fontSize: 13 },
  userRole: { color: colors.muted, fontSize: 11 },
  signOutButton: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: { color: colors.text, fontWeight: "700" },
  topbar: {
    height: 60,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  menuButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: "center",
  },
  menuButtonText: { color: colors.text, fontWeight: "700" },
  topbarTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
};
