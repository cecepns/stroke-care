import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ChatMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/ApiService';

interface HistoryScreenProps {
  navigation: any;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadChatHistory();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadChatHistory = async () => {
    try {
      const [history, recent] = await Promise.all([
        ApiService.getUserChatHistory(),
        ApiService.getRecentMessages(20),
      ]);
      setChatHistory(history);
      setRecentMessages(recent);
    } catch (error: any) {
      console.error('Load chat history error:', error);
      Alert.alert('Error', error.message || 'Gagal memuat riwayat chat');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatHistory();
    setRefreshing(false);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Baru saja';
    } else if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} hari yang lalu`;
    }
  };

  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isAdmin = item.sender_role === 'admin';
    const isOwnMessage = item.sender_id === user?.id;

    return (
      <View style={styles.messageItem}>
        <View style={styles.messageHeader}>
          <View style={[styles.messageIndicator, isAdmin && styles.adminIndicator]}>
            <Icon 
              name={isAdmin ? 'support-agent' : 'person'} 
              size={16} 
              color="#fff" 
            />
          </View>
          <View style={styles.messageInfo}>
            <Text style={styles.messageTitle}>
              {isAdmin ? '👨‍⚕️ Ahli Gizi' : isOwnMessage ? 'Anda' : item.sender_name}
            </Text>
            <Text style={styles.messageTime}>
              {formatTime(item.created_at || item.timestamp.toString())}
            </Text>
          </View>
        </View>
        
        <Text style={styles.messageContent} numberOfLines={3}>
          {item.content}
        </Text>
        
        <Text style={styles.messageDate}>
          {formatDate(item.created_at || item.timestamp.toString())}
        </Text>
      </View>
    );
  };

  const renderNotLoggedIn = () => (
    <View style={styles.notLoggedInContainer}>
      <Icon name="login" size={64} color="#ccc" />
      <Text style={styles.notLoggedInTitle}>
        Masuk untuk Melihat Riwayat
      </Text>
      <Text style={styles.notLoggedInText}>
        Silakan masuk ke akun Anda untuk melihat riwayat konsultasi
      </Text>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Icon name="login" size={20} color="#fff" />
        <Text style={styles.loginButtonText}>Masuk</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="chat-bubble-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>
        Belum Ada Riwayat Chat
      </Text>
      <Text style={styles.emptyStateText}>
        Mulai konsultasi untuk melihat riwayat chat di sini
      </Text>
      <TouchableOpacity
        style={styles.startChatButton}
        onPress={() => navigation.navigate('Chat')}
      >
        <Icon name="chat" size={20} color="#fff" />
        <Text style={styles.startChatButtonText}>Mulai Konsultasi</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Riwayat Chat</Text>
        </View>
        {renderNotLoggedIn()}
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Memuat riwayat...</Text>
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
        <Text style={styles.title}>Riwayat Chat</Text>
        <Text style={styles.subtitle}>
          {recentMessages.length} pesan
        </Text>
      </View>

      <FlatList
        data={recentMessages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9800']}
            tintColor="#FF9800"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FF9800',
    flexDirection: 'row',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    position: 'absolute',
    bottom: 8,
    right: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  messageItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  adminIndicator: {
    backgroundColor: '#674788',
  },
  messageInfo: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messageContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  messageDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notLoggedInTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  notLoggedInText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#674788',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  startChatButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  startChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default HistoryScreen;
