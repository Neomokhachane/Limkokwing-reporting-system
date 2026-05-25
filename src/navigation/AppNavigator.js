import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import OriginalShell from "../components/OriginalShell";
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import StudentCoursesScreen from "../screens/StudentCoursesScreen";
import PLUsersScreen from "../screens/PLUsersScreen";
import {
  AttendanceScreen,
  ClassesScreen,
  CoursesScreen,
  LecturersScreen,
  MonitoringScreen,
  RatingsScreen,
  ReportsScreen,
} from "../screens/CollectionScreens";
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
                  {(props) => shell(props, "Attendance", <AttendanceScreen {...props} mode="student" />)}
                </Stack.Screen>
                <Stack.Screen name="StudentMonitoring" options={{ title: "Monitoring" }}>
                  {(props) => shell(props, "Monitoring", <MonitoringScreen {...props} mode="student" />)}
                </Stack.Screen>
                <Stack.Screen name="StudentRating" options={{ title: "Rate Lecturers" }}>
                  {(props) => shell(props, "Rating", <RatingsScreen {...props} mode="student" />)}
                </Stack.Screen>
              </>
            )}

            {role === "lecturer" && (
              <>
                <Stack.Screen name="LecturerClasses" options={{ title: "Classes" }}>
                  {(props) => shell(props, "My Classes", <ClassesScreen {...props} mode="lecturer" />)}
                </Stack.Screen>
                <Stack.Screen name="LecturerReports" options={{ title: "Reports" }}>
                  {(props) => shell(props, "Reports", <ReportsScreen {...props} mode="lecturer" />)}
                </Stack.Screen>
                <Stack.Screen name="LecturerAttendance" options={{ title: "Attendance" }}>
                  {(props) => shell(props, "Attendance", <AttendanceScreen {...props} mode="lecturer" />)}
                </Stack.Screen>
                <Stack.Screen name="LecturerMonitoring" options={{ title: "Monitoring" }}>
                  {(props) => shell(props, "Monitoring", <MonitoringScreen {...props} mode="lecturer" />)}
                </Stack.Screen>
                <Stack.Screen name="LecturerRating" options={{ title: "Ratings" }}>
                  {(props) => shell(props, "Ratings", <RatingsScreen {...props} mode="lecturer" />)}
                </Stack.Screen>
              </>
            )}

            {role === "pl" && (
              <>
                <Stack.Screen name="PLUsers">
                  {(props) => shell(props, "User Management", <PLUsersScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PLCourses" options={{ title: "Courses" }}>
                  {(props) => shell(props, "Courses", <CoursesScreen {...props} mode="pl" />)}
                </Stack.Screen>
                <Stack.Screen name="PLClasses" options={{ title: "Classes" }}>
                  {(props) => shell(props, "Classes", <ClassesScreen {...props} mode="pl" />)}
                </Stack.Screen>
                <Stack.Screen name="PLLecturers">
                  {(props) => shell(props, "Lecturers", <LecturersScreen {...props} />)}
                </Stack.Screen>
                <Stack.Screen name="PLReports" options={{ title: "Reports" }}>
                  {(props) => shell(props, "Reports", <ReportsScreen {...props} mode="pl" />)}
                </Stack.Screen>
                <Stack.Screen name="PLMonitoring" options={{ title: "Monitoring" }}>
                  {(props) => shell(props, "Monitoring", <MonitoringScreen {...props} mode="pl" />)}
                </Stack.Screen>
                <Stack.Screen name="PLRating" options={{ title: "Ratings" }}>
                  {(props) => shell(props, "Ratings", <RatingsScreen {...props} mode="pl" />)}
                </Stack.Screen>
              </>
            )}

            {role === "prl" && (
              <>
                <Stack.Screen name="PRLCourses" options={{ title: "Courses" }}>
                  {(props) => shell(props, "Courses", <CoursesScreen {...props} mode="prl" />)}
                </Stack.Screen>
                <Stack.Screen name="PRLReports" options={{ title: "Reports" }}>
                  {(props) => shell(props, "Reports", <ReportsScreen {...props} mode="prl" />)}
                </Stack.Screen>
                <Stack.Screen name="PRLMonitoring" options={{ title: "Monitoring" }}>
                  {(props) => shell(props, "Monitoring", <MonitoringScreen {...props} mode="prl" />)}
                </Stack.Screen>
                <Stack.Screen name="PRLRating" options={{ title: "Ratings" }}>
                  {(props) => shell(props, "Ratings", <RatingsScreen {...props} mode="prl" />)}
                </Stack.Screen>
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
