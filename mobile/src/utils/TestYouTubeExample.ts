/**
 * Example test data and usage for YouTube implementation
 * This demonstrates how the YouTube player handles the provided embed URL
 */

import { 
  extractYouTubeVideoId, 
  isYouTubeUrl, 
  convertToYouTubeEmbedUrl,
  getYouTubeThumbnail 
} from './YouTubeUtils';

// Test with the provided embed URL
const testEmbedUrl = 'https://www.youtube.com/embed/HB8vftGxsIc?si=U8ukgvsEE91ltmGp';

export const testYouTubeImplementation = () => {
  console.log('=== YouTube Implementation Test ===');
  
  // Test URL validation
  console.log('1. URL Validation:');
  console.log(`   Input URL: ${testEmbedUrl}`);
  console.log(`   Is YouTube URL: ${isYouTubeUrl(testEmbedUrl)}`);
  
  // Test video ID extraction
  console.log('\n2. Video ID Extraction:');
  const videoId = extractYouTubeVideoId(testEmbedUrl);
  console.log(`   Extracted Video ID: ${videoId}`);
  
  // Test URL conversion
  console.log('\n3. URL Conversion:');
  const embedUrl = convertToYouTubeEmbedUrl(testEmbedUrl);
  console.log(`   Converted to Embed URL: ${embedUrl}`);
  
  // Test thumbnail generation
  console.log('\n4. Thumbnail URLs:');
  if (videoId) {
    console.log(`   Default: ${getYouTubeThumbnail(videoId, 'default')}`);
    console.log(`   Medium: ${getYouTubeThumbnail(videoId, 'mqdefault')}`);
    console.log(`   High: ${getYouTubeThumbnail(videoId, 'hqdefault')}`);
    console.log(`   Max: ${getYouTubeThumbnail(videoId, 'maxresdefault')}`);
  }
  
  return {
    originalUrl: testEmbedUrl,
    isValid: isYouTubeUrl(testEmbedUrl),
    videoId,
    playableUrl: embedUrl,
    thumbnail: videoId ? getYouTubeThumbnail(videoId, 'hqdefault') : null
  };
};

// Example material object that would trigger YouTube player
export const exampleMaterial = {
  id: 1,
  title: 'Contoh Video YouTube',
  description: 'Video edukasi yang bisa diputar langsung di aplikasi',
  content: 'Konten detail dari video ini...',
  video_url: testEmbedUrl,
  type: 'video_education',
  author_name: 'Tim Edukasi',
  created_at: new Date().toISOString(),
};

// This would be used in MaterialDetailScreen like:
// <YouTubePlayer 
//   url={material.video_url} 
//   title={material.title}
//   onError={handleVideoError}
// />
