import React, { useEffect, useState } from "react";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { FACULTIES } from "../constants/academic";
import { useAuth } from "../context/AuthContext";
import toast from "../components/Toast";
import { Button, Card, Input, Screen, Select, styles } from "../components/NativeUI";
import { Text } from "react-native";

const facultyOptions = FACULTIES.map((faculty) => ({ label: faculty, value: faculty }));
const genderOptions = ["Female", "Male", "Other", "Prefer not to say"].map((item) => ({ label: item, value: item }));

export default function ProfileScreen() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    studentId: "",
    faculty: "",
    phoneNumber: "",
    address: "",
    gender: "",
    dateOfBirth: "",
    emergencyContact: "",
  });
  const [requestReason, setRequestReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      studentId: userProfile?.studentId || userProfile?.studentNumber || "",
      faculty: userProfile?.faculty || "",
      phoneNumber: userProfile?.phoneNumber || "",
      address: userProfile?.address || "",
      gender: userProfile?.gender || "",
      dateOfBirth: userProfile?.dateOfBirth || "",
      emergencyContact: userProfile?.emergencyContact || "",
    });
  }, [userProfile]);

  const save = async () => {
    if (!currentUser?.uid) return;
    if (!form.studentId.trim() || !form.faculty) {
      toast.error("Student ID and faculty are required");
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          studentId: userProfile?.studentId || form.studentId.trim(),
          studentNumber: userProfile?.studentNumber || form.studentId.trim(),
          faculty: form.faculty,
          phoneNumber: form.phoneNumber.trim(),
          address: form.address.trim(),
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          emergencyContact: form.emergencyContact.trim(),
          profileDetailsLocked: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await refreshProfile();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const requestProfileEdit = async () => {
    if (!currentUser?.uid) return;
    if (!requestReason.trim()) {
      toast.error("Please explain what needs to change");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "profileEditRequests"), {
        studentId: currentUser.uid,
        studentName: userProfile?.fullName || userProfile?.name || "",
        studentNumber: userProfile?.studentNumber || userProfile?.studentId || "",
        faculty: userProfile?.faculty || "",
        reason: requestReason.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
      });
      setRequestReason("");
      toast.success("Profile edit request sent to Program Leader");
    } catch (error) {
      toast.error(error.message || "Failed to send profile edit request");
    } finally {
      setSaving(false);
    }
  };

  const isStudent = userProfile?.role === "student";
  const profileLocked = Boolean(userProfile?.profileDetailsLocked);
  const needsDetails = isStudent && (!userProfile?.studentId || !userProfile?.faculty || !profileLocked);

  return (
    <Screen title="Profile" subtitle={currentUser?.email}>
      <Card>
        <Text style={styles.strong}>{userProfile?.fullName || userProfile?.name || "User"}</Text>
        <Text style={styles.muted}>Role: {userProfile?.role || "-"}</Text>
        <Text style={styles.muted}>Faculty: {userProfile?.faculty || "-"}</Text>
        {userProfile?.role === "student" && <Text style={styles.muted}>Student ID: {userProfile?.studentNumber || userProfile?.studentId || "-"}</Text>}
        {isStudent && <Text style={styles.muted}>Profile details: {profileLocked ? "Locked" : "Not completed"}</Text>}
      </Card>
      {needsDetails && (
        <Card>
          <Text style={styles.strong}>Complete Student Details</Text>
          <Text style={styles.muted}>After saving, these details are locked. Future changes must be approved by the Program Leader.</Text>
          <Input label="Student ID" value={form.studentId} onChangeText={(value) => setForm((current) => ({ ...current, studentId: value }))} />
          <Select label="Faculty" value={form.faculty} placeholder="-- Select Faculty --" options={facultyOptions} onChange={(faculty) => setForm((current) => ({ ...current, faculty }))} />
          <Input label="Phone Number" value={form.phoneNumber} onChangeText={(phoneNumber) => setForm((current) => ({ ...current, phoneNumber }))} />
          <Input label="Address" value={form.address} onChangeText={(address) => setForm((current) => ({ ...current, address }))} />
          <Select label="Gender" value={form.gender} placeholder="-- Select Gender --" options={genderOptions} onChange={(gender) => setForm((current) => ({ ...current, gender }))} />
          <Input label="Date of Birth" placeholder="YYYY-MM-DD" value={form.dateOfBirth} onChangeText={(dateOfBirth) => setForm((current) => ({ ...current, dateOfBirth }))} />
          <Input label="Emergency Contact" value={form.emergencyContact} onChangeText={(emergencyContact) => setForm((current) => ({ ...current, emergencyContact }))} />
          <Button onPress={save} disabled={saving}>{saving ? "Saving..." : "Save Details"}</Button>
        </Card>
      )}
      {isStudent && profileLocked && (
        <Card>
          <Text style={styles.strong}>Request Profile Update</Text>
          <Text style={styles.muted}>Your profile details are locked. Send a request to the Program Leader if something needs to change.</Text>
          <Input label="What should be changed?" multiline value={requestReason} onChangeText={setRequestReason} />
          <Button onPress={requestProfileEdit} disabled={saving}>{saving ? "Sending..." : "Send Request"}</Button>
        </Card>
      )}
    </Screen>
  );
}
