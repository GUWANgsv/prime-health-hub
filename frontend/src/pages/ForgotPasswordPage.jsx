import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      await authService.verifyForgotPasswordEmail({ email });
      setStep("reset");
      setSuccess("Email found. You can now set a new password.");
    } catch (err) {
      setError(err.response?.data?.message || "email not found");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 8 characters and include letters and numbers");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password must match");
      return;
    }

    setLoading(true);
    try {
      await authService.resetForgotPassword({ email, password, confirmPassword });
      setSuccess("Password reset successfully. Please login with your new password.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
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
            Forgot Password
          </Typography>
          <Typography sx={{ opacity: 0.92 }}>
            Verify your email first, then create a new password.
          </Typography>
        </Box>

        <CardContent>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}

          {step === "email" ? (
            <Stack component="form" spacing={1.4} onSubmit={handleVerifyEmail} sx={{ width: "100%" }}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={loading} sx={{ py: 1.25 }}>
                {loading ? "Checking..." : "Check Email"}
              </Button>
            </Stack>
          ) : (
            <Stack component="form" spacing={1.4} onSubmit={handleResetPassword} sx={{ width: "100%" }}>
              <TextField label="Email" type="email" value={email} disabled fullWidth />
              <TextField
                label="New Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                fullWidth
                helperText="At least 8 characters with letters and numbers"
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                fullWidth
                error={Boolean(confirmPassword) && password !== confirmPassword}
                helperText={Boolean(confirmPassword) && password !== confirmPassword ? "Passwords do not match" : "Re-enter the same password"}
              />
              <Button type="submit" variant="contained" disabled={loading} sx={{ py: 1.25 }}>
                {loading ? "Saving..." : "Set New Password"}
              </Button>
            </Stack>
          )}

          <Typography sx={{ mt: 2 }}>
            <Link to="/login">Back to login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ForgotPasswordPage;
