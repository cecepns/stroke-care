import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  extractYouTubeVideoId,
  isYouTubeUrl,
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

const YouTubePlayerComponent: React.FC<YouTubePlayerProps> = ({
  url,
  title,
  style,
  autoPlay = false,
  onError,
  onLoad,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const playerRef = useRef(null);

  // Extract video ID and prepare URLs
  const videoId = extractYouTubeVideoId(url);
  const isValidYouTubeUrl = isYouTubeUrl(url);

  const onReady = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const onPlayerError = useCallback((error: string) => {
    setIsLoading(false);
    console.error('YouTube Player Error:', error);
    
    setError('Video tidak dapat dimuat. Mungkin video dibatasi atau tidak tersedia.');
    onError?.(error);
  }, [onError]);

  const onChangeState = useCallback((state: string) => {
    console.log('Player state:', state);
    if (state === 'playing') {
      setIsLoading(false);
      setPlaying(true);
    } else if (state === 'paused') {
      setPlaying(false);
    } else if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const renderPlayer = () => {
    if (!videoId) {
      return null;
    }

    return (
      <View style={[styles.playerContainer, style]}>
        <YoutubePlayer
          ref={playerRef}
          height={PLAYER_HEIGHT}
          play={playing}
          videoId={videoId}
          onReady={onReady}
          onError={onPlayerError}
          onChangeState={onChangeState}
          webViewProps={{
            androidLayerType: 'hardware',
          }}
          initialPlayerParams={{
            controls: true,
            modestbranding: true,
            showClosedCaptions: false,
            rel: false,
            preventFullScreen: false,
          }}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
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

  return renderPlayer();
};

const styles = StyleSheet.create({
  playerContainer: {
    width: '100%',
    height: PLAYER_HEIGHT,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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

export default YouTubePlayerComponent;
