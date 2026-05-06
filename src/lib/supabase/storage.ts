/**
 * Supabase Storage utilities for generating signed URLs.
 * Uses the server Supabase client for secure access.
 */

import { createClient } from './server';

const DEFAULT_EXPIRY_SECONDS = 60 * 60; // 1 hour

/**
 * Generates a signed URL for reading a file from Supabase Storage.
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns The signed URL string, or null if generation fails
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = DEFAULT_EXPIRY_SECONDS
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl, error: null };
}

/**
 * Generates a signed URL for uploading a file to Supabase Storage.
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns The signed upload URL string, or null if generation fails
 */
export async function getUploadUrl(
  bucket: string,
  path: string
): Promise<{ url: string | null; token: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) {
    return { url: null, token: null, error: error.message };
  }

  return { url: data.signedUrl, token: data.token, error: null };
}
