import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Bildirim davranışını ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
  }

  // Bildirim izinlerini al
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Bildirimler için izin gerekli!');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
    } else {
      alert('Push bildirimleri fiziksel cihazda çalışır!');
    }

    this.expoPushToken = token;
    return token;
  }

  // Günlük rüya hatırlatıcısı planla
  async scheduleDreamReminder(hour = 22, minute = 0) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌙 Rüya Zamanı!",
        body: "Bugünkü rüyalarınızı kaydetmeyi unutmayın. İyi geceler!",
        data: { type: 'dream_reminder' },
      },
      trigger: {
        hour: hour,
        minute: minute,
        repeats: true,
      },
    });
  }

  // Sabah rüya kaydetme hatırlatıcısı
  async scheduleMorningReminder(hour = 8, minute = 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "☀️ Günaydın!",
        body: "Gece gördüğünüz rüyaları kaydetmek için harika bir zaman!",
        data: { type: 'morning_reminder' },
      },
      trigger: {
        hour: hour,
        minute: minute,
        repeats: true,
      },
    });
  }

  // Rüya yorumu hazır bildirimi
  async sendDreamInterpretationReady(dreamTitle) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✨ Rüya Yorumunuz Hazır!",
        body: `"${dreamTitle}" rüyanızın yorumu tamamlandı. Hemen inceleyin!`,
        data: { type: 'interpretation_ready' },
      },
      trigger: null, // Hemen gönder
    });
  }

  // Haftalık rüya özeti
  async scheduleWeeklyReport() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📊 Haftalık Rüya Raporunuz",
        body: "Bu haftaki rüya analizinizi ve istatistiklerinizi görüntüleyin!",
        data: { type: 'weekly_report' },
      },
      trigger: {
        weekday: 1, // Pazartesi
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  }

  // Motivasyon bildirimi
  async sendMotivationalNotification() {
    const messages = [
      "🌟 Rüyalarınız geleceğinizin anahtarıdır!",
      "💫 Her rüya bir mesaj taşır, keşfetmeye devam edin!",
      "🔮 Bilinçaltınızdan gelen sinyalleri dinleyin!",
      "🌙 Rüyalarınız size rehberlik ediyor!",
      "✨ İç dünyanızı keşfetmeye devam edin!"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "DreamPack Motivasyon",
        body: randomMessage,
        data: { type: 'motivation' },
      },
      trigger: null,
    });
  }

  // Tüm planlanmış bildirimleri iptal et
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Planlanmış bildirimleri listele
  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Bildirim dinleyicilerini ayarla
  setupNotificationListeners(navigation) {
    // Uygulama açıkken gelen bildirimler
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Bildirim alındı:', notification);
    });

    // Bildirime tıklandığında
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      switch (data.type) {
        case 'dream_reminder':
        case 'morning_reminder':
          navigation.navigate('DreamInterpretation');
          break;
        case 'interpretation_ready':
          navigation.navigate('DreamInterpretation');
          break;
        case 'weekly_report':
          navigation.navigate('DreamInterpretation');
          break;
        default:
          navigation.navigate('Home');
      }
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  // Dinleyicileri temizle
  removeNotificationListeners(listeners) {
    if (listeners.notificationListener) {
      Notifications.removeNotificationSubscription(listeners.notificationListener);
    }
    if (listeners.responseListener) {
      Notifications.removeNotificationSubscription(listeners.responseListener);
    }
  }
}

export default new NotificationService();