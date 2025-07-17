import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { wp, hp, RFValue, spacing, fontSize, borderRadius, iconSize, isSmallDevice, isLargeDevice } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn } = useAuth();
  const { t } = useLanguage();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.trim() && !validateEmail(text.trim())) {
      setEmailError('Geçerli bir e-posta adresi girin');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (text && text.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır');
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async () => {
    // Input validasyonu
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (!password) {
      Alert.alert('Hata', 'Lütfen şifrenizi girin.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signIn(email.trim().toLowerCase(), password);
      
      if (result.success) {
        // AuthContext otomatik olarak Home'a yönlendirecek
      } else {
        // Daha anlaşılır hata mesajları
        let errorMessage = 'Giriş yapılamadı.';
        
        if (result.error) {
          if (result.error.includes('Invalid login credentials')) {
            errorMessage = 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.';
          } else if (result.error.includes('Email not confirmed')) {
            errorMessage = 'E-posta adresinizi doğrulamanız gerekiyor. Lütfen e-posta kutunuzu kontrol edin.';
          } else if (result.error.includes('Too many requests')) {
            errorMessage = 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.';
          } else {
            errorMessage = result.error;
          }
        }
        
        Alert.alert('Giriş Hatası', errorMessage);
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar style="light" />
      
      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <Animated.Text style={[styles.floatingIcon, { top: height * 0.1, left: width * 0.1, opacity: fadeAnim }]}>🌙</Animated.Text>
        <Animated.Text style={[styles.floatingIcon, { top: height * 0.15, right: width * 0.1, opacity: fadeAnim }]}>✨</Animated.Text>
        <Animated.Text style={[styles.floatingIcon, { top: height * 0.25, left: width * 0.8, opacity: fadeAnim }]}>💫</Animated.Text>
        <Animated.Text style={[styles.floatingIcon, { top: height * 0.35, left: width * 0.05, opacity: fadeAnim }]}>🌟</Animated.Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
            style={styles.logoContainer}
          >
            <Text style={styles.logo}>🌙</Text>
          </LinearGradient>
          <Text style={styles.title}>DreamPack</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={20} style={styles.formBlur}>
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused, emailError && styles.inputWrapperError]}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused, passwordError && styles.inputWrapperError]}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                  style={styles.loginButtonGradient}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={[styles.loginButtonText, styles.loginButtonTextDisabled, { marginLeft: 10 }]}>
                        {t('auth.signingIn')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {t('auth.signIn')}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign Up */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>{t('auth.noAccount')} </Text>
                <TouchableOpacity onPress={handleSignUp}>
                  <Text style={styles.signupLink}>{t('auth.signUp')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.6,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? (isLargeDevice() ? hp(12) : hp(10)) : hp(8),
    paddingBottom: hp(5),
  },
  logoContainer: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2.5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: RFValue(50),
  },
  title: {
    fontSize: RFValue(36),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: hp(1),
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: RFValue(18),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(7.5),
    paddingBottom: hp(6),
  },
  formBlur: {
    borderRadius: wp(6),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  form: {
    padding: wp(7.5),
  },
  inputContainer: {
    marginBottom: hp(3),
  },
  label: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperFocused: {
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  inputWrapperError: {
    borderColor: 'rgba(255,100,100,0.8)',
    backgroundColor: 'rgba(255,100,100,0.1)',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: 'white',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  eyeIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  errorText: {
    color: 'rgba(255,100,100,0.9)',
    fontSize: RFValue(12),
    marginTop: hp(0.5),
    marginLeft: wp(2),
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  loginButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  loginButtonTextDisabled: {
    color: 'white',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  signupLink: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});