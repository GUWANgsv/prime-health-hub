import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { doctorService } from "../services/doctorService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const SPECIALIZATIONS = [
  "General Practice",
  "Family Medicine",
  "Internal Medicine",
  "Pediatrics",
  "Geriatrics",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Hematology",
  "Infectious Disease",
  "Nephrology",
  "Neurology",
  "Oncology",
  "Pulmonology",
  "Rheumatology",
  "Psychiatry",
  "General Surgery",
  "Neurosurgery",
  "Orthopedic Surgery",
  "Plastic Surgery",
  "Vascular Surgery",
  "Cardiothoracic Surgery",
  "Urology",
  "Obstetrics & Gynecology (OB/GYN)",
  "Neonatology",
  "Pediatric Surgery",
  "Ophthalmology",
  "Otolaryngology (ENT)",
  "Dentistry",
  "Radiology",
  "Pathology",
  "Anesthesiology",
  "Emergency Medicine",
  "Physical Medicine & Rehabilitation",
  "Sports Medicine",
  "Pain Management",
  "Immunology",
  "Allergy Medicine"
];

function RegisterDoctorPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    specialization: "",
    experience: "",
    qualifications: "",
    consultationFee: "2500"
  });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");
    const contact = String(form.contact || "").replace(/\s+/g, "");

    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!/^\+?\d{10,15}$/.test(contact)) {
      setError("Contact number must contain only digits and be 10 to 15 numbers");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 8 characters and include letters and numbers");
      return;
    }

    setLoading(true);

    try {
      // userSchema registration
      await authService.register({
        name: form.name,
        email,
        password,
        role: "DOCTOR"
      });

      // login to get JWT for doctor profile creation
      const loginResult = await authService.login({ email, password });
      const token = loginResult.token;

      // Ensure token is in localStorage for API interceptor
      localStorage.setItem("token", token);

      // Small delay to ensure interceptor picks up the token
      await new Promise(resolve => setTimeout(resolve, 100));

      // doctorSchema profile creation
      await doctorService.createDoctorProfile({
        doctorName: form.name,
        contact,
        specialization: form.specialization,
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee),
        qualifications: form.qualifications
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      });

      localStorage.removeItem("token");
      setSuccess("Doctor registration completed. Please login.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Doctor registration failed");
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
            background: "linear-gradient(120deg, #0b3954, #2e8b57)"
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.8 }}>
            Doctor Registration
          </Typography>
          <Typography sx={{ opacity: 0.92 }}>
            Add your profile details, specialization, and consultation fee.
          </Typography>
        </Box>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 750 }}>Create user and doctor profile</Typography>

          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}

          <Stack component="form" spacing={1.3} onSubmit={submit} sx={{ width: "100%" }}>
            <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required helperText="Use a valid email like name@example.com" />
            <TextField fullWidth label="Contact Number" value={form.contact} onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} required helperText="Digits only, 10 to 15 numbers (optional + at start)" />
            <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required inputProps={{ minLength: 8 }} helperText="At least 8 characters with letters and numbers" />
            <TextField
              fullWidth
              select
              label="Specialization"
              value={form.specialization}
              onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
              required
            >
              {SPECIALIZATIONS.map((specialization) => (
                <MenuItem key={specialization} value={specialization}>
                  {specialization}
                </MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Experience (years)" type="number" value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))} required />
            <TextField fullWidth label="Consultation Fee (LKR)" type="number" value={form.consultationFee} onChange={(e) => setForm((p) => ({ ...p, consultationFee: e.target.value }))} required />
            <TextField fullWidth label="Qualifications (comma separated)" value={form.qualifications} onChange={(e) => setForm((p) => ({ ...p, qualifications: e.target.value }))} />
            <Button type="submit" variant="contained" color="secondary" disabled={loading} sx={{ py: 1.25 }}>
              {loading ? "Creating..." : "Register Doctor"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default RegisterDoctorPage;
