import express from "express";
import { toggleLike, getLikes } from "../controllers/like.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/:postId", getLikes);

// Protected routes
router.post("/:postId", protect, toggleLike);

export default router;
