import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration
const UPLOAD_DIR = path.join(__dirname, "../uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (increased for videos)
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg", 
  "image/jpg", 
  "image/png", 
  "image/gif", 
  "image/webp",
  // Videos
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-ms-wmv"
];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Storage Service - Abstracted for easy migration to Azure Blob Storage
 * Currently uses local file system, but can be swapped for Azure Blob Storage
 */
class StorageService {
  /**
   * Save file to storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} mimeType - File MIME type
   * @returns {Promise<{uuid: string, path: string, url: string}>}
   */
  async saveFile(fileBuffer, mimeType) {
    // Generate UUID for filename
    const uuid = uuidv4();
    
    // Determine file extension from MIME type
    const extension = this.getExtensionFromMimeType(mimeType);
    const filename = `${uuid}${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Save file to local storage
    fs.writeFileSync(filePath, fileBuffer);

    // Return file info
    return {
      uuid,
      path: filePath,
      url: `/uploads/${filename}`, // URL path for accessing the file
      filename,
    };
  }

  /**
   * Delete file from storage
   * @param {string} uuid - File UUID
   * @returns {Promise<boolean>}
   */
  async deleteFile(uuid) {
    try {
      // Find file by UUID (scan directory for file starting with UUID)
      const files = fs.readdirSync(UPLOAD_DIR);
      const file = files.find((f) => f.startsWith(uuid));

      if (file) {
        const filePath = path.join(UPLOAD_DIR, file);
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * Get file path by UUID
   * @param {string} uuid - File UUID
   * @returns {string|null}
   */
  getFilePath(uuid) {
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      const file = files.find((f) => f.startsWith(uuid));

      if (file) {
        return path.join(UPLOAD_DIR, file);
      }
      return null;
    } catch (error) {
      console.error("Error getting file path:", error);
      return null;
    }
  }

  /**
   * Get file URL by UUID
   * @param {string} uuid - File UUID
   * @returns {string}
   */
  getFileUrl(uuid) {
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      const file = files.find((f) => f.startsWith(uuid));

      if (file) {
        return `/uploads/${file}`;
      }
      return null;
    } catch (error) {
      console.error("Error getting file URL:", error);
      return null;
    }
  }

  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string}
   */
  getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
      // Images
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      // Videos
      "video/mp4": ".mp4",
      "video/mpeg": ".mpeg",
      "video/quicktime": ".mov",
      "video/x-msvideo": ".avi",
      "video/webm": ".webm",
      "video/x-ms-wmv": ".wmv",
    };
    return mimeToExt[mimeType] || ".jpg";
  }
  
  /**
   * Check if file is a video
   * @param {string} mimeType - MIME type
   * @returns {boolean}
   */
  isVideo(mimeType) {
    return mimeType && mimeType.startsWith("video/");
  }
  
  /**
   * Check if file is an image
   * @param {string} mimeType - MIME type
   * @returns {boolean}
   */
  isImage(mimeType) {
    return mimeType && mimeType.startsWith("image/");
  }

  /**
   * Validate file
   * @param {Object} file - File object from multer
   * @returns {{valid: boolean, error?: string}}
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
      };
    }

    return { valid: true };
  }
}

// Export singleton instance
export default new StorageService();

// Export constants for use in other files
export { UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
