import { describe, it, expect } from 'vitest';
import {
  validateFile,
  sanitizeFileName,
  PHOTO_MIME_TYPES,
  PATTERN_MIME_TYPES,
  YARN_PHOTO_MIME_TYPES,
  MAX_PHOTO_SIZE,
  MAX_PATTERN_SIZE,
  MAX_YARN_PHOTO_SIZE,
} from './file';

describe('validateFile', () => {
  describe('photo context', () => {
    it('accepts valid JPEG photo within size limit', () => {
      const result = validateFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 }, 'photo');
      expect(result).toEqual({ valid: true });
    });

    it('accepts valid PNG photo within size limit', () => {
      const result = validateFile({ type: 'image/png', size: 1024 }, 'photo');
      expect(result).toEqual({ valid: true });
    });

    it('accepts valid WEBP photo within size limit', () => {
      const result = validateFile({ type: 'image/webp', size: 2 * 1024 * 1024 }, 'photo');
      expect(result).toEqual({ valid: true });
    });

    it('accepts photo at exactly the size limit', () => {
      const result = validateFile({ type: 'image/jpeg', size: MAX_PHOTO_SIZE }, 'photo');
      expect(result).toEqual({ valid: true });
    });

    it('rejects photo exceeding 10 MB', () => {
      const result = validateFile({ type: 'image/jpeg', size: MAX_PHOTO_SIZE + 1 }, 'photo');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10 MB');
    });

    it('rejects invalid MIME type for photo', () => {
      const result = validateFile({ type: 'application/pdf', size: 1024 }, 'photo');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('application/pdf');
    });

    it('rejects empty MIME type', () => {
      const result = validateFile({ type: '', size: 1024 }, 'photo');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unknown');
    });
  });

  describe('pattern context', () => {
    it('accepts valid PDF pattern within size limit', () => {
      const result = validateFile({ type: 'application/pdf', size: 15 * 1024 * 1024 }, 'pattern');
      expect(result).toEqual({ valid: true });
    });

    it('accepts valid JPEG pattern within size limit', () => {
      const result = validateFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 }, 'pattern');
      expect(result).toEqual({ valid: true });
    });

    it('accepts valid PNG pattern within size limit', () => {
      const result = validateFile({ type: 'image/png', size: 1024 }, 'pattern');
      expect(result).toEqual({ valid: true });
    });

    it('accepts pattern at exactly the size limit', () => {
      const result = validateFile({ type: 'application/pdf', size: MAX_PATTERN_SIZE }, 'pattern');
      expect(result).toEqual({ valid: true });
    });

    it('rejects pattern exceeding 20 MB', () => {
      const result = validateFile({ type: 'application/pdf', size: MAX_PATTERN_SIZE + 1 }, 'pattern');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('20 MB');
    });

    it('rejects WEBP for pattern context', () => {
      const result = validateFile({ type: 'image/webp', size: 1024 }, 'pattern');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('image/webp');
    });
  });

  describe('yarn_photo context', () => {
    it('accepts valid JPEG yarn photo within size limit', () => {
      const result = validateFile({ type: 'image/jpeg', size: 3 * 1024 * 1024 }, 'yarn_photo');
      expect(result).toEqual({ valid: true });
    });

    it('accepts valid PNG yarn photo within size limit', () => {
      const result = validateFile({ type: 'image/png', size: 1024 }, 'yarn_photo');
      expect(result).toEqual({ valid: true });
    });

    it('accepts valid WEBP yarn photo within size limit', () => {
      const result = validateFile({ type: 'image/webp', size: 2 * 1024 * 1024 }, 'yarn_photo');
      expect(result).toEqual({ valid: true });
    });

    it('accepts yarn photo at exactly the size limit', () => {
      const result = validateFile({ type: 'image/jpeg', size: MAX_YARN_PHOTO_SIZE }, 'yarn_photo');
      expect(result).toEqual({ valid: true });
    });

    it('rejects yarn photo exceeding 5 MB', () => {
      const result = validateFile({ type: 'image/jpeg', size: MAX_YARN_PHOTO_SIZE + 1 }, 'yarn_photo');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5 MB');
    });

    it('rejects PDF for yarn_photo context', () => {
      const result = validateFile({ type: 'application/pdf', size: 1024 }, 'yarn_photo');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('application/pdf');
    });
  });

  describe('error messages', () => {
    it('includes the received MIME type in error', () => {
      const result = validateFile({ type: 'text/plain', size: 1024 }, 'photo');
      expect(result.error).toContain('text/plain');
    });

    it('includes file size in MB in error', () => {
      const result = validateFile({ type: 'image/jpeg', size: 12 * 1024 * 1024 }, 'photo');
      expect(result.error).toContain('12.00 MB');
    });

    it('checks MIME type before size', () => {
      // Both invalid MIME and oversized — should report MIME error
      const result = validateFile({ type: 'text/plain', size: MAX_PHOTO_SIZE + 1 }, 'photo');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('text/plain');
      expect(result.error).not.toContain('MB');
    });
  });
});

describe('sanitizeFileName', () => {
  it('lowercases the file name', () => {
    expect(sanitizeFileName('MyPhoto.JPG')).toBe('myphoto.jpg');
  });

  it('replaces spaces with hyphens', () => {
    expect(sanitizeFileName('my photo file.png')).toBe('my-photo-file.png');
  });

  it('removes path traversal sequences', () => {
    expect(sanitizeFileName('../../../etc/passwd')).toBe('etcpasswd');
  });

  it('removes backslash path traversal sequences', () => {
    expect(sanitizeFileName('..\\..\\file.txt')).toBe('file.txt');
  });

  it('removes leading slashes', () => {
    expect(sanitizeFileName('/root/file.png')).toBe('rootfile.png');
  });

  it('removes special characters', () => {
    expect(sanitizeFileName('file (1) [copy].png')).toBe('file-1-copy.png');
  });

  it('preserves dots, hyphens, and underscores', () => {
    expect(sanitizeFileName('my_file-name.test.png')).toBe('my_file-name.test.png');
  });

  it('handles multiple consecutive spaces', () => {
    expect(sanitizeFileName('my   file.png')).toBe('my-file.png');
  });

  it('handles empty string', () => {
    expect(sanitizeFileName('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(sanitizeFileName('!@#$%^&*()')).toBe('');
  });
});

describe('constants', () => {
  it('PHOTO_MIME_TYPES contains expected types', () => {
    expect(PHOTO_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('PATTERN_MIME_TYPES contains expected types', () => {
    expect(PATTERN_MIME_TYPES).toEqual(['application/pdf', 'image/jpeg', 'image/png']);
  });

  it('YARN_PHOTO_MIME_TYPES contains expected types', () => {
    expect(YARN_PHOTO_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('MAX_PHOTO_SIZE is 10 MB', () => {
    expect(MAX_PHOTO_SIZE).toBe(10 * 1024 * 1024);
  });

  it('MAX_PATTERN_SIZE is 20 MB', () => {
    expect(MAX_PATTERN_SIZE).toBe(20 * 1024 * 1024);
  });

  it('MAX_YARN_PHOTO_SIZE is 5 MB', () => {
    expect(MAX_YARN_PHOTO_SIZE).toBe(5 * 1024 * 1024);
  });
});
