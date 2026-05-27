import React from "react";
import { Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Screen, StatCard, styles } from "../components/NativeUI";

const roleMenus = {
  student: [
    ["Courses", "StudentCourses"],
    ["Attendance", "StudentAttendance"],
    ["Monitoring", "StudentMonitoring"],
    ["Rate Lecturers", "StudentRating"],
  ],
  lecturer: [
    ["Classes", "LecturerClasses"],
    ["Reports", "LecturerReports"],
    ["Attendance", "LecturerAttendance"],
    ["Monitoring", "LecturerMonitoring"],
    ["Ratings", "LecturerRating"],
  ],
  pl: [
    ["User Management", "PLUsers"],
    ["Courses", "PLCourses"],
    ["Classes", "PLClasses"],
    ["Lecturers", "PLLecturers"],
    ["Reports", "PLReports"],
    ["Monitoring", "PLMonitoring"],
    ["Ratings", "PLRating"],
  ],
  prl: [
    ["Courses", "PRLCourses"],
    ["Classes", "PRLClasses"],
    ["Reports", "PRLReports"],
    ["Monitoring", "PRLMonitoring"],
    ["Ratings", "PRLRating"],
  ],
};

export default function HomeScreen({ navigation }) {
  const { userProfile, currentUser, logout } = useAuth();
  const role = userProfile?.role || "student";
  const menu = roleMenus[role] || roleMenus.student;
  const roleLabel = {
    student: "Student",
    lecturer: "Lecturer",
    prl: "Principal Lecturer",
    pl: "Program Leader",
  }[role] || "User";

  return (
    <Screen title={`Welcome, ${userProfile?.fullName || userProfile?.name || "User"}`} subtitle={userProfile?.faculty || role.toUpperCase()}>
      <Card>
        <View style={styles.split}>
          <View style={styles.row}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>LU</Text>
            </View>
            <View>
              <Text style={styles.strong}>LUCT Reporting System</Text>
              <Text style={styles.muted}>{currentUser?.email}</Text>
              <Text style={styles.muted}>Role: {role.toUpperCase()}</Text>
            </View>
          </View>
          <Button variant="secondary" onPress={logout}>Sign Out</Button>
        </View>
      </Card>
      <View style={styles.statGrid}>
        <StatCard label="Role" value={roleLabel} tone="primary" />
        <StatCard label="Faculty" value={userProfile?.faculty ? "Assigned" : "Pending"} tone="secondary" />
        <StatCard label="Account" value="Active" tone="success" />
      </View>
      <Card>
        <Text style={styles.strong}>Dashboard Navigation</Text>
        <Text style={styles.muted}>Use the same sections from the original reporting system.</Text>
        <View style={{ gap: 10 }}>
          {menu.map(([label, route]) => (
            <TouchableNav key={route} label={label} onPress={() => navigation.navigate(route)} />
          ))}
          <TouchableNav label="Profile" onPress={() => navigation.navigate("Profile")} />
        </View>
      </Card>
    </Screen>
  );
}

function TouchableNav({ label, onPress }) {
  return (
    <View style={styles.navItem}>
      <Button onPress={onPress}>{label}</Button>
    </View>
  );
}
