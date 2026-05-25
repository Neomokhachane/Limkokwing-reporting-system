import React, { useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import toast from "../components/Toast";
import { FACULTIES } from "../constants/academic";
import { Badge, Button, Card, ConfirmDialog, DataList, DateInput, IconButton, Input, Loading, Screen, Select, StatCard, styles } from "../components/NativeUI";
import { exportToExcel } from "../utils/exportCsv";

const lower = (value) => (value || "").toLowerCase();
const facultyOptions = FACULTIES.map((faculty) => ({ label: faculty, value: faculty }));
const yearOptions = ["1", "2", "3"].map((year) => ({ label: `Year ${year}`, value: year }));
const semesterOptions = ["1", "2"].map((semester) => ({ label: `Semester ${semester}`, value: semester }));

function Stars({ value }) {
  const rating = Math.max(0, Math.min(5, Math.round(Number(value || 0))));
  return (
    <Text style={styles.text}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)} {Number(value || 0).toFixed(1)}
    </Text>
  );
}

function StarPicker({ label, value, onChange }) {
  const selected = Math.max(0, Math.min(5, Number(value || 0)));

  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(String(star))}>
            <Text style={{ color: star <= selected ? "#b45309" : "#9ca3af", fontSize: 28 }}>
              {star <= selected ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function useCollection(collectionName, filters = [], enabled = true) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const filterKey = JSON.stringify(filters);

  const load = () => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const parsedFilters = JSON.parse(filterKey);
    const constraints = parsedFilters.filter((item) => item.value).map((item) => where(item.field, "==", item.value));
    const ref = constraints.length ? query(collection(db, collectionName), ...constraints) : collection(db, collectionName);
    return onSnapshot(
      ref,
      (snap) => {
        setItems(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
        setLoading(false);
      },
      () => {
        toast.error(`Failed to load ${collectionName}`);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    const unsubscribe = load();
    return unsubscribe;
  }, [collectionName, filterKey, enabled]);

  return { items, loading, load };
}

export function CoursesScreen({ mode = "student" }) {
  const { currentUser, userProfile } = useAuth();
  const canManage = mode === "pl";
  const filters = mode === "lecturer"
    ? [{ field: "lecturerId", value: currentUser?.uid }]
    : mode === "student" || mode === "prl"
      ? [{ field: "faculty", value: userProfile?.faculty }]
      : [];
  const { items, loading, load } = useCollection("courses", filters);
  const { items: lecturers } = useCollection("users", [{ field: "role", value: "lecturer" }], canManage);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", faculty: userProfile?.faculty || "", lecturerId: "", lecturerName: "", registeredStudents: "0" });
  const lecturerOptions = lecturers
    .filter((item) => !form.faculty || item.faculty === form.faculty)
    .map((item) => ({ label: item.fullName || item.name || item.email, value: item.id, lecturer: item }));

  const save = async () => {
    if (!form.name || !form.code || !form.faculty) {
      toast.error("Course name, code and faculty are required");
      return;
    }
    try {
      const payload = {
        ...form,
        courseName: form.name,
        courseCode: form.code,
        registeredStudents: Math.max(0, Number(form.registeredStudents || 0)),
        updatedAt: serverTimestamp(),
        editedBy: currentUser?.uid || "",
      };

      if (editingId) {
        await updateDoc(doc(db, "courses", editingId), payload);
      } else {
        await addDoc(collection(db, "courses"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || "",
        });
      }
      setForm({ name: "", code: "", faculty: userProfile?.faculty || "", lecturerId: "", lecturerName: "", registeredStudents: "0" });
      setEditingId("");
      setShowForm(false);
      toast.success(editingId ? "Course updated" : "Course saved");
    } catch (error) {
      toast.error(error.message || "Failed to save course");
    }
  };

  const editCourse = (course) => {
    setForm({
      name: course.name || course.courseName || "",
      code: course.code || course.courseCode || "",
      faculty: course.faculty || userProfile?.faculty || "",
      lecturerId: course.lecturerId || "",
      lecturerName: course.lecturerName || "",
      registeredStudents: String(course.registeredStudents ?? 0),
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const removeCourse = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "courses", confirmDelete.id));
      toast.success("Course deleted");
      setConfirmDelete(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete course");
    }
  };

  const filtered = items.filter((item) => [item.name, item.courseName, item.code, item.courseCode, item.lecturerName].some((value) => lower(value).includes(lower(search))));

  return (
    <Screen title="Courses" subtitle="Course list">
      <Input placeholder="Search courses..." value={search} onChangeText={setSearch} />
      <Button
        variant="secondary"
        onPress={() => exportToExcel(
          filtered.map((course) => ({
            courseName: course.name || course.courseName || "",
            courseCode: course.code || course.courseCode || "",
            faculty: course.faculty || "",
            lecturerName: course.lecturerName || "Unassigned",
            registeredStudents: course.registeredStudents || 0,
          })),
          "course_enrollment_report",
          "Course_Enrollment"
        )}
      >
        Export Courses
      </Button>
      {canManage && (
        <>
          <Button onPress={() => {
            setEditingId("");
            setForm({ name: "", code: "", faculty: userProfile?.faculty || "", lecturerId: "", lecturerName: "", registeredStudents: "0" });
            setShowForm((value) => !value);
          }}>{showForm ? "Close" : "Add Course"}</Button>
          {showForm && (
            <Card>
              <Text style={styles.strong}>{editingId ? "Edit Course" : "Add Course"}</Text>
              <Input label="Course Name" value={form.name} onChangeText={(name) => setForm((item) => ({ ...item, name }))} />
              <Input label="Course Code" value={form.code} onChangeText={(code) => setForm((item) => ({ ...item, code }))} />
              <Select
                label="Faculty"
                value={form.faculty}
                placeholder="-- Select Faculty --"
                options={facultyOptions}
                onChange={(faculty) => setForm((item) => ({ ...item, faculty, lecturerId: "", lecturerName: "" }))}
              />
              <Select
                label="Lecturer"
                value={form.lecturerId}
                placeholder="-- Select Lecturer --"
                options={lecturerOptions}
                onChange={(lecturerId, option) => setForm((item) => ({
                  ...item,
                  lecturerId,
                  lecturerName: option.lecturer?.fullName || option.lecturer?.name || option.lecturer?.email || "",
                }))}
              />
              <Input label="Registered Students" keyboardType="numeric" value={form.registeredStudents} onChangeText={(registeredStudents) => setForm((item) => ({ ...item, registeredStudents }))} />
              <Button onPress={save}>{editingId ? "Update Course" : "Save Course"}</Button>
            </Card>
          )}
        </>
      )}
      {loading ? <Loading /> : null}
      <DataList
        data={filtered}
        emptyTitle="No courses found"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.strong}>{item.name || item.courseName}</Text>
            <Text style={styles.muted}>{item.code || item.courseCode} | {item.lecturerName || "Unassigned"}</Text>
            <Text style={styles.muted}>{item.faculty || "-"}</Text>
            {canManage && (
              <View style={styles.row}>
                <IconButton label="Edit" onPress={() => editCourse(item)} />
                <IconButton label="Delete" variant="danger" onPress={() => setConfirmDelete(item)} />
              </View>
            )}
          </Card>
        )}
      />
      <ConfirmDialog
        visible={Boolean(confirmDelete)}
        title="Delete course?"
        message={`This will remove ${confirmDelete?.name || confirmDelete?.courseName || "this course"}.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={removeCourse}
      />
    </Screen>
  );
}

export function ClassesScreen({ mode = "lecturer" }) {
  const { currentUser, userProfile } = useAuth();
  const filters = mode === "lecturer" ? [{ field: "lecturerId", value: currentUser?.uid }] : [];
  const { items, loading, load } = useCollection("classes", filters);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ className: "", year: "", semester: "", venue: "", scheduledTime: "", registeredStudents: "0" });
  const canEditClasses = mode === "lecturer" || mode === "pl";

  const save = async () => {
    if (!form.className || !form.venue) {
      toast.error("Class name and venue are required");
      return;
    }
    try {
      const payload = {
        ...form,
        year: Number(form.year || 0),
        semester: Number(form.semester || 0),
        registeredStudents: Math.max(0, Number(form.registeredStudents || 0)),
        lecturerId: currentUser?.uid || "",
        lecturerName: userProfile?.fullName || userProfile?.name || "",
        faculty: userProfile?.faculty || "",
        updatedAt: serverTimestamp(),
        editedBy: currentUser?.uid || "",
      };
      if (editingId) {
        await updateDoc(doc(db, "classes", editingId), payload);
      } else {
        await addDoc(collection(db, "classes"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || "",
        });
      }
      setForm({ className: "", year: "", semester: "", venue: "", scheduledTime: "", registeredStudents: "0" });
      setEditingId("");
      setShowForm(false);
      toast.success(editingId ? "Class updated" : "Class saved");
    } catch (error) {
      toast.error(error.message || "Failed to save class");
    }
  };

  const editClass = (record) => {
    setForm({
      className: record.className || "",
      year: record.year ? String(record.year) : "",
      semester: record.semester ? String(record.semester) : "",
      venue: record.venue || "",
      scheduledTime: record.scheduledTime || "",
      registeredStudents: String(record.registeredStudents ?? 0),
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const removeClass = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "classes", confirmDelete.id));
      toast.success("Class deleted");
      setConfirmDelete(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete class");
    }
  };

  return (
    <Screen title="Classes" subtitle="Manage class venues and schedules">
      {canEditClasses && (
        <>
          <Button onPress={() => {
            setEditingId("");
            setForm({ className: "", year: "", semester: "", venue: "", scheduledTime: "", registeredStudents: "0" });
            setShowForm((value) => !value);
          }}>{showForm ? "Close" : "Add Class"}</Button>
          {showForm && (
            <Card>
              <Text style={styles.strong}>{editingId ? "Edit Class" : "Add Class"}</Text>
              <Input label="Class Name" value={form.className} onChangeText={(className) => setForm((item) => ({ ...item, className }))} />
              <Select
                label="Year"
                value={form.year}
                placeholder="-- Select Year --"
                options={yearOptions}
                onChange={(year) => setForm((item) => ({ ...item, year }))}
              />
              <Select
                label="Semester"
                value={form.semester}
                placeholder="-- Select Semester --"
                options={semesterOptions}
                onChange={(semester) => setForm((item) => ({ ...item, semester }))}
              />
              <Input label="Venue" placeholder="MM1, Room 3, Hall 6" value={form.venue} onChangeText={(venue) => setForm((item) => ({ ...item, venue }))} />
              <Input label="Scheduled Time" value={form.scheduledTime} onChangeText={(scheduledTime) => setForm((item) => ({ ...item, scheduledTime }))} />
              <Input label="Registered Students" keyboardType="numeric" value={form.registeredStudents} onChangeText={(registeredStudents) => setForm((item) => ({ ...item, registeredStudents }))} />
              <Button onPress={save}>{editingId ? "Update Class" : "Save Class"}</Button>
            </Card>
          )}
        </>
      )}
      {loading ? <Loading /> : null}
      <DataList
        data={items}
        emptyTitle="No classes found"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.strong}>{item.className}</Text>
            <Text style={styles.muted}>Lecturer: {item.lecturerName || "-"}</Text>
            <Text style={styles.muted}>Venue: {item.venue || "-"}</Text>
            <Text style={styles.muted}>Students: {item.registeredStudents || 0}</Text>
            {canEditClasses && (
              <View style={styles.row}>
                <IconButton label="Edit" onPress={() => editClass(item)} />
                <IconButton label="Delete" variant="danger" onPress={() => setConfirmDelete(item)} />
              </View>
            )}
          </Card>
        )}
      />
      <ConfirmDialog
        visible={Boolean(confirmDelete)}
        title="Delete class?"
        message={`This will remove ${confirmDelete?.className || "this class"}.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={removeClass}
      />
    </Screen>
  );
}

