import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { wp, hp, RFValue, spacing, fontSize, borderRadius, iconSize, isSmallDevice, isLargeDevice } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [fullNameFocused, setFullNameFocused] = useState(false);
  
  const { signUp } = useAuth();
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

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !fullName) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    
    const result = await signUp(email, password, fullName);
    
    setIsLoading(false);
    
    if (result.success) {
      Alert.alert(
        'Başarılı!', 
        'Hesabınız oluşturuldu. Email adresinizi doğruladıktan sonra giriş yapabilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } else {
      Alert.alert('Kayıt Hatası', result.error || 'Kayıt oluşturulamadı.');
    }
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
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.title}>{t('auth.signUp')}</Text>
            <Text style={styles.subtitle}>{t('auth.joinFamily')}</Text>
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
                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('auth.fullName')}</Text>
                  <View style={[styles.inputWrapper, fullNameFocused && styles.inputWrapperFocused]}>
                    <TextInput
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder={t('auth.fullNamePlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      autoCapitalize="words"
                      onFocus={() => setFullNameFocused(true)}
                      onBlur={() => setFullNameFocused(false)}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('auth.email')}</Text>
                  <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder={t('auth.emailPlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('auth.password')}</Text>
                  <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('auth.passwordRequirement')}
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      secureTextEntry
                      autoCapitalize="none"
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                  <View style={[styles.inputWrapper, confirmPasswordFocused && styles.inputWrapperFocused]}>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      secureTextEntry
                      autoCapitalize="none"
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                    />
                  </View>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity 
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                    style={styles.signUpButtonGradient}
                  >
                    <Text style={[styles.signUpButtonText, isLoading && styles.signUpButtonTextDisabled]}>
                      {isLoading ? t('auth.creatingAccount') : t('auth.signUp')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Back to Login */}
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? (isLargeDevice() ? hp(12) : hp(10)) : hp(8),
    paddingBottom: hp(2.5),
  },
  logoContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
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
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  formBlur: {
    borderRadius: 25,
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
    padding: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
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
  },
  inputWrapperFocused: {
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: 'white',
  },
  signUpButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  signUpButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  signUpButtonTextDisabled: {
    color: 'white',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  loginLink: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});