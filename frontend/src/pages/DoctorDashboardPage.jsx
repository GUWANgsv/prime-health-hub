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
import { Link, useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { appointmentService } from "../services/appointmentService";
import { doctorService } from "../services/doctorService";
import { patientService } from "../services/patientService";
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

function DoctorDashboardPage() {
  const { logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const tabParam = searchParams.get("tab");
  const tab = ["home", "appointments", "profile"].includes(tabParam) ? tabParam : "home";

  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("ALL");
  const [appointmentDateSort, setAppointmentDateSort] = useState("ASC");
  const [reportByAppointment, setReportByAppointment] = useState({});
  const [videoByAppointment, setVideoByAppointment] = useState({});
  const [prescriptionByAppointment, setPrescriptionByAppointment] = useState({});
  const [whatsappLink, setWhatsappLink] = useState("");
  const [jitsiSession, setJitsiSession] = useState({
    open: false,
    url: "",
    roomName: ""
  });

  const [profileForm, setProfileForm] = useState({
    doctorName: "",
    contact: "",
    specialization: "",
    experience: "",
    consultationFee: "",
    qualifications: "",
    availability: []
  });
  const [availabilityDraft, setAvailabilityDraft] = useState({ date: "", startTime: "", endTime: "" });

  const today = new Date().toISOString().slice(0, 10);
  const isApproved = doctor?.status === "APPROVED";

  const todayAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.date === today),
    [appointments, today]
  );

  const filteredSortedAppointments = useMemo(() => {
    const filtered = appointmentStatusFilter === "ALL"
      ? appointments
      : appointments.filter((appointment) => appointment.status === appointmentStatusFilter);

    return [...filtered].sort((left, right) => {
      const leftDate = new Date(`${left.date}T${left.time || "00:00"}`);
      const rightDate = new Date(`${right.date}T${right.time || "00:00"}`);
      return appointmentDateSort === "ASC"
        ? leftDate - rightDate
        : rightDate - leftDate;
    });
  }, [appointments, appointmentStatusFilter, appointmentDateSort]);

  const loadDoctorData = async () => {
    setLoading(true);
    setError("");
    try {
      const profileRes = await doctorService.getMyProfile();
      setDoctor(profileRes.doctor);

      setProfileForm({
        doctorName: profileRes.doctor?.doctorName || "",
        contact: profileRes.doctor?.contact || "",
        specialization: profileRes.doctor?.specialization || "",
        experience: String(profileRes.doctor?.experience ?? ""),
        consultationFee: String(profileRes.doctor?.consultationFee ?? 2500),
        qualifications: (profileRes.doctor?.qualifications || []).join(", "),
        availability: profileRes.doctor?.availability || []
      });

      const appointmentRes = await appointmentService.getDoctorAppointments();
      setAppointments(appointmentRes.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load doctor dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, []);

  const handleAppointmentStatus = async (appointmentId, status) => {
    setError("");
    setSuccess("");
    try {
      const result = await appointmentService.updateAppointmentStatus(appointmentId, status);
      setWhatsappLink(result.whatsappLink || result.notificationDelivery?.find((item) => item?.whatsappLink)?.whatsappLink || "");
      setSuccess(`Appointment ${status.toLowerCase()} successfully`);
      await loadDoctorData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update appointment status");
    }
  };

  const handleVideoCallUpdate = async (appointmentId) => {
    const url = (videoByAppointment[appointmentId] || "").trim();
    if (!url) {
      setError("Please enter a video call URL");
      return;
    }

    setError("");
    setSuccess("");
    try {
      await appointmentService.updateVideoCall(appointmentId, url);
      setSuccess("Video call URL updated successfully");
      await loadDoctorData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update video call URL");
    }
  };

  const handleStartJitsiCall = async (appointment) => {
    if (!isApproved) {
      setError("Doctor profile must be approved to start video calls");
      return;
    }

    const roomName = `suwaya-${String(appointment._id).slice(-8)}-${Date.now()}`;
    const url = `https://meet.jit.si/${roomName}`;

    setError("");
    setSuccess("");
    try {
      await appointmentService.updateVideoCall(appointment._id, url);
      setVideoByAppointment((prev) => ({ ...prev, [appointment._id]: url }));
      setJitsiSession({ open: true, url, roomName });
      setSuccess("Jitsi call started and link shared with patient");
      await loadDoctorData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start Jitsi call");
    }
  };

  const closeJitsiSession = () => {
    setJitsiSession((prev) => ({ ...prev, open: false }));
  };

  const copyMeetingUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess("Meeting URL copied");
    } catch {
      setError("Unable to copy meeting URL");
    }
  };

  const handleIssuePrescription = async (appointmentId) => {
    const text = (prescriptionByAppointment[appointmentId] || "").trim();
    if (text.length < 5) {
      setError("Prescription must contain at least 5 characters");
      return;
    }

    setError("");
    setSuccess("");
    try {
      await appointmentService.issuePrescription(appointmentId, text);
      setSuccess("Digital prescription issued successfully");
      await loadDoctorData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to issue prescription");
    }
  };

  const handleLoadPatientReports = async (appointment) => {
    setError("");
    setSuccess("");
    try {
      const reportsRes = await patientService.getReportsForDoctor(appointment.patientId);
      setReportByAppointment((prev) => ({
        ...prev,
        [appointment._id]: reportsRes
      }));
      setSuccess("Patient reports loaded");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load patient reports");
    }
  };

  const downloadReportSummaryPdf = (appointment, reportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 7;
    let y = margin;

    const addTextBlock = (text, { bold = false, spacing = 0 } = {}) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(String(text || ""), maxWidth);

      for (const line of lines) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        doc.text(line, margin, y);
        y += lineHeight;
      }

      y += spacing;
    };

    addTextBlock("Patient Report Summary", { bold: true, spacing: 2 });
    addTextBlock(`Generated: ${new Date().toLocaleString()}`, { spacing: 2 });
    addTextBlock(`Appointment ID: ${appointment._id || "N/A"}`, { spacing: 3 });

    addTextBlock(`Medical history: ${(reportData.medicalHistory || []).join(", ") || "N/A"}`);
    addTextBlock(`Allergies: ${(reportData.allergies || []).join(", ") || "N/A"}`);
    addTextBlock(`Chronic conditions: ${(reportData.chronicConditions || []).join(", ") || "N/A"}`, { spacing: 3 });

    addTextBlock("Reports", { bold: true, spacing: 1 });

    const reports = Array.isArray(reportData.reports) ? reportData.reports : [];
    if (!reports.length) {
      addTextBlock("No uploaded reports.");
    } else {
      reports.forEach((report, index) => {
        addTextBlock(
          `${index + 1}. ${report.fileName || "Unknown file"} (${report.fileType || "unknown type"}) uploaded ${report.uploadedAt ? new Date(report.uploadedAt).toLocaleString() : "N/A"}`
        );
      });
    }

    doc.save(`patient-report-summary-${appointment._id}.pdf`);
  };

  const handleDownloadReportSummary = async (appointment) => {
    setError("");

    let reportData = reportByAppointment[appointment._id];
    if (!reportData) {
      try {
        const reportsRes = await patientService.getReportsForDoctor(appointment.patientId);
        setReportByAppointment((prev) => ({
          ...prev,
          [appointment._id]: reportsRes
        }));
        reportData = reportsRes;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load patient reports");
        return;
      }
    }

    downloadReportSummaryPdf(appointment, reportData);
    setSuccess("Report summary PDF downloaded");
  };

  const handleAddAvailability = () => {
    const date = availabilityDraft.date.trim();
    const startTime = availabilityDraft.startTime.trim();
    const endTime = availabilityDraft.endTime.trim();

    if (!date || !startTime || !endTime) {
      setError("Please provide date, start time, and end time");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be later than start time");
      return;
    }

    setProfileForm((prev) => ({
      ...prev,
      availability: [...prev.availability, { date, timeSlots: [`${startTime}-${endTime}`] }]
    }));
    setAvailabilityDraft({ date: "", startTime: "", endTime: "" });
  };

  const handleRemoveAvailability = (index) => {
    setProfileForm((prev) => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index)
    }));
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    if (!doctor?._id) return;

    setError("");
    setSuccess("");
    try {
      await doctorService.updateDoctorProfile(doctor._id, {
        doctorName: profileForm.doctorName,
        contact: profileForm.contact,
        specialization: profileForm.specialization,
        experience: Number(profileForm.experience),
        consultationFee: Number(profileForm.consultationFee),
        qualifications: profileForm.qualifications
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        availability: profileForm.availability
      });

      setSuccess("Doctor profile updated successfully");
      await loadDoctorData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update doctor profile");
    }
  };

  const handleDeleteProfile = async () => {
    if (!doctor?._id) return;

    const confirmed = window.confirm("Delete your doctor profile? This cannot be undone.");
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await doctorService.deleteDoctorProfile(doctor._id);
      logout();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete doctor profile");
    }
  };

  const renderAppointmentCard = (appointment) => {
    const reportData = reportByAppointment[appointment._id];
    const actionDisabled = appointment.status === "CANCELLED" || appointment.status === "COMPLETED";
    const videoCallDisabled = !isApproved || actionDisabled || appointment.status !== "CONFIRMED";
    return (
      <Card key={appointment._id} variant="outlined">
        <CardContent>
          <Typography color="text.secondary">
            {appointment.date} at {appointment.time}
          </Typography>
          <Typography variant="body2">Reason: {appointment.reason || "N/A"}</Typography>
          <Typography variant="body2">Status: {appointment.status}</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              onClick={() => handleAppointmentStatus(appointment._id, "CONFIRMED")}
              disabled={!isApproved || appointment.status !== "PENDING" || actionDisabled}
            >
              Confirm
            </Button>
            <Button
              color="error"
              variant="outlined"
              onClick={() => handleAppointmentStatus(appointment._id, "CANCELLED")}
              disabled={!isApproved || actionDisabled}
            >
              Cancel
            </Button>
            <Button
              color="success"
              variant="outlined"
              onClick={() => handleAppointmentStatus(appointment._id, "COMPLETED")}
              disabled={!isApproved || actionDisabled || appointment.status === "PENDING"}
            >
              Complete
            </Button>
          </Stack>
          {!isApproved ? (
            <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 0.5 }}>
              Action buttons are disabled until your doctor profile is APPROVED.
            </Typography>
          ) : null}

          <Divider sx={{ my: 1.5 }} />

          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Telemedicine Video Call</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="https://meet.jit.si/your-room"
              value={videoByAppointment[appointment._id] ?? appointment.videoCallUrl ?? ""}
              onChange={(e) =>
                setVideoByAppointment((prev) => ({ ...prev, [appointment._id]: e.target.value }))
              }
              disabled={videoCallDisabled}
            />
            <Button
              variant="outlined"
              onClick={() => handleVideoCallUpdate(appointment._id)}
              disabled={videoCallDisabled}
            >
              Save URL
            </Button>
            <Button
              variant="contained"
              onClick={() => handleStartJitsiCall(appointment)}
              disabled={videoCallDisabled}
            >
              Start Jitsi Call
            </Button>
            {(appointment.videoCallUrl || videoByAppointment[appointment._id]) ? (
              <Button
                variant="text"
                onClick={() => copyMeetingUrl(appointment.videoCallUrl || videoByAppointment[appointment._id])}
              >
                Copy URL
              </Button>
            ) : null}
          </Stack>

          <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }}>Digital Prescription</Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="Write diagnosis, medicines, dosage and advice"
            value={prescriptionByAppointment[appointment._id] ?? appointment.prescriptionText ?? ""}
            onChange={(e) =>
              setPrescriptionByAppointment((prev) => ({ ...prev, [appointment._id]: e.target.value }))
            }
            disabled={!isApproved || actionDisabled}
          />
          <Button
            sx={{ mt: 1 }}
            variant="outlined"
            onClick={() => handleIssuePrescription(appointment._id)}
            disabled={!isApproved || actionDisabled}
          >
            Issue Prescription
          </Button>

          <Divider sx={{ my: 1.5 }} />

          <Button variant="text" onClick={() => handleLoadPatientReports(appointment)}>
            View Patient Medical Reports
          </Button>
          <Button variant="text" onClick={() => handleDownloadReportSummary(appointment)}>
            Download Report Summary
          </Button>
          {reportData ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">Medical history: {(reportData.medicalHistory || []).join(", ") || "N/A"}</Typography>
              <Typography variant="body2">Allergies: {(reportData.allergies || []).join(", ") || "N/A"}</Typography>
              <Typography variant="body2">Chronic conditions: {(reportData.chronicConditions || []).join(", ") || "N/A"}</Typography>
              <Stack spacing={0.8} sx={{ mt: 1 }}>
                {(reportData.reports || []).map((report, idx) => (
                  <Stack key={`${report.fileName}-${idx}`} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      {report.fileName} ({report.fileType})
                    </Typography>
                  </Stack>
                ))}
                {(reportData.reports || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No uploaded reports.</Typography>
                ) : null}
              </Stack>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    );
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
              "linear-gradient(120deg, rgba(12,74,110,.40), rgba(15,118,110,.30)), url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1600&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Doctor Dashboard</Typography>
          <Typography sx={{ opacity: 0.92, mt: 1 }}>
            Manage today appointments, set schedules, issue digital prescriptions, and run telemedicine sessions.
          </Typography>
        </Box>
      </Card>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}
      {whatsappLink ? (
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
      ) : null}
      {loading ? <Alert severity="info" sx={{ mb: 2 }}>Loading doctor dashboard...</Alert> : null}

      {!doctor ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Doctor profile not found</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Please create your doctor profile first.
            </Typography>
            <Button component={Link} to="/register/doctor" variant="contained">Go to Doctor Registration</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {!isApproved ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Your profile status is {doctor.status}. To get appointments and use doctor actions, your profile must be APPROVED.
            </Alert>
          ) : null}

          {tab === "home" ? (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card><CardContent><Typography color="text.secondary">Today Appointments</Typography><Typography variant="h4">{todayAppointments.length}</Typography></CardContent></Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card><CardContent><Typography color="text.secondary">Total Appointments</Typography><Typography variant="h4">{appointments.length}</Typography></CardContent></Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card><CardContent><Typography color="text.secondary">Profile Status</Typography><Typography variant="h4">{doctor.status}</Typography></CardContent></Card>
                </Grid>
              </Grid>

              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>Today Appointments</Typography>
                  <Stack spacing={1.2}>
                    {todayAppointments.map((appointment) => renderAppointmentCard(appointment))}
                    {todayAppointments.length === 0 ? <Typography color="text.secondary">No appointments for today.</Typography> : null}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          ) : null}

          {tab === "appointments" ? (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>All Appointments (Past + Upcoming)</Typography>
                <Tabs
                  value={appointmentStatusFilter}
                  onChange={(_, value) => setAppointmentStatusFilter(value)}
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
                <TextField
                  select
                  size="small"
                  label="Sort by Date"
                  value={appointmentDateSort}
                  onChange={(e) => setAppointmentDateSort(e.target.value)}
                  sx={{ mb: 2, minWidth: 220 }}
                >
                  <MenuItem value="ASC">Date: Oldest first</MenuItem>
                  <MenuItem value="DESC">Date: Newest first</MenuItem>
                </TextField>
                <Stack spacing={1.2}>
                  {filteredSortedAppointments.map((appointment) => renderAppointmentCard(appointment))}
                  {filteredSortedAppointments.length === 0 ? <Typography color="text.secondary">No appointments found.</Typography> : null}
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {tab === "profile" ? (
            <Stack spacing={2}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Update Doctor Profile</Typography>
                  <Stack component="form" spacing={1.2} onSubmit={handleProfileUpdate}>
                    <TextField
                      label="Doctor Name"
                      value={profileForm.doctorName}
                      InputProps={{ readOnly: true }}
                      disabled
                      helperText="Doctor name cannot be edited"
                      required
                    />
                    <TextField
                      label="Contact Number"
                      value={profileForm.contact}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, contact: e.target.value.replace(/\D/g, "") }))}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 15 }}
                      required
                    />
                    <TextField
                      select
                      label="Specialization"
                      value={profileForm.specialization}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, specialization: e.target.value }))}
                      required
                    >
                      {SPECIALIZATIONS.map((spec) => (
                        <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      type="number"
                      label="Experience (years)"
                      value={profileForm.experience}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, experience: e.target.value }))}
                      required
                    />
                    <TextField
                      type="number"
                      label="Consultation Fee (LKR)"
                      value={profileForm.consultationFee}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, consultationFee: e.target.value }))}
                      inputProps={{ min: 1, step: 1 }}
                      helperText="This fee is copied to each appointment when you confirm it"
                      required
                    />
                    <TextField
                      label="Qualifications (comma separated)"
                      value={profileForm.qualifications}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, qualifications: e.target.value }))}
                    />

                    <Button type="submit" variant="contained">Save Profile</Button>
                    <Button color="error" variant="outlined" onClick={handleDeleteProfile}>Delete Profile</Button>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Set Availability Schedule (Date + Time)</Typography>
                  <Grid container spacing={1.2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date"
                        InputLabelProps={{ shrink: true }}
                        value={availabilityDraft.date}
                        onChange={(e) => setAvailabilityDraft((prev) => ({ ...prev, date: e.target.value }))}
                        disabled={!isApproved}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Start Time"
                        InputLabelProps={{ shrink: true }}
                        value={availabilityDraft.startTime}
                        onChange={(e) => setAvailabilityDraft((prev) => ({ ...prev, startTime: e.target.value }))}
                        disabled={!isApproved}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="time"
                        label="End Time"
                        InputLabelProps={{ shrink: true }}
                        value={availabilityDraft.endTime}
                        onChange={(e) => setAvailabilityDraft((prev) => ({ ...prev, endTime: e.target.value }))}
                        disabled={!isApproved}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button fullWidth variant="contained" onClick={handleAddAvailability} disabled={!isApproved}>
                        Add
                      </Button>
                    </Grid>
                  </Grid>

                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {profileForm.availability.map((item, index) => (
                      <Card key={`${item.date}-${index}`} variant="outlined">
                        <CardContent>
                          <Typography sx={{ fontWeight: 700 }}>{item.date}</Typography>
                          <Typography color="text.secondary">{(item.timeSlots || []).join(", ")}</Typography>
                          <Button
                            sx={{ mt: 1 }}
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleRemoveAvailability(index)}
                            disabled={!isApproved}
                          >
                            Remove
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {profileForm.availability.length === 0 ? (
                      <Typography color="text.secondary">No schedules added yet.</Typography>
                    ) : null}
                  </Stack>

                  <Button sx={{ mt: 2 }} variant="contained" onClick={handleProfileUpdate} disabled={!isApproved}>
                    Save Availability
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          ) : null}
        </>
      )}

      <Dialog open={jitsiSession.open} onClose={closeJitsiSession} fullWidth maxWidth="lg">
        <DialogTitle>
          Jitsi Telemedicine Session {jitsiSession.roomName ? `- ${jitsiSession.roomName}` : ""}
        </DialogTitle>
        <DialogContent>
          {jitsiSession.url ? (
            <Box sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1 }}>
                <TextField fullWidth size="small" value={jitsiSession.url} InputProps={{ readOnly: true }} />
                <Button variant="outlined" onClick={() => copyMeetingUrl(jitsiSession.url)}>Copy URL</Button>
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

export default DoctorDashboardPage;
