/**
 * STROKE CARE - Aplikasi 
 * Mobile application for nutrition consultation and education
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#8BCDF0" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
