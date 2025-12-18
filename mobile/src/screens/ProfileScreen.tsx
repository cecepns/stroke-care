import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, isAuthenticated } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const communityLink = 'https://whatsapp.com/channel/0029Vb6VHB44o7qHILUXyr1N';

  const handleJoinCommunity = () => {
    setIsModalVisible(false);
    Linking.openURL(communityLink).catch(err => {
      Alert.alert('Error', 'Tidak dapat membuka link WhatsApp');
      console.error('Error opening WhatsApp link:', err);
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Gagal keluar dari akun');
            }
          },
        },
      ]
    );
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderNotLoggedIn = () => (
    <View style={styles.notLoggedInContainer}>
      <Icon name="person-outline" size={64} color="#ccc" />
      <Text style={styles.notLoggedInTitle}>
        Masuk untuk Melihat Profil
      </Text>
      <Text style={styles.notLoggedInText}>
        Silakan masuk ke akun Anda untuk mengakses profil dan pengaturan
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
          <Text style={styles.title}>Profil</Text>
        </View>
        {renderNotLoggedIn()}
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Logo and Greeting */}
      <View style={styles.headerNew}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logoPlaceholder}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.appName}>STROKECARE APP</Text>
            <Text style={styles.greeting}>HELLO, {user?.name}</Text>
          </View>
        </View>
      </View>

      {/* User Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Pengguna</Text>
        
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Icon name="person" size={40} color="#333" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userRole}>
                {user?.role === 'user' ? '👤 Pengguna' : '🔹 ' + user?.role}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Konsultasi Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.consultationCard}
          onPress={() => setIsModalVisible(true)}
        >
          <View style={styles.consultationIcon}>
            <Icon name="groups" size={32} color="#2196F3" />
            <Icon name="chat-bubble" size={16} color="#2196F3" style={{ position: 'absolute', top: 8, right: 8 }} />
          </View>
          <View style={styles.consultationInfo}>
            <Text style={styles.consultationTitle}>Konsultasi</Text>
            <Text style={styles.consultationDescription}>
              Gabung untuk masuk ke dalam Channel Komunitas untuk berdiskusi lebih lanjut....
            </Text>
          </View>
          <Icon name="keyboard-arrow-right" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pengaturan</Text>
        
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <View style={styles.logoutIcon}>
            <Icon name="exit-to-app" size={32} color="#f44336" />
          </View>
          <View style={styles.logoutInfo}>
            <Text style={styles.logoutTitle}>keluar</Text>
            <Text style={styles.logoutDescription}>
              keluar dari akun StrokeCare
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Developer Info */}
      <View style={styles.developerInfo}>
        <Text style={styles.developerTitle}>Developer</Text>
        <Text style={styles.developerNames}>Dinita, Jannah, Reftina, Sarah</Text>
        <Text style={styles.developerVersion}>versi 1.0.0</Text>
      </View>

      {/* Community Link Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bergabung Tautan</Text>
            <Text style={styles.modalLink}>{communityLink}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>keluar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonJoin}
                onPress={handleJoinCommunity}
              >
                <Text style={styles.modalButtonJoinText}>Gabung</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 120
  },
  headerNew: {
    backgroundColor: '#87CEEB',
    paddingVertical: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    resizeMode: 'cover',
  },
  headerTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#674788',
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
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#87CEEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#333',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
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
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: '#333',
  },
  consultationIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
    position: 'relative',
  },
  consultationInfo: {
    flex: 1,
    marginRight: 8,
  },
  consultationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  consultationDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  logoutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: '#333',
  },
  logoutIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoutInfo: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 4,
  },
  logoutDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  developerInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  developerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  developerNames: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  developerVersion: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLink: {
    fontSize: 13,
    color: '#2196F3',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalButtonJoin: {
    flex: 1,
    backgroundColor: '#8BCDF0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalButtonJoinText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;

