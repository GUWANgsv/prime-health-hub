import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { patientService } from "../services/patientService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function RegisterPatientPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "MALE",
    contact: "",
    address: "",
    medicalHistory: "",
    allergies: "",
    chronicConditions: ""
  });

  const toList = (v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");
    const age = Number(form.age);
    const contact = String(form.contact || "").replace(/\s+/g, "");

    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 8 characters and include letters and numbers");
      return;
    }

    if (!Number.isInteger(age) || age < 1 || age > 130) {
      setError("Age must be a valid whole number between 1 and 130");
      return;
    }

    if (!/^\+?\d{10,15}$/.test(contact)) {
      setError("Contact number must contain only digits and be 10 to 15 numbers");
      return;
    }

    setLoading(true);

    try {
      // userSchema registration
      await authService.register({
        name: form.name,
        email,
        password,
        role: "PATIENT"
      });

      // login to get JWT for patient profile creation
      const loginResult = await authService.login({ email, password });
      const token = loginResult.token;

      // Ensure token is in localStorage for API interceptor
      localStorage.setItem("token", token);

      // Small delay to ensure interceptor picks up the token
      await new Promise(resolve => setTimeout(resolve, 100));

      // patientSchema profile creation
      await patientService.createPatientProfile({
        age,
        gender: form.gender,
        contact,
        address: form.address,
        medicalHistory: toList(form.medicalHistory),
        allergies: toList(form.allergies),
        chronicConditions: toList(form.chronicConditions)
      });

      localStorage.removeItem("token");
      setSuccess("Patient registration completed. Please login.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Patient registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", py: { xs: 3, md: 5 }, px: { xs: 2, sm: 0 } }}>
      <Card sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            color: "white",
            background: "linear-gradient(120deg, #2e8b57, #1f6feb)"
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.8 }}>
            Patient Registration
          </Typography>
          <Typography sx={{ opacity: 0.92 }}>
            Create your account, add your profile, and start booking care.
          </Typography>
        </Box>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 750 }}>Create user and patient profile</Typography>

          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}

          <Stack component="form" spacing={1.3} onSubmit={submit} sx={{ width: "100%" }}>
            <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required helperText="Use a valid email like name@example.com" />
            <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required inputProps={{ minLength: 8 }} helperText="At least 8 characters with letters and numbers" />
            <TextField fullWidth label="Age" type="number" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} required inputProps={{ min: 1, max: 130, step: 1 }} helperText="Enter age between 1 and 130" />
            <TextField fullWidth select label="Gender" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}>
              <MenuItem value="MALE">MALE</MenuItem>
              <MenuItem value="FEMALE">FEMALE</MenuItem>
              <MenuItem value="OTHER">OTHER</MenuItem>
            </TextField>
            <TextField fullWidth label="Contact" value={form.contact} onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} required helperText="Digits only, 10 to 15 numbers (optional + at start)" />
            <TextField fullWidth label="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required />
            <TextField fullWidth label="Medical History (comma separated)" value={form.medicalHistory} onChange={(e) => setForm((p) => ({ ...p, medicalHistory: e.target.value }))} />
            <TextField fullWidth label="Allergies (comma separated)" value={form.allergies} onChange={(e) => setForm((p) => ({ ...p, allergies: e.target.value }))} />
            <TextField fullWidth label="Chronic Conditions (comma separated)" value={form.chronicConditions} onChange={(e) => setForm((p) => ({ ...p, chronicConditions: e.target.value }))} />
            <Button type="submit" variant="contained" disabled={loading} sx={{ py: 1.25 }}>
              {loading ? "Creating..." : "Register Patient"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default RegisterPatientPage;
