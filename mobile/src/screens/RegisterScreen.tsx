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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama tidak boleh kosong');
      return false;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Email tidak valid');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(name, email, password);
      // Wait a bit to ensure auth state is updated before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error: any) {
      Alert.alert('Registrasi Gagal', error.message || 'Terjadi kesalahan saat registrasi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigation.goBack();
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.logoSection}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.title}>STROKECARE APP</Text>
            <Text style={styles.subtitle}>
              Daftar dengan akun anda untuk mengakses aplikasi
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <View style={styles.inputContainer}>
              <Icon name="person" size={20} color="#000" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap Anda"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Icon name="mail" size={20} color="#000" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Masukkan email Anda"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
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
                placeholder="Minimal 6 karakter"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konfirmasi Kata sandi</Text>
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#000" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Ulangi password Anda"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#000"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Daftar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={handleGoToLogin}>
              <Text style={styles.loginLink}>Masuk disini</Text>
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
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#8BCDF0',
    paddingVertical: 40,
    paddingHorizontal: 24,
    position: 'relative',
    minHeight: 280,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    padding: 8,
    zIndex: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
    fontFamily: 'serif',
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
    borderWidth: 1.5,
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
  registerButton: {
    backgroundColor: '#8BCDF0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  registerButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  loginText: {
    fontSize: 14,
    color: '#000',
  },
  loginLink: {
    fontSize: 14,
    color: '#8BCDF0',
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
