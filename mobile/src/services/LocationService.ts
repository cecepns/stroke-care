import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Linking } from 'react-native';
import { LocationData } from '../types';
import DatabaseService from './DatabaseService';
import { ErrorHandler } from '../utils/ErrorHandler';

class LocationService {
  async checkLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted;
      } else {
        // For iOS, we'll check through Geolocation
        const auth = await Geolocation.requestAuthorization('whenInUse');
        return auth === 'granted';
      }
    } catch (error) {
      console.error('Check location permission error:', error);
      return false;
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    try {
      // First check if permission is already granted
      const hasPermission = await this.checkLocationPermission();
      if (hasPermission) {
        return true;
      }

      // Request permission if not granted
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Izin Lokasi',
            message: 'Aplikasi memerlukan izin lokasi untuk mencatat posisi Anda.',
            buttonNeutral: 'Tanya Nanti',
            buttonNegative: 'Batal',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await Geolocation.requestAuthorization('whenInUse');
        return granted === 'granted';
      }
    } catch (error) {
      ErrorHandler.handleLocationError(error);
      return false;
    }
  }

  async openAppSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Failed to open app settings:', error);
    }
  }

  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      // First check if we have permission
      this.checkLocationPermission().then(hasPermission => {
        if (!hasPermission) {
          reject(new Error('Location permission not granted'));
          return;
        }

        Geolocation.getCurrentPosition(
          (position) => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: new Date().toISOString(),
              synced: false,
            };
            resolve(locationData);
          },
          (error) => {
            console.error('Geolocation error:', error);
            ErrorHandler.handleLocationError(error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      }).catch(error => {
        console.error('Permission check error:', error);
        reject(error);
      });
    });
  }

  async saveLocationToDatabase(location: LocationData): Promise<number> {
    try {
      const id = await DatabaseService.saveLocation(location);
      return id;
    } catch (error) {
      console.error('Save location to database error:', error);
      throw error;
    }
  }

  async syncToRemoteServer(): Promise<boolean> {
    try {
      const unsyncedLocations = await DatabaseService.getUnsyncedLocations();
      
      if (unsyncedLocations.length === 0) {
        return true; // Nothing to sync
      }

      // Simulate API call to remote server
      // In a real app, you would make actual HTTP requests here
      for (const location of unsyncedLocations) {
        if (location.id) {
          // Simulate successful sync
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Mark as synced in local database
          await DatabaseService.markLocationAsSynced(location.id);
        }
      }

      return true;
    } catch (error) {
      console.error('Sync to remote server error:', error);
      return false;
    }
  }

  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      // In a real app, you would use a geocoding service like Google Maps API
      // For now, we'll return a simple formatted string
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Get address error:', error);
      return 'Unknown location';
    }
  }
}

export default new LocationService();
