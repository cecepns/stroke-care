import { Alert } from 'react-native';

export class ErrorHandler {
  static handleError(error: any, context: string = 'Aplikasi') {
    console.error(`[${context}] Error:`, error);
    
    let message = 'Terjadi kesalahan yang tidak diketahui';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && error.message) {
      message = error.message;
    }
    
    Alert.alert(
      'Error',
      `${context}: ${message}`,
      [{ text: 'OK' }]
    );
  }
  
  static handleLocationError(error: any) {
    let message = 'Gagal mendapatkan lokasi';
    
    if (error.code === 1) {
      message = 'Izin lokasi ditolak. Silakan aktifkan izin lokasi di pengaturan.';
    } else if (error.code === 2) {
      message = 'Lokasi tidak tersedia. Silakan coba lagi.';
    } else if (error.code === 3) {
      message = 'Timeout mendapatkan lokasi. Silakan coba lagi.';
    }
    
    Alert.alert('Error Lokasi', message, [{ text: 'OK' }]);
  }
  
  static handleDatabaseError(error: any) {
    let message = 'Gagal mengakses database';
    
    if (error.message && error.message.includes('database')) {
      message = 'Database tidak dapat diakses. Silakan restart aplikasi.';
    }
    
    Alert.alert('Error Database', message, [{ text: 'OK' }]);
  }
}
