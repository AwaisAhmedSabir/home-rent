import express from "express";
import {
  getPosts,
  getPost,
  searchPosts,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { protect, isCreator } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/search", searchPosts);
router.get("/", getPosts);
router.get("/:id", getPost);

// Protected routes (Creator only)
router.post("/", protect, isCreator, createPost);
router.put("/:id", protect, isCreator, updatePost);
router.delete("/:id", protect, isCreator, deletePost);

export default router;
