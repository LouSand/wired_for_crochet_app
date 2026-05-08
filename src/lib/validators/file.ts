/**
 * File validation utilities for upload contexts.
 * Validates MIME types and file sizes for progress photos, pattern files, and yarn photos.
 */

// Allowed MIME types per upload context
export const PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const PATTERN_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const YARN_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

// Size limits in bytes
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_PATTERN_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_YARN_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

export type FileContext = 'photo' | 'pattern' | 'yarn_photo';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const CONTEXT_CONFIG: Record<
  FileContext,
  { mimeTypes: readonly string[]; maxSize: number; label: string }
> = {
  photo: {
    mimeTypes: PHOTO_MIME_TYPES,
    maxSize: MAX_PHOTO_SIZE,
    label: 'Photo',
  },
  pattern: {
    mimeTypes: PATTERN_MIME_TYPES,
    maxSize: MAX_PATTERN_SIZE,
    label: 'Pattern file',
  },
  yarn_photo: {
    mimeTypes: YARN_PHOTO_MIME_TYPES,
    maxSize: MAX_YARN_PHOTO_SIZE,
    label: 'Yarn photo',
  },
};

/**
 * Validates a file's MIME type and size for the given upload context.
 */
export function validateFile(
  file: { type: string; size: number },
  context: FileContext
): FileValidationResult {
  const config = CONTEXT_CONFIG[context];

  if (!config.mimeTypes.includes(file.type)) {
    const allowed = config.mimeTypes.join(', ');
    return {
      valid: false,
      error: `${config.label} must be one of: ${allowed}. Received: ${file.type || 'unknown'}`,
    };
  }

  if (file.size > config.maxSize) {
    const maxMB = config.maxSize / (1024 * 1024);
    const fileMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `${config.label} must be under ${maxMB} MB. File size: ${fileMB} MB`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a file name for safe storage:
 * - Strips path traversal characters (../, ..\, leading /)
 * - Replaces spaces with hyphens
 * - Lowercases the result
 * - Removes any characters that aren't alphanumeric, hyphens, underscores, or dots
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/\.\.[/\\]/g, '') // Remove path traversal sequences
    .replace(/^[/\\]+/, '') // Remove leading slashes
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]/g, ''); // Keep only safe characters
}
