import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ChatMessage, User } from '../types';
import SocketService from '../services/SocketService';

interface AnonymousChatScreenProps {
  navigation: any;
}

const AnonymousChatScreen: React.FC<AnonymousChatScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [anonymousUser, setAnonymousUser] = useState<User | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Check if we're in a tab navigator (though AnonymousChat is typically accessed from stack)
  const isInTabNavigator = route.name === 'AnonymousChat' && navigation.getParent()?.getState()?.type === 'tab';
  
  // Tab bar height calculation
  const tabBarHeight = Platform.OS === 'android' ? 70 + insets.bottom : 60;

  useEffect(() => {
    // Create anonymous user
    const anonUser: User = {
      id: Date.now(), // Use timestamp as unique ID
      name: `Anonim ${Math.floor(Math.random() * 1000)}`,
      email: '',
      role: 'anonymous',
    };
    setAnonymousUser(anonUser);

    // Connect to socket
    SocketService.connect();

    // Set up event listeners using the same function references for cleanup
    const handleConnectionWrapper = () => {
      setIsConnected(true);
      SocketService.joinAnonymousChat(anonUser);
    };

    const handleDisconnectionWrapper = () => {
      setIsConnected(false);
    };

    const handleMessageWrapper = (message: ChatMessage) => {
      setMessages(prev => {
        // Prevent duplicate messages by checking if message already exists
        const messageExists = prev.some(existingMsg => 
          existingMsg.id === message.id || 
          (existingMsg.content === message.content && 
           existingMsg.sender?.id === message.sender?.id &&
           Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000)
        );
        
        if (messageExists) {
          return prev;
        }
        
        return [...prev, message];
      });
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    SocketService.onConnection(handleConnectionWrapper);
    SocketService.onDisconnection(handleDisconnectionWrapper);
    SocketService.onMessage(handleMessageWrapper);

    return () => {
      SocketService.removeMessageListener(handleMessageWrapper);
      SocketService.removeConnectionListener(handleConnectionWrapper);
      SocketService.removeDisconnectionListener(handleDisconnectionWrapper);
      SocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [])

  const sendMessage = () => {
    if (!newMessage.trim() || !anonymousUser) return;

    SocketService.sendAnonymousMessage(newMessage.trim(), anonymousUser);
    setNewMessage('');
  };

  const handleGoToLogin = () => {
    Alert.alert(
      'Daftar Akun',
      'Untuk mendapatkan fitur lengkap dan riwayat chat, silakan buat akun terlebih dahulu.',
      [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Daftar', onPress: () => navigation.navigate('Register') },
      ]
    );
  };

  const formatTime = (timestamp: Date | string | undefined | null) => {
    try {
      // Handle null/undefined timestamps
      if (!timestamp) {
        return '--:--';
      }
      
      // Handle both Date objects and string timestamps
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return '--:--';
      }
      
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '--:--';
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.sender.id === anonymousUser?.id;
    const isAdmin = message.sender.role === 'admin';
    
    // Determine the actual timestamp to use
    // API messages have 'created_at', Socket messages have 'timestamp'
    const actualTimestamp = message.timestamp || message.created_at;

    return (
      <View
        key={`${message.id}-${index}`}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            isAdmin && !isOwnMessage && styles.adminBubble,
          ]}
        >
          {!isOwnMessage && (
            <Text style={styles.senderName}>
              {isAdmin ? '👨‍⚕️ ' : ''}{message.sender.name}
              {isAdmin && ' (Ahli Gizi)'}
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(actualTimestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chat Anonim</Text>
          <Text style={styles.headerSubtitle}>
            {isConnected ? '🟢 Terhubung' : '🔴 Menghubungkan...'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.accountButton}
          onPress={handleGoToLogin}
        >
          <Icon name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.warningBanner}>
        <Icon name="info-outline" size={20} color="#FF9800" />
        <Text style={styles.warningText}>
          Chat anonim tidak akan tersimpan. Buat akun untuk menyimpan riwayat chat.
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="chat-bubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Chat Anonim</Text>
            <Text style={styles.emptyStateText}>
              Kirim pesan untuk memulai konsultasi anonim dengan ahli gizi.
              Chat ini tidak akan tersimpan.
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollView>

      <View style={[
        styles.inputContainer, 
        { 
          paddingBottom: Platform.OS === 'android' 
            ? (keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 20))
            : insets.bottom,
          marginBottom: isInTabNavigator ? tabBarHeight : 0
        }
      ]}>
        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Ketik pesan Anda..."
            multiline
            maxLength={500}
            editable={isConnected}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || !isConnected) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
          >
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  accountButton: {
    padding: 8,
    marginLeft: 8,
  },
  warningBanner: {
    backgroundColor: '#FFF3E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  warningText: {
    fontSize: 12,
    color: '#F57C00',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
    paddingHorizontal: 32,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ownBubble: {
    backgroundColor: '#757575',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 3,
    borderLeftColor: '#674788',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#674788',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: '#fff',
    opacity: 0.7,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#666',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    backgroundColor: '#757575',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: 5
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default AnonymousChatScreen;
