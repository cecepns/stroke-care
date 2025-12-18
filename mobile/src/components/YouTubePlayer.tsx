import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  extractYouTubeVideoId,
  isYouTubeUrl,
  getYouTubeThumbnail,
} from '../utils/YouTubeUtils';

interface YouTubePlayerProps {
  url: string;
  title?: string;
  style?: object;
  autoPlay?: boolean;
  onError?: (error: any) => void;
  onLoad?: () => void;
}

const { width } = Dimensions.get('window');
const PLAYER_HEIGHT = (width * 9) / 16; // 16:9 aspect ratio

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  url,
  title,
  style,
  autoPlay = false,
  onError,
  onLoad,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(autoPlay);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const webViewRef = useRef<WebView>(null);

  // Extract video ID and prepare URLs
  const videoId = extractYouTubeVideoId(url);
  const isValidYouTubeUrl = isYouTubeUrl(url);
  const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId, 'hqdefault') : null;
  
  // Create embed URL for WebView with mobile-optimized parameters
  const embedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${autoPlay ? 1 : 0}&controls=1&modestbranding=1&rel=0&playsinline=1&widget_referrer=https://www.youtube.com`
    : url;

  // Different User-Agent strings for fallback
  const getUserAgent = () => {
    const userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    ];
    return userAgents[retryCount % userAgents.length];
  };

  const handlePlayPress = () => {
    if (!isValidYouTubeUrl) {
      Alert.alert('Error', 'URL video tidak valid');
      return;
    }

    setIsLoading(true);
    setShowPlayer(true);
    setError(null);
  };

  const handleWebViewLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleWebViewError = (error: any) => {
    setIsLoading(false);
    console.error('YouTube WebView Error:', error, 'Retry count:', retryCount);
    
    // Try different User-Agent if retry count is less than 3
    if (retryCount < 2) {
      console.log('Retrying with different User-Agent...');
      setRetryCount(retryCount + 1);
      setIsLoading(true);
      // Force WebView to reload with new User-Agent
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
      return;
    }
    
    // Check if it's a YouTube restriction error
    if (error?.nativeEvent?.description?.includes('restricted') || 
        error?.nativeEvent?.description?.includes('not available')) {
      setError('Video tidak tersedia atau dibatasi untuk ditonton di aplikasi mobile');
    } else {
      setError('Gagal memuat video setelah beberapa percobaan');
    }
    
    setShowPlayer(false);
    onError?.(error);
  };

  const handleWebViewLoadStart = () => {
    setIsLoading(true);
  };

  const renderThumbnail = () => (
    <View style={[styles.thumbnailContainer, style]}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
          <Icon name="play-circle-outline" size={64} color="#fff" />
        </View>
      )}
      
      <TouchableOpacity style={styles.playButton} onPress={handlePlayPress}>
        <View style={styles.playButtonInner}>
          <Icon name="play-arrow" size={32} color="#fff" />
        </View>
      </TouchableOpacity>

      {title && (
        <View style={styles.titleOverlay}>
          <Text style={styles.thumbnailTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );

  const renderPlayer = () => (
    <View style={[styles.playerContainer, style]}>
      <WebView
        ref={webViewRef}
        source={{ 
          uri: embedUrl,
          headers: {
            'Referer': 'https://www.youtube.com/',
            'User-Agent': getUserAgent()
          }
        }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        onLoad={handleWebViewLoad}
        onError={handleWebViewError}
        onLoadStart={handleWebViewLoadStart}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.minimizeButton}
        onPress={() => {
          setShowPlayer(false);
        }}
      >
        <Icon name="close" size={24} color="#fff" />
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    handlePlayPress();
  };

  const renderError = () => (
    <View style={[styles.errorContainer, style]}>
      <Icon name="error-outline" size={48} color="#f44336" />
      <Text style={styles.errorText}>{error}</Text>
      <View style={styles.errorButtons}>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.retryButton, styles.browserButton]} 
          onPress={() => {
            if (videoId) {
              Alert.alert(
                'Buka di Browser',
                'Video akan dibuka di browser eksternal',
                [
                  { text: 'Batal', style: 'cancel' },
                  { 
                    text: 'Buka', 
                    onPress: () => {
                      Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
                    }
                  }
                ]
              );
            }
          }}
        >
          <Text style={styles.retryButtonText}>Buka di Browser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isValidYouTubeUrl) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Icon name="warning" size={48} color="#ff9800" />
        <Text style={styles.errorText}>URL YouTube tidak valid</Text>
      </View>
    );
  }

  if (error) {
    return renderError();
  }

  if (showPlayer) {
    return renderPlayer();
  }

  return renderThumbnail();
};

const styles = StyleSheet.create({
  thumbnailContainer: {
    width: '100%',
    height: PLAYER_HEIGHT,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 2,
  },
  playButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  thumbnailTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  playerContainer: {
    width: '100%',
    height: PLAYER_HEIGHT,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  minimizeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    width: '100%',
    height: PLAYER_HEIGHT,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  browserButton: {
    backgroundColor: '#FF9800',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default YouTubePlayer;
