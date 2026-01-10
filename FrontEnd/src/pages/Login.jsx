import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (key) => (e) => {
    const value = key === "remember" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email: form.email, password: form.password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="signinPage">
      <Paper className="signinCard" elevation={0}>
        {/* Brand */}
        <Box className="brandRow">
          <span className="brandMark" aria-hidden="true" />
          <Typography className="brandName">HomeRent</Typography>
        </Box>

        {/* Title */}
        <Typography className="signinTitle">Sign in</Typography>

        {/* Error Message */}
        {error && (
          <Typography className="errorText">
            {error}
          </Typography>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} className="signinForm">
          <Typography className="fieldLabel">Email</Typography>
          <TextField
            fullWidth
            placeholder="your@email.com"
            value={form.email}
            onChange={handleChange("email")}
            type="email"
            autoComplete="email"
            className="textField"
            InputProps={{ className: "textFieldInput" }}
            required
          />

          <Typography className="fieldLabel">Password</Typography>
          <TextField
            fullWidth
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange("password")}
            type="password"
            autoComplete="current-password"
            className="textField"
            InputProps={{ className: "textFieldInput" }}
            required
          />

          <FormControlLabel
            className="rememberRow"
            control={
              <Checkbox
                checked={form.remember}
                onChange={handleChange("remember")}
              />
            }
            label="Remember me"
          />

          <Button type="submit" fullWidth className="primaryBtn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <Divider className="divider">
            <span className="dividerText">or</span>
          </Divider>

          <Typography className="footerText">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="footerLink"
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
