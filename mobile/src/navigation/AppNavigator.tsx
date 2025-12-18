import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, TabParamList } from '../types/navigation';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import VideoScreen from '../screens/VideoScreen';
import MaterialDetailScreen from '../screens/MaterialDetailScreen';
import AnonymousChatScreen from '../screens/AnonymousChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StrokeScreeningScreen from '../screens/StrokeScreeningScreen';
import HealthNotesScreen from '../screens/HealthNotesScreen';
import { useAuth } from '../contexts/AuthContext';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const MainTabNavigator = () => {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets(); // ambil safe area  
  const navigation = useNavigation();

  // If not authenticated, don't show tab navigation
  if (!isAuthenticated) {
    return <HomeScreen navigation={navigation} />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Materials') {
            iconName = 'library-books';
          } else if (route.name === 'Video') {
            iconName = 'videocam';
          } else if (route.name === 'HealthNotes') {
            iconName = 'favorite';
          } else if (route.name === 'Chat') {
            iconName = 'chat';
          } else if (route.name === 'History') {
            iconName = 'history';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8BCDF0',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8, // pakai safe area
          paddingTop: 8,
          height: Platform.OS === 'android' ? 70 + insets.bottom : 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          // Remove absolute positioning to prevent overlay issues
          // position: 'absolute',
          // bottom: 0,
          // left: 0,
          // right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Beranda',
        }}
      />
      <Tab.Screen 
        name="Materials" 
        component={MaterialsScreen}
        options={{
          title: 'Materi',
        }}
      />
      <Tab.Screen 
        name="Video" 
        component={VideoScreen}
        options={{
          title: 'Video',
        }}
      />
      <Tab.Screen 
        name="HealthNotes" 
        component={HealthNotesScreen}
        options={{
          title: 'Catatan',
        }}
      />
      {/* <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Konsultasi',
        }}
      /> */}
      {/* <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'Riwayat',
        }}
      /> */}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Materials" component={MaterialsScreen} />
        <Stack.Screen name="Video" component={VideoScreen} />
        <Stack.Screen name="MaterialDetail" component={MaterialDetailScreen} />
        {/* <Stack.Screen name="Chat" component={ChatScreen} /> */}
        <Stack.Screen name="AnonymousChat" component={AnonymousChatScreen} />
        {/* <Stack.Screen name="History" component={HistoryScreen} /> */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="StrokeScreening" component={StrokeScreeningScreen} />
        <Stack.Screen name="HealthNotes" component={HealthNotesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
