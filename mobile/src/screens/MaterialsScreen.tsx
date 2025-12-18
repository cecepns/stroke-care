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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Material } from '../types';
import { RootStackParamList } from '../types/navigation';
import ApiService from '../services/ApiService';

interface MaterialsScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

type MaterialsRouteProp = RouteProp<RootStackParamList, 'Materials'>;

const MaterialsScreen: React.FC<MaterialsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'article' | 'poster'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const route = useRoute<MaterialsRouteProp>();

  useEffect(() => {
    loadMaterials();
  }, []);

  // Reset filter when screen comes into focus with new parameters
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.initialFilter) {
        const filter = route.params.initialFilter;
        if (filter === 'article' || filter === 'poster' || filter === 'all') {
          setSelectedFilter(filter);
        }
      }
    }, [route?.params?.initialFilter])
  );

  useEffect(() => {
    filterMaterials();
  }, [materials, selectedFilter]);

  const loadMaterials = async () => {
    try {
      const data = await ApiService.getMaterials();
      const publishedMaterials = data.filter(m => m.status === 'published');
      setMaterials(publishedMaterials);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal memuat materi');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaterials();
    setRefreshing(false);
  };

  const filterMaterials = () => {
    if (selectedFilter === 'all') {
      setFilteredMaterials(materials);
    } else {
      setFilteredMaterials(materials.filter(m => m.type === selectedFilter));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return 'article';
      case 'poster':
        return 'image';
      default:
        return 'description';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article':
        return 'PerPoint';
      case 'poster':
        return 'Poster';
      default:
        return 'Materi';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return '#8BCDF0';
      case 'poster':
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

  const handleMaterialPress = (material: Material) => {
    navigation.navigate('MaterialDetail', { material });
  };

  const renderFilterButton = (filter: 'all' | 'article' | 'poster', label: string, icon: string) => (
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

  const renderMaterialCard = (material: Material) => {
    const isPoster = material.type === 'poster';
    const posterUrl = isPoster ? (material.poster_url || material.video_url) : null;

    return (
      <TouchableOpacity
        key={material.id}
        style={styles.materialCard}
        onPress={() => handleMaterialPress(material)}
      >
        <View style={styles.materialHeader}>
          <View style={styles.typeSection}>
            <Icon
              name={getTypeIcon(material.type)}
              size={24}
              color={getTypeColor(material.type)}
            />
            <Text style={[styles.typeLabel, { color: getTypeColor(material.type) }]}>
              {getTypeLabel(material.type)}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </View>

        <Text style={styles.materialTitle} numberOfLines={2}>
          {material.title}
        </Text>

        {isPoster && posterUrl ? (
          <View style={styles.posterPreviewContainer}>
            <Image 
              source={{ uri: posterUrl }}
              style={styles.posterPreviewImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <Text style={styles.materialDescription} numberOfLines={3}>
            {material.description}
          </Text>
        )}

        <View style={styles.materialFooter}>
          <View style={styles.authorSection}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.authorText}>{material.author_name}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(material.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#8BCDF0" />
        <Text style={styles.loadingText}>Memuat materi...</Text>
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
        <Text style={styles.headerTitle}>Materi Edukasi</Text>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            {renderFilterButton('all', 'Semua', 'apps')}
            {renderFilterButton('article', 'PerPoint', 'article')}
            {renderFilterButton('poster', 'Poster', 'image')}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredMaterials.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="library-books" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Belum ada materi</Text>
            <Text style={styles.emptyStateText}>
              Materi edukasi akan ditampilkan di sini
            </Text>
          </View>
        ) : (
          <View style={styles.materialsContainer}>
            {filteredMaterials.map(renderMaterialCard)}
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
  materialsContainer: {
    padding: 16,
    gap: 16,
  },
  materialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  materialHeader: {
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
  materialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  materialDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  materialFooter: {
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
  posterPreviewContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  posterPreviewImage: {
    width: '100%',
    height: '100%',
  },
});

export default MaterialsScreen;
