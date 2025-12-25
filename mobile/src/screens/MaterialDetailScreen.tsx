import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StackScreenProps } from '@react-navigation/stack';
import { Material } from '../types';
import { RootStackParamList } from '../types/navigation';
import YouTubePlayer from '../components/YouTubePlayer';
import HTMLContent from '../components/HTMLContent';
import { isYouTubeUrl } from '../utils/YouTubeUtils';

type MaterialDetailScreenProps = StackScreenProps<RootStackParamList, 'MaterialDetail'>;

const { width } = Dimensions.get('window');

const MaterialDetailScreen: React.FC<MaterialDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { material } = route.params;
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

  console.log(material)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return 'article';
      case 'video_education':
        return 'play-circle-outline';
      case 'video_podcast':
        return 'play-circle-outline';
      case 'poster':
        return 'image';
      default:
        return 'description';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article':
        return 'Artikel';
      case 'video_education':
        return 'Video Edukasi';
      case 'video_podcast':
        return 'Podcast';
      case 'poster':
        return 'Poster';
      case 'full':
        return 'Video Full';
      case 'part':
        return 'Video Part';
      default:
        return 'Materi';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return '#674788';
      case 'video_education':
        return '#2196F3';
      case 'video_podcast':
        return '#FF9800';
      case 'poster':
        return '#4CAF50';
      case 'full':
        return '#2196F3';
      case 'part':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleVideoPress = async () => {
    if (!material.video_url) {
      Alert.alert('Info', 'Video tidak tersedia');
      return;
    }

    console.log("MATERIAL VIDEO URL", material.video_url);

    // If it's not a YouTube URL, open externally as before
    if (!isYouTubeUrl(material.video_url)) {
      try {
        const supported = await Linking.canOpenURL(material.video_url);
        if (supported) {
          await Linking.openURL(material.video_url);
        } else {
          Alert.alert('Error', 'Tidak dapat membuka video');
        }
      } catch (error) {
        console.error('Error opening video:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat membuka video');
      }
    }
  };

  const handleVideoError = (error: any) => {
    console.error('YouTube Player Error:', error);
    Alert.alert(
      'Error Video', 
      'Video tidak dapat dimuat. Apakah Anda ingin membuka di browser?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Buka di Browser', 
          onPress: () => {
            if (material.video_url) {
              Linking.openURL(material.video_url);
            }
          }
        }
      ]
    );
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalVisible(true);
  };

  const handlePosterLinkPress = async () => {
    const link = material.poster_link || material.video_url;
    if (!link) {
      Alert.alert('Info', 'Link tidak tersedia');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        Alert.alert('Error', 'Tidak dapat membuka link');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat membuka link');
    }
  };

  const renderPosterSection = () => {
    if (material.type !== 'poster') {
      return null;
    }

    const posterUrl = material.poster_url || material.video_url;
    if (!posterUrl) {
      return null;
    }

    return (
      <View style={styles.posterSection}>
        <Text style={styles.videoSectionTitle}>Preview Poster</Text>
        
        <TouchableOpacity 
          style={styles.posterImageContainer}
          onPress={() => handleImagePress(posterUrl)}
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: posterUrl }}
            style={styles.posterImage}
            resizeMode="cover"
          />
          <View style={styles.posterOverlay}>
            <Icon name="zoom-in" size={40} color="rgba(255, 255, 255, 0.95)" />
            <Text style={styles.posterOverlayText}>Ketuk untuk perbesar</Text>
          </View>
        </TouchableOpacity>

        {(material.poster_link || material.video_url) && (
          <TouchableOpacity 
            style={styles.posterLinkButton} 
            onPress={handlePosterLinkPress}
          >
            <Icon name="open-in-new" size={24} color="#fff" />
            <Text style={styles.posterLinkButtonText}>Buka Link Poster</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderVideoSection = () => {
    if (!material.video_url || material.type === 'article' || material.type === 'poster') {
      return null;
    }

    // Check if it's a YouTube URL for embedded playback
    if (isYouTubeUrl(material.video_url)) {
      return (
        <View style={styles.videoSection}>
          <Text style={styles.videoSectionTitle}>
            {material.type === 'video_podcast' ? 'Podcast' : 'Video'}
          </Text>
          <YouTubePlayer
            url={material.video_url}
            title={material.title}
            onError={handleVideoError}
            style={styles.youtubePlayer}
          />
        </View>
      );
    }

    // For non-YouTube videos, show the original button
    return (
      <View style={styles.videoSection}>
        <TouchableOpacity style={styles.videoButton} onPress={handleVideoPress}>
          <Icon
            name={material.type === 'video_podcast' ? 'podcast' : 'play-circle-filled'}
            size={48}
            color="#fff"
          />
          <Text style={styles.videoButtonText}>
            {material.type === 'video_podcast' ? 'Dengarkan Podcast' : 'Tonton Video'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: "#8BCDF0" }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.typeSection}>
            <Icon
              name={getTypeIcon(material.type)}
              size={20}
              color="#fff"
            />
            <Text style={styles.typeLabel}>
              {getTypeLabel(material.type)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{material.title}</Text>
          <Text style={styles.description}>{material.description}</Text>
        </View>

        <View style={styles.metaSection}>
          <View style={styles.metaItem}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.metaText}>Oleh: {material.author_name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.metaText}>{formatDate(material.created_at)}</Text>
          </View>
        </View>

        {renderPosterSection()}
        {renderVideoSection()}
        
        {material.type === 'article' && material.content && (
          <View style={styles.contentSection}>
            <Text style={styles.contentTitle}>Konten</Text>
            <HTMLContent content={material.content} style={styles.htmlContent} />
          </View>
        )}
      </ScrollView>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable 
            style={styles.modalBackground}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Icon name="close" size={30} color="#fff" />
              </TouchableOpacity>
              
              {selectedImageUrl && (
                <Image 
                  source={{ uri: selectedImageUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 30,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  metaSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  videoSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  videoSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  youtubePlayer: {
    width: '100%',
    marginTop: 8,
  },
  videoButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  videoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  contentSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 1,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  htmlContent: {
    paddingTop: 8,
  },
  posterSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  posterImageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterOverlayText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  posterLinkButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  posterLinkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 10,
    elevation: 5,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});

export default MaterialDetailScreen;
