import crypto from 'crypto';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import type { File } from 'formidable';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

export const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

export const maxUploadSize = 10 * 1024 * 1024;

export function resolveStoredFilePath(filePath: string) {
  const storagePath = filePath.replace(/^\/+/, '').replace(/\\/g, '/');
  if (!storagePath.startsWith('uploads/')) {
    throw new Error('Invalid file path');
  }

  const absolutePath = path.resolve(process.cwd(), storagePath);
  const uploadRoot = path.resolve(UPLOAD_ROOT);
  if (!absolutePath.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new Error('Invalid file path');
  }

  return absolutePath;
}

export async function openStoredFile(filePath: string) {
  const absolutePath = resolveStoredFilePath(filePath);
  await fs.access(absolutePath);
  return {
    absolutePath,
    stream: createReadStream(absolutePath)
  };
}

export function safeHeaderFileName(fileName: string) {
  return path.basename(fileName).replace(/[\r\n"]/g, '_') || 'document';
}

export async function saveUploadedFile(file: File, folder = 'documents') {
  if (!file.mimetype || !allowedMimeTypes.has(file.mimetype)) {
    throw new Error('Format file tidak didukung');
  }

  if (file.size > maxUploadSize) {
    throw new Error('Ukuran file terlalu besar. Maksimal 10MB');
  }

  const extension = path.extname(file.originalFilename || '').toLowerCase();
  const storedFileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const targetDir = path.join(UPLOAD_ROOT, folder);
  const targetPath = path.join(targetDir, storedFileName);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.rename(file.filepath, targetPath);

  return {
    originalFileName: file.originalFilename || storedFileName,
    storedFileName,
    storageKey: `${folder}/${storedFileName}`,
    filePath: `/uploads/${folder}/${storedFileName}`,
    mimeType: file.mimetype,
    fileSize: file.size
  };
}
