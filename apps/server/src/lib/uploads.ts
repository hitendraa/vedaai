import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import multer from "multer";

const maxFileSize = 10 * 1024 * 1024;
const maxFileCount = 5;

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/markdown",
  "text/plain",
]);

const allowedExtensions = new Set([
  ".docx",
  ".jpeg",
  ".jpg",
  ".md",
  ".pdf",
  ".png",
  ".txt",
  ".webp",
]);

export const uploadsDir = path.resolve(process.cwd(), "uploads", "assignments");

mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${extension}`);
  },
});

export const assignmentUpload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: maxFileCount,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
      !allowedMimeTypes.has(file.mimetype) ||
      !allowedExtensions.has(extension)
    ) {
      cb(
        new Error(
          "Only PDF, DOCX, TXT, MD, JPG, PNG, and WEBP files are allowed.",
        ),
      );
      return;
    }

    cb(null, true);
  },
});

export function toAttachment(file: Express.Multer.File) {
  return {
    originalName: file.originalname,
    fileName: file.filename,
    path: file.path,
    mimeType: file.mimetype,
    size: file.size,
  };
}
