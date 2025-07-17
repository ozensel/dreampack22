import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  // Kullanıcı kayıt
  async signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Kullanıcı giriş
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Local storage'a kaydet
      await AsyncStorage.setItem('userToken', data.session.access_token);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', email);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Çıkış yap
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Local storage'ı temizle
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userEmail');

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Mevcut kullanıcıyı al
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Session kontrolü
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Şifre sıfırlama
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new AuthService();