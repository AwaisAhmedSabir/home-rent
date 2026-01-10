import multer from "multer";
import storageService from "../services/storage.service.js";

// Configure multer to use memory storage (we'll save manually)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const validation = storageService.validateFile({
    mimetype: file.mimetype,
    size: 0, // Size will be checked after upload
  });

  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (increased for videos)
  },
});

// Middleware for single image upload
export const uploadImage = upload.single("image");

// Middleware for handling upload errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 50MB limit",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }
  next();
};
