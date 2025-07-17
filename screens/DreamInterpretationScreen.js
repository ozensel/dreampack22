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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dreamService } from '../services/dreamService';


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
  
  const { user, signOut } = useAuth();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  
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
            <Text style={styles.sectionTitle}>🌙 {t('addNewDream')}</Text>
            
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
                <Text style={styles.emptyStateIcon}>🌙</Text>
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
            <Text style={styles.sectionTitle}>👤 {t('profile')}</Text>
            
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.user_metadata?.full_name || t('user')}
                </Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <Text style={styles.profileJoinDate}>
                  {t('joinDate')}: {new Date(user?.created_at).toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US')}
                </Text>
              </View>
            </View>

            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>{dreamStats.total}</Text>
                <Text style={styles.profileStatLabel}>{t('dreams')}</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>{Object.keys(dreamStats.categories).length}</Text>
                <Text style={styles.profileStatLabel}>{t('categoriesLabel')}</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>
                  {dreamStats.total > 0 ? Math.round(dreamStats.thisWeek / dreamStats.total * 100) : 0}%
                </Text>
                <Text style={styles.profileStatLabel}>{t('activity')}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.languageButton} 
              onPress={() => setShowLanguageOptions(!showLanguageOptions)}
            >
              <Text style={styles.languageButtonText}>🌐 {t('language')}</Text>
              <Text style={styles.languageArrow}>{showLanguageOptions ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showLanguageOptions && (
              <View style={styles.languageOptions}>
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
                      styles.languageOption,
                      currentLanguage === language.code && styles.languageOptionActive
                    ]}
                    onPress={async () => {
                       await changeLanguage(language.code);
                       setShowLanguageOptions(false);
                     }}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text style={[
                      styles.languageOptionText,
                      currentLanguage === language.code && styles.languageOptionTextActive
                    ]}>{language.name}</Text>
                    {currentLanguage === language.code && (
                      <Text style={styles.languageCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Account Settings Section */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>⚙️ {t('accountSettings')}</Text>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>👤</Text>
                <Text style={styles.profileMenuText}>{t('editProfile')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>🔒</Text>
                <Text style={styles.profileMenuText}>{t('changePassword')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Notification Settings Section */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>🔔 {t('notificationSettings')}</Text>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>📱</Text>
                <Text style={styles.profileMenuText}>{t('pushNotifications')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>📧</Text>
                <Text style={styles.profileMenuText}>{t('emailNotifications')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>⏰</Text>
                <Text style={styles.profileMenuText}>{t('dreamReminders')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy & Data Section */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>🛡️ {t('privacySettings')}</Text>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>📊</Text>
                <Text style={styles.profileMenuText}>{t('dataExport')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>💾</Text>
                <Text style={styles.profileMenuText}>{t('backup')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* App Settings Section */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>🎨 {t('theme')}</Text>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>🌙</Text>
                <Text style={styles.profileMenuText}>{t('darkMode')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Help & Support Section */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>❓ {t('helpSupport')}</Text>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>📞</Text>
                <Text style={styles.profileMenuText}>{t('contactUs')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>❓</Text>
                <Text style={styles.profileMenuText}>{t('faq')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>⭐</Text>
                <Text style={styles.profileMenuText}>{t('rateApp')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>📤</Text>
                <Text style={styles.profileMenuText}>{t('shareApp')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* App Info Section */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>ℹ️ {t('appInfo')}</Text>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>📄</Text>
                <Text style={styles.profileMenuText}>{t('termsOfService')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>🔒</Text>
                <Text style={styles.profileMenuText}>{t('privacyPolicy')}</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>
              
              <View style={styles.profileMenuItem}>
                <Text style={styles.profileMenuIcon}>📱</Text>
                <Text style={styles.profileMenuText}>{t('version')}</Text>
                <Text style={styles.profileVersionText}>1.0.0</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>🚪 {t('logout')}</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
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

        {/* Bottom Navigation */}
        <Animated.View style={[styles.bottomNav, { opacity: fadeAnim }]}>
          <BlurView intensity={20} style={styles.bottomNavBlur}>
            <View style={styles.bottomNavContent}>
              <TouchableOpacity 
                style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
                onPress={() => setActiveTab('home')}
              >
                <Text style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}>🏠</Text>
                <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>{t('home')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.navItem, activeTab === 'dreams' && styles.navItemActive]}
                onPress={() => setActiveTab('dreams')}
              >
                <Text style={[styles.navIcon, activeTab === 'dreams' && styles.navIconActive]}>📚</Text>
                <Text style={[styles.navLabel, activeTab === 'dreams' && styles.navLabelActive]}>{t('myDreams')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.navItem, activeTab === 'stats' && styles.navItemActive]}
                onPress={() => setActiveTab('stats')}
              >
                <Text style={[styles.navIcon, activeTab === 'stats' && styles.navIconActive]}>📊</Text>
                <Text style={[styles.navLabel, activeTab === 'stats' && styles.navLabelActive]}>{t('statistics')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
                onPress={() => setActiveTab('profile')}
              >
                <Text style={[styles.navIcon, activeTab === 'profile' && styles.navIconActive]}>👤</Text>
                <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>{t('profile')}</Text>
              </TouchableOpacity>
            </View>
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
            <Text style={styles.dreamDetailTitle}>🌙 Rüya Detayı</Text>
            <TouchableOpacity 
              style={styles.dreamDetailDeleteButton}
              onPress={() => handleDeleteDream(selectedDream.id)}
            >
              <Text style={styles.dreamDetailDeleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.dreamDetailScrollView} showsVerticalScrollIndicator={false}>
            {/* Dream Date and Category */}
            <View style={styles.dreamDetailMeta}>
              <Text style={styles.dreamDetailDate}>
                📅 {new Date(selectedDream.created_at).toLocaleDateString('tr-TR', {
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
                          <Text style={styles.dreamDetailInterpreterEmoji}>❓</Text>
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


    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  profileButtonGradient: {
    width: 50,
    height: 50,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 100,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dreamInput: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: 'white',
    textAlignVertical: 'top',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
    height: '80%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  modalBlur: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
 });