import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import DreamInterpretationScreen from './screens/DreamInterpretationScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import SubscriptionPlansScreen from './screens/SubscriptionPlansScreen';
import { ActivityIndicator, View } from 'react-native';
import notificationService from './services/notificationService';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      // Kullanıcı giriş yaptığında bildirim servisini başlat
      notificationService.registerForPushNotificationsAsync();
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="DreamInterpretation" component={DreamInterpretationScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </LanguageProvider>
  );
}
