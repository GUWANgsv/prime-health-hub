import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { appointmentService } from "../services/appointmentService";
import { doctorService } from "../services/doctorService";
import { patientService } from "../services/patientService";
import { aiService } from "../services/aiService";
import { useAuth } from "../context/AuthContext";

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

const APPOINTMENT_STATUS_ORDER = {
  PENDING: 0,
  CONFIRMED: 1,
  CANCELLED: 2,
  COMPLETED: 3
};

function PatientDashboardPage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const tabParam = searchParams.get("tab");
  const tab = ["home", "appointments", "reports", "profile", "ai"].includes(tabParam) ? tabParam : "home";

  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState("ALL");
  const [patient, setPatient] = useState(null);

  const [doctorQuery, setDoctorQuery] = useState({ name: "", specialization: "" });
  const [doctors, setDoctors] = useState([]);

  const [bookForm, setBookForm] = useState({
    doctorId: "",
    date: "",
    time: "",
    reason: ""
  });

  const [reportFile, setReportFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [jitsiSession, setJitsiSession] = useState({
    open: false,
    url: "",
    appointmentId: ""
  });

  const [profileForm, setProfileForm] = useState({
    patientName: user?.name || "",
    age: "",
    gender: "MALE",
    contact: "",
    address: "",
    medicalHistory: "",
    allergies: "",
    chronicConditions: ""
  });

  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [whatsappLink, setWhatsappLink] = useState("");

  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.userId) === String(bookForm.doctorId)),
    [doctors, bookForm.doctorId]
  );

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((left, right) => {
        const leftRank = APPOINTMENT_STATUS_ORDER[left.status] ?? 99;
        const rightRank = APPOINTMENT_STATUS_ORDER[right.status] ?? 99;

        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        const leftDate = `${left.date || ""} ${left.time || ""}`;
        const rightDate = `${right.date || ""} ${right.time || ""}`;
        return leftDate.localeCompare(rightDate);
      }),
    [appointments]
  );

  const toCsv = (arr = []) => (Array.isArray(arr) ? arr.join(", ") : "");
  const toList = (text) =>
    String(text || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, statsRes, apptRes, doctorsRes] = await Promise.allSettled([
        patientService.getMyProfile(),
        appointmentService.getMyStats(),
        appointmentService.getMyAppointments(appointmentFilter),
        doctorService.searchApprovedDoctors({})
      ]);
      const errors = [];

      if (profileRes.status === "fulfilled") {
        setPatient(profileRes.value.patient || null);
        setProfileForm({
          patientName: user?.name || "",
          age: String(profileRes.value.patient?.age || ""),
          gender: profileRes.value.patient?.gender || "MALE",
          contact: profileRes.value.patient?.contact || "",
          address: profileRes.value.patient?.address || "",
          medicalHistory: toCsv(profileRes.value.patient?.medicalHistory),
          allergies: toCsv(profileRes.value.patient?.allergies),
          chronicConditions: toCsv(profileRes.value.patient?.chronicConditions)
        });

        if (profileRes.value.patient?._id) {
          try {
            const reportsRes = await patientService.getReports(profileRes.value.patient._id);
            setReports(reportsRes.reports || []);
          } catch (reportErr) {
            errors.push(reportErr.response?.data?.message || "Failed to load reports");
          }
        }
      } else {
        setPatient(null);
        setReports([]);
        errors.push(profileRes.reason?.response?.data?.message || "Failed to load profile");
      }

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.stats || {
          todayAppointments: 0,
          totalAppointments: 0,
          pendingAppointments: 0,
          confirmedAppointments: 0
        });
      } else {
        setStats({
          todayAppointments: 0,
          totalAppointments: 0,
          pendingAppointments: 0,
          confirmedAppointments: 0
        });
        errors.push(statsRes.reason?.response?.data?.message || "Failed to load appointment stats");
      }

      if (apptRes.status === "fulfilled") {
        setAppointments(apptRes.value.appointments || []);
      } else {
        setAppointments([]);
        errors.push(apptRes.reason?.response?.data?.message || "Failed to load appointments");
      }

      if (doctorsRes.status === "fulfilled") {
        setDoctors(doctorsRes.value.doctors || []);
      } else {
        setDoctors([]);
        errors.push(doctorsRes.reason?.response?.data?.message || "Failed to load doctors");
      }

      if (errors.length > 0) {
        setError(errors[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load patient dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [appointmentFilter]);

  const searchDoctors = async () => {
    setError("");
    try {
      const res = await doctorService.searchApprovedDoctors(doctorQuery);
      setDoctors(res.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search doctors");
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const result = await appointmentService.bookAppointment(bookForm);
      setWhatsappLink(result.whatsappLink || result.notificationDelivery?.find((item) => item?.whatsappLink)?.whatsappLink || "");
      setSuccess("Appointment booked successfully");
      setBookForm({ doctorId: "", date: "", time: "", reason: "" });
      await loadDashboardData();
      setSearchParams({ tab: "home" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setError("");
    setSuccess("");
    try {
      await appointmentService.cancelAppointment(appointmentId);
      setSuccess("Appointment cancelled successfully");
      await loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const handleRescheduleAppointment = async (appointment) => {
    const nextDate = window.prompt("Enter new date (YYYY-MM-DD)", appointment.date || "");
    if (!nextDate) return;

    const nextTime = window.prompt("Enter new time (HH:mm)", appointment.time || "");
    if (!nextTime) return;

    setError("");
    setSuccess("");
    try {
      await appointmentService.rescheduleAppointment(appointment._id, {
        date: nextDate,
        time: nextTime
      });
      setSuccess("Appointment date/time updated successfully");
      await loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reschedule appointment");
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!patient?._id || !reportFile) {
      setError("Please choose a file first");
      return;
    }

    setError("");
    setSuccess("");
    try {
      await patientService.addReport(patient._id, { file: reportFile });
      const refreshed = await patientService.getReports(patient._id);
      setReports(refreshed.reports || []);
      setReportFile(null);
      setSuccess("Medical report uploaded");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload report");
    }
  };

  const downloadBlob = (response, fallbackName) => {
    const blob = response.data;
    const disposition = response.headers?.["content-disposition"] || "";
    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^\";]+)"?/i);
    const fileName = decodeURIComponent(match?.[1] || match?.[2] || fallbackName);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadMyReport = async (report) => {
    if (!patient?._id || !report?._id) {
      setError("This report cannot be downloaded");
      return;
    }

    setError("");
    try {
      const response = await patientService.downloadReport(patient._id, report._id);
      downloadBlob(response, report.fileName || "medical-report");
      setSuccess("Report downloaded successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download report");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!patient?._id) return;

    setError("");
    setSuccess("");
    try {
      await patientService.updateProfile(patient._id, {
        age: Number(profileForm.age),
        contact: profileForm.contact,
        address: profileForm.address,
        medicalHistory: toList(profileForm.medicalHistory),
        allergies: toList(profileForm.allergies),
        chronicConditions: toList(profileForm.chronicConditions)
      });
      setSuccess("Profile updated successfully");
      await loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleDeleteProfile = async () => {
    if (!patient?._id) return;
    const confirmed = window.confirm("Delete your patient profile? This cannot be undone.");
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await patientService.deleteProfile(patient._id);
      logout();
      setSuccess("Profile deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete profile");
    }
  };

  const handleAnalyzeSymptoms = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAnalysis(null);
    try {
      const res = await aiService.analyzeSymptoms(symptoms, user?.id);
      setAnalysis(res.analysis);
      setSuccess("AI analysis completed");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to analyze symptoms");
    }
  };

  const copyVideoLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess("Video call URL copied");
    } catch {
      setError("Unable to copy URL");
    }
  };

  const submitPayHereCheckout = (checkoutUrl, payload) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = checkoutUrl;

    Object.entries(payload || {}).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value ?? "");
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();
  };

  const handlePayConsultation = async (appointment) => {
    setError("");
    setSuccess("");

    try {
      const paymentRes = await appointmentService.initiatePayHerePayment(appointment._id);
      const payment = paymentRes.payment;
      if (!payment?.checkoutUrl || !payment?.payload) {
        throw new Error("Invalid payment payload");
      }

      setSuccess("Redirecting to secure payment gateway...");
      submitPayHereCheckout(payment.checkoutUrl, payment.payload);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to start payment");
    }
  };

  const NotificationLink = () =>
    whatsappLink ? (
      <Alert
        severity="success"
        sx={{ mb: 2, alignItems: "center" }}
        action={
          <Button color="inherit" size="small" href={whatsappLink} target="_blank" rel="noreferrer">
            Open WhatsApp
          </Button>
        }
      >
        WhatsApp confirmation link is ready.
      </Alert>
    ) : null;

  const openJitsiSession = (appointment) => {
    const url = appointment.videoCallUrl;
    if (!url) {
      setError("No video call link is available for this appointment");
      return;
    }

    setError("");
    setJitsiSession({
      open: true,
      url,
      appointmentId: appointment._id
    });
  };

  const closeJitsiSession = () => {
    setJitsiSession((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 2, md: 0 } }}>
      <Card sx={{ mb: 2, borderRadius: 3, overflow: "hidden" }}>
        <Box
          sx={{
            p: { xs: 4, md: 7 },
            minHeight: { xs: 260, md: 360 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: "white",
            backgroundImage:
              "linear-gradient(120deg, rgba(9,81,126,.42), rgba(4,120,87,.30)), url('https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?q=80&w=1600&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Patient Home</Typography>
          <Typography sx={{ opacity: 0.9, mt: 1 }}>
            Search approved doctors, manage appointments, upload medical reports, update your profile, and check symptoms with AI.
          </Typography>
        </Box>
      </Card>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}
      <NotificationLink />
      {loading ? <Alert severity="info" sx={{ mb: 2 }}>Loading patient data...</Alert> : null}

      {tab === "home" ? (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent><Typography color="text.secondary">Today Appointments</Typography><Typography variant="h4">{stats.todayAppointments}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent><Typography color="text.secondary">Total Appointments</Typography><Typography variant="h4">{stats.totalAppointments}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent><Typography color="text.secondary">Pending</Typography><Typography variant="h4">{stats.pendingAppointments}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent><Typography color="text.secondary">Confirmed</Typography><Typography variant="h4">{stats.confirmedAppointments}</Typography></CardContent></Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Search Doctors by Specialization or Name</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Doctor Name"
                    value={doctorQuery.name}
                    onChange={(e) => setDoctorQuery((p) => ({ ...p, name: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    select
                    fullWidth
                    label="Specialization"
                    value={doctorQuery.specialization}
                    onChange={(e) => setDoctorQuery((p) => ({ ...p, specialization: e.target.value }))}
                  >
                    <MenuItem value="">All</MenuItem>
                    {SPECIALIZATIONS.map((spec) => (
                      <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="contained" onClick={searchDoctors}>Search</Button>
                </Grid>
              </Grid>

              <Stack spacing={1.2} sx={{ mt: 2 }}>
                {doctors.map((doctor) => (
                  <Card key={doctor._id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{doctor.doctorName || "Doctor"}</Typography>
                      <Typography color="text.secondary">{doctor.specialization}</Typography>
                      <Typography variant="body2">Experience: {doctor.experience} years</Typography>
                    </CardContent>
                  </Card>
                ))}
                {doctors.length === 0 ? <Typography color="text.secondary">No approved doctors found.</Typography> : null}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Today & Upcoming Appointments</Typography>
              <Stack spacing={1.2}>
                {sortedAppointments.map((appointment) => (
                  <Card key={appointment._id} variant="outlined">
                    <CardContent>
                      <Typography sx={{ fontWeight: 700 }}>{appointment.doctorName || "Doctor"} • {appointment.specialization}</Typography>
                      <Typography color="text.secondary">{appointment.date} at {appointment.time}</Typography>
                      <Typography variant="body2">Status: {appointment.status}</Typography>
                      <Typography variant="body2">Consultation Fee: LKR {Number(appointment.consultationFee || 0).toFixed(2)}</Typography>
                      <Typography variant="body2">Payment: {appointment.paymentStatus || "UNPAID"}</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Prescription: {appointment.prescriptionText ? appointment.prescriptionText : "Not issued yet"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Issued At: {appointment.prescriptionIssuedAt ? new Date(appointment.prescriptionIssuedAt).toLocaleString() : "N/A"}
                      </Typography>
                      {appointment.status === "PENDING" ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                          <Button variant="outlined" onClick={() => handleRescheduleAppointment(appointment)}>
                            Modify date/time
                          </Button>
                          <Button color="error" variant="outlined" onClick={() => handleCancelAppointment(appointment._id)}>
                            Cancel before confirmation
                          </Button>
                        </Stack>
                      ) : null}
                      {appointment.status === "CONFIRMED" && appointment.paymentStatus !== "PAID" ? (
                        <Button sx={{ mt: 1 }} variant="contained" color="warning" onClick={() => handlePayConsultation(appointment)}>
                          Pay Consultation Fee
                        </Button>
                      ) : null}
                      {appointment.status === "CONFIRMED" && appointment.videoCallStartedByDoctor && appointment.videoCallUrl ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                          <TextField fullWidth size="small" value={appointment.videoCallUrl} InputProps={{ readOnly: true }} />
                          <Button variant="outlined" onClick={() => copyVideoLink(appointment.videoCallUrl)}>Copy URL</Button>
                          <Button variant="contained" onClick={() => openJitsiSession(appointment)}>Join in App</Button>
                          <Button variant="text" href={appointment.videoCallUrl} target="_blank" rel="noreferrer">Open in New Tab</Button>
                        </Stack>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
                {sortedAppointments.length === 0 ? <Typography color="text.secondary">No appointments yet.</Typography> : null}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      {tab === "appointments" ? (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Your Appointments</Typography>
              <Tabs
                value={appointmentFilter}
                onChange={(_, value) => setAppointmentFilter(value)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                <Tab value="ALL" label="All" />
                <Tab value="PENDING" label="Pending" />
                <Tab value="CONFIRMED" label="Confirmed" />
                <Tab value="CANCELLED" label="Cancelled" />
                <Tab value="COMPLETED" label="Completed" />
              </Tabs>

              <Typography variant="h6" sx={{ mb: 2 }}>Find Approved Doctors for Availability</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Doctor Name"
                    value={doctorQuery.name}
                    onChange={(e) => setDoctorQuery((p) => ({ ...p, name: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Specialization"
                    value={doctorQuery.specialization}
                    onChange={(e) => setDoctorQuery((p) => ({ ...p, specialization: e.target.value }))}
                  >
                    <MenuItem value="">All</MenuItem>
                    {SPECIALIZATIONS.map((spec) => (
                      <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button fullWidth variant="contained" onClick={searchDoctors}>Search</Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Stack component="form" spacing={1.3} onSubmit={handleBookAppointment}>
                <TextField
                  select
                  label="Select Doctor"
                  value={bookForm.doctorId}
                  onChange={(e) => setBookForm((p) => ({ ...p, doctorId: e.target.value }))}
                  required
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor._id} value={doctor.userId}>
                      {(doctor.doctorName || "Doctor") + " - " + doctor.specialization}
                    </MenuItem>
                  ))}
                </TextField>

                <Grid container spacing={1.3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date"
                      InputLabelProps={{ shrink: true }}
                      value={bookForm.date}
                      onChange={(e) => setBookForm((p) => ({ ...p, date: e.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Time"
                      InputLabelProps={{ shrink: true }}
                      value={bookForm.time}
                      onChange={(e) => setBookForm((p) => ({ ...p, time: e.target.value }))}
                      required
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Reason"
                  value={bookForm.reason}
                  onChange={(e) => setBookForm((p) => ({ ...p, reason: e.target.value }))}
                  multiline
                  minRows={2}
                />

                {selectedDoctor?.availability?.length ? (
                  <Alert severity="info">
                    Availability shared by doctor: {selectedDoctor.availability.map((a) => `${a.date} (${(a.timeSlots || []).join("/")})`).join("; ")}
                  </Alert>
                ) : (
                  <Alert severity="warning">No schedule shared yet. You can still book and wait for confirmation.</Alert>
                )}

                <Button type="submit" variant="contained">Book Appointment</Button>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 1 }}>Your Appointments</Typography>
              <Stack spacing={1.2}>
                {sortedAppointments.map((appointment) => (
                  <Card key={appointment._id} variant="outlined">
                    <CardContent>
                      <Typography sx={{ fontWeight: 700 }}>
                        {appointment.doctorName || "Doctor"} • {appointment.specialization}
                      </Typography>
                      <Typography color="text.secondary">
                        {appointment.date} at {appointment.time}
                      </Typography>
                      <Typography variant="body2">Status: {appointment.status}</Typography>
                      <Typography variant="body2">Consultation Fee: LKR {Number(appointment.consultationFee || 0).toFixed(2)}</Typography>
                      <Typography variant="body2">Payment: {appointment.paymentStatus || "UNPAID"}</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Prescription: {appointment.prescriptionText ? appointment.prescriptionText : "Not issued yet"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Issued At: {appointment.prescriptionIssuedAt ? new Date(appointment.prescriptionIssuedAt).toLocaleString() : "N/A"}
                      </Typography>
                      {appointment.status === "PENDING" ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                          <Button
                            variant="outlined"
                            onClick={() => handleRescheduleAppointment(appointment)}
                          >
                            Modify date/time
                          </Button>
                          <Button
                            color="error"
                            variant="outlined"
                            onClick={() => handleCancelAppointment(appointment._id)}
                          >
                            Cancel before confirmation
                          </Button>
                        </Stack>
                      ) : null}
                      {appointment.status === "CONFIRMED" && appointment.paymentStatus !== "PAID" ? (
                        <Button sx={{ mt: 1 }} variant="contained" color="warning" onClick={() => handlePayConsultation(appointment)}>
                          Pay Consultation Fee
                        </Button>
                      ) : null}
                      {appointment.status === "CONFIRMED" && appointment.videoCallStartedByDoctor && appointment.videoCallUrl ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={appointment.videoCallUrl}
                            InputProps={{ readOnly: true }}
                          />
                          <Button variant="outlined" onClick={() => copyVideoLink(appointment.videoCallUrl)}>
                            Copy URL
                          </Button>
                          <Button variant="contained" onClick={() => openJitsiSession(appointment)}>
                            Join in App
                          </Button>
                          <Button variant="text" href={appointment.videoCallUrl} target="_blank" rel="noreferrer">
                            Open in New Tab
                          </Button>
                        </Stack>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
                {sortedAppointments.length === 0 ? (
                  <Typography color="text.secondary">No appointments yet.</Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      {tab === "reports" ? (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Upload Medical Reports</Typography>
              <Stack component="form" spacing={1.3} onSubmit={handleUploadReport}>
                <Button component="label" variant="outlined">
                  Choose File
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                  />
                </Button>
                <Typography color="text.secondary">{reportFile ? `${reportFile.name} (${reportFile.type || "unknown"})` : "No file selected"}</Typography>
                <Button type="submit" variant="contained">Upload Medical Report Metadata</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>All Uploaded Reports</Typography>
              <Stack spacing={1.1}>
                {reports.map((report, idx) => (
                  <Card key={`${report.fileName}-${idx}`} variant="outlined">
                    <CardContent>
                      <Typography sx={{ fontWeight: 700 }}>{report.fileName}</Typography>
                      <Typography color="text.secondary">Type: {report.fileType}</Typography>
                      <Typography variant="body2">Uploaded: {new Date(report.uploadedAt).toLocaleString()}</Typography>
                      <Button sx={{ mt: 1 }} variant="outlined" onClick={() => handleDownloadMyReport(report)} disabled={!report._id}>
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {reports.length === 0 ? <Typography color="text.secondary">No reports uploaded yet.</Typography> : null}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      {tab === "profile" ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Patient Profile</Typography>
            <Stack component="form" spacing={1.3} onSubmit={handleProfileUpdate}>
              <Grid container spacing={1.3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Patient Name"
                    value={profileForm.patientName || ""}
                    InputProps={{ readOnly: true }}
                    disabled
                    helperText="Patient name cannot be updated"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Gender"
                    value={profileForm.gender}
                    InputProps={{ readOnly: true }}
                    disabled
                    helperText="Gender cannot be updated"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Age"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact"
                    value={profileForm.contact}
                    onChange={(e) => setProfileForm((p) => ({ ...p, contact: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                    required
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Medical History (comma separated)"
                value={profileForm.medicalHistory}
                onChange={(e) => setProfileForm((p) => ({ ...p, medicalHistory: e.target.value }))}
                multiline
                minRows={2}
              />
              <TextField
                fullWidth
                label="Allergies (comma separated)"
                value={profileForm.allergies}
                onChange={(e) => setProfileForm((p) => ({ ...p, allergies: e.target.value }))}
                multiline
                minRows={2}
              />
              <TextField
                fullWidth
                label="Chronic Conditions (comma separated)"
                value={profileForm.chronicConditions}
                onChange={(e) => setProfileForm((p) => ({ ...p, chronicConditions: e.target.value }))}
                multiline
                minRows={2}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button type="submit" variant="contained">Update Profile</Button>
                <Button color="error" variant="outlined" onClick={handleDeleteProfile}>Delete Profile</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {tab === "ai" ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>AI Symptom Checker</Typography>
            <Stack component="form" spacing={1.3} onSubmit={handleAnalyzeSymptoms}>
              <TextField
                label="Describe your symptoms"
                multiline
                minRows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
              />
              <Button type="submit" variant="contained">Analyze Symptoms</Button>
            </Stack>

            {analysis ? (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>Possible Conditions</Typography>
                  <Typography>{(analysis.possibleConditions || []).join(", ") || "N/A"}</Typography>
                  <Typography sx={{ fontWeight: 700, mt: 2, mb: 1 }}>Recommended Specializations</Typography>
                  <Typography>{(analysis.recommendedSpecializations || []).join(", ") || "N/A"}</Typography>
                  <Typography sx={{ fontWeight: 700, mt: 2, mb: 1 }}>Description</Typography>
                  <Typography>{analysis.description || "N/A"}</Typography>
                  <Typography sx={{ fontWeight: 700, mt: 2, mb: 1 }}>Advice</Typography>
                  <Typography>{analysis.advice || "N/A"}</Typography>
                </CardContent>
              </Card>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={jitsiSession.open} onClose={closeJitsiSession} fullWidth maxWidth="lg">
        <DialogTitle>Join Telemedicine Session</DialogTitle>
        <DialogContent>
          {jitsiSession.url ? (
            <Box sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1 }}>
                <TextField fullWidth size="small" value={jitsiSession.url} InputProps={{ readOnly: true }} />
                <Button variant="outlined" onClick={() => copyVideoLink(jitsiSession.url)}>Copy URL</Button>
                <Button variant="contained" href={jitsiSession.url} target="_blank" rel="noreferrer">Open in New Tab</Button>
              </Stack>
              <Box
                component="iframe"
                src={jitsiSession.url}
                title="Jitsi Meeting"
                allow="camera; microphone; fullscreen; display-capture"
                sx={{ width: "100%", height: { xs: 360, md: 620 }, border: 0, borderRadius: 1 }}
              />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default PatientDashboardPage;
