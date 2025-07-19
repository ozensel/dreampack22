import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Rüyalarınızı Keşfedin',
    description: 'Yapay zeka destekli yorumlarla rüyalarınızın gizli anlamlarını çözün ve iç dünyanızı keşfedin.',
    icon: '🌙',
    gradient: ['#667eea', '#764ba2'],
    particles: ['✨', '🌟', '💫'],
  },
  {
    id: 2,
    title: 'Kişisel Analiz',
    description: 'Her rüya size özeldir. Gelişmiş algoritmalarla kişiselleştirilmiş derinlemesine analizler alın.',
    icon: '🧠',
    gradient: ['#f093fb', '#f5576c'],
    particles: ['🔮', '💎', '🌈'],
  },
  {
    id: 3,
    title: 'Rüya Günlüğü',
    description: 'Rüyalarınızı kaydedin, desenlerini takip edin ve kişisel gelişiminizi izleyin.',
    icon: '📚',
    gradient: ['#4facfe', '#00f2fe'],
    particles: ['📖', '✍️', '📊'],
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const animateTransition = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  const onScroll = (event) => {
    const slideSize = width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      // Onboarding tamamlandığını kaydet
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      // Login ekranına yönlendir
      navigation.replace('Login');
    } catch (error) {
      console.error('Error saving onboarding status or navigating:', error);
      // Hata olsa bile login ekranına git
      navigation.replace('Login');
    }
  };

  const currentItem = onboardingData[currentIndex];

  const renderItem = ({ item, index }) => (
    <LinearGradient
      colors={item.gradient}
      style={[styles.container, { width }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Floating Particles */}
      <View style={styles.particlesContainer}>
        {item.particles.map((particle, particleIndex) => (
          <Animated.Text
            key={particleIndex}
            style={[
              styles.particle,
              {
                top: Math.random() * height * 0.6,
                left: Math.random() * width,
                opacity: fadeAnim,
              },
            ]}
          >
            {particle}
          </Animated.Text>
        ))}
      </View>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
            style={styles.iconBackground}
          >
            <Text style={styles.icon}>{item.icon}</Text>
          </LinearGradient>
        </View>
        
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </LinearGradient>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {/* Skip Button */}
      <BlurView intensity={20} style={styles.skipButton}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipTouchable}>
          <Text style={styles.skipText}>Geç</Text>
        </TouchableOpacity>
      </BlurView>

      {/* FlatList for swipeable onboarding */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.flatList}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  transform: [
                    {
                      scale: index === currentIndex ? 1.2 : 1,
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        {/* Navigation Button */}
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Başlayalım' : 'İleri'}
            </Text>
            <Text style={styles.nextButtonIcon}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    fontSize: 20,
    opacity: 0.6,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 50,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
  skipTouchable: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 50,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  nextButton: {
    borderRadius: 25,
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
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },
  nextButtonIcon: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
});