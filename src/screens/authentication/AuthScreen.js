import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { FACULTIES } from "../../constants/academic";
import { loginUser, registerUser } from "../../firebase/authService";
import toast from "../../components/Toast";
import { Button, Card, Input, Screen, Select, styles } from "../../components/NativeUI";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  role: "student",
  faculty: "",
  programme: "",
  studentId: "",
};

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const roles = useMemo(() => [
    { label: "Student", value: "student" },
    { label: "Lecturer", value: "lecturer" },
    { label: "Program Leader", value: "pl" },
    { label: "Principal Lecturer", value: "prl" },
  ], []);
  const facultyOptions = useMemo(() => FACULTIES.map((faculty) => ({ label: faculty, value: faculty })), []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async () => {
    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }

    if (mode === "register" && !form.fullName) {
      toast.error("Full name is required");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginUser(form.email.trim(), form.password);
        toast.success("Signed in successfully");
      } else {
        await registerUser(form.email.trim(), form.password, {
          ...form,
          email: form.email.trim(),
          studentNumber: form.studentId,
        });
        toast.success("Account created successfully");
      }
    } catch (error) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title={mode === "login" ? "Sign In" : "Register"} subtitle="Limkokwing reporting system">
      <Card>
        <View style={{ alignItems: "center", gap: 8, marginBottom: 8 }}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>LU</Text>
          </View>
          <Text style={styles.strong}>LUCT Reporting System</Text>
          <Text style={styles.muted}>Lecturer Reporting and Attendance Monitoring</Text>
        </View>
        {mode === "register" && (
          <>
            <Input label="Full Name" value={form.fullName} onChangeText={(value) => setField("fullName", value)} />
            <Select
              label="Role"
              value={form.role}
              placeholder="-- Select Role --"
              options={roles}
              onChange={(role) => setField("role", role)}
            />
            <Select
              label="Faculty"
              value={form.faculty}
              placeholder="-- Select Faculty --"
              options={facultyOptions}
              onChange={(faculty) => setField("faculty", faculty)}
            />
            {form.role === "student" && (
              <Input label="Student ID" value={form.studentId} onChangeText={(value) => setField("studentId", value)} />
            )}
          </>
        )}
        <Input label="Email" value={form.email} onChangeText={(value) => setField("email", value)} keyboardType="email-address" />
        <Input label="Password" value={form.password} onChangeText={(value) => setField("password", value)} secureTextEntry />
        <Button onPress={submit} disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}</Button>
        <Button variant="secondary" onPress={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Create a student or staff account" : "Already have an account? Sign in"}
        </Button>
      </Card>
    </Screen>
  );
}
