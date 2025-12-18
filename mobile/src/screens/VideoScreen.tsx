import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Material } from '../types';
import { RootStackParamList } from '../types/navigation';
import ApiService from '../services/ApiService';

interface VideoScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

type VideoRouteProp = RouteProp<RootStackParamList, 'Video'>;

const VideoScreen: React.FC<VideoScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState<Material[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Material[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'full' | 'part'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const route = useRoute<VideoRouteProp>();

  useEffect(() => {
    loadVideos();
  }, []);

  // Reset filter when screen comes into focus with new parameters
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.initialFilter) {
        const filter = route.params.initialFilter;
        if (filter === 'all' || filter === 'full' || filter === 'part') {
          setSelectedFilter(filter);
        }
      }
    }, [route?.params?.initialFilter])
  );

  useEffect(() => {
    filterVideos();
  }, [videos, selectedFilter]);

  const loadVideos = async () => {
    try {
      const data = await ApiService.getMaterials();
      
      // Filter only video materials with published status
      // Filter only video materials with published status and correct type
      const validTypes = ['full', 'part'];
      const publishedVideos = data.filter(
        (m: Material) =>
          m.status === 'published' && validTypes.includes(m.type)
      );
      setVideos(publishedVideos);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal memuat video');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  const filterVideos = () => {
    if (selectedFilter === 'all') {
      setFilteredVideos(videos);
    } else {
      setFilteredVideos(videos.filter(v => v.type === selectedFilter));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return 'play-circle-filled';
      case 'part':
        return 'play-circle-outline';
      default:
        return 'videocam';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'full':
        return 'Full';
      case 'part':
        return 'Part';
      default:
        return 'Video';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return '#8BCDF0';
      case 'part':
        return '#8BCDF0';
      default:
        return '#8BCDF0';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleVideoPress = (video: Material) => {
    navigation.navigate('MaterialDetail', { material: video });
  };

  const renderFilterButton = (filter: 'all' | 'full' | 'part', label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Icon
        name={icon}
        size={18}
        color={selectedFilter === filter ? '#fff' : '#000'}
      />
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderVideoCard = (video: Material) => (
    <TouchableOpacity
      key={video.id}
      style={styles.videoCard}
      onPress={() => handleVideoPress(video)}
    >
      <View style={styles.videoHeader}>
        <View style={styles.typeSection}>
          <Icon
            name={getTypeIcon(video.type)}
            size={24}
            color={getTypeColor(video.type)}
          />
          <Text style={[styles.typeLabel, { color: getTypeColor(video.type) }]}>
            {getTypeLabel(video.type)}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color="#ccc" />
      </View>

      <Text style={styles.videoTitle} numberOfLines={2}>
        {video.title}
      </Text>

      <Text style={styles.videoDescription} numberOfLines={3}>
        {video.description}
      </Text>

      <View style={styles.videoFooter}>
        <View style={styles.authorSection}>
          <Icon name="person" size={16} color="#666" />
          <Text style={styles.authorText}>{video.author_name}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(video.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#8BCDF0" />
        <Text style={styles.loadingText}>Memuat video...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Edukasi</Text>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            {renderFilterButton('all', 'Semua', 'apps')}
            {renderFilterButton('full', 'Full', 'play-circle-filled')}
            {renderFilterButton('part', 'Part', 'play-circle-outline')}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredVideos.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="videocam" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Belum ada video</Text>
            <Text style={styles.emptyStateText}>
              Video edukasi akan ditampilkan di sini
            </Text>
          </View>
        ) : (
          <View style={styles.videosContainer}>
            {filteredVideos.map(renderVideoCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#8BCDF0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8BCDF0',
    backgroundColor: '#fff',
  },
  filterButtonActive: {
    backgroundColor: '#8BCDF0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 6,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  videosContainer: {
    padding: 16,
    gap: 16,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  videoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default VideoScreen;