export function ReportsScreen({ mode = "lecturer" }) {
  const { currentUser, userProfile } = useAuth();
  const filters = mode === "lecturer" ? [{ field: "lecturerId", value: currentUser?.uid }] : mode === "prl" ? [{ field: "facultyName", value: userProfile?.faculty }] : [];
  const { items, loading, load } = useCollection("reports", filters);
  const { items: classes } = useCollection("classes", [{ field: "lecturerId", value: currentUser?.uid }], mode === "lecturer");
  const { items: courses } = useCollection("courses", [{ field: "lecturerId", value: currentUser?.uid }], mode === "lecturer");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    classId: "",
    className: "",
    weekOfReporting: "",
    dateOfLecture: "",
    courseId: "",
    courseName: "",
    courseCode: "",
    venue: "",
    scheduledLectureTime: "",
    actualStudents: "0",
    registeredStudents: "0",
    topicTaught: "",
    learningOutcomes: "",
    lecturerRecommendations: "",
  });
  const [feedback, setFeedback] = useState({});
  const classOptions = classes.map((item) => ({
    label: item.className || item.name || "Unnamed class",
    value: item.id,
    record: item,
  }));
  const courseOptions = courses.map((item) => ({
    label: `${item.name || item.courseName || "Unnamed course"}${item.code || item.courseCode ? ` (${item.code || item.courseCode})` : ""}`,
    value: item.id,
    record: item,
  }));

  const resetForm = () => setForm({
    classId: "",
    className: "",
    weekOfReporting: "",
    dateOfLecture: "",
    courseId: "",
    courseName: "",
    courseCode: "",
    venue: "",
    scheduledLectureTime: "",
    actualStudents: "0",
    registeredStudents: "0",
    topicTaught: "",
    learningOutcomes: "",
    lecturerRecommendations: "",
  });

  const save = async (nextStatus = "submitted") => {
    if (nextStatus !== "draft" && (!form.className || !form.weekOfReporting || !form.dateOfLecture || !form.courseName || !form.courseCode || !form.venue || !form.scheduledLectureTime || !form.topicTaught)) {
      toast.error("Class, week, date, course, venue, time and topic are required");
      return;
    }
    try {
      const payload = {
        ...form,
        facultyName: userProfile?.faculty || "",
        faculty: userProfile?.faculty || "",
        lecturerId: currentUser?.uid || "",
        lecturerEmail: currentUser?.email || "",
        lecturerName: userProfile?.fullName || userProfile?.name || "",
        weekOfReporting: Number(form.weekOfReporting || 0),
        actualStudents: Math.max(0, Number(form.actualStudents || 0)),
        registeredStudents: Math.max(0, Number(form.registeredStudents || 0)),
        scheduledLectureTime: form.scheduledLectureTime || "",
        lecturerRecommendations: form.lecturerRecommendations || "",
        status: nextStatus,
        finalized: nextStatus !== "draft",
        updatedAt: serverTimestamp(),
        editedBy: currentUser?.uid || "",
      };
      if (editingId) {
        await updateDoc(doc(db, "reports", editingId), payload);
      } else {
        await addDoc(collection(db, "reports"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || "",
        });
      }
      toast.success(nextStatus === "draft" ? "Report draft saved" : "Report submitted");
      resetForm();
      setEditingId("");
      setShowForm(false);
    } catch (error) {
      toast.error(error.message || "Failed to submit report");
    }
  };

  const editReport = (report) => {
    setForm({
      classId: report.classId || "",
      className: report.className || "",
      weekOfReporting: String(report.weekOfReporting || ""),
      dateOfLecture: report.dateOfLecture || "",
      courseId: report.courseId || "",
      courseName: report.courseName || "",
      courseCode: report.courseCode || "",
      venue: report.venue || "",
      scheduledLectureTime: report.scheduledLectureTime || "",
      actualStudents: String(report.actualStudents ?? 0),
      registeredStudents: String(report.registeredStudents ?? 0),
      topicTaught: report.topicTaught || "",
      learningOutcomes: report.learningOutcomes || "",
      lecturerRecommendations: report.lecturerRecommendations || "",
    });
    setEditingId(report.id);
    setShowForm(true);
  };

  const removeReport = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "reports", confirmDelete.id));
      toast.success("Report deleted");
      setConfirmDelete(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete report");
    }
  };

  const reviewReport = async (report, status) => {
    try {
      await updateDoc(doc(db, "reports", report.id), {
        status,
        reviewedBy: currentUser?.uid || "",
        reviewedByName: userProfile?.fullName || userProfile?.name || "",
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Report ${status}`);
    } catch (error) {
      toast.error(error.message || "Failed to review report");
    }
  };

  const submitFeedback = async (report) => {
    const text = feedback[report.id]?.trim();
    if (!text) {
      toast.error("Feedback is required");
      return;
    }
    try {
      await updateDoc(doc(db, "reports", report.id), {
        feedback: text,
        feedbackBy: currentUser?.uid || "",
        feedbackByName: userProfile?.fullName || userProfile?.name || "",
        feedbackAt: serverTimestamp(),
        status: "reviewed",
        updatedAt: serverTimestamp(),
      });
      setFeedback((state) => ({ ...state, [report.id]: "" }));
      toast.success("Feedback saved");
    } catch (error) {
      toast.error(error.message || "Failed to save feedback");
    }
  };

  return (
    <Screen title="Reports" subtitle="Lecture reports">
      <Button
        variant="secondary"
        onPress={() => exportToExcel(
          items.map((report) => ({
            facultyName: report.facultyName || report.faculty || "",
            className: report.className || "",
            weekOfReporting: report.weekOfReporting || "",
            dateOfLecture: report.dateOfLecture || "",
            courseName: report.courseName || "",
            courseCode: report.courseCode || "",
            lecturerName: report.lecturerName || "",
            actualStudentsPresent: report.actualStudents || 0,
            totalRegisteredStudents: report.registeredStudents || 0,
            venue: report.venue || "",
            scheduledLectureTime: report.scheduledLectureTime || "",
            topicTaught: report.topicTaught || "",
            learningOutcomes: report.learningOutcomes || "",
            lecturerRecommendations: report.lecturerRecommendations || "",
            status: report.status || "pending",
          })),
          "lecturer_reports",
          "Lecturer_Reports"
        )}
      >
        Export Reports
      </Button>
      {mode === "lecturer" && (
        <>
          <Button onPress={() => {
            setEditingId("");
            resetForm();
            setShowForm((value) => !value);
          }}>{showForm ? "Close" : "Add Report"}</Button>
          {showForm && (
            <Card>
              <Text style={styles.strong}>{editingId ? "Edit Report" : "New Report"}</Text>
              <Select
                label="Class Name"
                value={form.classId || form.className}
                placeholder="-- Select Class --"
                options={classOptions}
                onChange={(classId, option) => setForm((item) => ({
                  ...item,
                  classId,
                  className: option.record?.className || option.record?.name || "",
                  venue: option.record?.venue || item.venue,
                  scheduledLectureTime: option.record?.scheduledTime || item.scheduledLectureTime,
                  registeredStudents: String(option.record?.registeredStudents ?? item.registeredStudents),
                }))}
              />
              {!classOptions.length && <Input label="Class Name" value={form.className} onChangeText={(className) => setForm((item) => ({ ...item, className }))} />}
              <Input label="Week" keyboardType="numeric" value={form.weekOfReporting} onChangeText={(weekOfReporting) => setForm((item) => ({ ...item, weekOfReporting }))} />
              <DateInput label="Date of Lecture" value={form.dateOfLecture} onChange={(dateOfLecture) => setForm((item) => ({ ...item, dateOfLecture }))} />
              <Select
                label="Course"
                value={form.courseId || form.courseName}
                placeholder="-- Select Course --"
                options={courseOptions}
                onChange={(courseId, option) => setForm((item) => ({
                  ...item,
                  courseId,
                  courseName: option.record?.name || option.record?.courseName || "",
                  courseCode: option.record?.code || option.record?.courseCode || "",
                }))}
              />
              {!courseOptions.length && (
                <>
                  <Input label="Course Name" value={form.courseName} onChangeText={(courseName) => setForm((item) => ({ ...item, courseName }))} />
                  <Input label="Course Code" value={form.courseCode} onChangeText={(courseCode) => setForm((item) => ({ ...item, courseCode }))} />
                </>
              )}
              <Input label="Venue" placeholder="MM1, Room 3, Hall 6" value={form.venue} onChangeText={(venue) => setForm((item) => ({ ...item, venue }))} />
              <Input label="Scheduled Lecture Time" value={form.scheduledLectureTime} onChangeText={(scheduledLectureTime) => setForm((item) => ({ ...item, scheduledLectureTime }))} />
              <Input label="Actual Students" keyboardType="numeric" value={form.actualStudents} onChangeText={(actualStudents) => setForm((item) => ({ ...item, actualStudents }))} />
              <Input label="Registered Students" keyboardType="numeric" value={form.registeredStudents} onChangeText={(registeredStudents) => setForm((item) => ({ ...item, registeredStudents }))} />
              <Input label="Topic Taught" value={form.topicTaught} onChangeText={(topicTaught) => setForm((item) => ({ ...item, topicTaught }))} />
              <Input label="Learning Outcomes" multiline value={form.learningOutcomes} onChangeText={(learningOutcomes) => setForm((item) => ({ ...item, learningOutcomes }))} />
              <Input label="Lecturer Recommendations" multiline value={form.lecturerRecommendations} onChangeText={(lecturerRecommendations) => setForm((item) => ({ ...item, lecturerRecommendations }))} />
              <View style={styles.row}>
                <Button variant="secondary" onPress={() => save("draft")}>Save Draft</Button>
                <Button onPress={() => save("submitted")}>{editingId ? "Update Report" : "Submit Report"}</Button>
              </View>
            </Card>
          )}
        </>
      )}
      {loading ? <Loading /> : null}
      <DataList
        data={items}
        emptyTitle="No reports found"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.strong}>{item.courseName}</Text>
            <Text style={styles.muted}>{item.courseCode} | Week {item.weekOfReporting}</Text>
            <Text style={styles.muted}>Class: {item.className || "-"} | Faculty: {item.facultyName || item.faculty || "-"}</Text>
            <Text style={styles.muted}>Venue: {item.venue || "-"}</Text>
            <Text style={styles.muted}>Date: {item.dateOfLecture || "-"} | Time: {item.scheduledLectureTime || "-"}</Text>
            <Text style={styles.muted}>Present: {item.actualStudents || 0} / {item.registeredStudents || 0}</Text>
            {item.topicTaught ? <Text style={styles.muted}>Topic: {item.topicTaught}</Text> : null}
            {item.learningOutcomes ? <Text style={styles.muted}>Outcomes: {item.learningOutcomes}</Text> : null}
            {item.lecturerRecommendations ? <Text style={styles.muted}>Recommendations: {item.lecturerRecommendations}</Text> : null}
            {item.feedback ? <Text style={styles.muted}>Feedback: {item.feedback}</Text> : null}
            <Badge tone={["reviewed", "approved", "submitted"].includes(item.status) ? "success" : item.status === "rejected" ? "danger" : "warning"}>{item.status || "pending"}</Badge>
            {mode === "lecturer" && (
              <View style={styles.row}>
                <IconButton label="Edit" onPress={() => editReport(item)} />
                <IconButton label="Delete" variant="danger" onPress={() => setConfirmDelete(item)} />
              </View>
            )}
            {mode === "prl" && (
              <>
                <Input
                  label="PRL Feedback"
                  multiline
                  value={feedback[item.id] || ""}
                  onChangeText={(value) => setFeedback((state) => ({ ...state, [item.id]: value }))}
                />
                <Button onPress={() => submitFeedback(item)}>Save Feedback</Button>
                <View style={styles.row}>
                  <Button variant="success" onPress={() => reviewReport(item, "approved")}>Approve</Button>
                  <Button variant="danger" onPress={() => reviewReport(item, "rejected")}>Reject</Button>
                </View>
              </>
            )}
          </Card>
        )}
      />
      <ConfirmDialog
        visible={Boolean(confirmDelete)}
        title="Delete report?"
        message={`This will remove ${confirmDelete?.courseName || "this report"}.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={removeReport}
      />
    </Screen>
  );
}

export function RatingsScreen({ mode = "student" }) {
  const { currentUser, userProfile } = useAuth();
  const lecturerFilters = mode === "student" ? [{ field: "role", value: "lecturer" }, { field: "faculty", value: userProfile?.faculty }] : [{ field: "role", value: "lecturer" }];
  const { items: lecturers, loading: lecturersLoading } = useCollection("users", lecturerFilters);
  const ratingFilters = mode === "lecturer"
    ? [{ field: "lecturerId", value: currentUser?.uid }]
    : mode === "student"
      ? [{ field: "studentId", value: currentUser?.uid }]
      : [];
  const { items: ratings, loading: ratingsLoading } = useCollection("ratings", ratingFilters);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ rating: "0", teaching: "0", punctuality: "0", courseId: "", courseName: "", courseCode: "", comment: "" });
  const { items: courses } = useCollection("courses", selected ? [{ field: "lecturerId", value: selected.id }] : [], mode === "student" && Boolean(selected?.id));
  const courseOptions = courses.map((course) => ({
    label: `${course.name || course.courseName || "Course"}${course.code || course.courseCode ? ` (${course.code || course.courseCode})` : ""}`,
    value: course.id,
    course,
  }));
  const visibleRatings = ratings.filter((item) => item.requestType !== "enrollment");
  const averagesByLecturer = useMemo(() => {
    const grouped = {};
    visibleRatings.forEach((rating) => {
      grouped[rating.lecturerId] = grouped[rating.lecturerId] || [];
      grouped[rating.lecturerId].push(Number(rating.rating || 0));
    });
    return Object.fromEntries(
      Object.entries(grouped).map(([lecturerId, values]) => [
        lecturerId,
        values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
      ])
    );
  }, [visibleRatings]);

  const submit = async () => {
    if (!selected || !Number(form.rating)) {
      toast.error("Select a lecturer and rating");
      return;
    }
    if (!form.courseId) {
      toast.error("Select the course you are rating");
      return;
    }
    try {
      const ratingId = `${currentUser.uid}_${selected.id}_${form.courseId}`;
      const existing = ratings.find((rating) => rating.id === ratingId);
      await setDoc(doc(db, "ratings", ratingId), {
        studentId: currentUser.uid,
        lecturerId: selected.id,
        lecturerName: selected.fullName || selected.name || "",
        lecturerFaculty: selected.faculty || "",
        faculty: selected.faculty || userProfile?.faculty || "",
        courseId: form.courseId || "",
        courseName: form.courseName || "",
        courseCode: form.courseCode || "",
        anonymous: true,
        rating: Number(form.rating),
        teaching: Number(form.teaching || form.rating),
        punctuality: Number(form.punctuality || form.rating),
        comment: form.comment || "",
        createdAt: existing?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSelected(null);
      setForm({ rating: "0", teaching: "0", punctuality: "0", courseId: "", courseName: "", courseCode: "", comment: "" });
      toast.success(existing ? "Rating updated" : "Rating submitted");
    } catch (error) {
      toast.error(error.message || "Failed to submit rating");
    }
  };

  const startRating = (lecturer, existingRating = null) => {
    setSelected(lecturer);
    setForm({
      rating: String(existingRating?.rating || "0"),
      teaching: String(existingRating?.teaching || existingRating?.rating || "0"),
      punctuality: String(existingRating?.punctuality || existingRating?.rating || "0"),
      courseId: existingRating?.courseId || "",
      courseName: existingRating?.courseName || "",
      courseCode: existingRating?.courseCode || "",
      comment: existingRating?.comment || "",
    });
  };

  if (mode === "student") {
    const ratedLecturerIds = new Set(visibleRatings.map((rating) => rating.lecturerId));
    return (
      <Screen title="Rate Lecturers" subtitle="Teacher ratings remain anonymous">
        <View style={styles.statGrid}>
          <StatCard label="Your Ratings" value={String(visibleRatings.length)} tone="primary" />
          <StatCard label="Lecturers Rated" value={String(ratedLecturerIds.size)} tone="success" />
        </View>
        {lecturersLoading ? <Loading /> : null}
        <DataList
          data={lecturers}
          emptyTitle="No lecturers found"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.strong}>{item.fullName || item.name}</Text>
              <Text style={styles.muted}>{item.faculty || "-"}</Text>
              <Text style={styles.muted}>Average Rating: {(averagesByLecturer[item.id] || 0).toFixed(1)} / 5</Text>
              <Button onPress={() => startRating(item)}>Rate This Lecturer</Button>
              {selected?.id === item.id && (
                <Card>
                  <Select
                    label="Course"
                    value={form.courseId}
                    placeholder="-- Select Course --"
                    options={courseOptions}
                    onChange={(courseId, option) => setForm((state) => ({
                      ...state,
                      courseId,
                      courseName: option.course?.name || option.course?.courseName || "",
                      courseCode: option.course?.code || option.course?.courseCode || "",
                    }))}
                  />
                  <StarPicker label="Overall Rating" value={form.rating} onChange={(rating) => setForm((state) => ({ ...state, rating }))} />
                  <StarPicker label="Teaching" value={form.teaching} onChange={(teaching) => setForm((state) => ({ ...state, teaching }))} />
                  <StarPicker label="Punctuality" value={form.punctuality} onChange={(punctuality) => setForm((state) => ({ ...state, punctuality }))} />
                  <Input label="Comment" multiline value={form.comment} onChangeText={(comment) => setForm((state) => ({ ...state, comment }))} />
                  <Button onPress={submit}>Submit Rating</Button>
                </Card>
              )}
              {visibleRatings.filter((rating) => rating.lecturerId === item.id).map((rating) => (
                <Card key={rating.id}>
                  <Text style={styles.strong}>Your Rating</Text>
                  <Text style={styles.muted}>Course: {rating.courseName || "General lecturer rating"}</Text>
                  <Stars value={rating.rating} />
                  {rating.comment ? <Text style={styles.muted}>{rating.comment}</Text> : null}
                  <Text style={styles.muted}>Submitted: {rating.updatedAt?.toDate ? rating.updatedAt.toDate().toISOString().slice(0, 10) : "-"}</Text>
                  <Button variant="secondary" onPress={() => startRating(item, rating)}>Edit Rating</Button>
                </Card>
              ))}
            </Card>
          )}
        />
      </Screen>
    );
  }

  const analytics = lecturers
    .map((lecturer) => {
      const lecturerRatings = visibleRatings.filter((rating) => rating.lecturerId === lecturer.id);
      const total = lecturerRatings.length;
      const average = total ? lecturerRatings.reduce((sum, rating) => sum + Number(rating.rating || 0), 0) / total : 0;
      const recent = lecturerRatings
        .filter((rating) => rating.comment)
        .slice(-3)
        .reverse();
      const courseNames = Array.from(new Set(lecturerRatings.map((rating) => rating.courseName).filter(Boolean)));
      return {
        lecturer,
        ratings: lecturerRatings,
        total,
        average,
        recent,
        courseNames,
      };
    })
    .filter((item) => item.total > 0 || mode !== "lecturer")
    .filter((item) => [item.lecturer.fullName, item.lecturer.name, item.lecturer.faculty, item.courseNames.join(" ")].some((value) => lower(value).includes(lower(search))));
  const totalRatings = visibleRatings.length;
  const overallAverage = totalRatings ? visibleRatings.reduce((sum, rating) => sum + Number(rating.rating || 0), 0) / totalRatings : 0;

  return (
    <Screen title="Ratings" subtitle={mode === "lecturer" ? "Your student feedback only" : "Lecturer performance analytics"}>
      <Input placeholder="Search lecturer, faculty or course..." value={search} onChangeText={setSearch} />
      <Button
        variant="secondary"
        onPress={() => exportToExcel(
          analytics.map((item) => ({
            lecturerName: item.lecturer.fullName || item.lecturer.name || "Lecturer",
            faculty: item.lecturer.faculty || "",
            courses: item.courseNames.join(", "),
            averageRating: item.average.toFixed(2),
            totalRatings: item.total,
          })),
          "lecturer_ratings",
          "Lecturer_Ratings"
        )}
      >
        Export Ratings
      </Button>
      <View style={styles.statGrid}>
        <StatCard label="Average Rating" value={`${overallAverage.toFixed(1)} / 5`} tone="primary" />
        <StatCard label="Total Ratings" value={String(totalRatings)} tone="secondary" />
        <StatCard label="Lecturers Rated" value={String(analytics.filter((item) => item.total > 0).length)} tone="success" />
      </View>
      {ratingsLoading || lecturersLoading ? <Loading /> : null}
      <DataList
        data={analytics}
        emptyTitle="No ratings found"
        keyExtractor={(item) => item.lecturer.id}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.split}>
              <View>
                <Text style={styles.strong}>{item.lecturer.fullName || item.lecturer.name || "Lecturer"}</Text>
                <Text style={styles.muted}>Faculty: {item.lecturer.faculty || "-"}</Text>
                <Text style={styles.muted}>Course: {item.courseNames.join(", ") || "No rated course yet"}</Text>
              </View>
              <Badge tone={item.average >= 4 ? "success" : item.average >= 3 ? "primary" : item.total ? "warning" : "danger"}>
                {item.total ? `${item.average.toFixed(1)} / 5` : "No data"}
              </Badge>
            </View>
            <Text style={styles.muted}>Total Ratings: {item.total}</Text>
            {item.total ? <Stars value={item.average} /> : null}
            {item.recent.map((rating) => (
              <Card key={rating.id}>
                <Text style={styles.strong}>Anonymous Student</Text>
                <Text style={styles.muted}>{rating.courseName || "General lecturer rating"}</Text>
                <Stars value={rating.rating} />
                <Text style={styles.muted}>{rating.comment}</Text>
              </Card>
            ))}
          </Card>
        )}
      />
    </Screen>
  );
}

