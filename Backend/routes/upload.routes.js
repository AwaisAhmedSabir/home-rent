import express from "express";
import { uploadImage, deleteImage } from "../controllers/upload.controller.js";
import { uploadImage as uploadMiddleware, handleUploadError } from "../middleware/upload.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected routes
router.post("/", protect, uploadMiddleware, handleUploadError, uploadImage);
router.delete("/:uuid", protect, deleteImage);

export default router;
