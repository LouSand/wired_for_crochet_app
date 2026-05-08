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
