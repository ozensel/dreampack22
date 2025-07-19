import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { wp, hp, RFValue, spacing, fontSize, borderRadius, iconSize, isSmallDevice, isLargeDevice } from '../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UsageLimitIndicator from '../components/UsageLimitIndicator';
import PremiumFeatureGate from '../components/PremiumFeatureGate';
import subscriptionService from '../services/subscriptionService';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [dreamCount, setDreamCount] = useState(0);
  const [recentDreams, setRecentDreams] = useState([]);
  const [greeting, setGreeting] = useState('');
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState('');
  const [userSubscription, setUserSubscription] = useState(null);

  useEffect(() => {
    console.log('HomeScreen useEffect triggered, user:', user?.id);
    loadDreamData();
    setGreetingMessage();
    loadUserSubscription();
  }, [user]);

  const loadUserSubscription = async () => {
    if (user?.id) {
      try {
        console.log('Loading subscription for user:', user.id);
        const result = await subscriptionService.getUserActiveSubscription(user.id);
        console.log('Subscription result:', result);
        if (result.success) {
          setUserSubscription(result.data);
          console.log('User subscription set:', result.data);
        } else {
          console.log('No active subscription found');
          setUserSubscription(null);
        }
      } catch (error) {
        console.error('Abonelik bilgisi yüklenirken hata:', error);
        // Network hatası durumunda null olarak ayarla
        setUserSubscription(null);
      }
    } else {
      console.log('No user ID available for subscription check');
      setUserSubscription(null);
    }
  };

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

  const handlePremiumFeatureAccess = (featureName) => {
    setPremiumFeatureName(featureName);
    setShowPremiumGate(true);
  };

  const handleSubscriptionPress = () => {
    navigation.navigate('SubscriptionPlans');
  };

  const handleUpgradePress = () => {
    setShowPremiumGate(false);
    navigation.navigate('SubscriptionPlans');
  };

  const checkPremiumAccess = async (feature) => {
    if (!user?.id) return false;
    
    try {
      const result = await subscriptionService.canUseFeature(user.id, feature);
      return result.success && result.data.canUse;
    } catch (error) {
      console.error('Premium erişim kontrolü hatası:', error);
      return false;
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
      title: 'Ünlü Yorumları',
      subtitle: 'Premium özellik',
      icon: 'diamond',
      colors: ['#FFD700', '#FFA500'],
      isPremium: true,
      onPress: async () => {
        const hasAccess = await checkPremiumAccess('famous_person_interpretations');
        if (hasAccess) {
          navigation.navigate('FamousPersonInterpretation');
        } else {
          handlePremiumFeatureAccess('Ünlü Kişi Yorumları');
        }
      }
    },
    {
      id: 5,
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
              {/* Premium Status Indicator */}
              <View style={styles.premiumStatusContainer}>
                {userSubscription ? (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="diamond" size={wp(4)} color="#FFD700" />
                    <Text style={styles.premiumText}>Premium Üye</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.upgradeBadge}
                    onPress={() => navigation.navigate('SubscriptionPlans')}
                  >
                    <Ionicons name="arrow-up-circle" size={wp(4)} color="#4facfe" />
                    <Text style={styles.upgradeText}>Ücretsiz Plan</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.subscriptionButton}
                onPress={handleSubscriptionPress}
              >
                <Ionicons name="card" size={wp(5)} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => {}}
              >
                <Ionicons name="notifications-outline" size={wp(5)} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Usage Limit Indicator */}
          {user?.id && (
            <UsageLimitIndicator 
              userId={user.id} 
              onUpgradePress={handleUpgradePress}
            />
          )}

          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <TouchableOpacity style={[styles.statCard, { backgroundColor: '#667eea' }]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="moon" size={wp(8)} color="white" />
              </View>
              <Text style={styles.statNumber}>{dreamCount}</Text>
              <Text style={styles.statLabel}>Toplam Rüya</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.statCard, { backgroundColor: '#f093fb' }]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={wp(8)} color="white" />
              </View>
              <Text style={styles.statNumber}>{recentDreams.length}</Text>
              <Text style={styles.statLabel}>Bu Hafta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.statCard, { backgroundColor: '#4facfe' }]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={wp(8)} color="white" />
              </View>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Günlük Seri</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          </View>
          
          <View style={styles.modernActionsContainer}>
            <TouchableOpacity 
              style={[styles.modernActionCard]}
              onPress={() => navigation.navigate('DreamInterpretation')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.primaryActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.modernActionContent}>
                  <View style={styles.modernActionLeft}>
                    <View style={styles.modernActionIcon}>
                      <Ionicons name="add-circle" size={wp(10)} color="white" />
                    </View>
                    <View style={styles.modernActionText}>
                      <Text style={styles.modernActionTitle}>Rüya Ekle</Text>
                      <Text style={styles.modernActionSubtitle}>Yeni rüyanı kaydet ve yorumla</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={wp(6)} color="rgba(255,255,255,0.7)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity 
                style={[styles.modernActionCard, styles.secondaryAction, { backgroundColor: '#ff6b6b' }]}
                onPress={() => navigation.navigate('DreamInterpretation', { tab: 'dreams' })}
                activeOpacity={0.9}
              >
                <View style={styles.secondaryActionContent}>
                  <Ionicons name="moon" size={wp(7)} color="white" />
                  <Text style={styles.secondaryActionTitle}>Rüyalarım</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modernActionCard, styles.secondaryAction, { backgroundColor: '#4ecdc4' }]}
                onPress={() => navigation.navigate('DreamInterpretation', { tab: 'stats' })}
                activeOpacity={0.9}
              >
                <View style={styles.secondaryActionContent}>
                  <Ionicons name="stats-chart" size={wp(7)} color="white" />
                  <Text style={styles.secondaryActionTitle}>İstatistikler</Text>
                </View>
              </TouchableOpacity>
            </View>
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
                {recentDreams.map((dream, index) => {
                  const cardColors = ['#6c5ce7', '#fd79a8', '#00b894'];
                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.modernDreamCard, { backgroundColor: cardColors[index % cardColors.length] }]}
                      activeOpacity={0.8}
                    >
                      <View style={styles.modernDreamContent}>
                        <View style={styles.modernDreamHeader}>
                          <View style={styles.dreamIconBadge}>
                            <Ionicons name="moon" size={wp(4)} color="white" />
                          </View>
                          <Text style={styles.modernDreamDate}>
                            {new Date(dream.date).toLocaleDateString('tr-TR')}
                          </Text>
                          <View style={styles.dreamTypeBadge}>
                            <Text style={styles.dreamTypeText}>Rüya</Text>
                          </View>
                        </View>
                        <Text style={styles.modernDreamText} numberOfLines={2}>
                          {dream.dream || 'Rüya metni...'}
                        </Text>
                        <View style={styles.dreamFooter}>
                          <Text style={styles.readMoreText}>Devamını oku</Text>
                          <Ionicons name="arrow-forward" size={wp(4)} color="rgba(255,255,255,0.8)" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
      
      {/* Premium Feature Gate Modal */}
      <PremiumFeatureGate
        visible={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        onUpgrade={handleUpgradePress}
        featureName={premiumFeatureName}
        description="Bu özellik premium abonelik gerektirir"
      />
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
    paddingBottom: Platform.OS === 'android' ? hp(20) : hp(12),
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginBottom: hp(3),
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: wp(1),
    borderRadius: wp(4),
    padding: wp(4),
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  statIconContainer: {
    marginBottom: hp(1),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: wp(6),
    padding: wp(2),
  },
  statNumber: {
    fontSize: RFValue(20),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  statLabel: {
    fontSize: RFValue(11),
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
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
  modernActionsContainer: {
    paddingHorizontal: wp(5),
    marginBottom: hp(3),
  },
  modernActionCard: {
    borderRadius: wp(4),
    marginBottom: hp(2),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  primaryActionGradient: {
    padding: wp(5),
    borderRadius: wp(4),
  },
  modernActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernActionIcon: {
    marginRight: wp(4),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(6),
    padding: wp(2),
  },
  modernActionText: {
    flex: 1,
  },
  modernActionTitle: {
    fontSize: RFValue(16),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  modernActionSubtitle: {
    fontSize: RFValue(12),
    color: 'rgba(255,255,255,0.7)',
    lineHeight: RFValue(16),
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    flex: 1,
    marginHorizontal: wp(1),
    padding: wp(4),
    minHeight: hp(12),
  },
  secondaryActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  secondaryActionTitle: {
    fontSize: RFValue(13),
    color: 'white',
    fontWeight: 'bold',
    marginTop: hp(1),
    textAlign: 'center',
  },
  recentDreams: {
    paddingHorizontal: wp(5),
  },
  modernDreamCard: {
    marginBottom: hp(2),
    borderRadius: wp(4),
    padding: wp(5),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  modernDreamContent: {
    flex: 1,
  },
  modernDreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  dreamIconBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: wp(4),
    padding: wp(1.5),
  },
  modernDreamDate: {
    fontSize: RFValue(12),
    color: 'white',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  dreamTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: wp(3),
    paddingHorizontal: wp(2),
    paddingVertical: wp(1),
  },
  premiumStatusContainer: {
    marginTop: hp(1),
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: wp(4),
    paddingHorizontal: wp(3),
    paddingVertical: wp(1.5),
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumText: {
    color: '#FFD700',
    fontSize: RFValue(12),
    fontWeight: '600',
    marginLeft: wp(1.5),
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 172, 254, 0.2)',
    borderRadius: wp(4),
    paddingHorizontal: wp(3),
    paddingVertical: wp(1.5),
    borderWidth: 1,
    borderColor: '#4facfe',
  },
  upgradeText: {
    color: '#4facfe',
    fontSize: RFValue(12),
    fontWeight: '600',
    marginLeft: wp(1.5),
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(6),
    padding: wp(2.5),
    marginRight: wp(2),
  },
  dreamTypeText: {
    fontSize: RFValue(10),
    color: 'white',
    fontWeight: '600',
  },
  modernDreamText: {
    fontSize: RFValue(14),
    color: 'white',
    lineHeight: RFValue(20),
    marginBottom: hp(1.5),
  },
  dreamFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readMoreText: {
    fontSize: RFValue(12),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: Platform.OS === 'android' ? hp(10) : hp(5),
  },
});