export function AttendanceScreen({ mode = "student" }) {
  const { currentUser, userProfile } = useAuth();
  const filters = mode === "student" ? [{ field: "studentId", value: currentUser?.uid }] : mode === "lecturer" ? [{ field: "lecturerId", value: currentUser?.uid }] : [];
  const { items, loading } = useCollection("attendance", filters);
  const { items: courses } = useCollection("courses", mode === "lecturer" ? [{ field: "lecturerId", value: currentUser?.uid }] : []);
  const { items: enrollments } = useCollection("enrollments", []);
  const [savingId, setSavingId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));

  const lecturerCourseIds = useMemo(() => new Set(courses.map((item) => item.id)), [courses]);
  const lecturerEnrollments = enrollments.filter((item) => lecturerCourseIds.has(item.courseId));
  const totalsByCourse = items.reduce((acc, item) => {
    const key = item.courseId || "unknown";
    acc[key] = acc[key] || { total: 0, attended: 0 };
    acc[key].total += 1;
    if (item.status === "present" || item.status === "late") acc[key].attended += 1;
    return acc;
  }, {});

  const markAttendance = async (enrollment, status) => {
    setSavingId(`${enrollment.studentId}-${enrollment.courseId}`);
    try {
      const existing = items.find((record) =>
        record.studentId === enrollment.studentId &&
        record.courseId === enrollment.courseId &&
        record.date === attendanceDate
      );
      const payload = {
        studentId: enrollment.studentId,
        studentName: enrollment.studentName || "",
        studentNumber: enrollment.studentNumber || "",
        courseId: enrollment.courseId,
        courseName: enrollment.courseName || "",
        courseCode: enrollment.courseCode || "",
        lecturerId: currentUser?.uid || "",
        lecturerName: userProfile?.fullName || userProfile?.name || "",
        faculty: userProfile?.faculty || enrollment.faculty || "",
        date: attendanceDate,
        status,
        markedBy: currentUser?.uid || "",
        updatedAt: serverTimestamp(),
        editedBy: currentUser?.uid || "",
      };
      if (existing) {
        await updateDoc(doc(db, "attendance", existing.id), payload);
        toast.success(`Attendance updated to ${status}`);
      } else {
        await addDoc(collection(db, "attendance"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || "",
          finalized: false,
        });
        toast.success(`Marked ${status}`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to mark attendance");
    } finally {
      setSavingId("");
    }
  };

  if (mode === "lecturer") {
    return (
      <Screen title="Attendance" subtitle="Mark attendance for enrolled students">
        <DateInput label="Attendance Date" value={attendanceDate} onChange={setAttendanceDate} />
        <Button
          variant="secondary"
          onPress={() => exportToExcel(
            items.map((record) => ({
              date: record.date || "",
              studentName: record.studentName || "",
              studentNumber: record.studentNumber || "",
              courseName: record.courseName || "",
              courseCode: record.courseCode || "",
              lecturerName: record.lecturerName || "",
              faculty: record.faculty || "",
              status: record.status || "",
            })),
            "attendance_report",
            "Attendance_Report"
          )}
        >
          Export Attendance
        </Button>
        {loading ? <Loading /> : null}
        <DataList
          data={lecturerEnrollments}
          emptyTitle="No enrolled students for your assigned courses"
          keyExtractor={(item) => `${item.studentId}-${item.courseId}`}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.strong}>{item.studentName || "Student"}</Text>
              <Text style={styles.muted}>{item.studentNumber || "-"} | {item.courseName || item.courseCode}</Text>
              <View style={styles.row}>
                <Button
                  variant="success"
                  disabled={savingId === `${item.studentId}-${item.courseId}`}
                  onPress={() => markAttendance(item, "present")}
                >
                  Present
                </Button>
                <Button
                  variant="danger"
                  disabled={savingId === `${item.studentId}-${item.courseId}`}
                  onPress={() => markAttendance(item, "absent")}
                >
                  Absent
                </Button>
              </View>
            </Card>
          )}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Attendance" subtitle="Attendance records">
      <Button
        variant="secondary"
        onPress={() => exportToExcel(
          items.map((record) => ({
            date: record.date || "",
            studentName: record.studentName || "",
            studentNumber: record.studentNumber || "",
            courseName: record.courseName || "",
            courseCode: record.courseCode || "",
            status: record.status || "",
            attendancePercentage: totalsByCourse[record.courseId]
              ? `${Math.round((totalsByCourse[record.courseId].attended / totalsByCourse[record.courseId].total) * 100)}%`
              : "",
          })),
          "student_attendance_analytics",
          "Student_Attendance"
        )}
      >
        Export Attendance
      </Button>
      {loading ? <Loading /> : null}
      <DataList
        data={items}
        emptyTitle="No attendance records"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.strong}>{item.studentName || item.courseName || "Attendance"}</Text>
            <Text style={styles.muted}>{item.courseCode || ""} {item.date || ""}</Text>
            {totalsByCourse[item.courseId] && (
              <Text style={styles.muted}>
                Attendance: {Math.round((totalsByCourse[item.courseId].attended / totalsByCourse[item.courseId].total) * 100)}%
              </Text>
            )}
            <Badge tone={item.status === "present" ? "success" : "warning"}>{item.status || "recorded"}</Badge>
          </Card>
        )}
      />
    </Screen>
  );
}

