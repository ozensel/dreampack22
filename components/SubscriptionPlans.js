import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import subscriptionService from '../services/subscriptionService';

const { width } = Dimensions.get('window');

const SubscriptionPlans = ({ userId, onSubscriptionChange }) => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Abonelik planlarını yükle
      const plansResult = await subscriptionService.getSubscriptionPlans();
      if (plansResult.success) {
        setPlans(plansResult.data);
      }
      
      // Kullanıcının mevcut aboneliğini yükle
      if (userId) {
        const subscriptionResult = await subscriptionService.getUserActiveSubscription(userId);
        if (subscriptionResult.success) {
          setCurrentSubscription(subscriptionResult.data);
        }
      }
    } catch (error) {
      console.error('Abonelik verileri yüklenirken hata:', error);
      Alert.alert('Hata', 'Abonelik bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      Alert.alert(
        'Abonelik Onayı',
        'Bu abonelik planını satın almak istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Satın Al',
            onPress: async () => {
              const result = await subscriptionService.createSubscription(userId, planId);
              if (result.success) {
                Alert.alert('Başarılı', 'Aboneliğiniz başarıyla oluşturuldu!');
                loadData(); // Verileri yenile
                onSubscriptionChange && onSubscriptionChange();
              } else {
                Alert.alert('Hata', result.error || 'Abonelik oluşturulamadı');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Abonelik oluşturma hatası:', error);
      Alert.alert('Hata', 'Abonelik oluşturulamadı');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      Alert.alert(
        'Abonelik İptali',
        'Aboneliğinizi iptal etmek istediğinizden emin misiniz?',
        [
          { text: 'Hayır', style: 'cancel' },
          {
            text: 'Evet, İptal Et',
            style: 'destructive',
            onPress: async () => {
              const result = await subscriptionService.cancelSubscription(currentSubscription.id);
              if (result.success) {
                Alert.alert('Başarılı', 'Aboneliğiniz iptal edildi');
                loadData(); // Verileri yenile
                onSubscriptionChange && onSubscriptionChange();
              } else {
                Alert.alert('Hata', result.error || 'Abonelik iptal edilemedi');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Abonelik iptal hatası:', error);
      Alert.alert('Hata', 'Abonelik iptal edilemedi');
    }
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Ücretsiz' : `₺${price}`;
  };

  const getPlanIcon = (planName) => {
    if (planName.toLowerCase().includes('premium')) {
      return 'diamond';
    }
    return 'gift';
  };

  const getPlanGradient = (planName) => {
    if (planName.toLowerCase().includes('premium')) {
      return ['#FFD700', '#FFA500'];
    }
    return ['#4CAF50', '#45a049'];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Abonelik planları yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Plans Grid */}
      <View style={styles.plansContainer}>
        {plans.map((plan, index) => {
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          const isPremium = plan.name.toLowerCase().includes('premium');
          const isFree = plan.name === 'Ücretsiz';
          
          return (
            <BlurView 
              key={plan.id} 
              intensity={20} 
              style={[
                styles.planCard,
                isCurrentPlan && styles.currentPlanCard,
                isPremium && styles.premiumPlanCard
              ]}
            >
              <LinearGradient
                colors={isPremium ? 
                  ['rgba(255, 215, 0, 0.9)', 'rgba(255, 165, 0, 0.9)'] : 
                  isFree ? 
                    ['rgba(76, 175, 80, 0.8)', 'rgba(69, 160, 73, 0.8)'] :
                    ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)']
                }
                style={styles.planGradient}
              >
                {/* Popular Badge */}
                {isPremium && (
                  <View style={styles.popularBadge}>
                    <MaterialIcons name="star" size={16} color="white" />
                    <Text style={styles.popularText}>En Popüler</Text>
                  </View>
                )}
                
                {/* Plan Header */}
                <View style={styles.planHeader}>
                  <View style={styles.planIconContainer}>
                    <MaterialIcons 
                      name={isPremium ? 'diamond' : isFree ? 'favorite' : 'star'} 
                      size={32} 
                      color="white" 
                    />
                  </View>
                  <Text style={styles.planName}>{plan.name}</Text>
                </View>
                
                {/* Price */}
                <View style={styles.priceContainer}>
                  <Text style={styles.planPrice}>{formatPrice(plan.price)}</Text>
                  {plan.billing_period && (
                    <Text style={styles.planBilling}>/{plan.billing_period}</Text>
                  )}
                </View>
                
                {/* Features */}
                <View style={styles.featuresContainer}>
                  {/* Custom features for each plan */}
                  {isFree ? (
                    <>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={18} color="white" />
                        <Text style={styles.featureText}>Günlük 3 rüya yorumu</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={18} color="white" />
                        <Text style={styles.featureText}>Temel rüya analizi</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={18} color="white" />
                        <Text style={styles.featureText}>Rüya günlüğü</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={18} color="white" />
                        <Text style={styles.featureText}>Sınırsız rüya yorumu</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={18} color="white" />
                        <Text style={styles.featureText}>Ünlü kişi yorumları</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={18} color="white" />
                        <Text style={styles.featureText}>Detaylı analiz raporları</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={18} color="white" />
                        <Text style={styles.featureText}>Rüya geçmişi & İstatistikler</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={18} color="white" />
                        <Text style={styles.featureText}>Öncelikli destek</Text>
                      </View>
                    </>
                  )}
                </View>
                
                {/* Action Button */}
                {isCurrentPlan ? (
                  <View style={styles.currentPlanBadge}>
                    <MaterialIcons name="verified" size={20} color="white" />
                    <Text style={styles.currentPlanText}>Aktif Plan</Text>
                  </View>
                ) : !isFree ? (
                  <TouchableOpacity 
                    style={styles.subscribeButton}
                    onPress={() => handleSubscribe(plan.id)}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                      style={styles.subscribeButtonGradient}
                    >
                      <MaterialIcons name="rocket-launch" size={20} color="white" />
                      <Text style={styles.subscribeButtonText}>Başla</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.freePlanBadge}>
                    <MaterialIcons name="favorite" size={18} color="white" />
                    <Text style={styles.freePlanText}>Ücretsiz</Text>
                  </View>
                )}
              </LinearGradient>
            </BlurView>
          );
        })}
      </View>
      
      {/* Free Plan Upgrade Section */}
      {!currentSubscription && (
        <BlurView intensity={15} style={styles.upgradeSection}>
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)']}
            style={styles.upgradeSectionGradient}
          >
            <View style={styles.upgradeIconContainer}>
              <MaterialIcons name="auto-awesome" size={32} color="white" />
            </View>
            <Text style={styles.upgradeTitle}>Ücretsiz Plandasınız</Text>
            <Text style={styles.upgradeSubtitle}>
              Premium'a geçin ve rüyalarınızın tüm sırlarını keşfedin
            </Text>
            <View style={styles.upgradeFeatures}>
              <View style={styles.upgradeFeatureItem}>
                <MaterialIcons name="all-inclusive" size={24} color="white" />
                <Text style={styles.upgradeFeatureText}>Sınırsız yorumlama</Text>
              </View>
              <View style={styles.upgradeFeatureItem}>
                <MaterialIcons name="star" size={16} color="white" />
                <Text style={styles.upgradeFeatureText}>Ünlü kişi yorumları</Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  plansContainer: {
    padding: 20,
    gap: 30,
  },
  planCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
  },
  premiumPlanCard: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
  },
  planGradient: {
    padding: 24,
    minHeight: 280,
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 16,
  },
  planIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backdropFilter: 'blur(10px)',
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },
  planBilling: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  currentPlanBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    backdropFilter: 'blur(10px)',
  },
  currentPlanText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  freePlanBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  freePlanText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  upgradeSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  upgradeSectionGradient: {
    padding: 24,
    alignItems: 'center',
  },
  upgradeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  upgradeFeatures: {
    flexDirection: 'row',
    gap: 20,
  },
  upgradeFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upgradeFeatureText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SubscriptionPlans;