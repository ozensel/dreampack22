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

  // Apple ile giriş
  async signInWithApple(identityToken, nonce) {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
        nonce,
      });

      if (error) throw error;

      // Local storage'a kaydet
      await AsyncStorage.setItem('userToken', data.session.access_token);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', data.user.email || '');

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Çıkış yap
  async signOut() {
    try {
      // Önce local storage'ı temizle
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userEmail');
      
      // Sonra Supabase'den çıkış yapmaya çalış
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.log('Supabase signOut error (ignored):', error.message);
        }
      } catch (networkError) {
        // Network hatası olsa bile devam et
        console.log('Network error during signOut (ignored):', networkError.message);
      }

      return { success: true };
    } catch (error) {
      // AsyncStorage hatası durumunda bile başarılı döndür
      console.log('AsyncStorage error during signOut (ignored):', error.message);
      return { success: true };
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
      
      if (error) {
        // Refresh token hatası durumunda session'ı temizle
        if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
          await this.signOut();
          return { success: true, session: null };
        }
        throw error;
      }
      
      return { success: true, session };
    } catch (error) {
      console.log('getSession error:', error.message);
      return { success: false, error: error.message, session: null };
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