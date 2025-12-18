import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';

interface HomeScreenProps {
  navigation: any;
}

interface MissionItem {
  title: string;
  description: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const [expandedMission, setExpandedMission] = useState<number | null>(null);

  const missionItems: MissionItem[] = [
    {
      title: 'Menyediakan Informasi yang Akurat',
      description: 'Menyajikan materi edukatif tentang stroke, mulai dari faktor risiko, tanda gejala, hingga cara perawatan diri yang disusun berdasarkan bukti ilmiah dan mudah dipahami pengguna.',
    },
    {
      title: 'Mendorong Sikap Positif dalam Perawatan Diri',
      description: 'Menginspirasi pasien untuk memiliki motivasi dan komitmen dalam menjalankan gaya hidup sehat serta kepatuhan terhadap pengobatan melalui konten edukatif dan fitur motivasi.',
    },
    {
      title: 'Mengoptimalkan Edukasi Digital yang Interaktif',
      description: 'Menyediakan fitur pembelajaran berupa video, kuis, dan simulasi yang membantu pengguna memahami materi secara aktif dan menyenangkan.',
    },
    {
      title: 'Meningkatkan Aksesibilitas Edukasi',
      description: 'Memastikan seluruh pengguna dapat mengakses informasi dan panduan perawatan diri kapan saja dan di mana saja, tanpa batasan waktu maupun tempat.',
    },
    {
      title: 'Membangun Kesadaran dan Komunitas Dukungan',
      description: 'Membentuk wadah komunitas penyintas stroke dan keluarganya untuk saling berbagi pengalaman, memperkuat sikap positif, serta mendukung proses pemulihan bersama.',
    },
  ];

  const toggleMission = (index: number) => {
    setExpandedMission(expandedMission === index ? null : index);
  };

  const handleStartScreening = () => {
    navigation.navigate('StrokeScreening');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  if (isAuthenticated) {
    // If user is authenticated, show the main dashboard
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Section - Light Blue Background */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image source={require('../assets/images/logo.png')} style={styles.headerLogo} />
            <View style={styles.headerTextSection}>
              <Text style={styles.appName}>STROKECARE APP</Text>
              <Text style={styles.greeting}>HELLO, {user?.name || 'User'}</Text>
            </View>
          </View>
        </View>

        {/* Main Content - White Background, Scrollable */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* First Information Block */}
          <View style={styles.infoBlock}>
            <View style={styles.titleBox}>
              <Text style={styles.titleText}>Selamat Datang di SCA</Text>
            </View>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>
                Aplikasi ini hadir untuk membantu anda meningkatkan pengetahuan atau sikap dalam perawatan stroke, melalui edukasi digital yang interaktif dan mudah dipahami, dengan menyediakan informasi, panduan, serta pembelajaran terkait stroke.
              </Text>
            </View>
          </View>

          {/* Second Information Block */}
          <View style={styles.infoBlock}>
            <View style={styles.titleBox}>
              <Text style={styles.titleText}>VISI</Text>
            </View>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>
                Meningkatkan pengetahuan dan sikap terhadap stroke dalam pengelolaan diri secara mandiri melalui edukasi digital yang interaktif, mudah di akses dan berbasis teknologi.
              </Text>
            </View>
          </View>

          {/* MISI Section */}
          <View style={styles.infoBlock}>
            <View style={styles.titleBox}>
              <Text style={styles.titleText}>MISI</Text>
            </View>
            {missionItems.map((mission, index) => (
              <View key={index} style={styles.missionContainer}>
                <TouchableOpacity
                  style={styles.missionCard}
                  onPress={() => toggleMission(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Icon
                    name={expandedMission === index ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={24}
                    color="#000"
                  />
                </TouchableOpacity>
                {expandedMission === index && (
                  <View style={styles.missionDescriptionBox}>
                    <Text style={styles.missionDescriptionText}>
                      {mission.description}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* SKRINING RISIKO STROKE Section */}
          <View style={styles.infoBlock}>
            <TouchableOpacity
              style={styles.screeningTitleBox}
              onPress={handleStartScreening}
              activeOpacity={0.8}
            >
              <Text style={styles.screeningTitleText}>SKRINING RISIKO STROKE</Text>
            </TouchableOpacity>
            
            <View style={styles.descriptionBox}>
              <Text style={styles.screeningInstructionText}>
                LAKUKAN TEST SKRINING DISINI UNTUK MENGETAHUI APAKAH{'\n'}ANDA BERISIKO TERKENA STROKE!
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // If user is not authenticated, show welcome screen
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Section - Light Blue Background (~2/5 of screen) */}
      <View style={styles.welcomeHeader}>
        <View style={styles.logoSection}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Text style={styles.welcomeTitle}>Selamat Datang di</Text>
          <Text style={styles.welcomeTitleHeader}>STROKECARE APP</Text>
        </View>
      </View>

      {/* Bottom Section - White Background (~3/5 of screen) */}
      <View style={styles.authSection}>
        <Text style={styles.instructionText}>
          Masuk atau Daftar dengan akun anda{'\n'}untuk mengakses aplikasi
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Icon name="arrow-forward" size={24} color="#333" />
          <Text style={styles.primaryButtonText}>Masuk</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleRegister}>
          <Icon name="person-add" size={24} color="#333" />
          <Text style={styles.secondaryButtonText}>Daftar Akun</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Authenticated user styles
  header: {
    backgroundColor: '#8BCDF0',
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginRight: 16,
  },
  headerTextSection: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  infoBlock: {
    marginBottom: 24,
  },
  titleBox: {
    backgroundColor: '#8BCDF0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  descriptionBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    padding: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    textAlign: 'justify',
  },
  missionContainer: {
    marginBottom: 8,
  },
  missionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  missionDescriptionBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
    marginTop: -1,
  },
  missionDescriptionText: {
    fontSize: 13,
    color: '#000',
    lineHeight: 20,
    textAlign: 'justify',
  },
  // Screening styles
  screeningTitleBox: {
    backgroundColor: '#8BCDF0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  screeningTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  screeningInstructionText: {
    fontSize: 13,
    color: '#000',
    lineHeight: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  // Welcome screen styles
  welcomeHeader: {
    flex: 0.4, // ~2/5 of screen
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#8BCDF0',
  },
  logoSection: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  welcomeTitleHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'serif',
    marginTop: 4,
  },
  authSection: {
    flex: 0.6, // ~3/5 of screen
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'serif',
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#8BCDF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  primaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#757575',
    fontSize: 14,
  },
  anonymousButton: {
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  anonymousButtonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  anonymousNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default HomeScreen;
