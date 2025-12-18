/**
 * Utility functions for handling YouTube URLs and video operations
 */

/**
 * Extract YouTube video ID from various YouTube URL formats
 * @param url - YouTube URL (watch, embed, or short format)
 * @returns video ID or null if not found
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove any leading/trailing whitespace
  const cleanUrl = url.trim();

  // Various YouTube URL patterns
  const patterns = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Short URL: https://youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // YouTube URL with additional parameters
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Check if URL is a YouTube URL
 * @param url - URL to check
 * @returns true if it's a YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const youtubeHosts = [
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
  ];

  try {
    const urlObj = new URL(url);
    return youtubeHosts.includes(urlObj.hostname.toLowerCase());
  } catch {
    // If URL parsing fails, try simple string matching
    return youtubeHosts.some(host => url.toLowerCase().includes(host));
  }
};

/**
 * Convert YouTube URL to embed URL for WebView
 * @param url - YouTube URL (any format)
 * @returns Embed URL for WebView
 */
export const convertToYouTubeEmbedUrl = (url: string): string => {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return url;
  }

  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Get YouTube video thumbnail URL
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality (default: 'mqdefault')
 * @returns Thumbnail URL
 */
export const getYouTubeThumbnail = (
  videoId: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'mqdefault'
): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Extract video title and duration from YouTube URL (placeholder for future API integration)
 * @param videoId - YouTube video ID
 * @returns Basic video info
 */
export const getYouTubeVideoInfo = (videoId: string) => {
  return {
    id: videoId,
    thumbnail: getYouTubeThumbnail(videoId),
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
};
