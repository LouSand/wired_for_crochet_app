/**
 * Pattern-specific file validation utilities.
 * Wraps the generic file validation from src/lib/validators/file.ts
 * and adds pattern-specific helpers.
 */

import {
  validateFile,
  sanitizeFileName,
  MAX_PATTERN_SIZE,
  PATTERN_MIME_TYPES,
  type FileValidationResult,
} from '@/lib/validators/file'

/** Maximum file size for pattern uploads (20 MB) */
export const MAX_FILE_SIZE = MAX_PATTERN_SIZE

/** Allowed MIME types for pattern file uploads */
export const ALLOWED_MIME_TYPES = PATTERN_MIME_TYPES

/**
 * Validates a file for pattern upload.
 * Convenience wrapper around the generic validateFile with 'pattern' context.
 */
export function validatePatternFile(file: { size: number; type: string }): FileValidationResult {
  return validateFile(file, 'pattern')
}

/**
 * Derives a pattern title from a filename by removing the last extension.
 * If the filename has no extension (no dot), returns the full filename.
 *
 * Examples:
 *   "cozy-blanket.pdf" → "cozy-blanket"
 *   "my.pattern.v2.png" → "my.pattern.v2"
 *   "no-extension" → "no-extension"
 */
export function deriveTitleFromFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex <= 0) {
    return filename
  }
  return filename.substring(0, lastDotIndex)
}

// Re-export sanitizeFileName for convenience
export { sanitizeFileName }
