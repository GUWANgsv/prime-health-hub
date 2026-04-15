import { useMemo, useState } from "react";
import { AppBar, Box, Button, Container, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./context/AuthContext";

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const dashboardRoute = user?.role === "DOCTOR"
    ? "/dashboard/doctor"
    : user?.role === "ADMIN"
      ? "/dashboard/admin"
      : "/dashboard/patient";

  const patientNavLinks = useMemo(() => [
    { to: "/dashboard/patient?tab=home", label: "Home" },
    { to: "/dashboard/patient?tab=appointments", label: "Appointment" },
    { to: "/dashboard/patient?tab=reports", label: "Medical Reports" },
    { to: "/dashboard/patient?tab=profile", label: "Profile" },
    { to: "/dashboard/patient?tab=ai", label: "AI Symptom Checker" }
  ], []);

  const doctorNavLinks = useMemo(() => [
    { to: "/dashboard/doctor?tab=home", label: "Home" },
    { to: "/dashboard/doctor?tab=appointments", label: "Appointments" },
    { to: "/dashboard/doctor?tab=profile", label: "Profile & Availability" }
  ], []);

  const adminNavLinks = useMemo(() => [
    { to: "/dashboard/admin?tab=home", label: "Dashboard" },
    { to: "/dashboard/admin?tab=accounts", label: "Accounts" },
    { to: "/dashboard/admin?tab=doctors", label: "Doctors" },
    { to: "/dashboard/admin?tab=operations", label: "Operations" },
    { to: "/dashboard/admin?tab=profile", label: "Profile" }
  ], []);

  const currentNavLinks = !isAuthenticated
    ? []
    : user?.role === "PATIENT"
      ? patientNavLinks
      : user?.role === "DOCTOR"
        ? doctorNavLinks
        : adminNavLinks;

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileDrawerOpen(false);
  };

  const closeDrawer = () => setMobileDrawerOpen(false);

  const navigateFromDrawer = (to) => {
    closeDrawer();
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "linear-gradient(90deg, rgba(11,57,84,0.96), rgba(8,127,140,0.96))",
          backdropFilter: "blur(14px)",
          color: "#ffffff",
          borderBottom: "1px solid rgba(255,255,255,0.18)"
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1, gap: 1.5, justifyContent: "space-between", alignItems: "center", minHeight: { xs: 68, md: 76 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
              {!isDesktop ? (
                <IconButton onClick={() => setMobileDrawerOpen(true)} sx={{ color: "#ffffff", border: "1px solid rgba(255,255,255,0.22)" }}>
                  <MenuIcon />
                </IconButton>
              ) : null}
              <Box>
                <Typography
                  component={RouterLink}
                  to={isAuthenticated ? dashboardRoute : "/"}
                  sx={{ textDecoration: "none", color: "#ffffff", fontWeight: 800, letterSpacing: -0.2, display: "block" }}
                >
                  Smart Healthcare
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", display: { xs: "none", sm: "block" } }}>
                  Book, manage, and care from one place
                </Typography>
              </Box>
            </Box>

            {isDesktop ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {!isAuthenticated ? (
                  <>
                    <Button component={RouterLink} to="/register/patient" sx={{ color: "#ffffff" }}>Patient Register</Button>
                    <Button component={RouterLink} to="/register/doctor" sx={{ color: "#ffffff" }}>Doctor Register</Button>
                    <Button component={RouterLink} to="/login" variant="contained" sx={{ backgroundColor: "#ffffff", color: "#0b3954", "&:hover": { backgroundColor: "#e8f1f5" } }}>Login</Button>
                  </>
                ) : (
                  <>
                    {currentNavLinks.map((item) => (
                      <Button key={item.to} component={RouterLink} to={item.to} sx={{ color: "#ffffff", whiteSpace: "nowrap" }}>
                        {item.label}
                      </Button>
                    ))}
                    <Box
                      sx={{
                        px: 1.6,
                        py: 0.55,
                        borderRadius: "999px",
                        backgroundColor: "rgba(255,255,255,0.16)",
                        border: "1px solid rgba(255,255,255,0.38)",
                        display: "inline-flex",
                        alignItems: "center",
                        maxWidth: 260
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#ffffff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {user?.email || "user"}
                      </Typography>
                    </Box>
                    <Button variant="outlined" onClick={handleLogout} sx={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.7)" }}>Logout</Button>
                  </>
                )}
              </Stack>
            ) : null}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="left" open={mobileDrawerOpen} onClose={closeDrawer} PaperProps={{ sx: { width: 300, background: "linear-gradient(180deg, #0b3954, #087f8c)", color: "#ffffff" } }}>
        <Box sx={{ px: 2.5, py: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Smart Healthcare
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.4 }}>
            Navigate quickly on mobile
          </Typography>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.18)" }} />
        <List sx={{ py: 1 }}>
          {!isAuthenticated ? (
            <>
              <ListItemButton component={RouterLink} to="/register/patient" onClick={closeDrawer} sx={{ color: "#ffffff" }}>
                <ListItemText primary="Patient Register" />
              </ListItemButton>
              <ListItemButton component={RouterLink} to="/register/doctor" onClick={closeDrawer} sx={{ color: "#ffffff" }}>
                <ListItemText primary="Doctor Register" />
              </ListItemButton>
              <ListItemButton component={RouterLink} to="/login" onClick={closeDrawer} sx={{ color: "#ffffff" }}>
                <ListItemText primary="Login" />
              </ListItemButton>
            </>
          ) : (
            <>
              {currentNavLinks.map((item) => (
                <ListItemButton key={item.to} component={RouterLink} to={item.to} onClick={() => navigateFromDrawer(item.to)} sx={{ color: "#ffffff" }}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
              <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.18)" }} />
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Signed in as
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: "break-word" }}>
                  {user?.email || "user"}
                </Typography>
              </Box>
              <ListItemButton onClick={handleLogout} sx={{ color: "#ffffff" }}>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>

      <Box sx={{ flex: 1 }}>
        <AppRoutes />
      </Box>

      <Box
        component="footer"
        sx={{
          py: 2.5,
          mt: 2,
          background: "linear-gradient(90deg, #072a40, #055f6b)",
          color: "#dff4f7"
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" align="center" sx={{ color: "#dff4f7" }}>
            Smart Healthcare Platform. Secure appointments, telemedicine, and medical records.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default App;
