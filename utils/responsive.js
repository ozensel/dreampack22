import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standart tasarım boyutları (iPhone 11 Pro referans)
const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

// Responsive width fonksiyonu
export const wp = (percentage) => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

// Responsive height fonksiyonu
export const hp = (percentage) => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

// Responsive font size
export const RFPercentage = (percent) => {
  const heightPercent = (percent * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(heightPercent));
};

// Responsive font size based on device width
export const RFValue = (fontSize, standardScreenHeight = DESIGN_HEIGHT) => {
  const heightPercent = (fontSize * SCREEN_HEIGHT) / standardScreenHeight;
  return Math.round(PixelRatio.roundToNearestPixel(heightPercent));
};

// Cihaz türü kontrolü
export const isTablet = () => {
  return SCREEN_WIDTH >= 768;
};

export const isSmallDevice = () => {
  return SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 667;
};

export const isLargeDevice = () => {
  return SCREEN_WIDTH > 414 || SCREEN_HEIGHT > 896;
};

// Platform specific spacing
export const platformSpacing = {
  ios: {
    statusBarHeight: Platform.OS === 'ios' ? (SCREEN_HEIGHT >= 812 ? 44 : 20) : 0,
    bottomSafeArea: Platform.OS === 'ios' ? (SCREEN_HEIGHT >= 812 ? 34 : 0) : 0,
  },
  android: {
    statusBarHeight: Platform.OS === 'android' ? 25 : 0,
    bottomSafeArea: 0,
  }
};

// Responsive spacing değerleri
export const spacing = {
  xs: wp(1),
  sm: wp(2),
  md: wp(4),
  lg: wp(6),
  xl: wp(8),
  xxl: wp(12),
};

// Responsive font sizes
export const fontSize = {
  xs: RFValue(10),
  sm: RFValue(12),
  md: RFValue(14),
  lg: RFValue(16),
  xl: RFValue(18),
  xxl: RFValue(20),
  title: RFValue(24),
  header: RFValue(28),
  large: RFValue(32),
};

// Responsive border radius
export const borderRadius = {
  sm: wp(2),
  md: wp(3),
  lg: wp(4),
  xl: wp(6),
  round: wp(50),
};

// Responsive icon sizes
export const iconSize = {
  xs: wp(4),
  sm: wp(5),
  md: wp(6),
  lg: wp(7),
  xl: wp(8),
  xxl: wp(10),
};

export default {
  wp,
  hp,
  RFPercentage,
  RFValue,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  platformSpacing,
  spacing,
  fontSize,
  borderRadius,
  iconSize,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};