export function MonitoringScreen({ mode = "student" }) {
  const { currentUser, userProfile } = useAuth();
  const attendanceFilters = mode === "student"
    ? [{ field: "studentId", value: currentUser?.uid }]
    : mode === "lecturer"
      ? [{ field: "lecturerId", value: currentUser?.uid }]
      : [];
  const reportFilters = mode === "lecturer"
      ? [{ field: "lecturerId", value: currentUser?.uid }]
      : mode === "prl"
        ? [{ field: "facultyName", value: userProfile?.faculty }]
        : [];
  const { items: attendance, loading: attendanceLoading } = useCollection("attendance", attendanceFilters);
  const { items: reports, loading: reportsLoading } = useCollection("reports", reportFilters, mode !== "student");
  const attended = attendance.filter((item) => item.status === "present" || item.status === "late").length;
  const missed = Math.max(0, attendance.length - attended);
  const percentage = attendance.length ? Math.round((attended / attendance.length) * 100) : 0;

  return (
    <Screen title="Monitoring" subtitle="Reporting and attendance overview">
      <Button
        variant="secondary"
        onPress={() => exportToExcel(
          [
            {
              attendedLectures: attended,
              missedLectures: missed,
              attendancePercentage: `${percentage}%`,
              totalReports: reports.length,
              pendingReports: reports.filter((item) => (item.status || "pending") === "pending").length,
              reviewedReports: reports.filter((item) => item.status === "reviewed").length,
            },
            ...(mode === "student" ? attendance : reports).map((item) => ({
              type: mode === "student" ? "Attendance" : "Report",
              courseName: item.courseName || "",
              courseCode: item.courseCode || "",
              date: item.date || item.dateOfLecture || "",
              status: item.status || "",
              lecturerName: item.lecturerName || "",
              faculty: item.faculty || item.facultyName || "",
            })),
          ],
          "monitoring_analytics",
          "Monitoring_Analytics"
        )}
      >
        Export Monitoring Data
      </Button>
      {attendanceLoading || reportsLoading ? <Loading /> : null}
      <Card>
        <Text style={styles.strong}>Attendance Summary</Text>
        <Text style={styles.muted}>Attended lectures: {attended}</Text>
        <Text style={styles.muted}>Missed lectures: {missed}</Text>
        <Text style={styles.muted}>Attendance percentage: {percentage}%</Text>
      </Card>
      {mode !== "student" && (
        <Card>
          <Text style={styles.strong}>Report Summary</Text>
          <Text style={styles.muted}>Total reports: {reports.length}</Text>
          <Text style={styles.muted}>Pending: {reports.filter((item) => (item.status || "pending") === "pending").length}</Text>
          <Text style={styles.muted}>Reviewed: {reports.filter((item) => item.status === "reviewed").length}</Text>
        </Card>
      )}
      <DataList
        data={mode === "student" ? attendance : reports}
        emptyTitle={mode === "student" ? "No attendance records yet" : "No reports found"}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.strong}>{mode === "student" ? item.courseName || "Attendance" : item.courseName || "Report"}</Text>
            <Text style={styles.muted}>
              {mode === "student"
                ? `${item.date || "-"} | ${item.status || "recorded"}`
                : `${item.courseCode || "-"} | ${item.status || "pending"}`}
            </Text>
          </Card>
        )}
      />
    </Screen>
  );
}

export function LecturersScreen() {
  const { items, loading } = useCollection("users", [{ field: "role", value: "lecturer" }]);
  return (
    <Screen title="Lecturers" subtitle="Registered lecturers">
      {loading ? <Loading /> : null}
      <DataList
        data={items}
        emptyTitle="No lecturers found"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.strong}>{item.fullName || item.name}</Text>
            <Text style={styles.muted}>{item.email}</Text>
            <Text style={styles.muted}>{item.faculty || "-"}</Text>
          </Card>
        )}
      />
    </Screen>
  );
}
