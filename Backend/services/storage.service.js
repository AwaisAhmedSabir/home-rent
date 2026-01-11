import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// Storage configuration
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

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "homerent1218";
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME || "homerentstorage";

// Initialize Azure Blob Service Client
let blobServiceClient;
let containerClient;

console.log("🔍 Initializing Azure Storage...");
console.log(`   Container Name: ${AZURE_STORAGE_CONTAINER_NAME}`);
console.log(`   Account Name: ${AZURE_STORAGE_ACCOUNT_NAME}`);
console.log(`   Connection String Set: ${!!AZURE_STORAGE_CONNECTION_STRING}`);

try {
  if (AZURE_STORAGE_CONNECTION_STRING) {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
    console.log("✅ Azure Blob Storage client initialized");
    
    // Ensure container exists (create if it doesn't)
    containerClient.createIfNotExists({
      access: "blob", // Allow public read access to blobs
    }).then(() => {
      console.log(`✅ Azure Blob Storage container "${AZURE_STORAGE_CONTAINER_NAME}" is ready`);
    }).catch((error) => {
      console.error("⚠️  Error creating container (it might already exist):", error.message);
      console.error("   Full error:", error);
    });
  } else {
    console.warn("⚠️  AZURE_STORAGE_CONNECTION_STRING not set. Using local file system fallback.");
  }
} catch (error) {
  console.error("⚠️  Error initializing Azure Blob Storage:", error.message);
  console.error("   Full error:", error);
  console.warn("⚠️  Falling back to local file system. Set AZURE_STORAGE_CONNECTION_STRING to use Azure Blob Storage.");
  containerClient = null; // Ensure it's null on error
}

/**
 * Storage Service - Now uses Azure Blob Storage
 * Falls back to local file system if Azure Blob Storage is not configured
 */
class StorageService {
  /**
   * Save file to storage (Azure Blob Storage or local fallback)
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} mimeType - File MIME type
   * @returns {Promise<{uuid: string, path: string, url: string, filename: string}>}
   */
  async saveFile(fileBuffer, mimeType) {
    // Generate UUID for filename
    const uuid = uuidv4();
    
    // Determine file extension from MIME type
    const extension = this.getExtensionFromMimeType(mimeType);
    const filename = `${uuid}${extension}`;

    // Use Azure Blob Storage if configured
    if (containerClient) {
      try {
        console.log(`📤 Uploading file to Azure Storage: ${filename}`);
        const blockBlobClient = containerClient.getBlockBlobClient(filename);
        
        // Upload file to Azure Blob Storage
        await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
          blobHTTPHeaders: {
            blobContentType: mimeType,
          },
        });

        // Generate public URL
        const url = `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER_NAME}/${filename}`;
        console.log(`✅ File uploaded to Azure Storage: ${url}`);

        return {
          uuid,
          path: filename, // Store blob name instead of file path
          url: url,
          filename,
        };
      } catch (error) {
        console.error("❌ Error uploading to Azure Blob Storage:", error);
        console.error("   Error details:", error.message);
        throw new Error("Failed to upload file to Azure Blob Storage");
      }
    } else {
      console.warn(`⚠️  containerClient is not available. Using local file system fallback for: ${filename}`);
      // Fallback to local file system (for development)
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const UPLOAD_DIR = path.join(__dirname, "../uploads");

      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      const filePath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, fileBuffer);

      return {
        uuid,
        path: filePath,
        url: `/uploads/${filename}`,
        filename,
      };
    }
  }

  /**
   * Delete file from storage (Azure Blob Storage or local fallback)
   * @param {string} uuid - File UUID
   * @returns {Promise<boolean>}
   */
  async deleteFile(uuid) {
    try {
      if (containerClient) {
        // Use Azure Blob Storage
        try {
          // List blobs to find file starting with UUID
          const blobs = containerClient.listBlobsFlat({ prefix: uuid });
          
          for await (const blob of blobs) {
            const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            await blockBlobClient.delete();
            return true;
          }
          return false;
        } catch (error) {
          console.error("Error deleting from Azure Blob Storage:", error);
          return false;
        }
      } else {
        // Fallback to local file system
        const fs = await import("fs");
        const path = await import("path");
        const { fileURLToPath } = await import("url");
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const UPLOAD_DIR = path.join(__dirname, "../uploads");

        const files = fs.readdirSync(UPLOAD_DIR);
        const file = files.find((f) => f.startsWith(uuid));

        if (file) {
          const filePath = path.join(UPLOAD_DIR, file);
          fs.unlinkSync(filePath);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * Get file URL by UUID (Azure Blob Storage or local fallback)
   * @param {string} uuid - File UUID
   * @returns {Promise<string|null>}
   */
  async getFileUrl(uuid) {
    try {
      if (containerClient) {
        // Use Azure Blob Storage
        try {
          const blobs = containerClient.listBlobsFlat({ prefix: uuid });
          
          for await (const blob of blobs) {
            return `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER_NAME}/${blob.name}`;
          }
          return null;
        } catch (error) {
          console.error("Error getting file URL from Azure Blob Storage:", error);
          return null;
        }
      } else {
        // Fallback to local file system
        const fs = await import("fs");
        const path = await import("path");
        const { fileURLToPath } = await import("url");
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const UPLOAD_DIR = path.join(__dirname, "../uploads");

        const files = fs.readdirSync(UPLOAD_DIR);
        const file = files.find((f) => f.startsWith(uuid));

        if (file) {
          return `/uploads/${file}`;
        }
        return null;
      }
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
export { MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
