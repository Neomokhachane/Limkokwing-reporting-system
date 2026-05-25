import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { addDoc, collection, getDocs, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import toast from "../components/Toast";
import { Badge, Button, Card, DataList, Input, Loading, Screen, styles } from "../components/NativeUI";
import { exportToExcel } from "../utils/exportCsv";

export default function PLUsersScreen() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [profileRequests, setProfileRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [usersSnap, requestsSnap, profileRequestsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "enrollmentRequests")),
        getDocs(collection(db, "profileEditRequests")),
      ]);
      const users = usersSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
      setStudents(users.filter((item) => item.role === "student"));
      setLecturers(users.filter((item) => item.role === "lecturer"));
      setRequests(requestsSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
      setProfileRequests(profileRequestsSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (error) {
      toast.error("Failed to load user management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (request) => {
    setSubmitting(true);
    try {
      const student = students.find((item) => item.id === request.studentId) || {};
      await addDoc(collection(db, "enrollments"), {
        studentId: request.studentId,
        studentName: student.fullName || student.name || request.studentName || "",
        studentNumber: student.studentNumber || student.studentId || request.studentNumber || "",
        courseId: request.courseId,
        courseName: request.courseName || "",
        courseCode: request.courseCode || "",
        faculty: request.faculty || "",
        status: "approved",
        approvedBy: currentUser?.uid || "",
        enrolledAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", request.studentId), {
        enrollmentStatus: "approved",
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "enrollmentRequests", request.id), {
        status: "approved",
        reviewedBy: currentUser?.uid || "",
        reviewedAt: serverTimestamp(),
      });
      toast.success("Enrollment approved");
      await load();
    } catch (error) {
      toast.error(error.message || "Failed to approve enrollment");
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async (request) => {
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "users", request.studentId), {
        enrollmentStatus: "rejected",
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "enrollmentRequests", request.id), {
        status: "rejected",
        reviewedBy: currentUser?.uid || "",
        reviewedAt: serverTimestamp(),
      });
      toast.success("Enrollment rejected");
      await load();
    } catch (error) {
      toast.error(error.message || "Failed to reject enrollment");
    } finally {
      setSubmitting(false);
    }
  };

  const unlockProfile = async (request) => {
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "users", request.studentId), {
        profileDetailsLocked: false,
        profileUnlockedBy: currentUser?.uid || "",
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "profileEditRequests", request.id), {
        status: "approved",
        reviewedBy: currentUser?.uid || "",
        reviewedAt: serverTimestamp(),
      });
      toast.success("Student profile unlocked");
      await load();
    } catch (error) {
      toast.error(error.message || "Failed to unlock profile");
    } finally {
      setSubmitting(false);
    }
  };

  const rejectProfileRequest = async (request) => {
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "profileEditRequests", request.id), {
        status: "rejected",
        reviewedBy: currentUser?.uid || "",
        reviewedAt: serverTimestamp(),
      });
      toast.success("Profile request rejected");
      await load();
    } catch (error) {
      toast.error(error.message || "Failed to reject profile request");
    } finally {
      setSubmitting(false);
    }
  };

  const term = search.toLowerCase();
  const filteredStudents = students.filter((item) => [item.fullName, item.name, item.email, item.studentId, item.studentNumber].some((value) => (value || "").toLowerCase().includes(term)));
  const filteredLecturers = lecturers.filter((item) => [item.fullName, item.name, item.email, item.faculty].some((value) => (value || "").toLowerCase().includes(term)));
  const pending = requests.filter((item) => item.status === "pending");
  const pendingProfileRequests = profileRequests.filter((item) => item.status === "pending");

  return (
    <Screen title="User Management" subtitle="Students, lecturers and enrollment requests">
      <Input placeholder="Search users..." value={search} onChangeText={setSearch} />
      <View style={styles.row}>
        <Button
          variant="secondary"
          onPress={() => exportToExcel(
            filteredStudents.map((student) => ({
              fullName: student.fullName || student.name || "",
              email: student.email || "",
              studentNumber: student.studentNumber || student.studentId || "",
              faculty: student.faculty || "",
              enrollmentStatus: student.enrollmentStatus || "Active",
              profileStatus: student.profileDetailsLocked ? "Locked" : "Editable",
            })),
            "students_report",
            "Students"
          )}
        >
          Export Students
        </Button>
        <Button
          variant="secondary"
          onPress={() => exportToExcel(
            filteredLecturers.map((lecturer) => ({
              fullName: lecturer.fullName || lecturer.name || "",
              email: lecturer.email || "",
              faculty: lecturer.faculty || "",
              role: lecturer.role || "lecturer",
            })),
            "lecturers_report",
            "Lecturers"
          )}
        >
          Export Lecturers
        </Button>
        <Button
          variant="secondary"
          onPress={() => exportToExcel(
            requests.map((request) => ({
              studentName: request.studentName || students.find((student) => student.id === request.studentId)?.fullName || "",
              studentNumber: request.studentNumber || "",
              courseName: request.courseName || "",
              courseCode: request.courseCode || "",
              faculty: request.faculty || "",
              status: request.status || "",
            })),
            "course_enrollment_requests",
            "Enrollment_Requests"
          )}
        >
          Export Enrollments
        </Button>
      </View>
      {loading ? <Loading label="Loading users..." /> : null}
      <Card>
        <View style={styles.split}>
          <Text style={styles.strong}>Enrollment Requests</Text>
          <Badge>{pending.length} pending</Badge>
        </View>
        <DataList
          data={pending}
          emptyTitle="No pending enrollment requests"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.strong}>{item.studentName || students.find((student) => student.id === item.studentId)?.fullName || "Student"}</Text>
              <Text style={styles.muted}>{item.courseName} {item.courseCode ? `(${item.courseCode})` : ""}</Text>
              <Text style={styles.muted}>{item.faculty || "-"}</Text>
              <View style={styles.row}>
                <Button variant="success" disabled={submitting} onPress={() => approve(item)}>Approve</Button>
                <Button variant="danger" disabled={submitting} onPress={() => reject(item)}>Reject</Button>
              </View>
            </Card>
          )}
        />
      </Card>
      <Card>
        <View style={styles.split}>
          <Text style={styles.strong}>Profile Edit Requests</Text>
          <Badge>{pendingProfileRequests.length} pending</Badge>
        </View>
        <DataList
          data={pendingProfileRequests}
          emptyTitle="No pending profile edit requests"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.strong}>{item.studentName || students.find((student) => student.id === item.studentId)?.fullName || "Student"}</Text>
              <Text style={styles.muted}>{item.studentNumber || "-"}</Text>
              <Text style={styles.muted}>{item.reason || "No reason supplied"}</Text>
              <View style={styles.row}>
                <Button variant="success" disabled={submitting} onPress={() => unlockProfile(item)}>Unlock Profile</Button>
                <Button variant="danger" disabled={submitting} onPress={() => rejectProfileRequest(item)}>Reject</Button>
              </View>
            </Card>
          )}
        />
      </Card>
      <Card>
        <Text style={styles.strong}>Students</Text>
        <DataList
          data={filteredStudents}
          emptyTitle="No students found"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.strong}>{item.fullName || item.name}</Text>
              <Text style={styles.muted}>{item.studentNumber || item.studentId || "-"} | {item.email}</Text>
              <Text style={styles.muted}>Profile: {item.profileDetailsLocked ? "Locked" : "Editable"}</Text>
              <Badge tone="success">{item.enrollmentStatus || "Active"}</Badge>
            </View>
          )}
        />
      </Card>
      <Card>
        <Text style={styles.strong}>Lecturers</Text>
        <DataList
          data={filteredLecturers}
          emptyTitle="No lecturers found"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.strong}>{item.fullName || item.name}</Text>
              <Text style={styles.muted}>{item.email}</Text>
              <Text style={styles.muted}>{item.faculty || "-"}</Text>
            </View>
          )}
        />
      </Card>
    </Screen>
  );
}
