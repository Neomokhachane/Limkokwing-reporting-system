import React from "react";
import { AttendanceScreen } from "../CollectionScreens";

export default function StudentAttendanceScreen(props) {
  return <AttendanceScreen {...props} mode="student" />;
}
