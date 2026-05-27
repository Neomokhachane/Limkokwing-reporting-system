import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import OriginalShell from "../components/OriginalShell";
import AuthScreen from "../screens/authentication/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import StudentCoursesScreen from "../screens/student/StudentCoursesScreen";
import StudentAttendanceScreen from "../screens/student/StudentAttendanceScreen";
import StudentMonitoringScreen from "../screens/student/StudentMonitoringScreen";
import StudentRatingScreen from "../screens/student/StudentRatingScreen";
import LecturerClassesScreen from "../screens/lecturer/LecturerClassesScreen";
import LecturerReportsScreen from "../screens/lecturer/LecturerReportsScreen";
import LecturerAttendanceScreen from "../screens/lecturer/LecturerAttendanceScreen";
import LecturerMonitoringScreen from "../screens/lecturer/LecturerMonitoringScreen";
import LecturerRatingScreen from "../screens/lecturer/LecturerRatingScreen";
import PLUserManagementScreen from "../screens/programLeader/PLUserManagementScreen";
import PLCoursesScreen from "../screens/programLeader/PLCoursesScreen";
import PLClassesScreen from "../screens/programLeader/PLClassesScreen";
import PLLecturersScreen from "../screens/programLeader/PLLecturersScreen";
import PLReportsScreen from "../screens/programLeader/PLReportsScreen";
import PLMonitoringScreen from "../screens/programLeader/PLMonitoringScreen";
import PLRatingScreen from "../screens/programLeader/PLRatingScreen";
import PRLCoursesScreen from "../screens/principalLecturer/PRLCoursesScreen";
import PRLClassesScreen from "../screens/principalLecturer/PRLClassesScreen";
import PRLReportsScreen from "../screens/principalLecturer/PRLReportsScreen";
import PRLMonitoringScreen from "../screens/principalLecturer/PRLMonitoringScreen";
import PRLRatingScreen from "../screens/principalLecturer/PRLRatingScreen";
import { colors } from "../components/NativeUI";

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
};

function LoadingAuth() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { currentUser, userProfile, loading } = useAuth();
  const role = userProfile?.role || "student";

  if (loading) return <LoadingAuth />;

  const shell = (props, title, children) => (
    <OriginalShell navigation={props.navigation} routeName={props.route.name} title={title}>
      {children}
    </OriginalShell>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!currentUser ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Dashboard">
              {(props) => shell(props, "Dashboard", <HomeScreen {...props} />)}
            </Stack.Screen>
            <Stack.Screen name="Profile">
              {(props) => shell(props, "Profile", <ProfileScreen {...props} />)}
            </Stack.Screen>

            {role === "student" && (
              <>
                <Stack.Screen name="StudentCourses">
                  {(props) => shell(props, "Courses", <StudentCoursesScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="StudentAttendance" options={{ title: "Attendance" }}>
                  {(props) => shell(props, "Attendance", <StudentAttendanceScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="StudentMonitoring" options={{ title: "Monitoring" }}>
                  {(props) => shell(props, "Monitoring", <StudentMonitoringScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="StudentRating" options={{ title: "Rate Lecturers" }}>
                  {(props) => shell(props, "Rating", <StudentRatingScreen {...props} />)}
                </Stack.Screen>
              </>
            )}

            {role === "lecturer" && (
              <>
                <Stack.Screen name="LecturerClasses" options={{ title: "Classes" }}>
                  {(props) => shell(props, "My Classes", <LecturerClassesScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="LecturerReports" options={{ title: "Reports" }}>
                  {(props) => shell(props, "Reports", <LecturerReportsScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="LecturerAttendance" options={{ title: "Attendance" }}>
                  {(props) => shell(props, "Attendance", <LecturerAttendanceScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="LecturerMonitoring" options={{ title: "Monitoring" }}>
                  {(props) => shell(props, "Monitoring", <LecturerMonitoringScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="LecturerRating" options={{ title: "Ratings" }}>
                  {(props) => shell(props, "Ratings", <LecturerRatingScreen {...props} />)}
                </Stack.Screen>
              </>
            )}

            {role === "pl" && (
              <>
                <Stack.Screen name="PLUsers">
                  {(props) => shell(props, "User Management", <PLUserManagementScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PLCourses" options={{ title: "Courses" }}>
                  {(props) => shell(props, "Courses", <PLCoursesScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PLClasses" options={{ title: "Classes" }}>
                  {(props) => shell(props, "Classes", <PLClassesScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PLLecturers">
                  {(props) => shell(props, "Lecturers", <PLLecturersScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PLReports" options={{ title: "Reports" }}>
                  {(props) => shell(props, "Reports", <PLReportsScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PLMonitoring" options={{ title: "Monitoring" }}>
                  {(props) => shell(props, "Monitoring", <PLMonitoringScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PLRating" options={{ title: "Ratings" }}>
                  {(props) => shell(props, "Ratings", <PLRatingScreen {...props} />)}
                </Stack.Screen>
              </>
            )}

            {role === "prl" && (
              <>
                <Stack.Screen name="PRLCourses" options={{ title: "Courses" }}>
                  {(props) => shell(props, "Courses", <PRLCoursesScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PRLClasses" options={{ title: "Classes" }}>
                  {(props) => shell(props, "Classes", <PRLClassesScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PRLReports" options={{ title: "Reports" }}>
                  {(props) => shell(props, "Reports", <PRLReportsScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PRLMonitoring" options={{ title: "Monitoring" }}>
                  {(props) => shell(props, "Monitoring", <PRLMonitoringScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PRLRating" options={{ title: "Ratings" }}>
                  {(props) => shell(props, "Ratings", <PRLRatingScreen {...props} />)}
                </Stack.Screen>
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
