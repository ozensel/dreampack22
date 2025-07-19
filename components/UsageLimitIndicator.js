import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import subscriptionService from '../services/subscriptionService';

const UsageLimitIndicator = ({ userId, onUpgradePress }) => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUsageData();
    }
  }, [userId]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const result = await subscriptionService.checkDailyUsageLimit(userId);
      if (result.success) {
        setUsageData(result.data);
      }
    } catch (error) {
      console.error('Kullanım verisi yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!usageData || usageData.limit === null) return 0;
    return Math.min((usageData.usedCount / usageData.limit) * 100, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 90) return ['#f44336', '#d32f2f'];
    if (percentage >= 70) return ['#ff9800', '#f57c00'];
    return ['#4CAF50', '#388e3c'];
  };

  const getStatusText = () => {
    if (!usageData) return '';
    
    if (usageData.isPremium) {
      return 'Premium - Sınırsız kullanım';
    }
    
    if (usageData.limit === null) {
      return 'Sınırsız kullanım';
    }
    
    const remaining = usageData.limit - usageData.usedCount;
    if (remaining <= 0) {
      return 'Günlük limit doldu';
    }
    
    return `${remaining} kullanım hakkı kaldı`;
  };

  const getStatusIcon = () => {
    if (!usageData) return 'help-circle';
    
    if (usageData.isPremium) {
      return 'diamond';
    }
    
    if (usageData.limit === null) {
      return 'infinite';
    }
    
    const percentage = getProgressPercentage();
    if (percentage >= 90) return 'warning';
    if (percentage >= 70) return 'alert-circle';
    return 'checkmark-circle';
  };

  if (loading || !usageData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name={getStatusIcon()} 
          size={20} 
          color={usageData.isPremium ? '#FFD700' : '#666'} 
        />
        <Text style={styles.title}>Günlük Kullanım</Text>
      </View>
      
      {!usageData.isPremium && usageData.limit !== null && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <LinearGradient
              colors={getProgressColor()}
              style={[styles.progressBar, { width: `${getProgressPercentage()}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {usageData.usedCount} / {usageData.limit}
          </Text>
        </View>
      )}
      
      <Text style={[styles.statusText, {
        color: usageData.isPremium ? '#FFD700' : 
               usageData.usedCount >= usageData.limit ? '#f44336' : '#666'
      }]}>
        {getStatusText()}
      </Text>
      
      {!usageData.isPremium && (
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={onUpgradePress}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.upgradeButtonGradient}
          >
            <Ionicons name="diamond" size={16} color="white" />
            <Text style={styles.upgradeButtonText}>Premium'a Geç</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      {usageData.isPremium && (
        <View style={styles.premiumBadge}>
          <Ionicons name="diamond" size={16} color="#FFD700" />
          <Text style={styles.premiumText}>Premium Üye</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 10,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  upgradeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8DC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default UsageLimitIndicator;