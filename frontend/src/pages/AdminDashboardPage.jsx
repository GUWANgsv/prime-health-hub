import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authService } from "../services/authService";
import { appointmentService } from "../services/appointmentService";
import { doctorService } from "../services/doctorService";

const ROLE_FILTERS = ["ALL", "PATIENT", "DOCTOR"];

function AdminDashboardPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [adminProfile, setAdminProfile] = useState(null);
  const [adminForm, setAdminForm] = useState({ password: "", confirmPassword: "" });

  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [overview, setOverview] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    paidAppointments: 0,
    unpaidAppointments: 0,
    totalRevenue: 0
  });

  const tabParam = searchParams.get("tab");
  const activeTab = ["home", "accounts", "doctors", "operations", "profile"].includes(tabParam) ? tabParam : "home";

  const loadingIndicator = loading ? "Loading admin dashboard..." : "";

  const totalUsers = users.length;
  const patientUsers = users.filter((user) => user.role === "PATIENT").length;
  const doctorUsers = users.filter((user) => user.role === "DOCTOR").length;
  const adminUsers = users.filter((user) => user.role === "ADMIN").length;
  const pendingDoctors = doctors.filter((doctor) => doctor.status === "PENDING").length;
  const approvedDoctors = doctors.filter((doctor) => doctor.status === "APPROVED").length;

  const recentAppointments = useMemo(() => appointments.slice(0, 10), [appointments]);
  const filteredUsers = useMemo(
    () => (userRoleFilter === "ALL" ? users : users.filter((user) => user.role === userRoleFilter)),
    [users, userRoleFilter]
  );

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, usersRes, doctorsRes, overviewRes] = await Promise.allSettled([
        authService.getProfile(),
        authService.listUsers({}),
        doctorService.getAllDoctors({}),
        appointmentService.getAdminOverview()
      ]);

      if (profileRes.status === "fulfilled") {
        setAdminProfile(profileRes.value.user || null);
        setAdminForm({ password: "", confirmPassword: "" });
      } else {
        setError(profileRes.reason?.response?.data?.message || "Failed to load admin profile");
      }

      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.users || []);
      } else {
        setUsers([]);
        setError(usersRes.reason?.response?.data?.message || "Failed to load users");
      }

      if (doctorsRes.status === "fulfilled") {
        setDoctors(doctorsRes.value.doctors || []);
      } else {
        setDoctors([]);
        setError(doctorsRes.reason?.response?.data?.message || "Failed to load doctors");
      }

      if (overviewRes.status === "fulfilled") {
        setOverview(overviewRes.value.overview || overview);
        setAppointments(overviewRes.value.appointments || []);
      } else {
        setOverview({
          totalAppointments: 0,
          pendingAppointments: 0,
          confirmedAppointments: 0,
          completedAppointments: 0,
          paidAppointments: 0,
          unpaidAppointments: 0,
          totalRevenue: 0
        });
        setAppointments([]);
        setError(overviewRes.reason?.response?.data?.message || "Failed to load operations overview");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateAdminProfile = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const password = String(adminForm.password || "").trim();
    const confirmPassword = String(adminForm.confirmPassword || "").trim();

    if (!password || !confirmPassword) {
      setError("Password and confirm password are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must include at least one letter and one number");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password must match");
      return;
    }

    try {
      await authService.updateProfile({
        password
      });
      setSuccess("Password updated successfully");
      setAdminForm({ password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    }
  };

  const handleDeleteUser = async (userId) => {
    setError("");
    setSuccess("");

    try {
      const confirmed = window.confirm("Delete this user account? This cannot be undone.");
      if (!confirmed) return;

      await authService.deleteUser(userId);
      setSuccess("User account deleted successfully");
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user account");
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    setError("");
    setSuccess("");

    try {
      await doctorService.approveDoctor(doctorId);
      setSuccess("Doctor approved successfully");
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve doctor");
    }
  };

  const renderStat = (label, value) => (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1300, mx: "auto", py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 2, md: 0 } }}>
      <Card sx={{ mb: 2, borderRadius: 4, overflow: "hidden" }}>
        <Box
          sx={{
            p: { xs: 4, md: 7 },
            minHeight: { xs: 260, md: 360 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: "white",
            backgroundImage:
              "linear-gradient(120deg, rgba(4,47,79,.65), rgba(13,148,136,.45)), url('https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=1600&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <Chip label="Admin Control Center" sx={{ width: "fit-content", mb: 2, color: "white", borderColor: "rgba(255,255,255,0.4)" }} variant="outlined" />
          <Typography variant="h3" sx={{ fontWeight: 800, maxWidth: 780 }}>
            Manage user accounts, verify doctor registrations approved or not, and oversee platform operations and financial transactions.
          </Typography>
          <Typography sx={{ opacity: 0.92, mt: 1.5, maxWidth: 760 }}>
            Monitor approvals, fix user accounts, track revenue, and keep the platform moving from one dashboard.
          </Typography>
        </Box>
      </Card>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}
      {loadingIndicator ? <Alert severity="info" sx={{ mb: 2 }}>{loadingIndicator}</Alert> : null}

      {activeTab === "home" ? (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>{renderStat("Total Users", totalUsers)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{renderStat("Doctors", doctorUsers)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{renderStat("Patients", patientUsers)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{renderStat("Admin Accounts", adminUsers)}</Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>{renderStat("Pending Doctor Registrations", pendingDoctors)}</Grid>
            <Grid item xs={12} md={6}>{renderStat("Approved Doctors", approvedDoctors)}</Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Operations Snapshot</Typography>
              <Stack spacing={1}>
                <Typography variant="body2">Appointments: {overview.totalAppointments}</Typography>
                <Typography variant="body2">Pending: {overview.pendingAppointments} | Confirmed: {overview.confirmedAppointments} | Completed: {overview.completedAppointments}</Typography>
                <Typography variant="body2">Paid: {overview.paidAppointments} | Unpaid: {overview.unpaidAppointments}</Typography>
                <Typography variant="body2">Revenue: LKR {Number(overview.totalRevenue || 0).toFixed(2)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      {activeTab === "accounts" ? (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Manage User Accounts</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View and delete user accounts. Filter by patient or doctor.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {ROLE_FILTERS.map((role) => (
                  <Button
                    key={role}
                    variant={userRoleFilter === role ? "contained" : "outlined"}
                    onClick={() => setUserRoleFilter(role)}
                  >
                    {role}
                  </Button>
                ))}
              </Stack>
              <Stack spacing={1.5}>
                {filteredUsers.map((user) => (
                  <Card key={user.id} variant="outlined">
                    <CardContent>
                      <Grid container spacing={1.2} alignItems="center">
                        <Grid item xs={12} md={5}>
                          <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                          <Typography variant="body2" color="text.secondary">Created: {new Date(user.createdAt).toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Chip label={user.role} color={user.role === "ADMIN" ? "secondary" : user.role === "DOCTOR" ? "primary" : "default"} />
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                            <Button variant="outlined" onClick={() => alert(`Name: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nCreated: ${new Date(user.createdAt).toLocaleString()}`)}>
                              View
                            </Button>
                            <Button color="error" variant="contained" onClick={() => handleDeleteUser(user.id)}>
                              Delete
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      {activeTab === "doctors" ? (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Verify Doctor Registrations</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review registration status and approve doctors who are ready to operate.
              </Typography>
              <Stack spacing={1.5}>
                {doctors.map((doctor) => (
                  <Card key={doctor._id} variant="outlined">
                    <CardContent>
                      <Grid container spacing={1.2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Typography sx={{ fontWeight: 700 }}>{doctor.doctorName || "Doctor"}</Typography>
                          <Typography variant="body2" color="text.secondary">{doctor.specialization}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="body2">Fee: LKR {Number(doctor.consultationFee || 0).toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Chip label={doctor.status || "PENDING"} color={doctor.status === "APPROVED" ? "success" : "warning"} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                            <Button
                              variant="contained"
                              disabled={doctor.status === "APPROVED"}
                              onClick={() => handleApproveDoctor(doctor._id)}
                            >
                              Approve
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      {activeTab === "operations" ? (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><Card><CardContent><Typography color="text.secondary">Revenue</Typography><Typography variant="h4">LKR {Number(overview.totalRevenue || 0).toFixed(2)}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={4}><Card><CardContent><Typography color="text.secondary">Paid Appointments</Typography><Typography variant="h4">{overview.paidAppointments}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={4}><Card><CardContent><Typography color="text.secondary">Unpaid Appointments</Typography><Typography variant="h4">{overview.unpaidAppointments}</Typography></CardContent></Card></Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Recent Appointments</Typography>
              <Stack spacing={1.2}>
                {recentAppointments.map((appointment) => (
                  <Card key={appointment._id} variant="outlined">
                    <CardContent>
                      <Grid container spacing={1}>
                        <Grid item xs={12} md={4}>
                          <Typography sx={{ fontWeight: 700 }}>{appointment.doctorName || "Doctor"}</Typography>
                          <Typography variant="body2" color="text.secondary">Patient ID: {String(appointment.patientId).slice(-6)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Typography variant="body2">{appointment.date} {appointment.time}</Typography>
                          <Typography variant="body2">Status: {appointment.status}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="body2">Fee: LKR {Number(appointment.consultationFee || 0).toFixed(2)}</Typography>
                          <Typography variant="body2">Payment: {appointment.paymentStatus}</Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Typography variant="body2" color="text.secondary">{appointment.reason || "No reason provided"}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      {activeTab === "profile" ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Update Password</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              For security, update your admin password using confirmation.
            </Typography>
            <Stack component="form" spacing={1.3} onSubmit={handleUpdateAdminProfile} sx={{ maxWidth: 620 }}>
              <TextField
                label="New Password"
                type="password"
                value={adminForm.password}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                helperText="Minimum 8 characters with at least one letter and one number"
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={adminForm.confirmPassword}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                required
                error={Boolean(adminForm.confirmPassword) && adminForm.password !== adminForm.confirmPassword}
                helperText={Boolean(adminForm.confirmPassword) && adminForm.password !== adminForm.confirmPassword ? "Passwords do not match" : "Re-enter the same password"}
              />
              <Button type="submit" variant="contained">Update Password</Button>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Divider sx={{ my: 3 }} />

      <Typography variant="body2" color="text.secondary">
        Admin panel: manage users, approve doctors, and monitor financial activity.
      </Typography>
    </Box>
  );
}

export default AdminDashboardPage;