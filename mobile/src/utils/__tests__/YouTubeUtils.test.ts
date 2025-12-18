/**
 * Tests for YouTube utility functions
 */
import {
  extractYouTubeVideoId,
  isYouTubeUrl,
  convertToYouTubeEmbedUrl,
  getYouTubeThumbnail,
} from '../YouTubeUtils';

describe('YouTubeUtils', () => {
  describe('extractYouTubeVideoId', () => {
    it('should extract video ID from embed URL', () => {
      const embedUrl = 'https://www.youtube.com/embed/HB8vftGxsIc?si=U8ukgvsEE91ltmGp';
      const videoId = extractYouTubeVideoId(embedUrl);
      expect(videoId).toBe('HB8vftGxsIc');
    });

    it('should extract video ID from watch URL', () => {
      const watchUrl = 'https://www.youtube.com/watch?v=HB8vftGxsIc';
      const videoId = extractYouTubeVideoId(watchUrl);
      expect(videoId).toBe('HB8vftGxsIc');
    });

    it('should extract video ID from youtu.be URL', () => {
      const shortUrl = 'https://youtu.be/HB8vftGxsIc';
      const videoId = extractYouTubeVideoId(shortUrl);
      expect(videoId).toBe('HB8vftGxsIc');
    });

    it('should return null for invalid URLs', () => {
      expect(extractYouTubeVideoId('')).toBeNull();
      expect(extractYouTubeVideoId('invalid-url')).toBeNull();
      expect(extractYouTubeVideoId('https://example.com')).toBeNull();
    });
  });

  describe('isYouTubeUrl', () => {
    it('should identify YouTube URLs correctly', () => {
      expect(isYouTubeUrl('https://www.youtube.com/embed/HB8vftGxsIc')).toBe(true);
      expect(isYouTubeUrl('https://youtube.com/watch?v=HB8vftGxsIc')).toBe(true);
      expect(isYouTubeUrl('https://youtu.be/HB8vftGxsIc')).toBe(true);
      expect(isYouTubeUrl('https://m.youtube.com/watch?v=HB8vftGxsIc')).toBe(true);
    });

    it('should reject non-YouTube URLs', () => {
      expect(isYouTubeUrl('https://example.com')).toBe(false);
      expect(isYouTubeUrl('https://vimeo.com/123456')).toBe(false);
      expect(isYouTubeUrl('')).toBe(false);
      expect(isYouTubeUrl('invalid-url')).toBe(false);
    });
  });

  describe('convertToYouTubeEmbedUrl', () => {
    it('should convert watch URL to embed URL', () => {
      const watchUrl = 'https://www.youtube.com/watch?v=HB8vftGxsIc';
      const embedUrl = convertToYouTubeEmbedUrl(watchUrl);
      expect(embedUrl).toBe('https://www.youtube.com/embed/HB8vftGxsIc');
    });

    it('should return original URL if not a valid YouTube URL', () => {
      const invalidUrl = 'https://example.com/video';
      const result = convertToYouTubeEmbedUrl(invalidUrl);
      expect(result).toBe(invalidUrl);
    });
  });

  describe('getYouTubeThumbnail', () => {
    it('should return correct thumbnail URL', () => {
      const videoId = 'HB8vftGxsIc';
      const thumbnail = getYouTubeThumbnail(videoId);
      expect(thumbnail).toBe('https://img.youtube.com/vi/HB8vftGxsIc/mqdefault.jpg');
    });

    it('should support different quality options', () => {
      const videoId = 'HB8vftGxsIc';
      const hqThumbnail = getYouTubeThumbnail(videoId, 'hqdefault');
      expect(hqThumbnail).toBe('https://img.youtube.com/vi/HB8vftGxsIc/hqdefault.jpg');
    });
  });
});
