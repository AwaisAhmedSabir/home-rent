import express from "express";
import {
  register,
  login,
  getMe,
  searchUsers,
  seedCreator,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/seed-creator", seedCreator); // For initial setup

// Protected routes
router.get("/me", protect, getMe);
router.get("/search", protect, searchUsers);

export default router;
