/**
 * Input sanitization utilities for preventing XSS attacks.
 *
 * Since Supabase uses parameterized queries (PostgREST), SQL injection is
 * already handled at the database layer. This module focuses on neutralizing
 * HTML/script injection to prevent XSS when rendering user content.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}

const HTML_CHARS_REGEX = /[&<>"']/g

/**
 * Escapes HTML entities to prevent XSS.
 * Converts < > & " ' to their HTML entity equivalents.
 */
export function sanitizeHtml(input: string): string {
  return input.replace(HTML_CHARS_REGEX, (char) => HTML_ENTITY_MAP[char] || char)
}

/**
 * Combines HTML sanitization with trimming.
 * Use this for all user-provided text inputs before storage or display.
 */
export function sanitizeInput(input: string): string {
  return sanitizeHtml(input.trim())
}
