import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Linking,
  Switch,
  Share,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dreamService } from '../services/dreamService';
import { supabase } from '../config/supabase';
import { wp, hp, RFValue, spacing, fontSize, borderRadius, iconSize, isSmallDevice, isLargeDevice } from '../utils/responsive';


const { width, height } = Dimensions.get('window');

export default function DreamInterpretationScreen({ navigation }) {
  const [dreamText, setDreamText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFamousPerson, setSelectedFamousPerson] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [recentDreams, setRecentDreams] = useState([]);
  const [dreamStats, setDreamStats] = useState({ total: 0, thisWeek: 0, categories: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [dreamFocused, setDreamFocused] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, dreams, stats, profile
  const [famousPeople, setFamousPeople] = useState([]);
  const [showFamousPersonModal, setShowFamousPersonModal] = useState(false);
  const [selectedDream, setSelectedDream] = useState(null);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    displayName: '',
    bio: '',
    birthDate: '',
    location: '',
    favoriteSymbol: ''
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [dataRequestModalVisible, setDataRequestModalVisible] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [dataRequestForm, setDataRequestForm] = useState({
    requestType: '',
    reason: '',
    specificData: '',
    urgency: 'normal',
    additionalInfo: ''
  });
  const [backupHistoryModalVisible, setBackupHistoryModalVisible] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  
  const { user, signOut } = useAuth();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  
  // Dinamik styles
  const styles = useMemo(() => getStyles(darkModeEnabled), [darkModeEnabled]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const categories = useMemo(() => [
    { id: 'nightmare', name: t('categoryTypes.nightmare'), icon: '😰', color: '#FF6B6B' },
    { id: 'flying', name: t('categoryTypes.flying'), icon: '🕊️', color: '#4ECDC4' },
    { id: 'water', name: t('categoryTypes.water'), icon: '🌊', color: '#45B7D1' },
    { id: 'animals', name: t('categoryTypes.animals'), icon: '🦋', color: '#96CEB4' },
    { id: 'people', name: t('categoryTypes.people'), icon: '👥', color: '#FFEAA7' },
    { id: 'adventure', name: t('categoryTypes.adventure'), icon: '🗺️', color: '#DDA0DD' },
    { id: 'love', name: t('categoryTypes.love'), icon: '💕', color: '#FFB6C1' },
    { id: 'work', name: t('categoryTypes.work'), icon: '💼', color: '#A8E6CF' },
  ], [t]);

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

    loadUserData();
    loadFamousPeople();
  }, []);

  const loadFamousPeople = () => {
    const people = dreamService.getFamousPeople();
    setFamousPeople(people);
  };

  const loadUserData = async () => {
    try {
      const dreamsResult = await dreamService.getUserDreams(20);
      if (dreamsResult.success) {
        setRecentDreams(dreamsResult.data);
        calculateStats(dreamsResult.data);
      }
      
      // Karanlık mod ayarını yükle
      const darkModeSetting = await AsyncStorage.getItem('darkModeEnabled');
      if (darkModeSetting !== null) {
        setDarkModeEnabled(JSON.parse(darkModeSetting));
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  const calculateStats = (dreams) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisWeekDreams = dreams.filter(dream => 
      new Date(dream.created_at) > weekAgo
    );
    
    const categoryStats = dreams.reduce((acc, dream) => {
      if (dream.category) {
        acc[dream.category] = (acc[dream.category] || 0) + 1;
      }
      return acc;
    }, {});
    
    setDreamStats({
      total: dreams.length,
      thisWeek: thisWeekDreams.length,
      categories: categoryStats
    });
  };

  const handleDeleteDream = async (dreamId) => {
    Alert.alert(
      'Rüyayı Sil',
      'Bu rüyayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await dreamService.deleteDream(dreamId);
              if (result.success) {
                setSelectedDream(null);
                loadUserData(); // Listeyi yenile
                Alert.alert('Başarılı', 'Rüya başarıyla silindi.');
              } else {
                Alert.alert('Hata', result.error || 'Rüya silinirken bir hata oluştu.');
              }
            } catch (error) {
              Alert.alert('Hata', 'Rüya silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleInterpretDream = async () => {
    if (!dreamText.trim()) {
      Alert.alert('Hata', 'Lütfen rüyanızı yazın.');
      return;
    }

    setIsLoading(true);
    
    try {
      const saveResult = await dreamService.saveDream({
        content: dreamText,
        category: selectedCategory || null,
        title: dreamText.substring(0, 50) + '...',
        interpreted_by: selectedFamousPerson || null
      });

      if (saveResult.success) {
        let interpretResult;
        
        // Ünlü kişi seçildiyse onun perspektifinden yorumla
        if (selectedFamousPerson) {
          interpretResult = await dreamService.interpretDreamByFamousPerson(
            dreamText, 
            selectedFamousPerson, 
            selectedCategory
          );
        } else {
          // Normal yorumlama
          interpretResult = await dreamService.interpretDream(dreamText, selectedCategory);
        }
        
        if (interpretResult.success) {
          setInterpretation(interpretResult.data.interpretation);
          
          // Interpretation'ı veritabanına kaydet
          await dreamService.updateDream(saveResult.data.id, {
            interpretation: interpretResult.data.interpretation
          });
          
          setDreamText('');
          setSelectedCategory('');
          setSelectedFamousPerson('');
          loadUserData();
        }
      } else {
        Alert.alert('Hata', 'Rüya kaydedilemedi.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), onPress: signOut, style: 'destructive' },
      ]
    );
  };

  const handleEditProfile = () => {
    // Mevcut kullanıcı bilgilerini form'a yükle
    setEditProfileData({
      displayName: user?.user_metadata?.display_name || user?.email?.split('@')[0] || '',
      bio: user?.user_metadata?.bio || '',
      birthDate: user?.user_metadata?.birth_date || '',
      location: user?.user_metadata?.location || '',
      favoriteSymbol: user?.user_metadata?.favorite_symbol || ''
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      // Burada profil güncelleme API'si çağrılacak
      // Şimdilik sadece alert gösteriyoruz
      Alert.alert(
        t('success') || 'Başarılı',
        t('profileUpdated') || 'Profil başarıyla güncellendi.'
      );
      setShowEditProfileModal(false);
    } catch (error) {
      Alert.alert(
        t('error') || 'Hata',
        t('profileUpdateError') || 'Profil güncellenirken bir hata oluştu.'
      );
    }
  };

  const handleChangePassword = () => {
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
    setShowChangePasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert(
        t('error') || 'Hata',
        t('fillAllFields') || 'Lütfen tüm alanları doldurun.'
      );
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert(
        t('error') || 'Hata',
        t('passwordsDoNotMatch') || 'Şifreler eşleşmiyor.'
      );
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert(
        t('error') || 'Hata',
        t('passwordTooShort') || 'Şifre en az 6 karakter olmalıdır.'
      );
      return;
    }

    try {
      // Burada şifre güncelleme API'si çağrılacak
      // Şimdilik sadece alert gösteriyoruz
      Alert.alert(
        t('success') || 'Başarılı',
        t('passwordChanged') || 'Şifreniz başarıyla değiştirildi.'
      );
      setShowChangePasswordModal(false);
    } catch (error) {
      Alert.alert(
        t('error') || 'Hata',
        t('passwordError') || 'Şifre değiştirilirken bir hata oluştu.'
      );
    }
  };

  // Notification Settings Handlers
  const handlePushNotifications = () => {
    Alert.alert(
      t('pushNotifications') || 'Anlık Bildirimler',
      t('pushNotificationsDesc') || 'Anlık bildirim ayarlarınızı yönetin.',
      [
        { text: t('cancel') || 'İptal', style: 'cancel' },
        { 
          text: t('settings') || 'Ayarlar', 
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        }
      ]
    );
  };

  const handleEmailNotifications = (value) => {
    const action = value ? 'açmak' : 'kapatmak';
    const actionEn = value ? 'enable' : 'disable';
    
    Alert.alert(
      t('emailNotifications') || 'E-posta Bildirimleri',
      value 
        ? (t('emailNotificationsEnable') || 'E-posta bildirimlerini açmak istiyor musunuz?')
        : (t('emailNotificationsDisable') || 'E-posta bildirimlerini kapatmak istiyor musunuz?'),
      [
        { 
          text: t('cancel') || 'İptal', 
          style: 'cancel',
          onPress: () => {
            // Switch'i eski haline döndür
            setEmailNotificationsEnabled(!value);
          }
        },
        { 
          text: t('confirm') || 'Onayla', 
          onPress: () => {
            setEmailNotificationsEnabled(value);
            Alert.alert(
              t('success') || 'Başarılı',
              value 
                ? (t('emailNotificationsEnabled') || 'E-posta bildirimleri açıldı.')
                : (t('emailNotificationsDisabled') || 'E-posta bildirimleri kapatıldı.')
            );
          }
        }
      ]
    );
  };



  // Privacy & Data Handlers
  const handleDataRequest = () => {
    setDataRequestModalVisible(true);
  };

  const handleDataRequestSubmit = async () => {
    try {
      if (!dataRequestForm.requestType || !dataRequestForm.reason) {
        Alert.alert(
          t('error') || 'Hata',
          t('fillRequiredFields') || 'Lütfen gerekli alanları doldurun.'
        );
        return;
      }

      // E-posta içeriği hazırla
      const emailSubject = `DreamPack Veri Talebi - ${user?.email}`;
      const emailBody = `
Veri Talebi Detayları:

Kullanıcı: ${user?.email}
Talep Tarihi: ${new Date().toLocaleDateString('tr-TR')}
Talep Türü: ${dataRequestForm.requestType}
Gerekçe: ${dataRequestForm.reason}
İstenen Spesifik Veriler: ${dataRequestForm.specificData || 'Belirtilmemiş'}
Aciliyet: ${dataRequestForm.urgency}
Ek Bilgiler: ${dataRequestForm.additionalInfo || 'Yok'}

Bu talep DreamPack uygulaması üzerinden gönderilmiştir.`;

      // E-posta gönderme (mailto kullanarak)
      const mailtoUrl = `mailto:support@dreampack.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        
        // Kullanıcıya onay mesajı
        Alert.alert(
          t('requestSent') || 'Talep Gönderildi',
          t('dataRequestSentMessage') || 'Veri talebiniz başarıyla gönderildi. E-posta adresinize onay mesajı gönderilecektir. Talebiniz 3-5 iş günü içinde değerlendirilecektir.',
          [{ text: t('ok') || 'Tamam' }]
        );
        
        // Formu temizle ve modal'ı kapat
        setDataRequestForm({
          requestType: '',
          reason: '',
          specificData: '',
          urgency: 'normal',
          additionalInfo: ''
        });
        setDataRequestModalVisible(false);
      } else {
        Alert.alert(
          t('error') || 'Hata',
          t('emailAppNotFound') || 'E-posta uygulaması bulunamadı. Lütfen manuel olarak support@dreampack.com adresine başvurun.'
        );
      }
    } catch (error) {
      console.error('Data request error:', error);
      Alert.alert(
        t('error') || 'Hata',
        t('requestError') || 'Talep gönderilirken bir hata oluştu.'
      );
    }
  };

  const handleBackup = async () => {
    try {
      Alert.alert(
        t('backup') || 'Yedekleme',
        t('backupDesc') || 'Verilerinizi buluta yedekleyin.',
        [
          { text: t('cancel') || 'İptal', style: 'cancel' },
          { 
            text: t('backup') || 'Yedekle', 
            onPress: async () => {
              try {
                // Yedekleme verilerini hazırla
                const backupData = {
                  user_id: user?.id,
                  user_email: user?.email,
                  dreams: recentDreams,
                  stats: dreamStats,
                  settings: {
                    emailNotifications: emailNotificationsEnabled,
                    language: currentLanguage
                  },
                  backup_date: new Date().toISOString(),
                  app_version: '1.0.0',
                  backup_size: 0
                };

                // Backup boyutunu hesapla
                backupData.backup_size = JSON.stringify(backupData).length;

                // Supabase'e yedekle
                const { data, error } = await supabase
                  .from('user_backups')
                  .insert([backupData]);

                if (error) {
                  throw error;
                }

                // Eski yedeklemeleri temizle (son 10 yedeklemeyi tut)
                const { data: oldBackups } = await supabase
                  .from('user_backups')
                  .select('id')
                  .eq('user_id', user?.id)
                  .order('backup_date', { ascending: false })
                  .range(10, 1000);

                if (oldBackups && oldBackups.length > 0) {
                  const oldBackupIds = oldBackups.map(backup => backup.id);
                  await supabase
                    .from('user_backups')
                    .delete()
                    .in('id', oldBackupIds);
                }

                Alert.alert(
                  t('success') || 'Başarılı',
                  t('backupSuccess') || 'Verileriniz başarıyla buluta yedeklendi.'
                );
              } catch (error) {
                console.error('Backup error:', error);
                Alert.alert(
                  t('error') || 'Hata',
                  t('backupError') || 'Yedekleme sırasında bir hata oluştu.'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Backup error:', error);
    }
  };

  const handleViewBackups = () => {
    setBackupHistoryModalVisible(true);
    loadBackupHistory();
  };

  const loadBackupHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('user_backups')
        .select('id, backup_date, backup_size, app_version')
        .eq('user_id', user?.id)
        .order('backup_date', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      setBackupHistory(data || []);
    } catch (error) {
      console.error('Load backup history error:', error);
      Alert.alert(
        t('error') || 'Hata',
        t('loadBackupError') || 'Yedekleme geçmişi yüklenirken hata oluştu.'
      );
    }
  };

  const handleRestoreBackup = async (backupId) => {
    try {
      Alert.alert(
        t('restoreBackup') || 'Yedeklemeyi Geri Yükle',
        t('restoreBackupConfirm') || 'Bu yedeklemeyi geri yüklemek istediğinizden emin misiniz? Mevcut verileriniz değiştirilecektir.',
        [
          { text: t('cancel') || 'İptal', style: 'cancel' },
          {
            text: t('restore') || 'Geri Yükle',
            style: 'destructive',
            onPress: async () => {
              try {
                const { data, error } = await supabase
                  .from('user_backups')
                  .select('*')
                  .eq('id', backupId)
                  .single();

                if (error) {
                  throw error;
                }

                // Burada geri yükleme işlemi yapılacak
                // Şimdilik sadece bilgi mesajı gösterelim
                Alert.alert(
                  t('success') || 'Başarılı',
                  t('restoreSuccess') || 'Yedekleme başarıyla geri yüklendi.'
                );
                setBackupHistoryModalVisible(false);
              } catch (error) {
                console.error('Restore backup error:', error);
                Alert.alert(
                  t('error') || 'Hata',
                  t('restoreError') || 'Yedekleme geri yüklenirken hata oluştu.'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Restore backup error:', error);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    try {
      Alert.alert(
        t('deleteBackup') || 'Yedeklemeyi Sil',
        t('deleteBackupConfirm') || 'Bu yedeklemeyi silmek istediğinizden emin misiniz?',
        [
          { text: t('cancel') || 'İptal', style: 'cancel' },
          {
            text: t('delete') || 'Sil',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('user_backups')
                  .delete()
                  .eq('id', backupId);

                if (error) {
                  throw error;
                }

                Alert.alert(
                  t('success') || 'Başarılı',
                  t('deleteBackupSuccess') || 'Yedekleme başarıyla silindi.'
                );
                loadBackupHistory();
              } catch (error) {
                console.error('Delete backup error:', error);
                Alert.alert(
                  t('error') || 'Hata',
                  t('deleteBackupError') || 'Yedekleme silinirken hata oluştu.'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete backup error:', error);
    }
  };

  // App Settings Handlers
  const handleDarkMode = async (value) => {
    try {
      setDarkModeEnabled(value);
      await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(value));
      
      // Burada tema değişikliği uygulanabilir
      console.log('Dark mode:', value ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Dark mode toggle error:', error);
      Alert.alert(
        t('error') || 'Hata',
        t('settingsError') || 'Ayar kaydedilirken hata oluştu.'
      );
    }
  };

  // Help & Support Handlers
  const handleContactUs = () => {
    const email = 'info@iconyazilim.com';
    const subject = 'DreamPack Destek Talebi';
    const body = 'Merhaba,\n\nDreamPack uygulaması hakkında yardıma ihtiyacım var.\n\n';
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mailtoUrl);
        } else {
          Alert.alert(
            'Hata',
            'Mail uygulaması bulunamadı. Lütfen info@iconyazilim.com adresine manuel olarak mail gönderin.',
            [{ text: 'Tamam' }]
          );
        }
      })
      .catch((err) => {
        Alert.alert(
          'Hata',
          'Mail uygulaması açılamadı. Lütfen info@iconyazilim.com adresine manuel olarak mail gönderin.',
          [{ text: 'Tamam' }]
        );
      });
  };

  const handleFAQ = () => {
    setShowFAQModal(true);
  };

  const handleShareApp = () => {
    const shareOptions = {
      message: 'DreamPack - Rüyalarınızı yorumlayın ve anlamlarını keşfedin! 🌙✨',
      url: Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/id6738049462'
        : 'https://play.google.com/store/apps/details?id=com.iconyazilim.dreampack',
      title: 'DreamPack Uygulaması'
    };

    Share.share(shareOptions)
      .then((result) => {
        if (result.action === Share.sharedAction) {
          console.log('App shared successfully');
        }
      })
      .catch((error) => {
        Alert.alert(
          'Hata',
          'Paylaşım sırasında bir hata oluştu.',
          [{ text: 'Tamam' }]
        );
      });
  };

  const handleRateApp = () => {
    const appStoreUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/id6738049462' // iOS App Store URL
      : 'https://play.google.com/store/apps/details?id=com.iconyazilim.dreampack'; // Android Play Store URL
    
    Linking.canOpenURL(appStoreUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(appStoreUrl);
        } else {
          Alert.alert(
            'Hata',
            'Uygulama mağazası açılamadı.',
            [{ text: 'Tamam' }]
          );
        }
      })
      .catch((err) => {
        Alert.alert(
          'Hata',
          'Uygulama mağazası açılamadı.',
          [{ text: 'Tamam' }]
        );
      });
   };

   const handleTermsOfService = () => {
     const termsUrl = 'https://www.iconyazilim.com/dreampack/terms-of-service';
     
     Linking.canOpenURL(termsUrl)
       .then((supported) => {
         if (supported) {
           return Linking.openURL(termsUrl);
         } else {
           Alert.alert(
             'Hata',
             'Web sayfası açılamadı.',
             [{ text: 'Tamam' }]
           );
         }
       })
       .catch((err) => {
         Alert.alert(
           'Hata',
           'Web sayfası açılamadı.',
           [{ text: 'Tamam' }]
         );
       });
   };

   const handlePrivacyPolicy = () => {
     const privacyUrl = 'https://www.iconyazilim.com/dreampack/privacy-policy';
     
     Linking.canOpenURL(privacyUrl)
       .then((supported) => {
         if (supported) {
           return Linking.openURL(privacyUrl);
         } else {
           Alert.alert(
             'Hata',
             'Web sayfası açılamadı.',
             [{ text: 'Tamam' }]
           );
         }
       })
       .catch((err) => {
         Alert.alert(
           'Hata',
           'Web sayfası açılamadı.',
           [{ text: 'Tamam' }]
         );
       });
   };

   const renderHomeTab = () => (
    <ScrollView 
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Quick Stats */}
      <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={styles.statsBlur}>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{dreamStats.total}</Text>
              <Text style={styles.statLabel}>{t('totalDreams')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{dreamStats.thisWeek}</Text>
              <Text style={styles.statLabel}>{t('thisWeek')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Object.keys(dreamStats.categories).length}</Text>
              <Text style={styles.statLabel}>{t('categoriesLabel')}</Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {/* Dream Input Section */}
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <BlurView intensity={20} style={styles.sectionBlur}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}><Ionicons name="moon" size={18} color="white" /> {t('addNewDream')}</Text>
            
            <View style={styles.inputContainer}>
              <View style={[styles.dreamInputWrapper, dreamFocused && styles.inputWrapperFocused]}>
                <TextInput
                  style={styles.dreamInput}
                  value={dreamText}
                  onChangeText={setDreamText}
                  placeholder={t('dreamPlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onFocus={() => setDreamFocused(true)}
                  onBlur={() => setDreamFocused(false)}
                />
              </View>
            </View>

            <Text style={styles.categoryTitle}>{t('selectCategory')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && { backgroundColor: category.color + '40', borderColor: category.color }
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && { color: 'white', fontWeight: '600' }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.categoryTitle}>🎭 {t('selectInterpreter')} ({t('optional')})</Text>
            <TouchableOpacity 
              style={styles.selectInterpreterButton}
              onPress={() => setShowFamousPersonModal(true)}
            >
              <Text style={styles.selectInterpreterIcon}>👨‍🔬</Text>
              <View style={styles.selectInterpreterContent}>
                <Text style={styles.selectInterpreterText}>
                  {selectedFamousPerson 
                    ? famousPeople.find(p => p.id === selectedFamousPerson)?.name 
                    : t('selectInterpreterButton')
                  }
                </Text>
                <Text style={styles.selectInterpreterSubtext}>
                  {selectedFamousPerson 
                    ? famousPeople.find(p => p.id === selectedFamousPerson)?.specialty 
                    : t('selectInterpreterSubtext')
                  }
                </Text>
              </View>
              <Text style={styles.selectInterpreterArrow}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.interpretButton}
              onPress={handleInterpretDream}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                style={styles.interpretButtonGradient}
              >
                <Text style={[styles.interpretButtonText, isLoading && styles.interpretButtonTextDisabled]}>
                  {isLoading ? t('interpreting') : `🔮 ${t('interpretMyDream')}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {/* Interpretation Result */}
      {interpretation ? (
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <BlurView intensity={20} style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>✨ Rüya Yorumu</Text>
              <Text style={styles.interpretationText}>{interpretation}</Text>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={() => setInterpretation('')}
              >
                <Text style={styles.saveButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      ) : null}
    </ScrollView>
  );

  const renderDreamsTab = () => (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={styles.sectionBlur}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>📚 {t('myDreamHistory')}</Text>
            {recentDreams.length > 0 ? (
              recentDreams.map((dream, index) => {
                const category = categories.find(c => c.id === dream.category);
                return (
                  <TouchableOpacity key={dream.id} style={styles.dreamItem} onPress={() => setSelectedDream(dream)}>
                    <View style={styles.dreamHeader}>
                      <View style={styles.dreamInfo}>
                        {category && (
                          <View style={[styles.categoryBadge, { backgroundColor: category.color + '40' }]}>
                            <Text style={styles.categoryBadgeIcon}>{category.icon}</Text>
                            <Text style={styles.categoryBadgeText}>{category.name}</Text>
                          </View>
                        )}
                        <Text style={styles.dreamDate}>
                          {new Date(dream.created_at).toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.dreamContent} numberOfLines={3}>
                      {dream.content}
                    </Text>
                    {dream.interpretation && (
                      <Text style={styles.dreamInterpretation} numberOfLines={2}>
                        💭 {dream.interpretation}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}><Ionicons name="moon" size={48} color="rgba(255,255,255,0.6)" /></View>
                <Text style={styles.emptyStateText}>{t('noDreamsYet')}</Text>
                <Text style={styles.emptyStateSubtext}>{t('addFirstDream')}</Text>
              </View>
            )}
          </View>
        </BlurView>
      </Animated.View>
    </ScrollView>
  );

  const renderStatsTab = () => (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={styles.sectionBlur}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>📊 {t('statistics')}</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardNumber}>{dreamStats.total}</Text>
                <Text style={styles.statCardLabel}>{t('totalDreams')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardNumber}>{dreamStats.thisWeek}</Text>
                <Text style={styles.statCardLabel}>{t('thisWeek')}</Text>
              </View>
            </View>

            <Text style={styles.categoryStatsTitle}>{t('categoryDistribution')}</Text>
            {Object.entries(dreamStats.categories).map(([categoryId, count]) => {
              const category = categories.find(c => c.id === categoryId);
              if (!category) return null;
              
              const percentage = (count / dreamStats.total * 100).toFixed(1);
              
              return (
                <View key={categoryId} style={styles.categoryStatItem}>
                  <View style={styles.categoryStatHeader}>
                    <View style={styles.categoryStatInfo}>
                      <Text style={styles.categoryStatIcon}>{category.icon}</Text>
                      <Text style={styles.categoryStatName}>{category.name}</Text>
                    </View>
                    <Text style={styles.categoryStatCount}>{count} (%{percentage})</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${percentage}%`, backgroundColor: category.color }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </BlurView>
      </Animated.View>
    </ScrollView>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={styles.sectionBlur}>
          <View style={styles.sectionContent}>
            {/* Enhanced Profile Header */}
            <View style={styles.enhancedProfileHeader}>
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                style={styles.profileHeaderGradient}
              >
                <View style={styles.profileHeaderContent}>
                  <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2', '#f093fb']}
                        style={styles.enhancedAvatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.enhancedAvatarText}>
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </LinearGradient>
                      <View style={styles.statusIndicator} />
                    </View>
                  </View>
                  
                  <View style={styles.profileInfoSection}>
                    <Text style={styles.enhancedProfileName} numberOfLines={1}>
                      {user?.user_metadata?.full_name || t('user')}
                    </Text>
                    <View style={styles.levelBadge}>
                      <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        style={styles.levelBadgeGradient}
                      >
                        <Ionicons name="star" size={wp(3)} color="white" />
                        <Text style={styles.levelBadgeText}>
                          {dreamStats.total < 5 ? 'Yeni' : dreamStats.total < 20 ? 'Deneyimli' : 'Usta'}
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.joinInfo}>
                      <Ionicons name="calendar-outline" size={wp(3)} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.joinInfoText}>
                        {new Date(user?.created_at).toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US')}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.enhancedEditButton} onPress={handleEditProfile}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                      style={styles.editButtonGradient}
                    >
                      <Ionicons name="create-outline" size={wp(4)} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            {/* Enhanced Stats Grid */}
            <View style={styles.enhancedStatsContainer}>
              <View style={styles.enhancedStatsGrid}>
                <View style={styles.enhancedStatCard}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.enhancedStatGradient}
                  >
                    <View style={styles.enhancedStatIcon}>
                      <Ionicons name="moon" size={wp(5)} color="white" />
                    </View>
                    <View style={styles.enhancedStatContent}>
                      <Text style={styles.enhancedStatNumber}>{dreamStats.total}</Text>
                      <Text style={styles.enhancedStatLabel}>Toplam{"\n"}Rüya</Text>
                    </View>
                  </LinearGradient>
                </View>
                
                <View style={styles.enhancedStatCard}>
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    style={styles.enhancedStatGradient}
                  >
                    <View style={styles.enhancedStatIcon}>
                      <Ionicons name="grid" size={wp(5)} color="white" />
                    </View>
                    <View style={styles.enhancedStatContent}>
                      <Text style={styles.enhancedStatNumber}>{Object.keys(dreamStats.categories).length}</Text>
                      <Text style={styles.enhancedStatLabel}>Kategori</Text>
                    </View>
                  </LinearGradient>
                </View>
                
                <View style={styles.enhancedStatCard}>
                  <LinearGradient
                    colors={['#4facfe', '#00f2fe']}
                    style={styles.enhancedStatGradient}
                  >
                    <View style={styles.enhancedStatIcon}>
                      <Ionicons name="trending-up" size={wp(5)} color="white" />
                    </View>
                    <View style={styles.enhancedStatContent}>
                      <Text style={styles.enhancedStatNumber}>{dreamStats.thisWeek}</Text>
                      <Text style={styles.enhancedStatLabel}>Bu Hafta</Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            </View>

            {/* Language Selection Card */}
            <View style={styles.modernMenuCard}>
              <TouchableOpacity 
                style={styles.modernLanguageButton} 
                onPress={() => setShowLanguageOptions(!showLanguageOptions)}
              >
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="language" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('language')}</Text>
                </View>
                <Ionicons 
                  name={showLanguageOptions ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="rgba(255,255,255,0.7)" 
                />
              </TouchableOpacity>

              {showLanguageOptions && (
                <View style={styles.modernLanguageOptions}>
                  {[
                    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
                    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
                    { code: 'ja', name: '日本語', flag: '🇯🇵' },
                    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
                    { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' }
                  ].map((language) => (
                    <TouchableOpacity
                      key={language.code}
                      style={[
                        styles.modernLanguageOption,
                        currentLanguage === language.code && styles.modernLanguageOptionActive
                      ]}
                      onPress={async () => {
                         await changeLanguage(language.code);
                         setShowLanguageOptions(false);
                       }}
                    >
                      <Text style={styles.modernLanguageFlag}>{language.flag}</Text>
                      <Text style={[
                        styles.modernLanguageOptionText,
                        currentLanguage === language.code && styles.modernLanguageOptionTextActive
                      ]}>{language.name}</Text>
                      {currentLanguage === language.code && (
                        <Ionicons name="checkmark" size={16} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Account Settings Card */}
            <View style={styles.modernMenuCard}>
              <View style={styles.modernSectionHeader}>
                <Ionicons name="settings-outline" size={18} color="white" />
                <Text style={styles.modernSectionTitle}>{t('accountSettings')}</Text>
              </View>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleEditProfile}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="person-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('editProfile')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleChangePassword}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="lock-closed-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('changePassword')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            {/* Notification Settings Card */}
            <View style={styles.modernMenuCard}>
              <View style={styles.modernSectionHeader}>
                <Ionicons name="notifications-outline" size={18} color="white" />
                <Text style={styles.modernSectionTitle}>{t('notificationSettings')}</Text>
              </View>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handlePushNotifications}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="phone-portrait-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('pushNotifications')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <View style={styles.modernMenuItem}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="mail-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('emailNotifications')}</Text>
                </View>
                <Switch
                  value={emailNotificationsEnabled}
                  onValueChange={handleEmailNotifications}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(76, 175, 80, 0.5)' }}
                  thumbColor={emailNotificationsEnabled ? '#4CAF50' : 'rgba(255,255,255,0.8)'}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
              </View>
            </View>

            {/* Privacy & Data Card */}
            <View style={styles.modernMenuCard}>
              <View style={styles.modernSectionHeader}>
                <Ionicons name="shield-checkmark-outline" size={18} color="white" />
                <Text style={styles.modernSectionTitle}>{t('privacySettings')}</Text>
              </View>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleDataRequest}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="document-text-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('dataRequest')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleBackup}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="cloud-upload-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('backup')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleViewBackups}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="time-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('backupHistory')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            {/* App Settings Card */}
            <View style={styles.modernMenuCard}>
              <View style={styles.modernSectionHeader}>
                <Ionicons name="color-palette-outline" size={18} color="white" />
                <Text style={styles.modernSectionTitle}>{t('theme')}</Text>
              </View>
              
              <View style={styles.modernMenuItem}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="moon-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('darkMode')}</Text>
                </View>
                <Switch
                  value={darkModeEnabled}
                  onValueChange={handleDarkMode}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(76, 175, 80, 0.5)' }}
                  thumbColor={darkModeEnabled ? '#4CAF50' : 'rgba(255,255,255,0.8)'}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
              </View>
            </View>

            {/* Help & Support Card */}
            <View style={styles.modernMenuCard}>
              <View style={styles.modernSectionHeader}>
                <Ionicons name="help-circle-outline" size={18} color="white" />
                <Text style={styles.modernSectionTitle}>{t('helpSupport')}</Text>
              </View>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleContactUs}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="call-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('contactUs')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleFAQ}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('faq')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleRateApp}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="star-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('rateApp')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleShareApp}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="share-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('shareApp')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            {/* App Info Card */}
            <View style={styles.modernMenuCard}>
              <View style={styles.modernSectionHeader}>
                <Ionicons name="information-circle-outline" size={18} color="white" />
                <Text style={styles.modernSectionTitle}>{t('appInfo')}</Text>
              </View>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handleTermsOfService}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="document-text-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('termsOfService')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernMenuItem} onPress={handlePrivacyPolicy}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('privacyPolicy')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <View style={styles.modernMenuItem}>
                <View style={styles.modernMenuItemLeft}>
                  <View style={styles.modernMenuIcon}>
                    <Ionicons name="phone-portrait-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.modernMenuText}>{t('version')}</Text>
                </View>
                <Text style={styles.modernVersionText}>1.0.0</Text>
              </View>
            </View>

            {/* Modern Logout Button */}
            <TouchableOpacity style={styles.modernLogoutButton} onPress={handleLogout}>
              <LinearGradient
                colors={['#ff4757', '#ff3838']}
                style={styles.modernLogoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="log-out-outline" size={20} color="white" />
                <Text style={styles.modernLogoutText}>{t('logout')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={darkModeEnabled ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2', '#f093fb']}
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
        <Animated.Text style={[styles.floatingIcon, { top: height * 0.45, right: width * 0.15, opacity: fadeAnim }]}>🔮</Animated.Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>DreamPack</Text>
              <Text style={styles.userName}>
                {t('hello')}, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || t('user')}!
              </Text>
            </View>
            <TouchableOpacity onPress={() => setActiveTab('profile')} style={styles.profileButton}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.profileButtonGradient}
              >
                <Text style={styles.profileButtonText}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tab Content */}
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'dreams' && renderDreamsTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'profile' && renderProfileTab()}

        {/* Modern Floating Tab Bar */}
        <Animated.View style={[styles.floatingTabBar, { opacity: fadeAnim }]}>
          <BlurView intensity={40} style={styles.tabBarBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.tabBarGradient}
            >
              <View style={styles.tabBarContainer}>
                <TouchableOpacity 
                  style={[styles.modernTabItem, activeTab === 'home' && styles.modernTabItemActive]}
                  onPress={() => setActiveTab('home')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconContainer, activeTab === 'home' && styles.tabIconContainerActive]}>
                    <Ionicons 
                      name={activeTab === 'home' ? 'home' : 'home-outline'} 
                      size={wp(6)} 
                      color={activeTab === 'home' ? '#667eea' : 'rgba(255,255,255,0.7)'} 
                    />
                  </View>
                  {activeTab === 'home' && (
                    <Text style={styles.modernTabLabel}>{t('home')}</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modernTabItem, activeTab === 'dreams' && styles.modernTabItemActive]}
                  onPress={() => setActiveTab('dreams')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconContainer, activeTab === 'dreams' && styles.tabIconContainerActive]}>
                    <Ionicons 
                      name={activeTab === 'dreams' ? 'library' : 'library-outline'} 
                      size={wp(6)} 
                      color={activeTab === 'dreams' ? '#f093fb' : 'rgba(255,255,255,0.7)'} 
                    />
                  </View>
                  {activeTab === 'dreams' && (
                    <Text style={styles.modernTabLabel}>{t('myDreams')}</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modernTabItem, activeTab === 'stats' && styles.modernTabItemActive]}
                  onPress={() => setActiveTab('stats')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconContainer, activeTab === 'stats' && styles.tabIconContainerActive]}>
                    <Ionicons 
                      name={activeTab === 'stats' ? 'stats-chart' : 'stats-chart-outline'} 
                      size={wp(6)} 
                      color={activeTab === 'stats' ? '#4facfe' : 'rgba(255,255,255,0.7)'} 
                    />
                  </View>
                  {activeTab === 'stats' && (
                    <Text style={styles.modernTabLabel}>{t('statistics')}</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modernTabItem, activeTab === 'profile' && styles.modernTabItemActive]}
                  onPress={() => setActiveTab('profile')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconContainer, activeTab === 'profile' && styles.tabIconContainerActive]}>
                    <Ionicons 
                      name={activeTab === 'profile' ? 'person' : 'person-outline'} 
                      size={wp(6)} 
                      color={activeTab === 'profile' ? '#FFD700' : 'rgba(255,255,255,0.7)'} 
                    />
                  </View>
                  {activeTab === 'profile' && (
                    <Text style={styles.modernTabLabel}>{t('profile')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Famous Person Selection Modal */}
      <Modal
        visible={showFamousPersonModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFamousPersonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <BlurView intensity={30} style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>🎭 {t('selectInterpreter')}</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setShowFamousPersonModal(false)}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                  {famousPeople.map((person) => (
                    <TouchableOpacity
                      key={person.id}
                      style={[
                        styles.modalPersonItem,
                        selectedFamousPerson === person.id && styles.modalPersonItemSelected
                      ]}
                      onPress={() => {
                        setSelectedFamousPerson(selectedFamousPerson === person.id ? '' : person.id);
                        setShowFamousPersonModal(false);
                      }}
                    >
                      <View style={[styles.modalPersonIcon, { backgroundColor: person.color }]}>
                        <Text style={styles.modalPersonEmoji}>{person.icon}</Text>
                      </View>
                      <View style={styles.modalPersonInfo}>
                        <Text style={styles.modalPersonName}>{person.name}</Text>
                        <Text style={styles.modalPersonDescription}>{person.description}</Text>
                        <Text style={styles.modalPersonSpecialty}>{person.specialty}</Text>
                      </View>
                      {selectedFamousPerson === person.id && (
                        <Text style={styles.modalPersonSelected}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity
                    style={[
                      styles.modalPersonItem,
                      !selectedFamousPerson && styles.modalPersonItemSelected
                    ]}
                    onPress={() => {
                      setSelectedFamousPerson('');
                      setShowFamousPersonModal(false);
                    }}
                  >
                    <View style={[styles.modalPersonIcon, { backgroundColor: '#666' }]}>
                      <Text style={styles.modalPersonEmoji}>🤖</Text>
                    </View>
                    <View style={styles.modalPersonInfo}>
                      <Text style={styles.modalPersonName}>Genel AI Yorumlayıcı</Text>
                      <Text style={styles.modalPersonDescription}>Standart rüya yorumlama</Text>
                      <Text style={styles.modalPersonSpecialty}>Genel rüya analizi</Text>
                    </View>
                    {!selectedFamousPerson && (
                      <Text style={styles.modalPersonSelected}>✓</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* Dream Detail View */}
      {selectedDream && (
        <View style={styles.dreamDetailFullScreen}>
          <View style={styles.dreamDetailHeader}>
            <TouchableOpacity 
              style={styles.dreamDetailBackButton}
              onPress={() => setSelectedDream(null)}
            >
              <Text style={styles.dreamDetailBackText}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.dreamDetailTitle}><Ionicons name="moon" size={18} color="white" /> Rüya Detayı</Text>
            <TouchableOpacity 
              style={styles.dreamDetailDeleteButton}
              onPress={() => handleDeleteDream(selectedDream.id)}
            >
              <View style={styles.dreamDetailDeleteText}><Ionicons name="trash" size={18} color="#ff4444" /></View>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.dreamDetailScrollView} showsVerticalScrollIndicator={false}>
            {/* Dream Date and Category */}
            <View style={styles.dreamDetailMeta}>
              <Text style={styles.dreamDetailDate}>
                <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.7)" /> {new Date(selectedDream.created_at).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              {(() => {
                const category = categories.find(c => c.id === selectedDream.category);
                return category ? (
                  <View style={[styles.dreamDetailCategoryBadge, { backgroundColor: category.color + '40' }]}>
                    <Text style={styles.dreamDetailCategoryIcon}>{category.icon}</Text>
                    <Text style={styles.dreamDetailCategoryText}>{category.name}</Text>
                  </View>
                ) : null;
              })()}
            </View>

            {/* Dream Content */}
            <View style={styles.dreamDetailSection}>
              <Text style={styles.dreamDetailSectionTitle}>📝 Rüya İçeriği</Text>
              <Text style={styles.dreamDetailText}>{selectedDream.content}</Text>
            </View>

            {/* Interpretation */}
            <View style={styles.dreamDetailSection}>
              <Text style={styles.dreamDetailSectionTitle}>💭 Yorumlama</Text>
              <Text style={styles.dreamDetailText}>
                {selectedDream.interpretation || 'Bu rüya henüz yorumlanmamış.'}
              </Text>
            </View>

            {/* Famous Person Info */}
            <View style={styles.dreamDetailSection}>
              <Text style={styles.dreamDetailSectionTitle}>🎭 Yorumlayan</Text>
              <View style={styles.dreamDetailInterpreter}>
                {(() => {
                  if (selectedDream.interpreted_by) {
                    const interpreter = famousPeople.find(p => p.id === selectedDream.interpreted_by);
                    return interpreter ? (
                      <>
                        <View style={[styles.dreamDetailInterpreterIcon, { backgroundColor: interpreter.color }]}>
                          <Text style={styles.dreamDetailInterpreterEmoji}>{interpreter.icon}</Text>
                        </View>
                        <View style={styles.dreamDetailInterpreterInfo}>
                          <Text style={styles.dreamDetailInterpreterName}>{interpreter.name}</Text>
                          <Text style={styles.dreamDetailInterpreterDesc}>{interpreter.description}</Text>
                          <Text style={styles.dreamDetailInterpreterSpecialty}>{interpreter.specialty}</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={[styles.dreamDetailInterpreterIcon, { backgroundColor: '#666' }]}>
                          <Text style={styles.dreamDetailInterpreterEmoji}>🤖</Text>
                        </View>
                        <View style={styles.dreamDetailInterpreterInfo}>
                          <Text style={styles.dreamDetailInterpreterName}>Genel AI Yorumlayıcı</Text>
                          <Text style={styles.dreamDetailInterpreterDesc}>Standart rüya yorumlama</Text>
                        </View>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <View style={[styles.dreamDetailInterpreterIcon, { backgroundColor: '#999' }]}>
                          <View style={styles.dreamDetailInterpreterEmoji}><Ionicons name="help-circle" size={24} color="white" /></View>
                        </View>
                        <View style={styles.dreamDetailInterpreterInfo}>
                          <Text style={styles.dreamDetailInterpreterName}>Henüz yorumlanmadı</Text>
                          <Text style={styles.dreamDetailInterpreterDesc}>Bu rüya henüz yorumlanmamış</Text>
                        </View>
                      </>
                    );
                  }
                })()} 
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Profil Düzenleme Modal */}
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <LinearGradient
          colors={darkModeEnabled ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2', '#f093fb']}
          style={styles.container}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEditProfileModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('editProfile')}</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.modalSaveText}>{t('save') || 'Kaydet'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.profileFormSection}>
              <Text style={styles.profileFormLabel}>👤 {t('displayName') || 'Görünen Ad'}</Text>
              <TextInput
                style={styles.profileFormInput}
                value={editProfileData.displayName}
                onChangeText={(text) => setEditProfileData({...editProfileData, displayName: text})}
                placeholder={t('enterDisplayName') || 'Görünen adınızı girin'}
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.profileFormSection}>
              <Text style={styles.profileFormLabel}>📝 {t('bio') || 'Hakkımda'}</Text>
              <TextInput
                style={[styles.profileFormInput, styles.profileFormTextArea]}
                value={editProfileData.bio}
                onChangeText={(text) => setEditProfileData({...editProfileData, bio: text})}
                placeholder={t('enterBio') || 'Kendiniz hakkında birkaç kelime yazın'}
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.profileFormSection}>
              <Text style={styles.profileFormLabel}>🎂 {t('birthDate') || 'Doğum Tarihi'}</Text>
              <TextInput
                style={styles.profileFormInput}
                value={editProfileData.birthDate}
                onChangeText={(text) => setEditProfileData({...editProfileData, birthDate: text})}
                placeholder={t('enterBirthDate') || 'GG/AA/YYYY'}
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.profileFormSection}>
              <Text style={styles.profileFormLabel}>📍 {t('location') || 'Konum'}</Text>
              <TextInput
                style={styles.profileFormInput}
                value={editProfileData.location}
                onChangeText={(text) => setEditProfileData({...editProfileData, location: text})}
                placeholder={t('enterLocation') || 'Şehir, Ülke'}
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.profileFormSection}>
              <Text style={styles.profileFormLabel}>🌟 {t('favoriteSymbol') || 'Favori Rüya Sembolü'}</Text>
              <TextInput
                style={styles.profileFormInput}
                value={editProfileData.favoriteSymbol}
                onChangeText={(text) => setEditProfileData({...editProfileData, favoriteSymbol: text})}
                placeholder={t('enterFavoriteSymbol') || 'Örn: Uçmak, Su, Hayvanlar'}
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.profileFormSection}>
              <Text style={styles.profileFormNote}>
                💡 {t('profileNote') || 'Bu bilgiler rüya yorumlarınızı kişiselleştirmek için kullanılacaktır.'}
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Şifre Değiştirme Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <LinearGradient
          colors={darkModeEnabled ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2', '#f093fb']}
          style={styles.container}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowChangePasswordModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('changePassword')}</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSavePassword}
            >
              <Text style={styles.modalSaveText}>{t('save') || 'Kaydet'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.passwordFormContainer}>
              <Text style={styles.passwordFormTitle}><Ionicons name="lock-closed" size={18} color="white" /> {t('changePasswordTitle') || 'Yeni Şifrenizi Belirleyin'}</Text>
              <Text style={styles.passwordFormSubtitle}>
                {t('changePasswordSubtitle') || 'Güvenliğiniz için güçlü bir şifre seçin.'}
              </Text>

              <View style={styles.profileFormSection}>
                <Text style={styles.profileFormLabel}><Ionicons name="key" size={14} color="white" /> {t('newPassword') || 'Yeni Şifre'}</Text>
                <TextInput
                  style={styles.profileFormInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                  placeholder={t('enterNewPassword') || 'Yeni şifrenizi girin'}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.profileFormSection}>
                <Text style={styles.profileFormLabel}>🔑 {t('confirmPassword') || 'Şifre Tekrarı'}</Text>
                <TextInput
                  style={styles.profileFormInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                  placeholder={t('confirmNewPassword') || 'Şifrenizi tekrar girin'}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.passwordRequirements}>
                <Text style={styles.passwordRequirementsTitle}><Ionicons name="list" size={14} color="white" /> {t('passwordRequirements') || 'Şifre Gereksinimleri:'}</Text>
                <Text style={styles.passwordRequirementItem}>• {t('minLength') || 'En az 6 karakter'}</Text>
                <Text style={styles.passwordRequirementItem}>• {t('matchPasswords') || 'Şifreler eşleşmeli'}</Text>
                <Text style={styles.passwordRequirementItem}>• {t('strongPassword') || 'Güçlü şifre önerilir'}</Text>
              </View>

              <View style={styles.profileFormSection}>
                <Text style={styles.profileFormNote}>
                  <Ionicons name="shield-checkmark" size={14} color="white" /> {t('passwordNote') || 'Şifreniz güvenli bir şekilde şifrelenerek saklanacaktır.'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Data Request Modal */}
      <Modal
        visible={dataRequestModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setDataRequestModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('dataRequest') || 'Veri Talebi'}</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleDataRequestSubmit}
            >
              <Text style={styles.modalSaveText}>{t('send') || 'Gönder'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.passwordFormContainer}>
              <Text style={styles.passwordFormTitle}><Ionicons name="mail" size={18} color="white" /> {t('dataRequestTitle') || 'Veri Talep Formu'}</Text>
              <Text style={styles.passwordFormSubtitle}>
                {t('dataRequestSubtitle') || 'Verilerinizi talep etmek için aşağıdaki formu doldurun.'}
              </Text>

              <View style={styles.profileFormSection}>
                <Text style={styles.profileFormLabel}><Ionicons name="list" size={14} color="white" /> {t('requestType') || 'Talep Türü'} *</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={styles.profileFormInput}
                    onPress={() => {
                      Alert.alert(
                        t('selectRequestType') || 'Talep Türü Seçin',
                        '',
                        [
                          { text: t('cancel') || 'İptal', style: 'cancel' },
                          { text: t('allData') || 'Tüm Verilerim', onPress: () => setDataRequestForm({...dataRequestForm, requestType: 'Tüm Verilerim'}) },
                          { text: t('dreamData') || 'Sadece Rüya Verileri', onPress: () => setDataRequestForm({...dataRequestForm, requestType: 'Sadece Rüya Verileri'}) },
                          { text: t('profileData') || 'Profil Bilgileri', onPress: () => setDataRequestForm({...dataRequestForm, requestType: 'Profil Bilgileri'}) },
                          { text: t('statisticsData') || 'İstatistik Verileri', onPress: () => setDataRequestForm({...dataRequestForm, requestType: 'İstatistik Verileri'}) }
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.profileFormInputText, !dataRequestForm.requestType && styles.placeholderText]}>
                      {dataRequestForm.requestType || (t('selectRequestType') || 'Talep türünü seçin')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.profileFormSection}>
                <Text style={styles.profileFormLabel}><Ionicons name="help-circle" size={14} color="white" /> {t('reason') || 'Gerekçe'} *</Text>
                <TextInput
                  style={[styles.profileFormInput, styles.textArea]}
                  value={dataRequestForm.reason}
                  onChangeText={(text) => setDataRequestForm({...dataRequestForm, reason: text})}
                  placeholder={t('reasonPlaceholder') || 'Verilerinizi neden talep ettiğinizi açıklayın...'}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.profileFormSection}>
                <Text style={styles.profileFormLabel}>🎯 {t('specificData') || 'Spesifik Veriler'}</Text>
                <TextInput
                  style={[styles.profileFormInput, styles.textArea]}
                  value={dataRequestForm.specificData}
                  onChangeText={(text) => setDataRequestForm({...dataRequestForm, specificData: text})}
                  placeholder={t('specificDataPlaceholder') || 'Hangi spesifik verileri istediğinizi belirtin (opsiyonel)...'}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.profileFormSection}>
                <Text style={styles.profileFormLabel}>⚡ {t('urgency') || 'Aciliyet'}</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={styles.profileFormInput}
                    onPress={() => {
                      Alert.alert(
                        t('selectUrgency') || 'Aciliyet Seçin',
                        '',
                        [
                          { text: t('cancel') || 'İptal', style: 'cancel' },
                          { text: t('low') || 'Düşük', onPress: () => setDataRequestForm({...dataRequestForm, urgency: 'Düşük'}) },
                          { text: t('normal') || 'Normal', onPress: () => setDataRequestForm({...dataRequestForm, urgency: 'Normal'}) },
                          { text: t('high') || 'Yüksek', onPress: () => setDataRequestForm({...dataRequestForm, urgency: 'Yüksek'}) },
                          { text: t('urgent') || 'Acil', onPress: () => setDataRequestForm({...dataRequestForm, urgency: 'Acil'}) }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.profileFormInputText}>
                      {dataRequestForm.urgency || (t('selectUrgency') || 'Aciliyet seçin')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.profileFormSection}>
                <Text style={styles.profileFormLabel}>💬 {t('additionalInfo') || 'Ek Bilgiler'}</Text>
                <TextInput
                  style={[styles.profileFormInput, styles.textArea]}
                  value={dataRequestForm.additionalInfo}
                  onChangeText={(text) => setDataRequestForm({...dataRequestForm, additionalInfo: text})}
                  placeholder={t('additionalInfoPlaceholder') || 'Eklemek istediğiniz başka bilgiler varsa yazın...'}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.profileFormSection}>
                <Text style={styles.profileFormNote}>
                  📋 {t('dataRequestNote') || 'Talebiniz 3-5 iş günü içinde değerlendirilecek ve e-posta adresinize bilgi verilecektir.'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Backup History Modal */}
      <Modal
        visible={backupHistoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setBackupHistoryModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('backupHistory') || 'Yedekleme Geçmişi'}</Text>
            <View style={styles.modalSaveButton} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.passwordFormContainer}>
              <Text style={styles.passwordFormTitle}>📋 {t('backupHistory') || 'Yedekleme Geçmişi'}</Text>
              <Text style={styles.passwordFormSubtitle}>
                {t('backupHistorySubtitle') || 'Geçmiş yedeklemelerinizi görüntüleyin ve yönetin.'}
              </Text>

              {backupHistory.length === 0 ? (
                <View style={styles.emptyBackupContainer}>
                  <Text style={styles.emptyBackupIcon}>📦</Text>
                  <Text style={styles.emptyBackupText}>
                    {t('noBackupsFound') || 'Henüz yedekleme bulunamadı.'}
                  </Text>
                  <Text style={styles.emptyBackupSubtext}>
                    {t('createFirstBackup') || 'İlk yedeklemenizi oluşturmak için yedekleme butonunu kullanın.'}
                  </Text>
                </View>
              ) : (
                backupHistory.map((backup, index) => (
                  <View key={backup.id} style={styles.backupItem}>
                    <View style={styles.backupItemHeader}>
                      <Text style={styles.backupItemTitle}>
                        💾 {t('backup') || 'Yedekleme'} #{backupHistory.length - index}
                      </Text>
                      <Text style={styles.backupItemDate}>
                        {new Date(backup.backup_date).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    
                    <View style={styles.backupItemDetails}>
                      <Text style={styles.backupItemDetail}>
                        📊 {t('size') || 'Boyut'}: {(backup.backup_size / 1024).toFixed(1)} KB
                      </Text>
                      <Text style={styles.backupItemDetail}>
                        📱 {t('version') || 'Sürüm'}: {backup.app_version}
                      </Text>
                    </View>
                    
                    <View style={styles.backupItemActions}>
                      <TouchableOpacity
                        style={[styles.backupActionButton, styles.restoreButton]}
                        onPress={() => handleRestoreBackup(backup.id)}
                      >
                        <Text style={styles.backupActionText}>🔄 {t('restore') || 'Geri Yükle'}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.backupActionButton, styles.deleteButton]}
                        onPress={() => handleDeleteBackup(backup.id)}
                      >
                        <Text style={styles.backupActionText}>🗑️ {t('delete') || 'Sil'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFAQModal}
        onRequestClose={() => setShowFAQModal(false)}
      >
        <LinearGradient
          colors={darkModeEnabled ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2', '#f093fb']}
          style={styles.container}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>❓ {t('faq') || 'Sık Sorulan Sorular'}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFAQModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.faqContainer}>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>🤔 Rüya yorumu nasıl çalışır?</Text>
                <Text style={styles.faqAnswer}>DreamPack, yapay zeka teknolojisi kullanarak rüyalarınızı analiz eder ve psikolojik semboller temelinde yorumlar sunar.</Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>💾 Rüyalarım güvende mi?</Text>
                <Text style={styles.faqAnswer}>Evet, tüm verileriniz şifrelenmiş olarak saklanır ve sadece sizin erişiminize açıktır.</Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>🌟 Ünlü kişi yorumları gerçek mi?</Text>
                <Text style={styles.faqAnswer}>Ünlü kişi yorumları, o kişilerin bilinen görüşleri ve yaklaşımları temelinde AI tarafından oluşturulan yorumlardır.</Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>📱 Uygulama ücretsiz mi?</Text>
                <Text style={styles.faqAnswer}>DreamPack temel özellikleri ücretsiz olarak sunar. Premium özellikler için abonelik seçenekleri mevcuttur.</Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>🔄 Yedekleme nasıl çalışır?</Text>
                <Text style={styles.faqAnswer}>Rüyalarınızı ve yorumlarınızı güvenli bir şekilde yedekleyebilir, istediğiniz zaman geri yükleyebilirsiniz.</Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>🌍 Hangi dilleri destekliyor?</Text>
                <Text style={styles.faqAnswer}>DreamPack Türkçe, İngilizce, Japonca, Tayca, Malayca ve Endonezce dillerini destekler.</Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

    </LinearGradient>
  );
}

const getStyles = (darkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkMode ? '#1a1a2e' : 'transparent',
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 20,
    opacity: 0.4,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? (isLargeDevice() ? hp(8) : hp(7)) : hp(5),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2.5),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: RFValue(16),
    color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: RFValue(24),
    color: darkMode ? 'white' : 'white',
    fontWeight: 'bold',
    textShadowColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileButton: {
    borderRadius: wp(6.5),
    overflow: 'hidden',
  },
  profileButtonGradient: {
    width: wp(13),
    height: wp(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  statsContent: {
    flexDirection: 'row',
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionBlur: {
    borderRadius: 20,
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
  sectionContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  dreamInputWrapper: {
    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
    minHeight: 100,
  },
  inputWrapperFocused: {
    borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)',
    backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
  },
  dreamInput: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: darkMode ? '#ffffff' : 'white',
    textAlignVertical: 'top',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkMode ? '#ffffff' : 'white',
    marginBottom: 10,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  categoryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  interpretButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  interpretButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  interpretButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  interpretButtonTextDisabled: {
    color: 'white',
  },
  interpretationText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
    textAlign: 'justify',
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dreamItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dreamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  categoryBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  dreamDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  dreamContent: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginBottom: 8,
  },
  dreamInterpretation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statCardNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statCardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  categoryStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  categoryStatItem: {
    marginBottom: 15,
  },
  categoryStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryStatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryStatIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryStatName: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  categoryStatCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 3,
  },
  profileJoinDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  profileStats: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  profileStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  languageButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 15,
  },
  languageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  languageArrow: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  languageOptions: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageOptionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    flex: 1,
  },
  languageOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  languageCheck: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  bottomNavBlur: {
    paddingTop: 10,
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.7,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  navLabelActive: {
    color: 'white',
    fontWeight: '600',
  },
  famousPersonButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 140,
    alignItems: 'center',
  },
  famousPersonButtonSelected: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderColor: '#8A2BE2',
    borderWidth: 2,
  },
  famousPersonName: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  famousPersonSpecialty: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  selectInterpreterButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectInterpreterIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectInterpreterContent: {
    flex: 1,
  },
  selectInterpreterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectInterpreterSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  selectInterpreterArrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBlur: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalScrollView: {
    flex: 1,
  },
  modalPersonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalPersonItemSelected: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderColor: '#8A2BE2',
    borderWidth: 2,
  },
  modalPersonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalPersonEmoji: {
    fontSize: 24,
  },
  modalPersonInfo: {
    flex: 1,
  },
  modalPersonName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalPersonDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 2,
  },
  modalPersonSpecialty: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontStyle: 'italic',
  },
  modalPersonSelected: {
     color: '#8A2BE2',
     fontSize: 20,
     fontWeight: 'bold',
     marginLeft: 10,
   },
   dreamDetailFullScreen: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: '#1a1a2e',
     zIndex: 1000,
   },
   dreamDetailBackButton: {
     padding: 10,
     borderRadius: 20,
     backgroundColor: 'rgba(255,255,255,0.1)',
   },
   dreamDetailBackText: {
     color: 'white',
     fontSize: 16,
     fontWeight: '600',
   },
   dreamDetailHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 20,
     paddingTop: 50,
     borderBottomWidth: 1,
     borderBottomColor: 'rgba(255,255,255,0.2)',
   },
   dreamDetailTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: 'white',
   },
   dreamDetailHeaderButtons: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 10,
   },
   dreamDetailDeleteButton: {
     width: 30,
     height: 30,
     borderRadius: 15,
     backgroundColor: 'rgba(255,0,0,0.3)',
     justifyContent: 'center',
     alignItems: 'center',
   },
   dreamDetailDeleteText: {
     fontSize: 16,
   },
   dreamDetailCloseButton: {
     width: 30,
     height: 30,
     borderRadius: 15,
     backgroundColor: 'rgba(255,255,255,0.2)',
     justifyContent: 'center',
     alignItems: 'center',
   },
   dreamDetailCloseText: {
     color: 'white',
     fontSize: 16,
     fontWeight: 'bold',
   },
   dreamDetailScrollView: {
     flex: 1,
     padding: 20,
   },
   dreamDetailMeta: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 20,
     flexWrap: 'wrap',
   },
   dreamDetailDate: {
     color: 'rgba(255,255,255,0.8)',
     fontSize: 14,
     marginBottom: 5,
   },
   dreamDetailCategoryBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 15,
     marginLeft: 10,
   },
   dreamDetailCategoryIcon: {
     fontSize: 16,
     marginRight: 6,
   },
   dreamDetailCategoryText: {
     color: 'white',
     fontSize: 12,
     fontWeight: '600',
   },
   dreamDetailSection: {
     marginBottom: 25,
   },
   dreamDetailSectionTitle: {
     color: 'white',
     fontSize: 16,
     fontWeight: '600',
     marginBottom: 10,
   },
   dreamDetailText: {
     color: 'rgba(255,255,255,0.9)',
     fontSize: 14,
     lineHeight: 20,
     backgroundColor: 'rgba(255,255,255,0.1)',
     padding: 15,
     borderRadius: 12,
   },
   dreamDetailInterpreter: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255,255,255,0.1)',
     padding: 15,
     borderRadius: 12,
   },
   dreamDetailInterpreterIcon: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 12,
   },
   dreamDetailInterpreterEmoji: {
     fontSize: 20,
   },
   dreamDetailInterpreterInfo: {
     flex: 1,
   },
   dreamDetailInterpreterName: {
     color: 'white',
     fontSize: 14,
     fontWeight: '600',
     marginBottom: 2,
   },
   dreamDetailInterpreterDesc: {
     color: 'rgba(255,255,255,0.8)',
     fontSize: 12,
     marginBottom: 2,
   },
   dreamDetailInterpreterSpecialty: {
     color: 'rgba(255,255,255,0.6)',
     fontSize: 11,
     fontStyle: 'italic',
   },
   // Profile Section Styles
   profileSection: {
     marginBottom: 20,
     backgroundColor: 'rgba(255,255,255,0.1)',
     borderRadius: 15,
     overflow: 'hidden',
   },
   profileSectionTitle: {
     fontSize: 16,
     fontWeight: '600',
     color: 'white',
     padding: 15,
     paddingBottom: 10,
     backgroundColor: 'rgba(255,255,255,0.05)',
   },
   profileMenuItem: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 15,
     paddingVertical: 12,
     borderBottomWidth: 1,
     borderBottomColor: 'rgba(255,255,255,0.1)',
   },
   profileMenuIcon: {
     fontSize: 18,
     marginRight: 12,
     width: 24,
     textAlign: 'center',
   },
   profileMenuText: {
     flex: 1,
     fontSize: 16,
     color: 'white',
     fontWeight: '500',
   },
   profileMenuArrow: {
     fontSize: 18,
     color: 'rgba(255,255,255,0.6)',
     fontWeight: 'bold',
   },
   profileVersionText: {
     fontSize: 14,
     color: 'rgba(255,255,255,0.6)',
     fontWeight: '400',
   },
   // Profile Container
   profileContainer: {
     flex: 1,
     backgroundColor: 'transparent',
   },
   // Modern Profile Styles
   modernProfileHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: wp(6),
     backgroundColor: 'rgba(255,255,255,0.08)',
     borderRadius: wp(5),
     marginHorizontal: wp(5),
     marginBottom: hp(2.5),
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.15)',
   },
   modernAvatarContainer: {
     position: 'relative',
     marginRight: wp(5),
   },
   modernAvatar: {
     width: wp(20),
     height: wp(20),
     borderRadius: wp(10),
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 3,
     borderColor: 'rgba(255,255,255,0.3)',
   },
   modernAvatarText: {
     fontSize: RFValue(28),
     fontWeight: '700',
     color: 'white',
     textShadowColor: 'rgba(0,0,0,0.3)',
     textShadowOffset: { width: 1, height: 1 },
     textShadowRadius: 2,
   },
   onlineIndicator: {
     position: 'absolute',
     bottom: wp(1.5),
     right: wp(1.5),
     width: wp(4),
     height: wp(4),
     borderRadius: wp(2),
     backgroundColor: '#4CAF50',
     borderWidth: 2,
     borderColor: 'white',
   },
   modernProfileInfo: {
     flex: 1,
     justifyContent: 'center',
   },
   joinDateContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginTop: 4,
   },
   modernJoinDate: {
     fontSize: RFValue(13),
     color: 'rgba(255,255,255,0.7)',
     marginLeft: wp(1.5),
     fontWeight: '500',
   },
   editProfileButton: {
     width: wp(10),
     height: wp(10),
     borderRadius: wp(5),
     backgroundColor: 'rgba(255,255,255,0.15)',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.2)',
   },
   userLevelContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 4,
   },
   userLevelText: {
     fontSize: RFValue(14),
     color: 'rgba(255,255,255,0.9)',
     marginLeft: wp(1.5),
     fontWeight: '600',
   },
   modernProfileAvatar: {
     width: 100,
     height: 100,
     borderRadius: 50,
     backgroundColor: 'rgba(255,255,255,0.1)',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 15,
     borderWidth: 3,
     borderColor: 'rgba(255,255,255,0.2)',
   },
   modernProfileName: {
     fontSize: RFValue(20),
     fontWeight: '700',
     color: 'white',
     marginBottom: hp(0.5),
     textShadowColor: 'rgba(0,0,0,0.2)',
     textShadowOffset: { width: 1, height: 1 },
     textShadowRadius: 2,
   },
   modernProfileEmail: {
     fontSize: RFValue(15),
     color: 'rgba(255,255,255,0.85)',
     marginBottom: hp(0.3),
     fontWeight: '500',
   },
   modernProfileJoinDate: {
     fontSize: 14,
     color: 'rgba(255,255,255,0.6)',
     textAlign: 'center',
   },
   modernStatsGrid: {
     flexDirection: 'row',
     marginHorizontal: wp(5),
     marginBottom: hp(3),
     justifyContent: 'space-between',
   },
   modernStatCard: {
     flex: 1,
     marginHorizontal: wp(1),
     borderRadius: wp(4),
     overflow: 'hidden',
     elevation: 3,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.25,
     shadowRadius: 3.84,
   },
   statCardGradient: {
     padding: wp(4),
     alignItems: 'center',
     justifyContent: 'center',
     minHeight: hp(12),
   },
   statIconContainer: {
     width: wp(8),
     height: wp(8),
     borderRadius: wp(4),
     backgroundColor: 'rgba(255,255,255,0.2)',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: hp(1),
   },
   modernStatItem: {
     flex: 1,
     alignItems: 'center',
   },
   modernStatNumber: {
     fontSize: RFValue(24),
     fontWeight: '800',
     color: 'white',
     marginBottom: hp(0.5),
     textShadowColor: 'rgba(0,0,0,0.3)',
     textShadowOffset: { width: 1, height: 1 },
     textShadowRadius: 2,
   },
   modernStatLabel: {
     fontSize: RFValue(11),
     color: 'rgba(255,255,255,0.9)',
     fontWeight: '600',
     textAlign: 'center',
     textTransform: 'uppercase',
     letterSpacing: 0.5,
   },
   modernStatDivider: {
     width: 1,
     backgroundColor: 'rgba(255,255,255,0.3)',
     marginHorizontal: 15,
   },
   modernMenuCard: {
     backgroundColor: 'rgba(255,255,255,0.1)',
     borderRadius: 20,
     marginHorizontal: 20,
     marginBottom: 20,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.2)',
     overflow: 'hidden',
   },
   modernSectionHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 20,
     paddingBottom: 15,
     backgroundColor: 'rgba(255,255,255,0.05)',
   },
   modernSectionTitle: {
     fontSize: 16,
     fontWeight: '600',
     color: 'white',
     marginLeft: 10,
   },
   modernMenuItem: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 20,
     paddingVertical: 15,
     borderBottomWidth: 1,
     borderBottomColor: 'rgba(255,255,255,0.1)',
   },
   modernMenuItemLeft: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
   },
   modernMenuIcon: {
     width: 35,
     height: 35,
     borderRadius: 17.5,
     backgroundColor: 'rgba(255,255,255,0.1)',
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 15,
   },
   modernMenuText: {
     fontSize: 16,
     color: 'white',
     fontWeight: '500',
     flex: 1,
   },
   modernLanguageButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 20,
     paddingVertical: 15,
   },
   modernLanguageOptions: {
     paddingHorizontal: 20,
     paddingBottom: 10,
   },
   modernLanguageOption: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 12,
     paddingHorizontal: 15,
     borderRadius: 12,
     marginBottom: 8,
     backgroundColor: 'rgba(255,255,255,0.05)',
   },
   modernLanguageOptionActive: {
     backgroundColor: 'rgba(76, 175, 80, 0.2)',
     borderWidth: 1,
     borderColor: 'rgba(76, 175, 80, 0.5)',
   },
   modernLanguageFlag: {
     fontSize: 20,
     marginRight: 12,
   },
   modernLanguageOptionText: {
     fontSize: 16,
     color: 'rgba(255,255,255,0.8)',
     fontWeight: '500',
   },
   modernLanguageOptionTextActive: {
     color: 'white',
     fontWeight: '600',
   },
   modernVersionText: {
     fontSize: 14,
     color: 'rgba(255,255,255,0.6)',
     fontWeight: '500',
   },
   modernLogoutButton: {
     marginHorizontal: 20,
     marginBottom: 30,
     borderRadius: 15,
     overflow: 'hidden',
   },
   modernLogoutGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 15,
     paddingHorizontal: 20,
   },
   modernLogoutText: {
     color: 'white',
     fontSize: 16,
     fontWeight: '600',
     marginLeft: 10,
   },
   // Password Modal Styles
   passwordFormContainer: {
     padding: 20,
   },
   passwordFormTitle: {
     fontSize: 24,
     fontWeight: 'bold',
     color: '#fff',
     textAlign: 'center',
     marginBottom: 8,
   },
   passwordFormSubtitle: {
     fontSize: 16,
     color: 'rgba(255,255,255,0.7)',
     textAlign: 'center',
     marginBottom: 30,
     lineHeight: 22,
   },
   passwordRequirements: {
     backgroundColor: 'rgba(255,255,255,0.1)',
     borderRadius: 12,
     padding: 16,
     marginVertical: 20,
   },
   passwordRequirementsTitle: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#fff',
     marginBottom: 12,
   },
   passwordRequirementItem: {
     fontSize: 14,
     color: 'rgba(255,255,255,0.8)',
     marginBottom: 6,
     paddingLeft: 8,
   },
   // Modal Styles
   modalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 20,
     paddingTop: 60,
     paddingBottom: 20,
     borderBottomWidth: 1,
     borderBottomColor: 'rgba(255,255,255,0.1)',
   },
   modalCloseButton: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: 'rgba(255,255,255,0.1)',
     justifyContent: 'center',
     alignItems: 'center',
   },
   modalCloseText: {
     color: 'white',
     fontSize: 18,
     fontWeight: 'bold',
   },
   modalTitle: {
     color: 'white',
     fontSize: 18,
     fontWeight: '600',
   },
   modalSaveButton: {
     backgroundColor: '#4CAF50',
     paddingHorizontal: 20,
     paddingVertical: 10,
     borderRadius: 20,
   },
   modalSaveText: {
     color: 'white',
     fontSize: 16,
     fontWeight: '600',
   },
   modalContent: {
     flex: 1,
     paddingHorizontal: 20,
   },
   profileFormSection: {
     marginBottom: 25,
   },
   profileFormLabel: {
     color: 'white',
     fontSize: 16,
     fontWeight: '600',
     marginBottom: 10,
   },
   profileFormInput: {
     backgroundColor: 'rgba(255,255,255,0.1)',
     borderRadius: 12,
     paddingHorizontal: 15,
     paddingVertical: 12,
     color: 'white',
     fontSize: 16,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.2)',
   },
   profileFormTextArea: {
     height: 100,
     textAlignVertical: 'top',
   },
   profileFormNote: {
     color: 'rgba(255,255,255,0.7)',
     fontSize: 14,
     fontStyle: 'italic',
     textAlign: 'center',
     backgroundColor: 'rgba(255,255,255,0.05)',
     padding: 15,
     borderRadius: 12,
     marginTop: 10,
   },
   profileMenuTextContainer: {
     flex: 1,
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
   },
   profileMenuStatus: {
     fontSize: 12,
     fontWeight: '600',
   },
   textArea: {
     height: 80,
     textAlignVertical: 'top',
   },
   pickerContainer: {
     borderRadius: 12,
     overflow: 'hidden',
   },
   profileFormInputText: {
     color: 'white',
     fontSize: 16,
   },
   placeholderText: {
     color: 'rgba(255,255,255,0.5)',
   },
   emptyBackupContainer: {
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 40,
     paddingHorizontal: 20,
   },
   emptyBackupIcon: {
     fontSize: 48,
     marginBottom: 16,
   },
   emptyBackupText: {
     color: 'white',
     fontSize: 18,
     fontWeight: '600',
     textAlign: 'center',
     marginBottom: 8,
   },
   emptyBackupSubtext: {
     color: 'rgba(255,255,255,0.7)',
     fontSize: 14,
     textAlign: 'center',
     lineHeight: 20,
   },
   backupItem: {
     backgroundColor: 'rgba(255,255,255,0.1)',
     borderRadius: 12,
     padding: 16,
     marginBottom: 12,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.2)',
   },
   backupItemHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
     marginBottom: 12,
   },
   backupItemTitle: {
     color: 'white',
     fontSize: 16,
     fontWeight: '600',
     flex: 1,
   },
   backupItemDate: {
     color: 'rgba(255,255,255,0.7)',
     fontSize: 12,
     textAlign: 'right',
     marginLeft: 8,
   },
   backupItemDetails: {
     marginBottom: 16,
   },
   backupItemDetail: {
     color: 'rgba(255,255,255,0.8)',
     fontSize: 14,
     marginBottom: 4,
   },
   backupItemActions: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     gap: 12,
   },
   backupActionButton: {
     flex: 1,
     paddingVertical: 10,
     paddingHorizontal: 16,
     borderRadius: 8,
     alignItems: 'center',
   },
   restoreButton: {
     backgroundColor: 'rgba(76, 175, 80, 0.2)',
     borderWidth: 1,
     borderColor: 'rgba(76, 175, 80, 0.5)',
   },
   deleteButton: {
     backgroundColor: 'rgba(244, 67, 54, 0.2)',
     borderWidth: 1,
     borderColor: 'rgba(244, 67, 54, 0.5)',
   },
   backupActionText: {
     color: 'white',
     fontSize: 14,
     fontWeight: '600',
   },
   faqContainer: {
     paddingBottom: 20,
   },
   faqItem: {
     backgroundColor: 'rgba(255,255,255,0.1)',
     borderRadius: 15,
     padding: 20,
     marginBottom: 15,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.2)',
   },
   faqQuestion: {
     color: 'white',
     fontSize: 16,
     fontWeight: '700',
     marginBottom: 10,
     lineHeight: 22,
   },
   faqAnswer: {
     color: 'rgba(255,255,255,0.9)',
     fontSize: 14,
     lineHeight: 20,
     fontWeight: '400',
   },
   // Enhanced Profile Header Styles
   enhancedProfileHeader: {
     marginTop: hp(2),
     marginBottom: hp(3),
     marginHorizontal: wp(5),
     borderRadius: wp(6),
     overflow: 'hidden',
     elevation: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
   },
   profileHeaderGradient: {
     paddingVertical: hp(3),
     paddingHorizontal: wp(5),
   },
   profileHeaderContent: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
   },
   avatarSection: {
     alignItems: 'center',
     marginRight: wp(4),
   },
   avatarWrapper: {
     position: 'relative',
   },
   enhancedAvatar: {
     width: wp(18),
     height: wp(18),
     borderRadius: wp(9),
     backgroundColor: 'rgba(255,255,255,0.2)',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 3,
     borderColor: 'rgba(255,255,255,0.3)',
   },
   enhancedAvatarText: {
     fontSize: wp(8),
     fontWeight: 'bold',
     color: 'white',
   },
   statusIndicator: {
     position: 'absolute',
     bottom: 2,
     right: 2,
     width: wp(4),
     height: wp(4),
     borderRadius: wp(2),
     backgroundColor: '#4CAF50',
     borderWidth: 2,
     borderColor: 'white',
   },
   profileInfoSection: {
     flex: 1,
   },
   enhancedProfileName: {
     fontSize: wp(5.5),
     fontWeight: 'bold',
     color: 'white',
     marginBottom: hp(0.5),
   },
   levelBadge: {
     alignSelf: 'flex-start',
     borderRadius: wp(3),
     overflow: 'hidden',
     marginBottom: hp(1),
   },
   levelBadgeGradient: {
     paddingHorizontal: wp(3),
     paddingVertical: hp(0.5),
   },
   levelBadgeText: {
     color: 'white',
     fontSize: wp(3),
     fontWeight: '600',
   },
   joinInfo: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   joinInfoText: {
     color: 'rgba(255,255,255,0.8)',
     fontSize: wp(3.2),
     marginLeft: wp(1),
   },
   enhancedEditButton: {
     borderRadius: wp(6),
     overflow: 'hidden',
   },
   editButtonGradient: {
     paddingHorizontal: wp(4),
     paddingVertical: hp(1.2),
     flexDirection: 'row',
     alignItems: 'center',
   },
   // Enhanced Stats Styles
   enhancedStatsContainer: {
     marginHorizontal: wp(5),
     marginBottom: hp(3),
   },
   enhancedStatsGrid: {
     flexDirection: 'row',
     justifyContent: 'space-between',
   },
   enhancedStatCard: {
     flex: 1,
     marginHorizontal: wp(1),
     borderRadius: wp(4),
     overflow: 'hidden',
     elevation: 5,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.25,
     shadowRadius: 3.84,
   },
   enhancedStatGradient: {
     padding: wp(4),
     alignItems: 'center',
     justifyContent: 'center',
     minHeight: hp(12),
   },
   enhancedStatIcon: {
     fontSize: wp(6),
     marginBottom: hp(1),
   },
   enhancedStatContent: {
     alignItems: 'center',
   },
   enhancedStatNumber: {
     fontSize: wp(6),
     fontWeight: 'bold',
     color: 'white',
     marginBottom: hp(0.5),
     textShadowColor: 'rgba(0,0,0,0.3)',
     textShadowOffset: { width: 1, height: 1 },
     textShadowRadius: 2,
   },
   enhancedStatLabel: {
     fontSize: wp(3),
     color: 'rgba(255,255,255,0.9)',
     fontWeight: '600',
     textAlign: 'center',
     lineHeight: wp(3.5),
   },
   // Modern Floating Tab Bar Styles
   floatingTabBar: {
     position: 'absolute',
     bottom: hp(3),
     left: wp(5),
     right: wp(5),
     height: hp(8),
     borderRadius: wp(8),
     overflow: 'hidden',
     elevation: 10,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 5 },
     shadowOpacity: 0.3,
     shadowRadius: 10,
     zIndex: 1000,
   },
   tabBarBlur: {
     flex: 1,
     borderRadius: wp(8),
   },
   tabBarGradient: {
     flex: 1,
     borderRadius: wp(8),
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.2)',
   },
   tabBarContainer: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-around',
     paddingHorizontal: wp(2),
     paddingVertical: hp(1),
   },
   modernTabItem: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: hp(0.8),
     paddingHorizontal: wp(2),
     borderRadius: wp(6),
     minWidth: wp(12),
     
   },
   modernTabItemActive: {
     backgroundColor: 'rgba(255,255,255,0.15)',
     paddingHorizontal: wp(3),
     minWidth: wp(20),
   },
   tabIconContainer: {
     width: wp(8),
     height: wp(8),
     borderRadius: wp(4),
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(255,255,255,0.1)',
 
    },
   tabIconContainerActive: {
     backgroundColor: 'rgba(255,255,255,0.25)',
     transform: [{ scale: 1.1 }],
   },
   modernTabLabel: {
     color: 'white',
     fontSize: wp(3.2),
     fontWeight: '600',
     marginLeft: wp(2),
     textShadowColor: 'rgba(0,0,0,0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
   },
 });