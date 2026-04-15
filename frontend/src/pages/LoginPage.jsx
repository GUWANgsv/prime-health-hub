import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form);
      if (user.role === "ADMIN") navigate("/dashboard/admin");
      else if (user.role === "DOCTOR") navigate("/dashboard/doctor");
      else navigate("/dashboard/patient");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <Box sx={{ maxWidth: 620, mx: "auto", py: { xs: 3, md: 5 }, px: { xs: 2, sm: 0 } }}>
      <Card sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            color: "white",
            background: "linear-gradient(120deg, #0b3954, #087f8c)"
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.8 }}>
            Welcome Back
          </Typography>
          <Typography sx={{ opacity: 0.92 }}>
            Access your healthcare dashboard and continue where you left off.
          </Typography>
        </Box>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 750 }}>Login</Typography>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>Access your healthcare dashboard</Typography>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

          <Stack component="form" spacing={1.4} onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={loading} sx={{ py: 1.25 }}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </Stack>

          <Typography sx={{ mt: 2 }}>
            New user? <Link to="/">Go to home</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LoginPage;
