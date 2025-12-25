import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  InteractionManager,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Mohon isi semua field');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting login...');
      await login(email, password);
      console.log('Login successful, waiting for state propagation...');
      
      // Wait for React to complete all pending interactions and state updates
      // This ensures MainTabNavigator sees the updated isAuthenticated = true
      await new Promise(resolve => {
        InteractionManager.runAfterInteractions(() => {
          // Additional small delay to ensure context propagation
          setTimeout(resolve, 100);
        });
      });
      
      // Navigate after successful login and state update
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      console.log('Navigation complete');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Gagal', error.message || 'Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigation.goBack();
  };

  const handleGoToRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = async () => {
    const url = 'https://whatsapp.com/channel/0029Vb6VHB44o7qHILUXyr1N';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Tidak dapat membuka link WhatsApp');
      }
    } catch (error) {
      console.error('Error opening WhatsApp channel:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat membuka link');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.title}>STROKECARE APP</Text>
            <Text style={styles.subtitle}>
              Masuk dengan akun anda untuk mengakses aplikasi
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color="#000" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Masukkan email Anda"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kata sandi</Text>
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#000" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Masukkan password Anda"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#000"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Lupa Sandi?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Masuk</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerSection}>
            <Text style={styles.registerText}>belum punya akun?</Text>
            <TouchableOpacity onPress={handleGoToRegister}>
              <Text style={styles.registerLink}>Daftar disini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#A7D9F5',
    paddingVertical: 48,
    paddingHorizontal: 24,
    minHeight: '45%',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#000',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    padding: 24,
    flex: 1,
    backgroundColor: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  passwordToggle: {
    padding: 4,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '400',
  },
  loginButton: {
    backgroundColor: '#A7D9F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#000',
  },
  loginButtonDisabled: {
    backgroundColor: '#cccccc',
    borderColor: '#999',
  },
  loginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  registerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  registerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '400',
    marginLeft: 4,
  },
});

export default LoginScreen;
