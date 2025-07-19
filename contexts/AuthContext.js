import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import authService from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // İlk session kontrolü
    getInitialSession();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Loading'i sadece başarılı giriş veya çıkış durumunda false yap
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getInitialSession = async () => {
    try {
      // Önce AsyncStorage'dan çıkış durumunu kontrol et
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      // Eğer kullanıcı çıkış yapmışsa session kontrolü yapma
      if (isLoggedIn !== 'true') {
        console.log('User logged out, clearing session');
        setSession(null);
        setUser(null);
        // Supabase session'ını da temizle
        await authService.signOut();
        return;
      }
      
      const { session, error } = await authService.getSession();
      if (error) {
        console.log('Session error:', error);
        // Hatalı session durumunda temizle
        setSession(null);
        setUser(null);
        // AsyncStorage'ı da temizle
        await AsyncStorage.removeItem('isLoggedIn');
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userEmail');
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
    } catch (error) {
      console.log('Initial session error:', error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    const result = await authService.signIn(email, password);
    // Loading state'i sadece başarılı giriş durumunda değiştir
    // Başarısız giriş durumunda kullanıcı login ekranında kalmalı
    return result;
  };

  const signUp = async (email, password, fullName) => {
    setLoading(true);
    const result = await authService.signUp(email, password, fullName);
    setLoading(false);
    return result;
  };

  const signInWithApple = async (identityToken, nonce) => {
    const result = await authService.signInWithApple(identityToken, nonce);
    return result;
  };

  const signOut = async () => {
    try {
      // Önce authService ile temizlik yap
      await authService.signOut();
      
      // Sonra local state'i temizle
      setSession(null);
      setUser(null);
      setLoading(false);
      
      console.log('User successfully signed out');
      return { success: true };
    } catch (error) {
      console.log('SignOut error:', error);
      // Hata olsa bile local state'i temizle
      setSession(null);
      setUser(null);
      setLoading(false);
      return { success: true };
    }
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };



  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithApple,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};