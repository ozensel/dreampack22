import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import notificationService from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationSettingsScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    dreamReminder: true,
    morningReminder: true,
    weeklyReport: true,
    motivationalMessages: true,
    interpretationReady: true,
  });
  const [reminderTime, setReminderTime] = useState({ hour: 22, minute: 0 });
  const [morningTime, setMorningTime] = useState({ hour: 8, minute: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadSettings();
    initializeNotifications();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      const savedReminderTime = await AsyncStorage.getItem('reminderTime');
      const savedMorningTime = await AsyncStorage.getItem('morningTime');
      
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      if (savedReminderTime) {
        setReminderTime(JSON.parse(savedReminderTime));
      }
      if (savedMorningTime) {
        setMorningTime(JSON.parse(savedMorningTime));
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      await AsyncStorage.setItem('reminderTime', JSON.stringify(reminderTime));
      await AsyncStorage.setItem('morningTime', JSON.stringify(morningTime));
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
    }
  };

  const initializeNotifications = async () => {
    try {
      await notificationService.registerForPushNotificationsAsync();
      setIsInitialized(true);
    } catch (error) {
      console.error('Bildirim servisi başlatılırken hata:', error);
      Alert.alert('Hata', 'Bildirim servisi başlatılamadı.');
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
    
    // Bildirimleri güncelle
    await updateNotifications(newSettings);
  };

  const updateNotifications = async (currentSettings) => {
    try {
      // Önce tüm bildirimleri iptal et
      await notificationService.cancelAllNotifications();
      
      // Aktif ayarlara göre bildirimleri yeniden planla
      if (currentSettings.dreamReminder) {
        await notificationService.scheduleDreamReminder(reminderTime.hour, reminderTime.minute);
      }
      
      if (currentSettings.morningReminder) {
        await notificationService.scheduleMorningReminder(morningTime.hour, morningTime.minute);
      }
      
      if (currentSettings.weeklyReport) {
        await notificationService.scheduleWeeklyReport();
      }
    } catch (error) {
      console.error('Bildirimler güncellenirken hata:', error);
    }
  };

  const showTimePickerAlert = (type) => {
    const currentTime = type === 'reminder' ? reminderTime : morningTime;
    const title = type === 'reminder' ? 'Akşam Hatırlatıcı Saati' : 'Sabah Hatırlatıcı Saati';
    
    Alert.prompt(
      title,
      'Saat formatı: HH:MM (örn: 22:30)',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Kaydet',
          onPress: (timeString) => {
            const [hour, minute] = timeString.split(':').map(Number);
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
              const newTime = { hour, minute };
              if (type === 'reminder') {
                setReminderTime(newTime);
              } else {
                setMorningTime(newTime);
              }
              updateNotifications(settings);
            } else {
              Alert.alert('Hata', 'Geçerli bir saat formatı girin (00:00 - 23:59)');
            }
          },
        },
      ],
      'plain-text',
      `${currentTime.hour.toString().padStart(2, '0')}:${currentTime.minute.toString().padStart(2, '0')}`
    );
  };

  const testNotification = async () => {
    try {
      await notificationService.sendMotivationalNotification();
      Alert.alert('Test Bildirimi', 'Test bildirimi gönderildi!');
    } catch (error) {
      Alert.alert('Hata', 'Test bildirimi gönderilemedi.');
    }
  };

  const formatTime = (time) => {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
  };

  const SettingItem = ({ title, subtitle, value, onValueChange, showTime, onTimePress }) => (
    <BlurView intensity={Platform.OS === 'android' ? 40 : 20} style={styles.settingItem}>
      <View style={styles.settingContent}>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          {showTime && (
            <TouchableOpacity onPress={onTimePress} style={styles.timeButton}>
              <Text style={styles.timeText}>{showTime}</Text>
              <Ionicons name="time-outline" size={16} color="#8B5CF6" />
            </TouchableOpacity>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: '#8B5CF6' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
        />
      </View>
    </BlurView>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#8B5CF6']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
        <TouchableOpacity
          style={styles.testButton}
          onPress={testNotification}
        >
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌙 Rüya Hatırlatıcıları</Text>
          
          <SettingItem
            title="Akşam Hatırlatıcısı"
            subtitle="Yatmadan önce rüya kaydetme hatırlatıcısı"
            value={settings.dreamReminder}
            onValueChange={(value) => updateSetting('dreamReminder', value)}
            showTime={settings.dreamReminder ? formatTime(reminderTime) : null}
            onTimePress={() => showTimePickerAlert('reminder')}
          />
          
          <SettingItem
            title="Sabah Hatırlatıcısı"
            subtitle="Sabah uyandığınızda rüya kaydetme hatırlatıcısı"
            value={settings.morningReminder}
            onValueChange={(value) => updateSetting('morningReminder', value)}
            showTime={settings.morningReminder ? formatTime(morningTime) : null}
            onTimePress={() => showTimePickerAlert('morning')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Raporlar ve Analizler</Text>
          
          <SettingItem
            title="Haftalık Rapor"
            subtitle="Her Pazartesi haftalık rüya analizinizi alın"
            value={settings.weeklyReport}
            onValueChange={(value) => updateSetting('weeklyReport', value)}
          />
          
          <SettingItem
            title="Yorum Hazır Bildirimi"
            subtitle="Rüya yorumunuz hazır olduğunda bildirim alın"
            value={settings.interpretationReady}
            onValueChange={(value) => updateSetting('interpretationReady', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Motivasyon</Text>
          
          <SettingItem
            title="Motivasyon Mesajları"
            subtitle="Günlük motivasyon ve ilham verici mesajlar"
            value={settings.motivationalMessages}
            onValueChange={(value) => updateSetting('motivationalMessages', value)}
          />
        </View>

        <BlurView intensity={Platform.OS === 'android' ? 40 : 20} style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#8B5CF6" />
          <Text style={styles.infoText}>
            Bildirimler cihazınızın ayarlarından da kontrol edilebilir. 
            Test bildirimi göndermek için sağ üstteki ikona dokunun.
          </Text>
        </BlurView>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  testButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    marginLeft: 5,
  },
  settingItem: {
    borderRadius: 15,
    marginBottom: 10,
    overflow: 'hidden',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingText: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timeText: {
    color: '#8B5CF6',
    fontWeight: '600',
    marginRight: 5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;