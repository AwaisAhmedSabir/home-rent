import storageService from "../services/storage.service.js";

// @desc    Upload image
// @route   POST /api/upload
// @access  Private
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate file
    const validation = storageService.validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Save file to storage
    const fileInfo = await storageService.saveFile(
      req.file.buffer,
      req.file.mimetype
    );

    // Determine media type
    const mediaType = storageService.isVideo(req.file.mimetype) ? "video" : "image";

    res.status(200).json({
      success: true,
      data: {
        uuid: fileInfo.uuid,
        url: fileInfo.url,
        filename: fileInfo.filename,
        mediaType: mediaType,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
};

// @desc    Delete image
// @route   DELETE /api/upload/:uuid
// @access  Private
export const deleteImage = async (req, res) => {
  try {
    const { uuid } = req.params;

    const deleted = await storageService.deleteFile(uuid);

    if (deleted) {
      res.status(200).json({
        success: true,
        message: "Image deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete image",
    });
  }
};
