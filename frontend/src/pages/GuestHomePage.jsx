import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography
} from "@mui/material";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Link as RouterLink } from "react-router-dom";

const PLATFORM_FEATURES = [
  {
    icon: EventAvailableRoundedIcon,
    title: "Role Based Dashboards",
    description: "Separate spaces for patients and doctors with tailored workflows and permissions."
  },
  {
    icon: HealthAndSafetyRoundedIcon,
    title: "Appointment Management",
    description: "Book, confirm, cancel, complete, and filter appointments with status tracking."
  },
  {
    icon: VideocamRoundedIcon,
    title: "Telemedicine with Jitsi",
    description: "Doctors can start secure video sessions and patients can join inside the platform."
  },
  {
    icon: DescriptionRoundedIcon,
    title: "Medical Reports",
    description: "Upload and download real report files with protected access."
  },
  {
    icon: SecurityRoundedIcon,
    title: "Digital Prescriptions",
    description: "Doctors can issue prescriptions and patients can view them in appointment history."
  },
  {
    icon: PsychologyRoundedIcon,
    title: "AI Symptom Assistant",
    description: "Patients can get preliminary symptom guidance and recommended specializations."
  }
];

const PLATFORM_STEPS = [
  {
    title: "Create Your Account",
    description: "Register as patient or doctor and sign in to your personalized workspace."
  },
  {
    title: "Manage Care Flow",
    description: "Book appointments, confirm schedules, and handle clinical updates quickly."
  },
  {
    title: "Consult and Follow Up",
    description: "Run video sessions, issue prescriptions, and keep records organized."
  }
];

const CLIENT_RESPONSES = [
  {
    name: "Nimal Perera",
    role: "Patient",
    quote: "Booking and rescheduling appointments now takes less than a minute.",
    tone: "linear-gradient(135deg, rgba(31,111,235,0.16), rgba(46,139,87,0.12))",
    cube: "#1f6feb"
  },
  {
    name: "Dr. Kavindi Jayasuriya",
    role: "Doctor",
    quote: "I can confirm appointments, run telemedicine sessions, and issue prescriptions from one place.",
    tone: "linear-gradient(135deg, rgba(46,139,87,0.16), rgba(12,57,84,0.12))",
    cube: "#2e8b57"
  },
  {
    name: "Sahan Silva",
    role: "Patient",
    quote: "I can finally upload reports and download my files when visiting another clinic.",
    tone: "linear-gradient(135deg, rgba(8,127,140,0.16), rgba(31,111,235,0.12))",
    cube: "#087f8c"
  }
];

function GuestHomePage() {
  return (
    <Box>
      <Box
        sx={{
          width: "100%",
          minHeight: { xs: 320, md: 430 },
          display: "flex",
          alignItems: "center",
          color: "white",
          backgroundImage:
            "linear-gradient(120deg, rgba(8,47,73,.9), rgba(2,132,199,.82)), url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
          <Chip label="Trusted Digital Healthcare" sx={{ mb: 2, backgroundColor: "rgba(255,255,255,.2)", color: "white" }} />
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.2, maxWidth: 850 }}>
            Your Care Journey, All In One Place
          </Typography>
          <Typography sx={{ maxWidth: 760, opacity: 0.95, mb: 3 }}>
            Register as a patient or doctor, manage appointments, run telemedicine sessions, and keep prescriptions and reports organized securely.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button component={RouterLink} to="/register/patient" variant="contained" color="primary" size="large">
              Register as Patient
            </Button>
            <Button component={RouterLink} to="/register/doctor" variant="contained" color="secondary" size="large">
              Register as Doctor
            </Button>
            <Button component={RouterLink} to="/login" variant="outlined" size="large" sx={{ color: "white", borderColor: "rgba(255,255,255,.8)" }}>
              Login
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {PLATFORM_STEPS.map((step, index) => (
          <Grid item xs={12} md={4} key={step.title}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Chip label={`Step ${index + 1}`} size="small" sx={{ mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.6 }}>
                  {step.title}
                </Typography>
                <Typography color="text.secondary">{step.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, mt: 0.5 }}>
        Platform Capabilities
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {PLATFORM_FEATURES.map((feature) => (
          <Grid item xs={12} md={6} key={feature.title}>
            <Card variant="outlined" sx={{ height: "100%", transition: "transform 180ms ease, box-shadow 180ms ease", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 18px 34px rgba(18,50,74,0.12)" } }}>
              <CardContent>
                <Stack direction="row" spacing={1.1} sx={{ mb: 0.8, alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark", width: 34, height: 34 }}>
                    <feature.icon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {feature.title}
                  </Typography>
                </Stack>
                <Typography color="text.secondary">{feature.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 4, overflow: "hidden" }}>
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.7 }}>
                Built for everyday healthcare coordination
              </Typography>
              <Typography color="text.secondary">
                From first booking to final follow-up, the platform keeps communication, reports, and care decisions in one secure timeline.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={1} alignItems={{ md: "flex-end" }}>
                <Button component={RouterLink} to="/register/patient" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
                  Start as Patient
                </Button>
                <Button component={RouterLink} to="/register/doctor" variant="outlined" endIcon={<ArrowForwardRoundedIcon />}>
                  Start as Doctor
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
        Client Responses
      </Typography>
      <Box
        sx={{
          position: "relative",
          pb: 1
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            overflowX: "auto",
            pb: 1,
            pr: 0.5,
            "& > *": { flex: "0 0 320px" }
          }}
        >
          {CLIENT_RESPONSES.map((item) => (
            <Card
              key={item.name}
              sx={{
                position: "relative",
                minHeight: 190,
                background: item.tone,
                border: "1px solid rgba(18,50,74,0.12)",
                transition: "transform 180ms ease, box-shadow 180ms ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 18px 34px rgba(18,50,74,0.12)" }
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 14,
                  height: 14,
                  borderRadius: 0.6,
                  backgroundColor: item.cube,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.18)"
                }}
              />
              <CardContent>
                <Typography sx={{ fontStyle: "italic", mb: 1.2, mt: 0.6 }}>
                  "{item.quote}"
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>{item.name}</Typography>
                <Typography color="text.secondary" variant="body2">{item.role}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />
      <Typography color="text.secondary" sx={{ textAlign: "center" }}>
        Smart Healthcare connects patient, doctor, and admin workflows in one modern platform.
      </Typography>
      </Container>
    </Box>
  );
}

export default GuestHomePage;
