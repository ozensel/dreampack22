import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const PremiumFeatureGate = ({ 
  visible, 
  onClose, 
  onUpgrade, 
  featureName = 'Bu özellik',
  description = 'Premium abonelik gerektirir'
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.header}
          >
            <Ionicons name="diamond" size={48} color="white" />
            <Text style={styles.title}>Premium Özellik</Text>
          </LinearGradient>
          
          <View style={styles.content}>
            <Text style={styles.featureName}>{featureName}</Text>
            <Text style={styles.description}>{description}</Text>
            
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Premium ile neler kazanırsınız:</Text>
              
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Sınırsız rüya yorumu</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Ünlü kişi yorumları</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Detaylı analiz raporları</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Rüya geçmişi ve istatistikler</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={onUpgrade}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.upgradeButtonGradient}
              >
                <Ionicons name="diamond" size={20} color="white" />
                <Text style={styles.upgradeButtonText}>Premium'a Geç</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Daha Sonra</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  content: {
    padding: 20,
  },
  featureName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#555',
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
  },
  upgradeButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default PremiumFeatureGate;