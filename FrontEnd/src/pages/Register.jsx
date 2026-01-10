import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed.");
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
        <Typography className="signinTitle">Sign up</Typography>

        {/* Error Message */}
        {error && (
          <Typography className="errorText">
            {error}
          </Typography>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} className="signinForm">
          <Typography className="fieldLabel">Name</Typography>
          <TextField
            fullWidth
            placeholder="Your full name"
            value={form.name}
            onChange={handleChange("name")}
            type="text"
            autoComplete="name"
            className="textField"
            InputProps={{ className: "textFieldInput" }}
            required
          />

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
            autoComplete="new-password"
            className="textField"
            InputProps={{ className: "textFieldInput" }}
            required
          />

          <Button type="submit" fullWidth className="primaryBtn" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <Divider className="divider">
            <span className="dividerText">or</span>
          </Divider>

          <Typography className="footerText">
            Already have an account?{" "}
            <Link
              to="/login"
              className="footerLink"
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
