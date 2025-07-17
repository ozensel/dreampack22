import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { wp, hp, RFValue, spacing, fontSize, borderRadius, iconSize, isSmallDevice, isLargeDevice } from '../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [dreamCount, setDreamCount] = useState(0);
  const [recentDreams, setRecentDreams] = useState([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    loadDreamData();
    setGreetingMessage();
  }, []);

  const loadDreamData = async () => {
    try {
      const dreams = await AsyncStorage.getItem('dreams');
      if (dreams) {
        const dreamList = JSON.parse(dreams);
        setDreamCount(dreamList.length);
        setRecentDreams(dreamList.slice(-3).reverse());
      }
    } catch (error) {
      console.error('Error loading dreams:', error);
    }
  };

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Günaydın');
    } else if (hour < 18) {
      setGreeting('İyi Öğleden Sonra');
    } else {
      setGreeting('İyi Akşamlar');
    }
  };

  const quickActions = [
    {
      id: 1,
      title: 'Rüya Ekle',
      subtitle: 'Yeni rüyanı kaydet',
      icon: 'add-circle',
      colors: ['#667eea', '#764ba2'],
      onPress: () => navigation.navigate('DreamInterpretation')
    },
    {
      id: 2,
      title: 'Rüyalarım',
      subtitle: 'Geçmiş rüyalarını gör',
      icon: 'moon',
      colors: ['#f093fb', '#f5576c'],
      onPress: () => navigation.navigate('DreamInterpretation', { tab: 'dreams' })
    },
    {
      id: 3,
      title: 'İstatistikler',
      subtitle: 'Rüya analizlerini incele',
      icon: 'stats-chart',
      colors: ['#4facfe', '#00f2fe'],
      onPress: () => navigation.navigate('DreamInterpretation', { tab: 'stats' })
    },
    {
      id: 4,
      title: 'Profil',
      subtitle: 'Hesap ayarlarını düzenle',
      icon: 'person-circle',
      colors: ['#fa709a', '#fee140'],
      onPress: () => navigation.navigate('DreamInterpretation', { tab: 'profile' })
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.backgroundGradient}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greetingText}>{greeting} 🌙</Text>
              <Text style={styles.welcomeText}>
                {user?.email?.split('@')[0] || 'Rüya Gezgini'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {}}
            >
              <Ionicons name="notifications-outline" size={wp(6)} color="white" />
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <BlurView intensity={20} style={styles.statsCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.statsGradient}
            >
              <View style={styles.statsContent}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{dreamCount}</Text>
                  <Text style={styles.statLabel}>Toplam Rüya</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{recentDreams.length}</Text>
                  <Text style={styles.statLabel}>Bu Hafta</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>7</Text>
                  <Text style={styles.statLabel}>Günlük Seri</Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.colors}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionContent}>
                    <View style={styles.actionIcon}>
                      <Ionicons name={action.icon} size={wp(8)} color="white" />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Dreams */}
          {recentDreams.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Son Rüyalar</Text>
                <TouchableOpacity onPress={() => navigation.navigate('DreamInterpretation', { tab: 'dreams' })}>
                  <Text style={styles.seeAllText}>Tümünü Gör</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.recentDreams}>
                {recentDreams.map((dream, index) => (
                  <BlurView key={index} intensity={15} style={styles.dreamCard}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                      style={styles.dreamGradient}
                    >
                      <View style={styles.dreamContent}>
                        <View style={styles.dreamHeader}>
                          <Ionicons name="moon" size={wp(5)} color="#667eea" />
                          <Text style={styles.dreamDate}>
                            {new Date(dream.date).toLocaleDateString('tr-TR')}
                          </Text>
                        </View>
                        <Text style={styles.dreamText} numberOfLines={2}>
                          {dream.dream || 'Rüya metni...'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </BlurView>
                ))}
              </View>
            </>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(6),
    paddingBottom: hp(3),
  },
  headerContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: RFValue(16),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: hp(0.5),
  },
  welcomeText: {
    fontSize: RFValue(24),
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  notificationButton: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsCard: {
    marginHorizontal: wp(5),
    marginBottom: hp(3),
    borderRadius: wp(4),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsGradient: {
    padding: wp(5),
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: RFValue(24),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  statLabel: {
    fontSize: RFValue(12),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: hp(4),
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: wp(2),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: RFValue(18),
    color: 'white',
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: RFValue(14),
    color: '#667eea',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(3),
    marginBottom: hp(3),
  },
  actionCard: {
    width: (width - wp(8)) / 2,
    marginHorizontal: wp(1),
    marginBottom: hp(2),
    borderRadius: wp(4),
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionGradient: {
    padding: wp(4),
    minHeight: hp(15),
    justifyContent: 'center',
  },
  actionContent: {
    alignItems: 'center',
  },
  actionIcon: {
    marginBottom: hp(1),
  },
  actionTitle: {
    fontSize: RFValue(14),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(0.5),
  },
  actionSubtitle: {
    fontSize: RFValue(11),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: RFValue(14),
  },
  recentDreams: {
    paddingHorizontal: wp(5),
  },
  dreamCard: {
    marginBottom: hp(1.5),
    borderRadius: wp(3),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dreamGradient: {
    padding: wp(4),
  },
  dreamContent: {
    flex: 1,
  },
  dreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  dreamDate: {
    fontSize: RFValue(12),
    color: 'rgba(255,255,255,0.7)',
    marginLeft: wp(2),
    fontWeight: '500',
  },
  dreamText: {
    fontSize: RFValue(13),
    color: 'rgba(255,255,255,0.9)',
    lineHeight: RFValue(18),
  },
  bottomSpacing: {
    height: hp(5),
  },
});