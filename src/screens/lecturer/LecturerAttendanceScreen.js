import React from "react";
import { AttendanceScreen } from "../CollectionScreens";

export default function LecturerAttendanceScreen(props) {
  return <AttendanceScreen {...props} mode="lecturer" />;
}
