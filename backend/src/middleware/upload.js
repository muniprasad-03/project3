import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadsDirectory = path.join(__dirname, "..", "..", "uploads");

fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) =>
    callback(null, uploadsDirectory),
  filename: (_req, file, callback) => {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .replace(/-+/g, "-");
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const uploadStudyNote = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype))
      return callback(new Error("Only PDF, DOC, and DOCX files are allowed"));
    callback(null, true);
  },
});

export const uploadProfilePhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype))
      return callback(new Error("Only JPG, PNG, and WebP profile photos are allowed"));
    callback(null, true);
  },
});
