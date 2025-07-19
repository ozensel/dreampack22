import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  Animated,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionPlans from '../components/SubscriptionPlans';
import subscriptionService from '../services/subscriptionService';

const { width, height } = Dimensions.get('window');

export default function SubscriptionPlansScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  const loadCurrentSubscription = async () => {
    if (user?.id) {
      try {
        const result = await subscriptionService.getUserActiveSubscription(user.id);
        if (result.success) {
          setCurrentSubscription(result.data);
        }
      } catch (error) {
        console.error('Abonelik bilgisi yüklenirken hata:', error);
      }
    }
  };

  const handleSubscriptionChange = () => {
    loadCurrentSubscription();
    // Ana ekrana geri dön ve verileri yenile
    navigation.goBack();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Aboneliği İptal Et',
      'Aboneliğinizi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await subscriptionService.cancelSubscription(user.id);
              if (result.success) {
                Alert.alert('Başarılı', 'Aboneliğiniz başarıyla iptal edildi.');
                loadCurrentSubscription();
              } else {
                Alert.alert('Hata', result.error || 'Abonelik iptal edilirken bir hata oluştu.');
              }
            } catch (error) {
              Alert.alert('Hata', 'Abonelik iptal edilirken bir hata oluştu.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRenewSubscription = () => {
    Alert.alert(
      'Abonelik Yenileme',
      'Aboneliğinizi yenilemek için aşağıdaki planlardan birini seçebilirsiniz.',
      [
        {
          text: 'Tamam',
          style: 'default',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated Background */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="diamond" size={28} color="#FFD700" />
          <Text style={styles.headerTitle}>Premium Planlar</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {user?.id ? (
          <>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroIconContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.heroIconGradient}
                >
                  <MaterialIcons name="auto-awesome" size={40} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.heroTitle}>Rüyalarınızın Gücünü Keşfedin</Text>
              <Text style={styles.heroSubtitle}>
                Premium özelliklerle rüyalarınızı daha derinlemesine anlayın
              </Text>
            </View>

            {/* Current Subscription */}
            {currentSubscription && (
              <BlurView intensity={20} style={styles.currentSubscriptionCard}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 165, 0, 0.2)']}
                  style={styles.currentSubscriptionGradient}
                >
                  <View style={styles.currentSubscriptionHeader}>
                    <MaterialIcons name="verified" size={24} color="#FFD700" />
                    <Text style={styles.currentSubscriptionTitle}>Aktif Abonelik</Text>
                  </View>
                  <Text style={styles.currentSubscriptionPlan}>{currentSubscription.plan_name}</Text>
                  <Text style={styles.currentSubscriptionPrice}>₺{currentSubscription.price}/{currentSubscription.billing_period}</Text>
                  <Text style={styles.currentSubscriptionStatus}>
                    {currentSubscription.status === 'active' ? 'Aktif' : 'Pasif'}
                  </Text>
                  
                  <View style={styles.subscriptionActions}>
                    <TouchableOpacity 
                      style={styles.manageButton}
                      onPress={handleRenewSubscription}
                    >
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                        style={styles.manageButtonGradient}
                      >
                        <MaterialIcons name="refresh" size={18} color="white" />
                        <Text style={styles.manageButtonText}>Yenile</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={handleCancelSubscription}
                    >
                      <Text style={styles.cancelButtonText}>İptal Et</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </BlurView>
            )}

            {/* Subscription Plans */}
            <SubscriptionPlans 
              onSubscriptionChange={handleSubscriptionChange}
              currentSubscription={currentSubscription}
            />
          </>
        ) : (
          <BlurView intensity={30} style={styles.loginPrompt}>
            <View style={styles.loginIconContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.loginIconGradient}
              >
                <MaterialIcons name="person" size={48} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.loginPromptTitle}>Hesabınıza Giriş Yapın</Text>
            <Text style={styles.loginPromptText}>
              Premium özelliklerimizi keşfetmek için giriş yapmanız gerekiyor
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Auth')}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.loginButtonGradient}
              >
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  heroIconContainer: {
    marginBottom: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  currentSubscriptionCard: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  currentSubscriptionGradient: {
    padding: 24,
  },
  currentSubscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentSubscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
  currentSubscriptionPlan: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  currentSubscriptionPrice: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  currentSubscriptionStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 20,
  },
  subscriptionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  manageButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  manageButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  manageButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  cancelButtonText: {
    color: '#ff4444',
    fontWeight: '600',
    fontSize: 14,
  },
  loginPrompt: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 30,
  },
  loginIconContainer: {
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  loginPromptText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});