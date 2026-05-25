import React, { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { FACULTIES } from "../constants/academic";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import useFirestoreCollection from "../hooks/useFirestoreCollection";
import { COLLECTIONS, enrollmentRequestService } from "../services/firebaseRepository";
import toast from "../components/Toast";
import { Badge, Button, Card, DataList, Input, Loading, Screen, Select, styles } from "../components/NativeUI";

const normalize = (value) => (value || "").trim().toLowerCase();
const facultyOptions = FACULTIES.map((faculty) => ({ label: faculty, value: faculty }));

export default function StudentCoursesScreen() {
  const { currentUser, userProfile, loading: authLoading, refreshProfile } = useAuth();
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");
  const [details, setDetails] = useState({ studentId: "", faculty: "" });
  const hasStudentId = Boolean(userProfile?.studentId || userProfile?.studentNumber);
  const hasFaculty = Boolean(userProfile?.faculty);
  const needsDetails = !hasStudentId || !hasFaculty;

  useEffect(() => {
    setDetails({
      studentId: userProfile?.studentId || userProfile?.studentNumber || "",
      faculty: userProfile?.faculty || "",
    });
  }, [userProfile]);

  const { data: courses, loading: coursesLoading, error: coursesError } = useFirestoreCollection(
    COLLECTIONS.courses,
    [{ field: "faculty", value: userProfile?.faculty || "" }],
    { enabled: hasFaculty }
  );
  const { data: enrollments } = useFirestoreCollection(
    COLLECTIONS.enrollments,
    [{ field: "studentId", value: currentUser?.uid || "" }],
    { enabled: Boolean(currentUser?.uid) }
  );
  const { data: requests, loading: requestsLoading } = useFirestoreCollection(
    COLLECTIONS.enrollmentRequests,
    [{ field: "studentId", value: currentUser?.uid || "" }],
    { enabled: Boolean(currentUser?.uid) }
  );

  const enrolledIds = useMemo(() => new Set(enrollments.map((item) => item.courseId)), [enrollments]);
  const requestedIds = useMemo(
    () => new Set(requests.filter((item) => item.status === "pending").map((item) => item.courseId)),
    [requests]
  );

  const filtered = courses.filter((course) => {
    const term = search.toLowerCase();
    return normalize(course.faculty) === normalize(userProfile?.faculty) &&
      [course.name, course.courseName, course.code, course.courseCode, course.lecturerName].some((value) =>
        (value || "").toLowerCase().includes(term)
      );
  });

  const saveDetails = async () => {
    if (!currentUser?.uid) {
      toast.error("Please sign in before saving details");
      return;
    }
    if (!details.studentId.trim() || !details.faculty) {
      toast.error("Student ID and faculty are required");
      return;
    }
    try {
      const studentNumber = userProfile?.studentNumber || userProfile?.studentId || details.studentId.trim();
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          studentId: userProfile?.studentId || studentNumber,
          studentNumber,
          faculty: userProfile?.faculty || details.faculty,
        },
        { merge: true }
      );
      await refreshProfile();
      toast.success("Student details saved");
    } catch (error) {
      toast.error(error.message || "Failed to save details");
    }
  };

  const requestEnrollment = async (course) => {
    if (authLoading || !currentUser?.uid || !userProfile) {
      toast.error("Please wait for your account to finish loading");
      return;
    }
    if (needsDetails) {
      toast.error("Complete your student ID and faculty before enrolling");
      return;
    }
    if (normalize(course.faculty) !== normalize(userProfile.faculty)) {
      toast.error("Your faculty does not match this course");
      return;
    }

    setSavingId(course.id);
    try {
      await enrollmentRequestService.requestEnrollment({
        student: { uid: currentUser.uid, ...userProfile },
        course,
      });
      toast.success("Enrollment request sent to Program Leader");
    } catch (error) {
      toast.error(error.code === "permission-denied" ? "Permission denied. Confirm Firestore rules are deployed." : error.message || "Failed to request enrollment");
    } finally {
      setSavingId("");
    }
  };

  return (
    <Screen title="Courses" subtitle="Enroll into courses from your faculty">
      <Input placeholder="Search courses or lecturers..." value={search} onChangeText={setSearch} />
      {needsDetails && (
        <Card>
          <Text style={styles.strong}>Complete Student Details</Text>
          {!hasStudentId && <Input label="Student ID" value={details.studentId} onChangeText={(studentId) => setDetails((item) => ({ ...item, studentId }))} />}
          {!hasFaculty && (
            <Select
              label="Faculty"
              value={details.faculty}
              placeholder="-- Select Faculty --"
              options={facultyOptions}
              onChange={(faculty) => setDetails((item) => ({ ...item, faculty }))}
            />
          )}
          <Button onPress={saveDetails}>Save Details</Button>
        </Card>
      )}
      {coursesLoading || requestsLoading ? <Loading label="Loading courses..." /> : null}
      {coursesError ? <Text style={styles.muted}>Courses: {coursesError.message}</Text> : null}
      <DataList
        data={needsDetails ? [] : filtered}
        emptyTitle={needsDetails ? "Student details required" : "No courses found"}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isEnrolled = enrolledIds.has(item.id);
          const isRequested = requestedIds.has(item.id);
          return (
            <Card>
              <Text style={styles.strong}>{item.name || item.courseName}</Text>
              <Text style={styles.muted}>{item.code || item.courseCode} | {item.lecturerName || "Unassigned"}</Text>
              <Badge tone={isEnrolled ? "success" : isRequested ? "primary" : "warning"}>
                {isEnrolled ? "Enrolled" : isRequested ? "Requested" : "Available"}
              </Badge>
              <Button disabled={isEnrolled || isRequested || savingId === item.id} onPress={() => requestEnrollment(item)}>
                {savingId === item.id ? "Sending..." : isEnrolled ? "Enrolled" : isRequested ? "Requested" : "Request Enrollment"}
              </Button>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
